import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { PROCESSING_STATUS } from "../config/constants.js";
import { createDraft } from "./gmailService.js";
import { generateEmail, GeminiRateLimitError, GEMINI_RATE_LIMIT_MESSAGE } from "./geminiService.js";
import { getConfiguredSheetId, getLeads, SpreadsheetValidationError, updateLeadStatus } from "./sheetsService.js";
import { errorMessage } from "../types/errors.js";
const PROCESSING_LEASE_MS = 10 * 60 * 1000;
const USAGE_CYCLE_MS = 30 * 24 * 60 * 60 * 1000;
export function getDemoProcessingResult() {
    return {
        message: "8 demo drafts generated.",
        processed: 8,
        created: 8,
        skipped: 0,
        failed: 0,
        limitReached: false,
    };
}
export class UsageLimitError extends Error {
    constructor(isDemo = false, resetAt) {
        super(isDemo
            ? "Your daily AI demo draft limit has been reached."
            : `Draft limit reached. Resets on ${formatUsageResetDate(resetAt || usagePeriodResetAt(new Date()))}.`);
        this.name = "UsageLimitError";
    }
}
export function formatUsageResetDate(resetAt) {
    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    }).format(resetAt);
}
export function usagePeriodResetAt(periodStart, isDemo = false) {
    if (isDemo) {
        const resetAt = new Date(periodStart);
        resetAt.setUTCHours(0, 0, 0, 0);
        resetAt.setUTCDate(resetAt.getUTCDate() + 1);
        return resetAt;
    }
    return new Date(periodStart.getTime() + USAGE_CYCLE_MS);
}
function startOfUtcDay(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
function leadFingerprint(lead) {
    return crypto.createHash("sha256").update(JSON.stringify([
        lead.name, lead.email, lead.company, lead.website, lead.context,
        ...(lead.sheetData ? [lead.sheetData] : []),
    ])).digest("hex");
}
function legacyLeadFingerprint(lead) {
    return crypto.createHash("sha256").update(JSON.stringify([
        lead.name, lead.email, lead.company, lead.website, lead.context,
    ])).digest("hex");
}
export async function refreshUsageCycle(userId) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error("Authenticated user no longer exists.");
        const now = new Date();
        const cycleStartAt = user.isDemo ? user.usagePeriodStart : user.quotaCycleStartAt;
        const resetAt = usagePeriodResetAt(cycleStartAt, user.isDemo);
        if (now < resetAt)
            return { ...user, usagePeriodResetAt: resetAt };
        const advanced = user.isDemo
            ? await prisma.user.updateMany({
                where: { id: userId, usagePeriodStart: user.usagePeriodStart },
                data: {
                    draftsUsed: 0,
                    draftsReserved: 0,
                    usagePeriodStart: startOfUtcDay(now),
                },
            })
            : await prisma.user.updateMany({
                where: { id: userId, quotaCycleStartAt: user.quotaCycleStartAt },
                data: {
                    draftsUsed: 0,
                    quotaCycleStartAt: now,
                },
            });
        if (advanced.count === 1)
            continue;
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new Error("Authenticated user no longer exists.");
    const resetAt = usagePeriodResetAt(user.isDemo ? user.usagePeriodStart : user.quotaCycleStartAt, user.isDemo);
    if (new Date() >= resetAt)
        return refreshUsageCycle(userId);
    return { ...user, usagePeriodResetAt: resetAt };
}
export async function reserveDraftUsage(userId) {
    const user = await refreshUsageCycle(userId);
    const updated = await prisma.$executeRaw `
    UPDATE "User"
    SET "draftsReserved" = "draftsReserved" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${userId}
      AND "draftsUsed" + "draftsReserved" < "draftLimit"
      AND "quotaCycleStartAt" = ${user.quotaCycleStartAt}
  `;
    if (updated === 0)
        throw new UsageLimitError(user.isDemo, usagePeriodResetAt(user.isDemo ? user.usagePeriodStart : user.quotaCycleStartAt, user.isDemo));
}
async function commitDraftUsage(userId, createdAt) {
    const user = await refreshUsageCycle(userId);
    const createdInCurrentCycle = createdAt >= user.quotaCycleStartAt;
    const updated = await prisma.user.updateMany({
        where: { id: userId, draftsReserved: { gt: 0 } },
        data: {
            draftsReserved: { decrement: 1 },
            ...(createdInCurrentCycle ? { draftsUsed: { increment: 1 } } : {}),
        },
    });
    if (updated.count === 0)
        throw new Error("Unable to release quota reservation for completed draft.");
}
async function releaseDraftUsage(userId) {
    await prisma.user.updateMany({
        where: { id: userId, draftsReserved: { gt: 0 } },
        data: { draftsReserved: { decrement: 1 } },
    });
}
async function claimLeadForCreation(userId, lead) {
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
                    { status: null },
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
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
            return null;
        throw error;
    }
}
export function leadRecordFilter(userId, lead) {
    return {
        userId,
        spreadsheetId: lead.spreadsheetId,
        sheetName: lead.sheetName,
        rowNumber: lead.rowNumber,
    };
}
async function findLeadRecord(userId, lead) {
    return prisma.leadProcessing.findUnique({
        where: { userId_spreadsheetId_sheetName_rowNumber: leadRecordFilter(userId, lead) },
    });
}
async function updateLeadRecord(userId, lead, fields) {
    await prisma.leadProcessing.updateMany({
        where: leadRecordFilter(userId, lead),
        data: fields,
    });
}
async function markLeadFailed(record, error) {
    await prisma.leadProcessing.updateMany({
        where: { id: record.id, status: PROCESSING_STATUS.PROCESSING },
        data: { status: PROCESSING_STATUS.FAILED, errorMessage: errorMessage(error).slice(0, 1000) },
    });
}
async function markSheetFailed(userId, lead) {
    try {
        await updateLeadStatus(userId, lead, "Failed");
    }
    catch (error) {
        console.error(`Could not mark row ${lead.rowNumber} as failed in Google Sheets: ${errorMessage(error)}`);
    }
}
function leadLabel(lead) {
    return `${lead.name || "(unnamed)"} <${lead.email || "(no email)"}>, row ${lead.rowNumber}`;
}
export function decideLeadAction(lead, trackingRecord, sheetDraftId = lead.draftId) {
    const status = lead.status.trim().toLowerCase();
    const sameTrackedLead = trackingRecord?.leadFingerprint === leadFingerprint(lead)
        || trackingRecord?.leadFingerprint === legacyLeadFingerprint(lead);
    const trackedAsProcessed = Boolean(sheetDraftId)
        || (sameTrackedLead && (trackingRecord.status === PROCESSING_STATUS.SENT
            || Boolean(trackingRecord.gmailDraftId)));
    if (trackedAsProcessed) {
        return { action: "skipped", reason: "This lead already has a tracked Gmail draft." };
    }
    if (status === "sent") {
        return { action: "skipped", reason: `Status "${lead.status}" is not eligible for processing.` };
    }
    if (status !== "new" && status !== "failed" && status !== "draft created") {
        return { action: "skipped", reason: `Status "${lead.status}" is not eligible for processing.` };
    }
    if (lead.validationErrors.length > 0)
        return { action: "skipped", reason: `Invalid lead: ${lead.validationErrors.join(", ")}.` };
    return { action: "create", reason: "New lead." };
}
export function mergeLeadTracking(lead, record) {
    if (!record)
        return lead;
    const trackingStatuses = {
        [PROCESSING_STATUS.DRAFT_CREATED]: "Draft Created",
        [PROCESSING_STATUS.SENT]: "Sent",
        [PROCESSING_STATUS.FAILED]: "Failed",
        [PROCESSING_STATUS.PROCESSING]: "New",
    };
    const trackingStatus = record.status ? ({
        ...trackingStatuses,
    }[record.status] || "New") : "New";
    return {
        ...lead,
        status: lead.statusColumn ? lead.status : trackingStatus,
        draftId: lead.draftId || record.gmailDraftId || "",
        messageId: lead.messageId || record.gmailMessageId || "",
        threadId: lead.threadId || record.gmailThreadId || "",
    };
}
async function processLead(userId, lead, leadNumber, totalLeads) {
    const progressLabel = `lead ${leadNumber}/${totalLeads}:`;
    const sheetDraftId = lead.draftId;
    const trackingRecord = await findLeadRecord(userId, lead);
    lead = mergeLeadTracking(lead, trackingRecord);
    const decision = decideLeadAction(lead, trackingRecord, sheetDraftId);
    const existingDraftId = lead.draftId || null;
    if (decision.action === "skipped") {
        console.info(`${progressLabel} skipped (${decision.reason})`);
        console.info(`Lead ${leadLabel(lead)} skipped; existing draft ID ${existingDraftId || "(none)"}; reason: ${decision.reason}`);
        return { action: decision.action, reason: decision.reason, existingDraftId };
    }
    console.info(`Lead ${leadLabel(lead)} is New; creating a new Gmail draft.`);
    const claim = await claimLeadForCreation(userId, lead);
    if (!claim) {
        const reason = "Another request is already processing this row.";
        console.info(`${progressLabel} skipped (${reason})`);
        console.info(`Lead ${leadLabel(lead)} skipped; reason: ${reason}`);
        return { action: "skipped", reason, existingDraftId };
    }
    let usageReserved = false;
    let createdDraftId = null;
    let createdMessageId = null;
    let createdThreadId = null;
    let draftCreatedAt = null;
    let failureStage = "quota reservation";
    try {
        await reserveDraftUsage(userId);
        usageReserved = true;
        failureStage = "Gemini";
        console.info(`${progressLabel} Gemini call started`);
        const email = await generateEmail(lead);
        console.info(`${progressLabel} Gemini call finished`);
        failureStage = "Gmail draft creation";
        const draft = await createDraft(userId, { to: lead.email, ...email });
        if (!draft?.id)
            throw new Error("Gmail created a draft without returning a draft ID.");
        console.info(`${progressLabel} Gmail draft created`);
        draftCreatedAt = new Date();
        createdDraftId = draft.id;
        createdMessageId = draft.message?.id || null;
        createdThreadId = draft.message?.threadId || null;
        await prisma.leadProcessing.update({
            where: { id: claim.id },
            data: {
                leadFingerprint: leadFingerprint(lead),
                status: PROCESSING_STATUS.DRAFT_CREATED,
                gmailDraftId: createdDraftId,
                gmailMessageId: createdMessageId,
                gmailThreadId: createdThreadId,
            },
        });
        await commitDraftUsage(userId, draftCreatedAt);
        usageReserved = false;
        try {
            await updateLeadStatus(userId, lead, "Draft Created", createdDraftId, createdMessageId || "", createdThreadId || "");
        }
        catch (error) {
            console.error(`Gmail draft ${createdDraftId} was created for lead ${leadLabel(lead)}, but the Sheet status/draft metadata update failed: ${errorMessage(error)}`);
        }
        console.info(`Lead ${leadLabel(lead)} created new Gmail draft ${createdDraftId} (message ${createdMessageId || "(missing)"}, thread ${createdThreadId || "(missing)"}); quota incremented.`);
        return {
            action: "created",
            reason: "Created a new Gmail draft.",
            draftId: createdDraftId,
            messageId: createdMessageId,
            threadId: createdThreadId,
            existingDraftId,
        };
    }
    catch (error) {
        if (createdDraftId) {
            console.error(`Gmail draft ${createdDraftId} exists for lead ${leadLabel(lead)}, but recording its processing state failed: ${errorMessage(error)}`);
            if (usageReserved) {
                try {
                    await commitDraftUsage(userId, draftCreatedAt);
                }
                catch (usageError) {
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
        let reservationReleaseError;
        if (usageReserved) {
            try {
                await releaseDraftUsage(userId);
            }
            catch (releaseError) {
                reservationReleaseError = releaseError;
                console.error(`Could not release reserved draft quota for lead ${leadLabel(lead)}: ${errorMessage(releaseError)}`);
            }
        }
        if (error instanceof GeminiRateLimitError) {
            console.error(`${progressLabel} failed (${error.message})`);
            try {
                const released = await prisma.leadProcessing.updateMany({
                    where: { id: claim.id, status: PROCESSING_STATUS.PROCESSING },
                    data: { status: null, errorMessage: null },
                });
                if (released.count !== 1) {
                    console.warn(`Could not release processing claim for rate-limited lead ${leadLabel(lead)}.`);
                }
            }
            catch (releaseError) {
                console.error(`Could not release processing claim for rate-limited lead ${leadLabel(lead)}: ${errorMessage(releaseError)}`);
            }
            throw error;
        }
        if (error instanceof UsageLimitError) {
            console.error(`${progressLabel} failed (${error.message})`);
            try {
                await prisma.leadProcessing.updateMany({
                    where: { id: claim.id, status: PROCESSING_STATUS.PROCESSING },
                    data: { status: null, errorMessage: null },
                });
            }
            catch (recordError) {
                console.error(`Could not release quota-blocked lead ${leadLabel(lead)}: ${errorMessage(recordError)}`);
            }
            throw error;
        }
        const originalMessage = errorMessage(error);
        const stagePrefix = failureStage === "Gemini" || originalMessage.startsWith("Gemini ")
            ? ""
            : `${failureStage} error: `;
        const reason = `${stagePrefix}${originalMessage || "An unexpected error occurred."}${reservationReleaseError
            ? ` Draft quota reservation release also failed: ${errorMessage(reservationReleaseError)}`
            : ""}`;
        console.error(`${progressLabel} failed (${reason})`);
        const failure = new Error(reason, { cause: error });
        try {
            await markLeadFailed(claim, failure);
        }
        catch (recordError) {
            console.error(`Could not persist failed state for lead ${leadLabel(lead)}: ${errorMessage(recordError)}`);
        }
        await markSheetFailed(userId, lead);
        console.error(`Lead ${leadLabel(lead)} failed; existing draft ID ${existingDraftId || "(none)"}; reason: ${reason}`);
        return { action: "failed", reason, existingDraftId };
    }
}
export async function processLeadsIndependently(leads, processOne, handleFailure = async () => { }, onProgress) {
    const details = [];
    let draftsCreated = 0;
    let failed = 0;
    for (const [index, lead] of leads.entries()) {
        const leadNumber = index + 1;
        onProgress?.({ currentLead: leadNumber, totalLeads: leads.length, draftsCreated, failed });
        let result;
        let stopBatch = false;
        try {
            result = await processOne(lead, leadNumber, leads.length);
        }
        catch (error) {
            if (error instanceof UsageLimitError) {
                result = { action: "failed", reason: error.message, existingDraftId: lead.draftId || null };
                stopBatch = true;
            }
            else if (error instanceof GeminiRateLimitError) {
                result = { action: "failed", reason: error.message, existingDraftId: lead.draftId || null };
                stopBatch = true;
            }
            else {
                const reason = errorMessage(error);
                console.error(`lead ${leadNumber}/${leads.length}: failed (${reason})`);
                try {
                    await handleFailure(lead, error);
                }
                catch (handlingError) {
                    console.error(`Could not record failure for row ${lead.rowNumber}: ${errorMessage(handlingError)}`);
                }
                console.error(`Lead ${leadLabel(lead)} failed; existing draft ID ${lead.draftId || "(none)"}; reason: ${reason}`);
                result = { action: "failed", reason, existingDraftId: lead.draftId || null };
            }
        }
        details.push({ name: lead.name, email: lead.email, rowNumber: lead.rowNumber, ...result });
        if (result.action === "created")
            draftsCreated += 1;
        if (result.action === "failed")
            failed += 1;
        onProgress?.({ currentLead: leadNumber, totalLeads: leads.length, draftsCreated, failed });
        if (stopBatch)
            break;
    }
    return details;
}
export async function processUserLeads(userId, spreadsheet, onProgress) {
    const user = await refreshUsageCycle(userId);
    if (!user)
        throw new Error("Authenticated user no longer exists.");
    if (user.isDemo)
        return getDemoProcessingResult();
    const resetAt = usagePeriodResetAt(user.quotaCycleStartAt, false);
    if (user.draftsUsed + user.draftsReserved >= user.draftLimit) {
        return {
            message: new UsageLimitError(false, resetAt).message,
            processed: 0,
            created: 0,
            skipped: 0,
            failed: 0,
            details: [],
            limitReached: true,
            aiRateLimitReached: false,
            draftsUsed: user.draftsUsed,
            draftLimit: user.draftLimit,
            usagePeriodStart: user.usagePeriodStart,
            quotaCycleStartAt: user.quotaCycleStartAt,
            usagePeriodResetAt: resetAt,
        };
    }
    if (!spreadsheet.sheetName.trim())
        throw new SpreadsheetValidationError("Sheet tab not found");
    const sheetId = await getConfiguredSheetId(userId, spreadsheet.spreadsheetId, spreadsheet.sheetName);
    if (sheetId === null)
        throw new SpreadsheetValidationError("Sheet tab not found");
    const leads = await getLeads(userId, spreadsheet);
    if (leads.length === 0)
        throw new SpreadsheetValidationError(`No leads found in ${spreadsheet.sheetName}`);
    const details = await processLeadsIndependently(leads, (lead, leadNumber, totalLeads) => processLead(userId, lead, leadNumber, totalLeads), async (lead, error) => {
        await markSheetFailed(userId, lead);
        try {
            const record = await findLeadRecord(userId, lead);
            if (record?.status === PROCESSING_STATUS.PROCESSING)
                await markLeadFailed(record, error);
        }
        catch (recordError) {
            console.error(`Could not persist unexpected failure for lead ${leadLabel(lead)}: ${errorMessage(recordError)}`);
        }
    }, onProgress);
    const limitReached = details.some((result) => (result.action === "failed" && result.reason?.startsWith("Draft limit reached.") === true));
    const aiRateLimitReached = details.some((result) => result.reason === GEMINI_RATE_LIMIT_MESSAGE);
    const summary = summarizeProcessingResults(details);
    const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { draftsUsed: true, draftLimit: true, usagePeriodStart: true, quotaCycleStartAt: true, isDemo: true },
    });
    if (!updatedUser)
        throw new Error("Authenticated user no longer exists.");
    console.info(`Lead processing complete: ${summary.processed} evaluated, ${summary.created} created, ${summary.skipped} skipped, ${summary.failed} failed.`);
    return {
        message: aiRateLimitReached
            ? GEMINI_RATE_LIMIT_MESSAGE
            : limitReached
                ? new UsageLimitError(false, usagePeriodResetAt(updatedUser.quotaCycleStartAt, false)).message
                : "Lead processing completed",
        ...summary,
        details,
        limitReached,
        aiRateLimitReached,
        draftsUsed: updatedUser.draftsUsed,
        draftLimit: updatedUser.draftLimit,
        usagePeriodStart: updatedUser.usagePeriodStart,
        quotaCycleStartAt: updatedUser.quotaCycleStartAt,
        usagePeriodResetAt: usagePeriodResetAt(updatedUser.isDemo ? updatedUser.usagePeriodStart : updatedUser.quotaCycleStartAt, updatedUser.isDemo),
    };
}
export function summarizeProcessingResults(results) {
    const counts = results.reduce((total, result) => {
        if (Object.hasOwn(total, result.action))
            total[result.action] += 1;
        return total;
    }, { created: 0, skipped: 0, failed: 0 });
    return {
        processed: results.length,
        created: counts.created,
        skipped: counts.skipped,
        failed: counts.failed,
    };
}
