import assert from "node:assert/strict";
import test from "node:test";
import { getDemoProcessingResult, mergeLeadTracking, processLeadsIndependently, summarizeProcessingResults, UsageLimitError, usagePeriodResetAt } from "../src/services/leadProcessingService.js";
import {
  createGeminiRequestScheduler,
  GeminiRateLimitError,
  GEMINI_RATE_LIMIT_MESSAGE,
  withGeminiRetries,
} from "../src/services/geminiService.js";
import type { Lead } from "../src/types/domain.js";

function testLead(overrides: Partial<Lead> = {}): Lead {
  return {
    rowNumber: 2,
    name: "",
    email: "",
    company: "",
    website: "",
    context: "",
    status: "New",
    draftId: "",
    messageId: "",
    threadId: "",
    statusColumn: null,
    draftIdColumn: null,
    messageIdColumn: null,
    threadIdColumn: null,
    spreadsheetId: "sheet-id-123456789",
    sheetName: "Sheet1",
    validationErrors: [],
    ...overrides,
  };
}

test("normal usage resets exactly 30 days after the user's quota cycle start", () => {
  assert.equal(usagePeriodResetAt(new Date("2026-10-07T12:34:56.000Z")).toISOString(), "2026-11-06T12:34:56.000Z");
  assert.equal(usagePeriodResetAt(new Date("2026-01-31T00:00:00.000Z")).toISOString(), "2026-03-02T00:00:00.000Z");
  assert.equal(usagePeriodResetAt(new Date("2026-12-31T00:00:00.000Z")).toISOString(), "2027-01-30T00:00:00.000Z");
});

test("demo usage resets at the next UTC day boundary", () => {
  assert.equal(usagePeriodResetAt(new Date("2026-11-21T12:34:56.000Z"), true).toISOString(), "2026-11-22T00:00:00.000Z");
});

test("quota errors include the rolling-cycle reset date", () => {
  const error = new UsageLimitError(false, new Date("2026-12-01T00:00:00.000Z"));
  assert.equal(error.message, "Draft limit reached. Resets on December 1, 2026.");
});

test("quota exhaustion stops the batch without marking later leads failed", async () => {
  const leads = [1, 2].map((rowNumber) => testLead({ rowNumber }));
  const attempted: number[] = [];
  const details = await processLeadsIndependently(leads, async (lead) => {
    attempted.push(lead.rowNumber);
    throw new UsageLimitError(false, new Date("2026-12-01T00:00:00.000Z"));
  });

  assert.deepEqual(attempted, [1]);
  assert.equal(details.length, 1);
  assert.equal(details[0].reason, "Draft limit reached. Resets on December 1, 2026.");
});

test("Gemini retries temporary 503 errors twice with bounded exponential delays", async () => {
  const delays: number[] = [];
  let attempts = 0;
  const result = await withGeminiRetries(async () => {
    attempts += 1;
    if (attempts < 3) {
      const error = Object.assign(new Error("temporary overload"), { status: 503 });
      throw error;
    }
    return "generated";
  }, async (delay) => { delays.push(delay); });

  assert.equal(result, "generated");
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [250, 500]);
});

test("Gemini 429 retries honor Retry-After with increasing delays", async () => {
  const delays: number[] = [];
  let attempts = 0;
  const result = await withGeminiRetries(async () => {
    attempts += 1;
    if (attempts < 4) {
      throw Object.assign(new Error("rate limited"), {
        status: 429,
        response: { headers: { "Retry-After": "2" } },
      });
    }
    return "generated";
  }, async (delay) => { delays.push(delay); });

  assert.equal(result, "generated");
  assert.equal(attempts, 4);
  assert.deepEqual(delays, [2000, 4000, 8000]);
});

test("exhausted Gemini 429 retries use increasing fallback delays and a friendly error", async () => {
  const delays: number[] = [];
  let attempts = 0;

  await assert.rejects(
    withGeminiRetries(async () => {
      attempts += 1;
      throw Object.assign(new Error("rate limited"), { status: 429 });
    }, async (delay) => { delays.push(delay); }),
    (error: unknown) => error instanceof GeminiRateLimitError && error.message === GEMINI_RATE_LIMIT_MESSAGE,
  );

  assert.equal(attempts, 4);
  assert.deepEqual(delays, [20_000, 40_000, 80_000]);
});

test("Gemini request scheduler serializes requests and leaves 13 seconds between them", async () => {
  let now = 0;
  let activeRequests = 0;
  let maxActiveRequests = 0;
  const startTimes: number[] = [];
  const delays: number[] = [];
  const schedule = createGeminiRequestScheduler(
    13_000,
    async (delay) => {
      delays.push(delay);
      now += delay;
    },
    () => now,
  );
  const request = async (result: number): Promise<number> => {
    startTimes.push(now);
    activeRequests += 1;
    maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
    await Promise.resolve();
    activeRequests -= 1;
    return result;
  };

  assert.deepEqual(await Promise.all([schedule(() => request(1)), schedule(() => request(2))]), [1, 2]);
  assert.deepEqual(startTimes, [0, 13_000]);
  assert.deepEqual(delays, [13_000]);
  assert.equal(maxActiveRequests, 1);
});

