import { google } from "googleapis";
import { getGoogleClient, GoogleConnectionError, isGoogleTokenError } from "./googleClientService.js";
const REQUIRED_HEADERS = ["name", "email", "company"];
const HEADER_ALIASES = {
    name: ["name", "full name", "contact name"],
    email: ["email", "email address", "email id"],
    company: ["company", "company name", "organization"],
    website: ["website", "web site", "company website", "url"],
    context: ["message", "context", "message context", "requirement", "notes", "details"],
    status: ["status"],
    draftId: ["draft id", "draftid", "gmail draft id", "gmail draftid"],
    messageId: ["gmail message id", "message id", "messageid"],
    threadId: ["gmail thread id", "thread id", "threadid"],
};
const AI_EXCLUDED_HEADERS = new Set([
    "email", "email address", "email id", "draft id", "draftid", "gmail draft id", "gmail draftid",
    "gmail message id", "message id", "messageid", "gmail thread id", "thread id", "threadid",
]);
export class SpreadsheetValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "SpreadsheetValidationError";
    }
}
export class GoogleSheetsPermissionError extends Error {
    code;
    userId;
    diagnosticReason;
    constructor(code, message, userId, diagnosticReason) {
        super(message);
        this.name = "GoogleSheetsPermissionError";
        this.code = code;
        this.userId = userId;
        this.diagnosticReason = diagnosticReason;
    }
}
function googleErrorReason(error) {
    if (typeof error !== "object" || error === null || !("response" in error))
        return "";
    const response = error.response;
    if (typeof response !== "object" || response === null || !("data" in response))
        return "";
    const data = response.data;
    if (typeof data !== "object" || data === null || !("error" in data))
        return "";
    const details = data.error;
    const strings = [];
    const visit = (value, depth = 0) => {
        if (depth > 6 || value === null || value === undefined)
            return;
        if (typeof value === "string") {
            strings.push(value);
            return;
        }
        if (Array.isArray(value)) {
            value.forEach((item) => visit(item, depth + 1));
            return;
        }
        if (typeof value === "object")
            Object.values(value).forEach((item) => visit(item, depth + 1));
    };
    visit(details);
    return strings.join(" ").toLowerCase();
}
export function classifyGoogleSheetsPermissionFailure(error) {
    const reason = googleErrorReason(error);
    if (/insufficientpermissions|access_token_scope_insufficient|insufficient authentication scopes/.test(reason)) {
        return { code: "GOOGLE_SHEETS_SCOPE_REQUIRED", diagnosticReason: "insufficient_oauth_scope" };
    }
    if (/accessnotconfigured|api_disabled|has not been used in project/.test(reason)) {
        return { code: "GOOGLE_SHEETS_FORBIDDEN_UNKNOWN", diagnosticReason: "google_api_not_enabled_or_configured" };
    }
    if (/caller does not have permission|does not have permission|permission_denied|insufficient permissions/.test(reason)) {
        return { code: "GOOGLE_SHEET_ACCESS_DENIED", diagnosticReason: "google_resource_permission_denied" };
    }
    return { code: "GOOGLE_SHEETS_FORBIDDEN_UNKNOWN", diagnosticReason: "unclassified_google_403" };
}
function quotedSheetName(sheetName) {
    return `'${sheetName.replace(/'/g, "''")}'`;
}
function normalizeHeader(value) {
    return String(value || "").trim().toLowerCase().replace(/[\/_-]+/g, " ").replace(/\s+/g, " ");
}
export function mapSheetColumns(headers) {
    const normalizedHeaders = headers.map(normalizeHeader);
    return Object.fromEntries(Object.entries(HEADER_ALIASES).map(([field, aliases]) => [
        field,
        normalizedHeaders.findIndex((header) => aliases.includes(header)),
    ]));
}
function columnLetter(index) {
    let value = index + 1;
    let result = "";
    while (value > 0) {
        const remainder = (value - 1) % 26;
        result = String.fromCharCode(65 + remainder) + result;
        value = Math.floor((value - 1) / 26);
    }
    return result;
}
export function parseLeads(rows, { spreadsheetId, sheetName }) {
    if (rows.length === 0) {
        throw new SpreadsheetValidationError("The selected sheet is empty. Add a header row before processing leads.");
    }
    const indexes = mapSheetColumns(rows[0]);
    const missingHeaders = REQUIRED_HEADERS.filter((field) => indexes[field] === -1);
    if (missingHeaders.length > 0) {
        throw new SpreadsheetValidationError(`The selected sheet is missing required column(s): ${missingHeaders.join(", ")}.`);
    }
    return rows.slice(1).map((row, index) => {
        const value = (field) => indexes[field] === -1 ? "" : String(row[indexes[field]] || "").trim();
        const sheetData = rows[0].flatMap((header, columnIndex) => {
            const column = String(header ?? "").trim();
            const cell = row[columnIndex];
            const cellValue = cell === null || cell === undefined ? "" : String(cell).trim();
            if (!column || !cellValue || AI_EXCLUDED_HEADERS.has(normalizeHeader(column)))
                return [];
            return [{ column, value: cellValue }];
        });
        const lead = {
            rowNumber: index + 2,
            name: value("name"),
            email: value("email"),
            company: value("company"),
            website: value("website"),
            context: value("context"),
            status: value("status") || "New",
            draftId: value("draftId"),
            messageId: value("messageId"),
            threadId: value("threadId"),
            statusColumn: indexes.status === -1 ? null : columnLetter(indexes.status),
            draftIdColumn: indexes.draftId === -1 ? null : columnLetter(indexes.draftId),
            messageIdColumn: indexes.messageId === -1 ? null : columnLetter(indexes.messageId),
            threadIdColumn: indexes.threadId === -1 ? null : columnLetter(indexes.threadId),
            spreadsheetId,
            sheetName,
            sheetData,
        };
        const validationErrors = ["name", "email", "company"]
            .filter((field) => !lead[field])
            .map((field) => `missing ${field}`);
        if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email))
            validationErrors.push("invalid email");
        return { ...lead, validationErrors };
    });
}
async function getUserSheet(userId, spreadsheetId, sheetName) {
    const { client } = await getGoogleClient(userId);
    return {
        sheets: google.sheets({ version: "v4", auth: client }),
        spreadsheetId,
        sheetName,
    };
}
export function findSheetIdByTitle(sheets, sheetName) {
    const match = sheets?.find((sheet) => sheet.properties?.title === sheetName);
    const sheetId = match?.properties?.sheetId;
    return typeof sheetId === "number" && Number.isSafeInteger(sheetId) && sheetId >= 0 ? sheetId : null;
}
export async function getConfiguredSheetId(userId, spreadsheetId, sheetName) {
    try {
        const { client } = await getGoogleClient(userId);
        const response = await google.sheets({ version: "v4", auth: client }).spreadsheets.get({
            spreadsheetId,
            fields: "sheets(properties(sheetId,title))",
        });
        return findSheetIdByTitle(response.data.sheets, sheetName);
    }
    catch (error) {
        mapGoogleError(error, userId);
    }
}
function mapGoogleError(error, userId) {
    if (isGoogleTokenError(error)) {
        throw new GoogleConnectionError("Google connection expired or was revoked. Please reconnect your account.", error);
    }
    const status = typeof error === "object" && error !== null && "response" in error
        && typeof error.response === "object" && error.response !== null && "status" in error.response
        ? error.response.status : undefined;
    if (status === 403) {
        const { code, diagnosticReason } = classifyGoogleSheetsPermissionFailure(error);
        if (code === "GOOGLE_SHEETS_SCOPE_REQUIRED") {
            throw new GoogleSheetsPermissionError("GOOGLE_SHEETS_SCOPE_REQUIRED", "This Google connection is missing Sheets permission. Reconnect Google and approve the requested Sheets access.", userId, diagnosticReason);
        }
        throw new GoogleSheetsPermissionError(code, code === "GOOGLE_SHEET_ACCESS_DENIED"
            ? "The connected Google account cannot access this spreadsheet. Share it with the connected account or choose a spreadsheet that account can access."
            : "Google denied the Sheets request. Check Google Cloud API configuration and the connected account's access.", userId, diagnosticReason);
    }
    throw error;
}
export async function getLeads(userId, { spreadsheetId, sheetName }) {
    try {
        const { sheets } = await getUserSheet(userId, spreadsheetId, sheetName);
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${quotedSheetName(sheetName)}!A1:ZZ`,
        });
        const rows = response.data.values || [];
        return parseLeads(rows, { spreadsheetId, sheetName });
    }
    catch (error) {
        mapGoogleError(error, userId);
    }
}
export async function updateLeadStatus(userId, lead, status, draftId, messageId, threadId) {
    try {
        const data = [];
        if (lead.statusColumn) {
            data.push({
                range: `${quotedSheetName(lead.sheetName)}!${lead.statusColumn}${lead.rowNumber}`,
                values: [[status]],
            });
        }
        if (lead.draftIdColumn && draftId !== undefined) {
            data.push({
                range: `${quotedSheetName(lead.sheetName)}!${lead.draftIdColumn}${lead.rowNumber}`,
                values: [[draftId]],
            });
        }
        if (lead.messageIdColumn && messageId !== undefined) {
            data.push({
                range: `${quotedSheetName(lead.sheetName)}!${lead.messageIdColumn}${lead.rowNumber}`,
                values: [[messageId]],
            });
        }
        if (lead.threadIdColumn && threadId !== undefined) {
            data.push({
                range: `${quotedSheetName(lead.sheetName)}!${lead.threadIdColumn}${lead.rowNumber}`,
                values: [[threadId]],
            });
        }
        if (data.length === 0)
            return;
        const { sheets } = await getUserSheet(userId, lead.spreadsheetId, lead.sheetName);
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: lead.spreadsheetId,
            requestBody: {
                valueInputOption: "USER_ENTERED",
                data,
            },
        });
    }
    catch (error) {
        mapGoogleError(error, userId);
    }
}
