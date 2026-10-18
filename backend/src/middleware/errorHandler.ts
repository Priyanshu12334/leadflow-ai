import { GoogleConnectionError } from "../services/googleClientService.js";
import { UsageLimitError } from "../services/leadProcessingService.js";
import { GoogleSheetsPermissionError, SpreadsheetValidationError } from "../services/sheetsService.js";
import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Route not found." });
};

function hasCode(error: unknown, code: number | string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function getGoogleResponseStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("response" in error)) return undefined;
  const response = error.response;
  if (typeof response !== "object" || response === null || !("status" in response)) return undefined;
  return typeof response.status === "number" ? response.status : undefined;
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof UsageLimitError) return res.status(403).json({ error: error.message, code: "USAGE_LIMIT_REACHED" });
  if (error instanceof SpreadsheetValidationError) return res.status(400).json({ error: error.message, code: "INVALID_SPREADSHEET" });
  if (error instanceof GoogleConnectionError) return res.status(401).json({ error: error.message, code: "GOOGLE_RECONNECT_REQUIRED" });
  if (error instanceof GoogleSheetsPermissionError) {
    // Google API errors may carry request headers; log only safe classification data.
    console.warn("Google Sheets authorization failure:", {
      userId: error.userId,
      code: error.code,
      reason: error.diagnosticReason,
      status: 403,
    });
    return res.status(403).json({ error: error.message, code: error.code });
  }
  if (hasCode(error, 11000) || hasCode(error, "P2002")) {
    return res.status(409).json({ error: "A duplicate resource already exists." });
  }
  if (getGoogleResponseStatus(error) === 404) return res.status(400).json({ error: "Google Sheet or requested Google resource was not found." });
  if (getGoogleResponseStatus(error) === 403) {
    console.warn("Google API authorization failure:", { status: 403 });
    return res.status(403).json({ error: "Google denied access. Check the connected account and its access to this resource." });
  }
  console.error(error);
  res.status(500).json({ error: "The request could not be completed. Please try again." });
};
