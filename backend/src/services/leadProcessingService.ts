import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import type { LeadProcessing } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { PROCESSING_STATUS } from "../config/constants.js";
import { createDraft } from "./gmailService.js";
import { generateEmail } from "./geminiService.js";
import { getLeads, updateLeadStatus } from "./sheetsService.js";
import type { Lead, SpreadsheetLocation } from "../types/domain.js";
import { errorMessage } from "../types/errors.js";

const PROCESSING_LEASE_MS = 10 * 60 * 1000;
type UserId = string;

export interface ProcessingResult {
  action: "created" | "skipped" | "failed";
  reason?: string;
  existingDraftId?: string | null;
  draftId?: string;
  messageId?: string | null;
  threadId?: string | null;
}

export interface ProcessingResultDetail extends ProcessingResult {
  name: string;
  email: string;
  rowNumber: number;
}

type LeadDecision = ProcessingResult | { action: "create"; reason: string };
type LeadRecordUpdate = Prisma.LeadProcessingUpdateManyMutationInput;
type LeadTrackingRecord = Pick<LeadProcessing, "status">
  & Partial<Pick<LeadProcessing, "leadFingerprint" | "gmailDraftId" | "gmailMessageId" | "gmailThreadId">>;

export class UsageLimitError extends Error {
  constructor() {
    super("Your monthly AI draft limit has been reached.");
    this.name = "UsageLimitError";
  }
}

function currentUsagePeriod() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function leadFingerprint(lead: Lead): string {
  return crypto.createHash("sha256").update(JSON.stringify([
    lead.name, lead.email, lead.company, lead.website, lead.context,
  ])).digest("hex");
}

async function resetUsagePeriod(userId: UserId): Promise<void> {
  const periodStart = currentUsagePeriod();
  await prisma.user.updateMany({
    where: { id: userId, usagePeriodStart: { lt: periodStart } },
    data: { draftsUsed: 0, draftsReserved: 0, usagePeriodStart: periodStart },
  });
}

export async function reserveDraftUsage(userId: UserId): Promise<void> {
  await resetUsagePeriod(userId);
  const updated = await prisma.$executeRaw`
    UPDATE "User"
    SET "draftsReserved" = "draftsReserved" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${userId}
      AND "draftsUsed" + "draftsReserved" < "draftLimit"
  `;
  if (updated === 0) throw new UsageLimitError();
}

async function commitDraftUsage(userId: UserId): Promise<void> {
  const updated = await prisma.user.updateMany({
    where: { id: userId, draftsReserved: { gt: 0 } },
    data: { draftsReserved: { decrement: 1 }, draftsUsed: { increment: 1 } },
  });
  if (updated.count === 0) throw new Error("Unable to record completed draft usage.");
}

async function releaseDraftUsage(userId: UserId): Promise<void> {
  await prisma.user.updateMany({
    where: { id: userId, draftsReserved: { gt: 0 } },
    data: { draftsReserved: { decrement: 1 } },
  });
}

async function claimLeadForCreation(userId: UserId, lead: Lead) {
  const fingerprint = leadFingerprint(lead);
  const filter = leadRecordFilter(userId, lead);
  const existing = await prisma.leadProcessing.findUnique({
    where: { userId_spreadsheetId_sheetName_rowNumber: filter },
  });

  if (existing?.status === PROCESSING_STATUS.PROCESSING && existing.updatedAt > new Date(Date.now() - PROCESSING_LEASE_MS)) {
    return null;
  }

  if (existing) {
    const leaseExpiredAt = new Date(Date.now() - PROCESSING_LEASE_MS);
    const claimed = await prisma.leadProcessing.updateMany({
      where: {
        id: existing.id,
        OR: [
          { status: { not: PROCESSING_STATUS.PROCESSING } },
          { updatedAt: { lte: leaseExpiredAt } },
        ],
      },
      data: {
        leadFingerprint: fingerprint,
        status: PROCESSING_STATUS.PROCESSING,
        gmailDraftId: null,
        errorMessage: null,
        usageCommitted: false,
      },
    });
    return claimed.count === 1
      ? prisma.leadProcessing.findUnique({ where: { id: existing.id } })
      : null;
  }

  try {
    const record = await prisma.leadProcessing.create({
      data: {
        ...filter,
        leadFingerprint: fingerprint,
      },
    });
    return record;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return null;
    throw error;
  }
}

