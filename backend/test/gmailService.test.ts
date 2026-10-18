import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { buildRawEmail } from "../src/services/gmailService.js";
import { decideLeadAction, summarizeProcessingResults } from "../src/services/leadProcessingService.js";
import type { Lead } from "../src/types/domain.js";

function testLead(overrides: Partial<Lead> = {}): Lead {
  return {
    rowNumber: 2,
    name: "Priya Shah",
    email: "priya@example.com",
    company: "Example Labs",
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

test("draft message construction includes recipient, subject, and body without a send operation", () => {
  const raw = buildRawEmail({
    to: "lead@example.com",
    subject: "Following up on your project",
    body: "Hello Priya,\n\nThank you for reaching out.",
  });

  assert.match(raw, /^To: lead@example\.com\r?\n/);
  assert.match(raw, /Subject: Following up on your project/);
  assert.match(raw, /Hello Priya,/);
  assert.doesNotMatch(raw, /\bSend\b/i);
});

test("lead status and validation resolve to a single row action", () => {
  const lead = testLead({
    status: "New",
    draftId: "",
    validationErrors: [],
  });
  assert.equal(decideLeadAction(lead).action, "create");
  assert.equal(decideLeadAction({ ...lead, status: "Draft Created", draftId: "draft-1" }).action, "skipped");
  const draftCreatedLead = { ...lead, status: "Draft Created" };
  assert.equal(decideLeadAction(draftCreatedLead).action, "create");

  const leadFingerprint = crypto.createHash("sha256").update(JSON.stringify([
    lead.name, lead.email, lead.company, lead.website, lead.context,
  ])).digest("hex");
  const trackedDraft = {
    leadFingerprint,
    status: "draft_created" as const,
    gmailDraftId: "draft-1",
  };
  assert.equal(decideLeadAction(draftCreatedLead, trackedDraft).action, "skipped");
  assert.equal(decideLeadAction(lead, trackedDraft).action, "skipped");
  assert.equal(
    decideLeadAction(draftCreatedLead, { ...trackedDraft, leadFingerprint: "different-lead" }).action,
    "create",
  );
  assert.equal(decideLeadAction({ ...lead, status: "Failed" }).action, "skipped");
  assert.equal(decideLeadAction({ ...lead, status: "Sent" }).action, "skipped");
  assert.equal(decideLeadAction({ ...lead, validationErrors: ["missing email"] }).action, "skipped");
  assert.equal(decideLeadAction({ ...lead, status: "Sent", validationErrors: ["missing email"] }).action, "skipped");
});

test("processing totals contain only created, skipped, and failed outcomes", () => {
  assert.deepEqual(
    summarizeProcessingResults([
      { action: "created" },
      { action: "skipped" },
      { action: "failed" },
    ]),
    {
      processed: 3,
      created: 1,
      skipped: 1,
      failed: 1,
    },
  );
});
