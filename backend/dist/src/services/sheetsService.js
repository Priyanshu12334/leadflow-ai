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
export class SpreadsheetValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "SpreadsheetValidationError";
    }
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
function mapGoogleError(error) {
    if (isGoogleTokenError(error)) {
        throw new GoogleConnectionError("Google connection expired or was revoked. Please reconnect your account.", error);
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
        mapGoogleError(error);
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
        mapGoogleError(error);
    }
}
