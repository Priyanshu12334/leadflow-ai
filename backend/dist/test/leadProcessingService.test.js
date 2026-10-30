import assert from "node:assert/strict";
import test from "node:test";
import { mergeLeadTracking, processLeadsIndependently, summarizeProcessingResults, usagePeriodResetAt } from "../src/services/leadProcessingService.js";
import { withGeminiRetries } from "../src/services/geminiService.js";
function testLead(overrides = {}) {
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
test("usage cycles reset exactly 30 days after the user's cycle start", () => {
    assert.equal(usagePeriodResetAt(new Date("2026-10-07T12:34:56.000Z")).toISOString(), "2026-11-06T12:34:56.000Z");
    assert.equal(usagePeriodResetAt(new Date("2026-01-31T00:00:00.000Z")).toISOString(), "2026-03-02T00:00:00.000Z");
});
test("Gemini retries temporary 503/429 errors twice with bounded exponential delays", async () => {
    const delays = [];
    let attempts = 0;
    const result = await withGeminiRetries(async () => {
        attempts += 1;
        if (attempts < 3) {
            const error = Object.assign(new Error("temporary overload"), { status: attempts === 1 ? 503 : 429 });
            throw error;
        }
        return "generated";
    }, async (delay) => { delays.push(delay); });
    assert.equal(result, "generated");
    assert.equal(attempts, 3);
    assert.deepEqual(delays, [250, 500]);
});
test("exhausted Gemini retries are identified and later new leads are still processed", async () => {
    const leads = [1, 2, 3].map((rowNumber) => testLead({
        name: `Lead ${rowNumber}`,
        email: `lead${rowNumber}@example.com`,
        rowNumber,
        status: "New",
        draftId: "",
    }));
    const generated = [];
    const details = await processLeadsIndependently(leads, async (lead) => {
        const email = await withGeminiRetries(async () => {
            generated.push(lead.rowNumber);
            if (lead.rowNumber === 1) {
                const error = Object.assign(new Error("high demand"), { status: 503 });
                throw error;
            }
            return { subject: "Hello", body: "A short note." };
        }, async () => { });
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
test("non-temporary Gemini errors are not retried", async () => {
    let attempts = 0;
    await assert.rejects(withGeminiRetries(async () => {
        attempts += 1;
        const error = Object.assign(new Error("invalid request"), { status: 400 });
        throw error;
    }, async () => { }), /Gemini generation error: invalid request/);
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
    const details = await processLeadsIndependently(leads, async () => ({ action: "created" }));
    assert.deepEqual(summarizeProcessingResults(details), {
        processed: 4,
        created: 4,
        skipped: 0,
        failed: 0,
    });
});
