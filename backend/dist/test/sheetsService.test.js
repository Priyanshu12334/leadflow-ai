import assert from "node:assert/strict";
import test from "node:test";
import { SpreadsheetValidationError, parseLeads, updateLeadStatus } from "../src/services/sheetsService.js";
test("parses named lead columns and finds the Status column", () => {
    const leads = parseLeads([
        ["Name", "Email", "Company", "Website", "Message/Context", "Status"],
        ["Priya Shah", "priya@example.com", "Example Labs", "https://example.com", "Needs a product website", "New"],
    ], { spreadsheetId: "sheet-id-123456789", sheetName: "Sheet1" });
    assert.equal(leads.length, 1);
    assert.equal(leads[0].context, "Needs a product website");
    assert.equal(leads[0].statusColumn, "F");
    assert.equal(leads[0].draftId, "");
    assert.equal(leads[0].draftIdColumn, null);
    assert.deepEqual(leads[0].validationErrors, []);
});
test("parses optional Gmail draft, message, and thread IDs from the sheet", () => {
    const leads = parseLeads([
        ["Name", "Email", "Company", "Status", "Gmail Draft ID", "Gmail Message ID", "Gmail Thread ID"],
        ["Priya Shah", "priya@example.com", "Example Labs", "Draft Created", "draft-123", "message-123", "thread-123"],
    ], { spreadsheetId: "sheet-id-123456789", sheetName: "Sheet1" });
    assert.equal(leads[0].draftId, "draft-123");
    assert.equal(leads[0].draftIdColumn, "E");
    assert.equal(leads[0].messageId, "message-123");
    assert.equal(leads[0].messageIdColumn, "F");
    assert.equal(leads[0].threadId, "thread-123");
    assert.equal(leads[0].threadIdColumn, "G");
});
test("parses leads without tracking columns and leaves the original sheet structure untouched", () => {
    const rows = [
        ["Contact Name", "Email Address", "Organization", "Company Website", "Requirements"],
        ["Lead One", "one@example.com", "Example One", "https://one.example", "Website refresh"],
        ["Lead Two", "two@example.com", "Example Two", "", "New product"],
        ["Lead Three", "three@example.com", "Example Three", "", ""],
        ["Lead Four", "four@example.com", "Example Four", "", "Consultation"],
    ];
    const originalHeaders = [...rows[0]];
    const leads = parseLeads(rows, { spreadsheetId: "sheet-id-123456789", sheetName: "Sheet1" });
    assert.equal(leads.length, 4);
    assert.deepEqual(leads.map((lead) => lead.status), ["New", "New", "New", "New"]);
    assert.deepEqual(leads.map((lead) => lead.statusColumn), [null, null, null, null]);
    assert.deepEqual(leads.map((lead) => lead.draftIdColumn), [null, null, null, null]);
    assert.deepEqual(leads.map((lead) => lead.messageIdColumn), [null, null, null, null]);
    assert.deepEqual(leads.map((lead) => lead.threadIdColumn), [null, null, null, null]);
    assert.deepEqual(rows[0], originalHeaders);
});
test("does not call Sheets when no status or metadata columns are mapped", async () => {
    const lead = {
        name: "",
        email: "",
        company: "",
        website: "",
        context: "",
        status: "New",
        draftId: "",
        messageId: "",
        threadId: "",
        spreadsheetId: "sheet-id-123456789",
        sheetName: "Sheet1",
        rowNumber: 2,
        statusColumn: null,
        draftIdColumn: null,
        messageIdColumn: null,
        threadIdColumn: null,
        validationErrors: [],
    };
    await assert.doesNotReject(updateLeadStatus("user-id", lead, "Draft Created", "draft-1", "message-1", "thread-1"));
});
test("flags incomplete leads and rejects sheets without required headers", () => {
    const leads = parseLeads([
        ["Name", "Email", "Company", "Status"],
        ["", "not-an-email", "", "New"],
    ], { spreadsheetId: "sheet-id-123456789", sheetName: "Sheet1" });
    assert.deepEqual(leads[0].validationErrors, ["missing name", "missing company", "invalid email"]);
    assert.throws(() => parseLeads([["Name", "Email", "Status"]], { spreadsheetId: "sheet-id-123456789", sheetName: "Sheet1" }), SpreadsheetValidationError);
});
