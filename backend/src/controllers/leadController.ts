import { processUserLeads } from "../services/leadProcessingService.js";
import type { RequestHandler } from "express";

export const processLeads: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication is required." });
    const { spreadsheetId, sheetName = "Sheet1" } = req.body || {};
    if (typeof spreadsheetId !== "string" || !/^[A-Za-z0-9_-]{15,}$/.test(spreadsheetId)) {
      return res.status(400).json({ error: "A valid Google spreadsheet ID is required." });
    };
    if (typeof sheetName !== "string" || sheetName.trim().length === 0 || sheetName.length > 100) {
      return res.status(400).json({ error: "A valid sheet name is required." });
    }
    const result = await processUserLeads(req.user.id, { spreadsheetId, sheetName: sheetName.trim() });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