export function leadRecordFilter(userId: UserId, lead: Lead) {
  return {
    userId,
    spreadsheetId: lead.spreadsheetId,
    sheetName: lead.sheetName,
    rowNumber: lead.rowNumber,
  };
}

async function findLeadRecord(userId: UserId, lead: Lead) {
  return prisma.leadProcessing.findUnique({
    where: { userId_spreadsheetId_sheetName_rowNumber: leadRecordFilter(userId, lead) },
  });
}

async function updateLeadRecord(userId: UserId, lead: Lead, fields: LeadRecordUpdate): Promise<void> {
  await prisma.leadProcessing.updateMany({
    where: leadRecordFilter(userId, lead),
    data: fields,
  });
}

async function markLeadFailed(
  record: LeadProcessing,
  error: unknown,
): Promise<void> {
  await prisma.leadProcessing.updateMany({
    where: { id: record.id, status: PROCESSING_STATUS.PROCESSING },
    data: { status: PROCESSING_STATUS.FAILED, errorMessage: errorMessage(error).slice(0, 1000) },
  });
}

async function markSheetFailed(userId: UserId, lead: Lead): Promise<void> {
  try {
    await updateLeadStatus(userId, lead, "Failed");
  } catch (error) {
    console.error(`Could not mark row ${lead.rowNumber} as failed in Google Sheets: ${errorMessage(error)}`);
  }
}

function leadLabel(lead: Lead): string {
  return `${lead.name || "(unnamed)"} <${lead.email || "(no email)"}>, row ${lead.rowNumber}`;
}

export function decideLeadAction(
  lead: Lead,
  trackingRecord?: LeadTrackingRecord | null,
  sheetDraftId = lead.draftId,
): LeadDecision {
  const status = lead.status.trim().toLowerCase();
  const sameTrackedLead = trackingRecord?.leadFingerprint === leadFingerprint(lead);
  const trackedAsProcessed = sameTrackedLead && (
    trackingRecord.status === PROCESSING_STATUS.DRAFT_CREATED
    || trackingRecord.status === PROCESSING_STATUS.SENT
    || Boolean(trackingRecord.gmailDraftId)
  );

  if (trackedAsProcessed) {
    return { action: "skipped", reason: "This lead already has a tracked Gmail draft." };
  }

  if (status === "draft created") {
    if (sameTrackedLead || sheetDraftId) {
      return { action: "skipped", reason: `Status "${lead.status}" is already tracked for this lead.` };
    }
    if (lead.validationErrors.length > 0) {
      return { action: "skipped", reason: `Invalid lead: ${lead.validationErrors.join(", ")}.` };
    }
    return { action: "create", reason: "New lead." };
  }

  if (status !== "new") {
    return { action: "skipped", reason: `Status "${lead.status}" is not eligible for processing.` };
  }
  if (lead.validationErrors.length > 0) return { action: "skipped", reason: `Invalid lead: ${lead.validationErrors.join(", ")}.` };
  return { action: "create", reason: "New lead." };
}

export function mergeLeadTracking(
  lead: Lead,
  record: LeadTrackingRecord | null | undefined,
): Lead {
  if (!record) return lead;
  const trackingStatuses: Record<LeadProcessing["status"], string> = {
    [PROCESSING_STATUS.DRAFT_CREATED]: "Draft Created",
    [PROCESSING_STATUS.SENT]: "Sent",
    [PROCESSING_STATUS.FAILED]: "Failed",
    [PROCESSING_STATUS.PROCESSING]: "New",
  };
  const trackingStatus = {
    ...trackingStatuses,
  }[record.status] || "New";

  return {
    ...lead,
    status: lead.statusColumn ? lead.status : trackingStatus,
    draftId: lead.draftId || record.gmailDraftId || "",
    messageId: lead.messageId || record.gmailMessageId || "",
    threadId: lead.threadId || record.gmailThreadId || "",
  };
}

