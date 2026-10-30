import { processUserLeads } from "../services/leadProcessingService.js";
import type { RequestHandler } from "express";
import { prisma } from "../db/prisma.js";
import { getLeads } from "../services/sheetsService.js";
import crypto from "node:crypto";

export const listLeads: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication is required." });
    const { spreadsheetId, sheetName } = req.user;
    if (!spreadsheetId) return res.status(400).json({ error: "Configure your Google spreadsheet before viewing leads." });
    const leads = await getLeads(req.user.id, { spreadsheetId, sheetName });
    const records = await prisma.leadProcessing.findMany({ where: { userId: req.user.id, spreadsheetId, sheetName }, select: { rowNumber: true, nextFollowUpDate: true } });
    const dates = new Map(records.map((record) => [record.rowNumber, record.nextFollowUpDate?.toISOString().slice(0, 10) ?? null]));
    res.json({ leads: leads.map(({ rowNumber, name, email, company }) => ({ rowNumber, name, email, company, nextFollowUpDate: dates.get(rowNumber) ?? null })) });
  } catch (error) { next(error); }
};

export const updateLeadFollowUpDate: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication is required." });
    const { rowNumber, nextFollowUpDate } = req.body ?? {};
    if (!Number.isSafeInteger(rowNumber) || rowNumber < 2) return res.status(400).json({ error: "A valid lead row number is required." });
    const parsedDate = typeof nextFollowUpDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(nextFollowUpDate) ? new Date(`${nextFollowUpDate}T00:00:00.000Z`) : null;
    if (nextFollowUpDate !== null && (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== nextFollowUpDate)) {
      return res.status(400).json({ error: "Follow-up date must be a valid YYYY-MM-DD date or null." });
    }
    const { spreadsheetId, sheetName } = req.user;
    if (!spreadsheetId) return res.status(400).json({ error: "Configure your Google spreadsheet before updating leads." });
    const leads = await getLeads(req.user.id, { spreadsheetId, sheetName });
    const lead = leads.find((item) => item.rowNumber === rowNumber);
    if (!lead) return res.status(404).json({ error: "Lead row was not found in your configured spreadsheet." });
    const leadFingerprint = crypto.createHash("sha256").update(JSON.stringify([lead.name, lead.email, lead.company, lead.website, lead.context])).digest("hex");
    const filter = { userId: req.user.id, spreadsheetId, sheetName, rowNumber };
    const date = parsedDate;
    const record = await prisma.leadProcessing.upsert({
      where: { userId_spreadsheetId_sheetName_rowNumber: filter },
      create: { ...filter, leadFingerprint, status: null, nextFollowUpDate: date },
      update: { nextFollowUpDate: date },
      select: { nextFollowUpDate: true },
    });
    res.json({ nextFollowUpDate: record.nextFollowUpDate?.toISOString().slice(0, 10) ?? null });
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
