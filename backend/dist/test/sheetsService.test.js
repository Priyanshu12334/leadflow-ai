import assert from "node:assert/strict";
import test from "node:test";
import { GOOGLE_SCOPES } from "../src/config/constants.js";
import { classifyGoogleSheetsPermissionFailure, findSheetIdByTitle, parseLeads, updateLeadStatus } from "../src/services/sheetsService.js";
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
test("imports a Name, Email, Company sheet with no validation errors", () => {
    const [lead] = parseLeads([
        ["Name", "Email", "Company"],
        ["Avery Chen", "avery@example.com", "Northstar Labs"],
    ], { spreadsheetId: "sheet-id-123456789", sheetName: "Sheet1" });
    assert.equal(lead.name, "Avery Chen");
    assert.equal(lead.email, "avery@example.com");
    assert.equal(lead.company, "Northstar Labs");
    assert.deepEqual(lead.validationErrors, []);
});
test("imports a Name, Email, Requirement sheet and maps Requirement to context", () => {
    const [lead] = parseLeads([
        ["Name", "Email", "Requirement"],
        ["Jordan Lee", "jordan@example.com", "Needs pricing for the analytics plan"],
    ], { spreadsheetId: "sheet-id-123456789", sheetName: "Sheet2" });
    assert.equal(lead.name, "Jordan Lee");
    assert.equal(lead.email, "jordan@example.com");
    assert.equal(lead.company, "");
    assert.equal(lead.context, "Needs pricing for the analytics plan");
    assert.deepEqual(lead.validationErrors, []);
    assert.deepEqual(lead.sheetData, [
        { column: "Name", value: "Jordan Lee" },
        { column: "Requirement", value: "Needs pricing for the analytics plan" },
    ]);
});
test("maps common header variations case-insensitively and retains optional and unknown fields", () => {
    const [lead] = parseLeads([
        ["FULL NAME", "E-mail", "Company Name", "Phone", "Website", "Custom Field"],
        ["Casey Park", "casey@example.com", "Example Org", "555-0100", "https://example.org", "Keep this value"],
    ], { spreadsheetId: "sheet-id-123456789", sheetName: "Sheet1" });
    assert.equal(lead.name, "Casey Park");
    assert.equal(lead.email, "casey@example.com");
    assert.equal(lead.company, "Example Org");
    assert.equal(lead.website, "https://example.org");
    assert.deepEqual(lead.validationErrors, []);
    assert.deepEqual(lead.sheetData, [
        { column: "FULL NAME", value: "Casey Park" },
        { column: "Company Name", value: "Example Org" },
        { column: "Phone", value: "555-0100" },
        { column: "Website", value: "https://example.org" },
        { column: "Custom Field", value: "Keep this value" },
    ]);
});
test("retains non-empty lead-specific sheet fields for email personalization without email or tracking IDs", () => {
    const leads = parseLeads([
        ["Name", "Email", "Company", "Product Interest", "Lead Source", "Status", "Notes", "Gmail Draft ID"],
        ["Maya Chen", "maya@example.test", "Northstar Robotics", "Inventory analytics", "Industry webinar", "New", "Comparing reporting options", "draft-internal"],
    ], { spreadsheetId: "sheet-id-123456789", sheetName: "Sheet1" });
    assert.deepEqual(leads[0].sheetData, [
        { column: "Name", value: "Maya Chen" },
        { column: "Company", value: "Northstar Robotics" },
        { column: "Product Interest", value: "Inventory analytics" },
        { column: "Lead Source", value: "Industry webinar" },
        { column: "Status", value: "New" },
        { column: "Notes", value: "Comparing reporting options" },
    ]);
});
test("resolves the configured tab to Google's numeric gid and handles missing tabs", () => {
    const metadata = [
        { properties: { sheetId: 0, title: "Sheet1" } },
        { properties: { sheetId: 84729163, title: "Sheet2" } },
    ];
    assert.equal(findSheetIdByTitle(metadata, "Sheet2"), 84729163);
    assert.equal(findSheetIdByTitle(metadata, "Renamed tab"), null);
    assert.equal(findSheetIdByTitle(undefined, "Sheet1"), null);
});
test("inspects Google error details before classifying a Sheets 403", () => {
    assert.equal(classifyGoogleSheetsPermissionFailure({
        response: { status: 403, data: { error: { status: "PERMISSION_DENIED", details: [{ reason: "ACCESS_TOKEN_SCOPE_INSUFFICIENT" }] } } },
    }).code, "GOOGLE_SHEETS_SCOPE_REQUIRED");
    assert.equal(classifyGoogleSheetsPermissionFailure({
        response: { status: 403, data: { error: { status: "PERMISSION_DENIED", message: "The caller does not have permission" } } },
    }).code, "GOOGLE_SHEET_ACCESS_DENIED");
    assert.equal(classifyGoogleSheetsPermissionFailure({
        response: { status: 403, data: { error: { status: "PERMISSION_DENIED", message: "Google Sheets API has not been used in project" } } },
    }).diagnosticReason, "google_api_not_enabled_or_configured");
});
test("OAuth requests per-user Sheets and Gmail draft scopes", () => {
    assert.ok(GOOGLE_SCOPES.includes("https://www.googleapis.com/auth/spreadsheets"));
    assert.ok(GOOGLE_SCOPES.includes("https://www.googleapis.com/auth/gmail.compose"));
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
test("keeps rows without a recipient and explains why processing must skip them", () => {
    const leads = parseLeads([
        ["Name", "Email", "Company", "Status"],
        ["", "not-an-email", "", "New"],
    ], { spreadsheetId: "sheet-id-123456789", sheetName: "Sheet1" });
    assert.deepEqual(leads[0].validationErrors, ["invalid email; draft skipped because a valid recipient email is required"]);
    const withoutEmailHeader = parseLeads([["Organization", "Custom"], ["Acme", "Keep"]], { spreadsheetId: "sheet-id-123456789", sheetName: "Sheet1" });
    assert.deepEqual(withoutEmailHeader[0].validationErrors, ["email column could not be identified; draft skipped because a recipient email is required"]);
    assert.deepEqual(parseLeads([], { spreadsheetId: "sheet-id-123456789", sheetName: "Sheet1" }), []);
    assert.deepEqual(parseLeads([["Company", "Status"]], { spreadsheetId: "sheet-id-123456789", sheetName: "Sheet1" }), []);
});
test("imports arbitrary reordered headers, duplicate headers, ragged rows, and custom values", () => {
    const [lead] = parseLeads([
        [" LinkedIn Profile ", "Mail ID", "Business", "Contact Name", "Custom", "Custom"],
        ["https://linkedin.example/acme", "a@b.example", "Acme", "", "first", "second", "extra"],
    ], { spreadsheetId: "sheet-id-123456789", sheetName: "Other" });
    assert.equal(lead.linkedin, "https://linkedin.example/acme");
    assert.equal(lead.email, "a@b.example");
    assert.equal(lead.company, "Acme");
    assert.equal(lead.name, "");
    assert.deepEqual(lead.sheetFields?.slice(-3), [
        { column: "Custom", value: "first" },
        { column: "Custom", value: "second" },
        { column: "Column G", value: "extra" },
    ]);
    assert.deepEqual(lead.validationErrors, []);
});
test("recognizes contact names and student names after unrelated leading columns", () => {
    const [companyLead] = parseLeads([
        ["Company", "Contact Name", "Email Address", "Requirement"],
        ["Northstar Labs", "Avery Chen", "avery@example.com", "Analytics options"],
    ], { spreadsheetId: "sheet-id-123456789", sheetName: "Companies" });
    assert.equal(companyLead.name, "Avery Chen");
    assert.equal(companyLead.company, "Northstar Labs");
    const [studentLead] = parseLeads([
        ["Student U.Roll", "Student Name", "Date of exam", "Time of exam"],
        ["U-1042", "Mira Patel", "2026-05-12", "09:30"],
    ], { spreadsheetId: "sheet-id-123456789", sheetName: "Students" });
    assert.equal(studentLead.name, "Mira Patel");
    assert.deepEqual(studentLead.sheetFields, [
        { column: "Student U.Roll", value: "U-1042" },
        { column: "Student Name", value: "Mira Patel" },
        { column: "Date of exam", value: "2026-05-12" },
        { column: "Time of exam", value: "09:30" },
    ]);
    assert.match(studentLead.validationErrors[0], /recipient email is required/);
});
