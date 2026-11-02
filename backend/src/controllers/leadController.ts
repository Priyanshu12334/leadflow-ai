import { processUserLeads } from "../services/leadProcessingService.js";
import type { RequestHandler } from "express";
import { getLeads } from "../services/sheetsService.js";

export const listLeads: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication is required." });
    const { spreadsheetId, sheetName } = req.user;
    if (!spreadsheetId) return res.status(400).json({ error: "Configure your Google spreadsheet before viewing leads." });
    const leads = await getLeads(req.user.id, { spreadsheetId, sheetName });
    res.json({ leads: leads.map(({ rowNumber, name, email, company, context, sheetFields }) => ({
      rowNumber,
      name,
      email,
      company,
      context,
      fields: sheetFields ?? [],
    })) });
  } catch (error) { next(error); }
};

export const processLeads: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication is required." });
    const { spreadsheetId, sheetName } = req.user;
    if (!spreadsheetId) return res.status(400).json({ error: "Configure your Google spreadsheet before processing leads." });
    const result = await processUserLeads(req.user.id, { spreadsheetId, sheetName });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
