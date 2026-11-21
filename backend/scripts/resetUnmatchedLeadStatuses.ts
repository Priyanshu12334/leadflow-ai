import type { LeadProcessingStatus } from "@prisma/client";
import { PROCESSING_STATUS } from "../src/config/constants.js";
import { prisma } from "../src/db/prisma.js";
import { getLeads, updateLeadStatus } from "../src/services/sheetsService.js";

const resettableStatuses: LeadProcessingStatus[] = [PROCESSING_STATUS.DRAFT_CREATED, PROCESSING_STATUS.FAILED];
const resettableSheetStatuses = new Set(["draft created", "failed", "processed", "already processed"]);
const applyChanges = process.argv.includes("--apply");
const resetQuota = process.argv.includes("--reset-quota");
const accountEmail = process.argv.find((argument) => argument.startsWith("--email="))?.slice("--email=".length);

function quotaResetAt(cycleStartAt: Date): Date {
  return new Date(cycleStartAt.getTime() + 30 * 24 * 60 * 60 * 1000);
}

async function resetUnmatchedLeadStatuses(): Promise<void> {
  const users = await prisma.user.findMany({
    where: accountEmail ? { email: accountEmail, isDemo: false } : { isDemo: false },
    select: {
      id: true,
      spreadsheetId: true,
      sheetName: true,
      draftsUsed: true,
      draftsReserved: true,
      draftLimit: true,
      quotaCycleStartAt: true,
    },
    ...(accountEmail ? {} : { take: 2 }),
  });
  if (users.length === 0) {
    throw new Error(accountEmail ? "The specified non-demo account was not found." : "No local non-demo account was found.");
  }
  if (users.length > 1) {
    throw new Error("Multiple local non-demo accounts were found. Rerun with --email=<your account email>.");
  }

  const user = users[0];
  if (!user.spreadsheetId) throw new Error("The selected account has no configured spreadsheet.");
  const spreadsheet = { spreadsheetId: user.spreadsheetId, sheetName: user.sheetName };
  const [leads, records] = await Promise.all([
    getLeads(user.id, spreadsheet),
    prisma.leadProcessing.findMany({
      where: { userId: user.id, ...spreadsheet },
      select: { id: true, rowNumber: true, status: true, gmailDraftId: true, updatedAt: true },
    }),
  ]);
  if (resetQuota) {
    const activeProcessingCutoff = new Date(Date.now() - 10 * 60 * 1000);
    if (user.draftsReserved > 0 || records.some((record) => (
      record.status === PROCESSING_STATUS.PROCESSING && record.updatedAt > activeProcessingCutoff
    ))) {
      throw new Error("Cannot reset quota while lead processing is active. Wait for processing to finish, then rerun.");
    }
  }
  const leadsByRow = new Map(leads.map((lead) => [lead.rowNumber, lead]));
  const recordsByRow = new Map(records.map((record) => [record.rowNumber, record]));
  const sheetRows = leads.filter((lead) => (
    resettableSheetStatuses.has(lead.status.trim().toLowerCase())
    && !lead.draftId
    && !recordsByRow.get(lead.rowNumber)?.gmailDraftId
  ));
  const databaseRecords = records.filter((record) => (
    record.status !== null
    && resettableStatuses.includes(record.status)
    && !record.gmailDraftId
    && !leadsByRow.get(record.rowNumber)?.draftId
  ));

  if (!applyChanges) {
    const sheetStatusCounts = new Map<string, { withDraftId: number; withoutDraftId: number }>();
    for (const lead of leads) {
      const status = lead.status || "blank";
      const count = sheetStatusCounts.get(status) ?? { withDraftId: 0, withoutDraftId: 0 };
      if (lead.draftId) count.withDraftId += 1;
      else count.withoutDraftId += 1;
      sheetStatusCounts.set(status, count);
    }
    const statusCounts = new Map<string, { withDraftId: number; withoutDraftId: number }>();
    for (const record of records) {
      const status = record.status ?? "null";
      const count = statusCounts.get(status) ?? { withDraftId: 0, withoutDraftId: 0 };
      if (record.gmailDraftId) count.withDraftId += 1;
      else count.withoutDraftId += 1;
      statusCounts.set(status, count);
    }
    const statusSummary = [...statusCounts.entries()]
      .map(([status, count]) => `${status}: ${count.withDraftId} with draft ID, ${count.withoutDraftId} without`)
      .join("; ") || "none";
    const sheetSummary = [...sheetStatusCounts.entries()]
      .map(([status, count]) => `${status}: ${count.withDraftId} with draft ID, ${count.withoutDraftId} without`)
      .join("; ") || "none";
    console.log(`Dry run: ${sheetRows.length} spreadsheet statuses and ${databaseRecords.length} database statuses are eligible. Rerun with --apply to reset them.`);
    console.log(`Spreadsheet status totals (${leads.length} leads): ${sheetSummary}.`);
    console.log(`Database status totals: ${statusSummary}.`);
    if (resetQuota) {
      console.log(`Quota dry run: ${user.draftsUsed} used, ${user.draftsReserved} reserved, ${user.draftLimit} limit. Cycle starts ${user.quotaCycleStartAt.toISOString()} and resets ${quotaResetAt(user.quotaCycleStartAt).toISOString()}.`);
    }
    return;
  }

  if (resetQuota) {
    const quotaReset = await prisma.user.updateMany({
      where: {
        id: user.id,
        draftsReserved: 0,
        quotaCycleStartAt: user.quotaCycleStartAt,
      },
      data: {
        draftsUsed: 0,
        quotaCycleStartAt: new Date(),
      },
    });
    if (quotaReset.count !== 1) {
      throw new Error("Account usage changed during reset. No lead statuses were changed; rerun the command.");
    }
  }

  for (const lead of sheetRows) {
    await updateLeadStatus(user.id, lead, "");
  }

  const reset = databaseRecords.length > 0
    ? await prisma.leadProcessing.updateMany({
      where: {
        id: { in: databaseRecords.map((record) => record.id) },
        status: { in: resettableStatuses },
        gmailDraftId: null,
      },
      data: { status: null, errorMessage: null },
    })
    : { count: 0 };

  console.log(`Cleared ${sheetRows.length} spreadsheet statuses and ${reset.count} database statuses.`);
  if (resetQuota) console.log(`Reset 30-day usage to 0/${user.draftLimit} and started a new quota cycle.`);
}

resetUnmatchedLeadStatuses()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