async function processLead(userId: UserId, lead: Lead): Promise<ProcessingResult> {
  const sheetDraftId = lead.draftId;
  const trackingRecord = await findLeadRecord(userId, lead);
  lead = mergeLeadTracking(lead, trackingRecord);
  const decision = decideLeadAction(lead, trackingRecord, sheetDraftId);
  const existingDraftId = lead.draftId || null;

  if (decision.action === "skipped") {
    console.info(`Lead ${leadLabel(lead)} skipped; existing draft ID ${existingDraftId || "(none)"}; reason: ${decision.reason}`);
    return { action: decision.action, reason: decision.reason, existingDraftId };
  }

  console.info(`Lead ${leadLabel(lead)} is New; creating a new Gmail draft.`);

  const claim = await claimLeadForCreation(userId, lead);
  if (!claim) {
    const reason = "Another request is already processing this row.";
    console.info(`Lead ${leadLabel(lead)} skipped; reason: ${reason}`);
    return { action: "skipped", reason, existingDraftId };
  }

  let usageReserved = false;
  let createdDraftId: string | null = null;
  let createdMessageId: string | null = null;
  let createdThreadId: string | null = null;
  let failureStage = "quota reservation";
  try {
    await reserveDraftUsage(userId);
    usageReserved = true;
    failureStage = "Gemini";
    const email = await generateEmail(lead);
    failureStage = "Gmail draft creation";
    const draft = await createDraft(userId, { to: lead.email, ...email });
    if (!draft?.id) throw new Error("Gmail created a draft without returning a draft ID.");
    createdDraftId = draft.id;
    createdMessageId = draft.message?.id || null;
    createdThreadId = draft.message?.threadId || null;

    await prisma.leadProcessing.update({
      where: { id: claim.id },
      data: {
        leadFingerprint: leadFingerprint(lead),
        status: PROCESSING_STATUS.DRAFT_CREATED,
        gmailDraftId: draft.id,
        gmailMessageId: createdMessageId,
        gmailThreadId: createdThreadId,
      },
    });
    await commitDraftUsage(userId);
    usageReserved = false;
    try {
      await updateLeadStatus(userId, lead, "Draft Created", draft.id, createdMessageId || "", createdThreadId || "");
    } catch (error) {
      console.error(`Gmail draft ${draft.id} was created for lead ${leadLabel(lead)}, but the Sheet status/draft metadata update failed: ${errorMessage(error)}`);
    }
    console.info(`Lead ${leadLabel(lead)} created new Gmail draft ${draft.id} (message ${createdMessageId || "(missing)"}, thread ${createdThreadId || "(missing)"}); quota incremented.`);
    return {
      action: "created",
      reason: "Created a new Gmail draft.",
      draftId: draft.id,
      messageId: createdMessageId,
      threadId: createdThreadId,
      existingDraftId,
    };
  } catch (error) {
    if (createdDraftId) {
      console.error(`Gmail draft ${createdDraftId} exists for lead ${leadLabel(lead)}, but recording its processing state failed: ${errorMessage(error)}`);
      if (usageReserved) {
        try {
          await commitDraftUsage(userId);
        } catch (usageError) {
          console.error(`Could not commit quota for successfully created Gmail draft ${createdDraftId}: ${errorMessage(usageError)}`);
        }
      }
      await updateLeadStatus(userId, lead, "Draft Created", createdDraftId, createdMessageId || "", createdThreadId || "").catch((sheetError) => {
        console.error(`Could not persist created draft ID ${createdDraftId} for lead ${leadLabel(lead)}: ${errorMessage(sheetError)}`);
      });
      return {
        action: "created",
        reason: `Draft created; processing record warning: ${errorMessage(error)}`,
        draftId: createdDraftId,
        messageId: createdMessageId,
        threadId: createdThreadId,
        existingDraftId,
      };
    }

    let reservationReleaseError: unknown;
    if (usageReserved) {
      try {
        await releaseDraftUsage(userId);
      } catch (releaseError) {
        reservationReleaseError = releaseError;
        console.error(`Could not release reserved draft quota for lead ${leadLabel(lead)}: ${errorMessage(releaseError)}`);
      }
    }
    if (error instanceof UsageLimitError) {
      try {
        await markLeadFailed(claim, error);
      } catch (recordError) {
        console.error(`Could not persist failed state for lead ${leadLabel(lead)}: ${errorMessage(recordError)}`);
      }
      await markSheetFailed(userId, lead);
      console.warn(`Lead ${leadLabel(lead)} failed; existing draft ID ${existingDraftId || "(none)"}; reason: ${error.message}`);
      return { action: "failed", reason: error.message, existingDraftId };
    }
    const originalMessage = errorMessage(error);
    const stagePrefix = failureStage === "Gemini" || originalMessage.startsWith("Gemini ")
      ? ""
      : `${failureStage} error: `;
    const reason = `${stagePrefix}${originalMessage || "An unexpected error occurred."}${reservationReleaseError
      ? ` Draft quota reservation release also failed: ${errorMessage(reservationReleaseError)}`
      : ""}`;
    const failure = new Error(reason, { cause: error });
    try {
      await markLeadFailed(claim, failure);
    } catch (recordError) {
      console.error(`Could not persist failed state for lead ${leadLabel(lead)}: ${errorMessage(recordError)}`);
    }
    await markSheetFailed(userId, lead);
    console.error(`Lead ${leadLabel(lead)} failed; existing draft ID ${existingDraftId || "(none)"}; reason: ${reason}`);
    return { action: "failed", reason, existingDraftId };
  }
}

