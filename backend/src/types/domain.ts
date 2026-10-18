export interface Lead {
  rowNumber: number;
  name: string;
  email: string;
  company: string;
  website: string;
  context: string;
  status: string;
  draftId: string;
  messageId: string;
  threadId: string;
  statusColumn: string | null;
  draftIdColumn: string | null;
  messageIdColumn: string | null;
  threadIdColumn: string | null;
  spreadsheetId: string;
  sheetName: string;
  validationErrors: string[];
}

export interface SpreadsheetLocation {
  spreadsheetId: string;
  sheetName: string;
}

export interface LeadProcessingRecordFields {
  status: string;
  gmailDraftId?: string | null;
  gmailMessageId?: string | null;
  gmailThreadId?: string | null;
}

export interface EmailContent {
  subject: string;
  body: string;
}

export interface GmailDraft {
  id?: string;
  message?: {
    id?: string | null;
    threadId?: string | null;
  } | null;
}
