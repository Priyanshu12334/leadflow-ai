import { getDemoProcessingResult } from "../services/leadProcessingService.js";
import { getLeadProcessingJob, startLeadProcessingJob } from "../services/leadProcessingJobService.js";
import type { RequestHandler } from "express";
import { getLeads } from "../services/sheetsService.js";
import { demoLeads } from "../../data/demoLeads.js";

export const listLeads: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication is required." });
    if (req.user.isDemo) return res.json({ leads: demoLeads });
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
    if (!req.user.isDemo && !spreadsheetId) return res.status(400).json({ error: "Configure your Google spreadsheet before processing leads." });
    if (req.user.isDemo) return res.status(200).json(getDemoProcessingResult());
    const jobId = startLeadProcessingJob(req.user.id, { spreadsheetId: spreadsheetId ?? "", sheetName });
    return res.status(202).json({ jobId });
  } catch (error) {
    next(error);
  }
};

export const getProcessLeadsJob: RequestHandler = (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Authentication is required." });
  const jobId = req.params.jobId;
  if (typeof jobId !== "string") return res.status(404).json({ error: "Processing job not found." });
  const job = getLeadProcessingJob(req.user.id, jobId);
  if (!job) return res.status(404).json({ error: "Processing job not found." });
  return res.json({ job });
};
