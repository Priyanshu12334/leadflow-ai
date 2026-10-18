import assert from "node:assert/strict";
import test from "node:test";
import { leadRecordFilter } from "../src/services/leadProcessingService.js";
import type { Lead } from "../src/types/domain.js";

const sharedSheetLead: Lead = {
  rowNumber: 8,
  name: "Lead",
  email: "lead@example.com",
  company: "Example",
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
  spreadsheetId: "shared-sheet-id-123456",
  sheetName: "Leads",
  validationErrors: [],
};

test("two users processing the same sheet row receive separate history keys", () => {
  const userAKey = leadRecordFilter("user-a", sharedSheetLead);
  const userBKey = leadRecordFilter("user-b", sharedSheetLead);

  assert.deepEqual(userAKey, {
    userId: "user-a",
    spreadsheetId: sharedSheetLead.spreadsheetId,
    sheetName: sharedSheetLead.sheetName,
    rowNumber: sharedSheetLead.rowNumber,
  });
  assert.deepEqual(userBKey, { ...userAKey, userId: "user-b" });
  assert.notDeepEqual(userAKey, userBKey);
});