export async function processLeadsIndependently(
  leads: Lead[],
  processOne: (lead: Lead) => Promise<ProcessingResult>,
  handleFailure: (lead: Lead, error: unknown) => Promise<void> = async () => {},
): Promise<ProcessingResultDetail[]> {
  const details: ProcessingResultDetail[] = [];
  for (const lead of leads) {
    let result: ProcessingResult;
    try {
      result = await processOne(lead);
    } catch (error) {
      const reason = errorMessage(error);
      try {
        await handleFailure(lead, error);
      } catch (handlingError) {
        console.error(`Could not record failure for row ${lead.rowNumber}: ${errorMessage(handlingError)}`);
      }
      console.error(`Lead ${leadLabel(lead)} failed; existing draft ID ${lead.draftId || "(none)"}; reason: ${reason}`);
      result = { action: "failed", reason, existingDraftId: lead.draftId || null };
    }
    details.push({ name: lead.name, email: lead.email, rowNumber: lead.rowNumber, ...result });
  }
  return details;
}

export async function processUserLeads(userId: UserId, spreadsheet: SpreadsheetLocation) {
  await resetUsagePeriod(userId);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new Error("Authenticated user no longer exists.");

  const leads = await getLeads(userId, spreadsheet);
  const details = await processLeadsIndependently(
    leads,
    (lead) => processLead(userId, lead),
    async (lead, error) => {
      await markSheetFailed(userId, lead);
      try {
        const record = await findLeadRecord(userId, lead);
        if (record?.status === PROCESSING_STATUS.PROCESSING) await markLeadFailed(record, error);
      } catch (recordError) {
        console.error(`Could not persist unexpected failure for lead ${leadLabel(lead)}: ${errorMessage(recordError)}`);
      }
    },
  );
  let limitReached = false;

  for (const result of details) {
    if (result.action === "failed" && result.reason === "Your monthly AI draft limit has been reached.") limitReached = true;
  }

  const summary = summarizeProcessingResults(details);
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { draftsUsed: true, draftLimit: true },
  });
  if (!updatedUser) throw new Error("Authenticated user no longer exists.");
  console.info(`Lead processing complete: ${summary.processed} evaluated, ${summary.created} created, ${summary.skipped} skipped, ${summary.failed} failed.`);
  return {
    message: "Lead processing completed",
    ...summary,
    details,
    limitReached,
    draftsUsed: updatedUser.draftsUsed,
    draftLimit: updatedUser.draftLimit,
  };
}

export function summarizeProcessingResults(results: Array<Pick<ProcessingResult, "action">>) {
  const counts = results.reduce((total, result) => {
    if (Object.hasOwn(total, result.action)) total[result.action] += 1;
    return total;
  }, { created: 0, skipped: 0, failed: 0 });

  return {
    processed: results.length,
    created: counts.created,
    skipped: counts.skipped,
    failed: counts.failed,
  };
}