test("exhausted Gemini retries are identified and later new leads are still processed", async () => {
  const leads = [1, 2, 3].map((rowNumber) => testLead({
    name: `Lead ${rowNumber}`,
    email: `lead${rowNumber}@example.com`,
    rowNumber,
    status: "New",
    draftId: "",
  }));
  const generated: number[] = [];
  const details = await processLeadsIndependently(leads, async (lead) => {
    const email = await withGeminiRetries(async () => {
      generated.push(lead.rowNumber);
      if (lead.rowNumber === 1) {
        const error = Object.assign(new Error("high demand"), { status: 503 });
        throw error;
      }
      return { subject: "Hello", body: "A short note." };
    }, async () => {});
    return { action: "created", reason: `Created draft for ${email.subject}.` };
  });

  assert.deepEqual(generated, [1, 1, 1, 2, 3]);
  assert.deepEqual(details.map(({ action }) => action), ["failed", "created", "created"]);
  assert.match(details[0].reason || "", /^Gemini 503 UNAVAILABLE:/);
  assert.deepEqual(summarizeProcessingResults(details), {
    processed: 3,
    created: 2,
    skipped: 0,
    failed: 1,
  });
});

test("an exhausted Gemini rate limit stops the batch without marking later leads failed", async () => {
  const leads = [1, 2, 3].map((rowNumber) => testLead({
    name: `Lead ${rowNumber}`,
    email: `lead${rowNumber}@example.com`,
    rowNumber,
  }));
  const attempted: number[] = [];
  let failureHandlerCalls = 0;
  const details = await processLeadsIndependently(
    leads,
    async (lead) => {
      attempted.push(lead.rowNumber);
      throw new GeminiRateLimitError(new Error("429"));
    },
    async () => { failureHandlerCalls += 1; },
  );

  assert.deepEqual(attempted, [1]);
  assert.deepEqual(details.map(({ action }) => action), ["failed"]);
  assert.equal(details[0].reason, GEMINI_RATE_LIMIT_MESSAGE);
  assert.equal(failureHandlerCalls, 0);
});

test("non-temporary Gemini errors are not retried", async () => {
  let attempts = 0;
  await assert.rejects(
    withGeminiRetries(async () => {
      attempts += 1;
      const error = Object.assign(new Error("invalid request"), { status: 400 });
      throw error;
    }, async () => {}),
    /Gemini generation error: invalid request/,
  );
  assert.equal(attempts, 1);
});

test("database tracking supplies status and Gmail IDs when a sheet has no tracking columns", () => {
  const lead = testLead({
    status: "New",
    statusColumn: null,
    draftId: "",
    messageId: "",
    threadId: "",
  });
  const trackedDraft = mergeLeadTracking(lead, {
    status: "draft_created",
    gmailDraftId: "draft-1",
    gmailMessageId: "message-1",
    gmailThreadId: "thread-1",
  });
  assert.equal(trackedDraft.status, "Draft Created");
  assert.equal(trackedDraft.draftId, "draft-1");
  assert.equal(trackedDraft.messageId, "message-1");
  assert.equal(trackedDraft.threadId, "thread-1");

  const sentLead = mergeLeadTracking(lead, { status: "sent" });
  assert.equal(sentLead.status, "Sent");
});

test("legacy sheet status and metadata columns remain the source when present", () => {
  const lead = testLead({
    status: "New",
    statusColumn: "D",
    draftId: "",
    messageId: "",
    threadId: "",
  });
  const merged = mergeLeadTracking(lead, {
    status: "draft_created",
    gmailDraftId: "draft-1",
    gmailMessageId: "message-1",
    gmailThreadId: "thread-1",
  });
  assert.equal(merged.status, "New");
  assert.equal(merged.draftId, "draft-1");
  assert.equal(merged.messageId, "message-1");
  assert.equal(merged.threadId, "thread-1");
});

test("the four-lead new-row flow still reports four created drafts", async () => {
  const leads = Array.from({ length: 4 }, (_, index) => testLead({
    name: `Lead ${index + 1}`,
    email: `lead${index + 1}@example.com`,
    rowNumber: index + 2,
    status: "New",
    statusColumn: null,
    draftId: "",
    messageId: "",
    threadId: "",
  }));
  const progress: Array<{ currentLead: number; totalLeads: number; draftsCreated: number; failed: number }> = [];
  const details = await processLeadsIndependently(
    leads,
    async () => ({ action: "created" }),
    undefined,
    (update) => { progress.push(update); },
  );

  assert.deepEqual(summarizeProcessingResults(details), {
    processed: 4,
    created: 4,
    skipped: 0,
    failed: 0,
  });
  assert.deepEqual(progress.map(({ currentLead, draftsCreated }) => [currentLead, draftsCreated]), [
    [1, 0], [1, 1], [2, 1], [2, 2], [3, 2], [3, 3], [4, 3], [4, 4],
  ]);
});

test("demo processing returns fixed counts without draft details", () => {
  const result = getDemoProcessingResult();

  assert.equal(result.message, "8 demo drafts generated.");
  assert.deepEqual(
    { processed: result.processed, created: result.created, skipped: result.skipped, failed: result.failed },
    { processed: 8, created: 8, skipped: 0, failed: 0 },
  );
  assert.equal("details" in result, false);
});
