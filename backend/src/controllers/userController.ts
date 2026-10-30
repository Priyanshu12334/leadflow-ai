import type { RequestHandler } from "express";
import { prisma } from "../db/prisma.js";
import { authenticatedUserSelect, type AuthenticatedUser } from "../types/authenticatedUser.js";
import { decryptToken } from "../services/tokenEncryptionService.js";
import { createOAuthClient } from "../services/googleOAuthService.js";
import { getConfiguredSheetId } from "../services/sheetsService.js";
import { refreshUsageCycle, usagePeriodResetAt } from "../services/leadProcessingService.js";

function publicUser(user: AuthenticatedUser & { usagePeriodResetAt?: Date }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    draftsUsed: user.draftsUsed,
    draftLimit: user.draftLimit,
    usagePeriodStart: user.usagePeriodStart,
    usagePeriodResetAt: user.usagePeriodResetAt ?? usagePeriodResetAt(user.usagePeriodStart),
    googleConnected: Boolean(user.googleRefreshToken),
    spreadsheetId: user.spreadsheetId,
    sheetName: user.sheetName,
    createdAt: user.createdAt,
  };
}

export const getCurrentUser: RequestHandler = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Authentication is required." });
  try {
    const user = await refreshUsageCycle(req.user.id);
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
};

export const getSpreadsheetOpenLink: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Authentication is required." });
    if (!user.googleRefreshToken) return res.status(409).json({ error: "Connect your Google account before opening a spreadsheet." });
    const { spreadsheetId, sheetName } = user;
    if (!spreadsheetId || !/^[A-Za-z0-9_-]{15,}$/.test(spreadsheetId)) {
      return res.status(409).json({ error: "Configure a valid spreadsheet before opening it." });
    }

    const sheetId = await getConfiguredSheetId(user.id, spreadsheetId, sheetName);
    if (sheetId === null) {
      return res.status(404).json({ error: `The configured tab "${sheetName}" was not found. Check its name and save your settings.`, code: "SHEET_TAB_NOT_FOUND" });
    }

    const url = new URL(`/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/edit`, "https://docs.google.com");
    url.hash = new URLSearchParams({ gid: String(sheetId) }).toString();
    return res.json({ url: url.toString(), sheetId, sheetName });
  } catch (error) {
    return next(error);
  }
};

export const disconnectGoogle: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication is required." });
    const userId = req.user.id;
    const stored = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleRefreshToken: true },
    });
    if (!stored) return res.status(401).json({ error: "Authentication is required." });

    // Remove local access first, and keep the app account, quota and history.
    const disconnected = await prisma.user.updateMany({
      where: { id: userId, googleRefreshToken: stored.googleRefreshToken },
      data: { googleRefreshToken: null, spreadsheetId: null },
    });

    if (disconnected.count === 1 && stored.googleRefreshToken) {
      try {
        const refreshToken = decryptToken(stored.googleRefreshToken);
        await createOAuthClient().revokeToken(refreshToken);
      } catch {
        // Local disconnection is still complete if Google's revoke endpoint is unavailable.
        console.warn("Google grant revocation failed after local account disconnection.");
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: authenticatedUserSelect });
    if (!user) return res.status(401).json({ error: "Authentication is required." });
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};

export const updateSpreadsheet: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication is required." });
    if (!req.user.googleRefreshToken) return res.status(409).json({ error: "Connect your Google account before configuring a spreadsheet." });
    const { spreadsheetId, sheetName = "Sheet1" } = req.body || {};
    if (typeof spreadsheetId !== "string" || !/^[A-Za-z0-9_-]{15,}$/.test(spreadsheetId)) {
      return res.status(400).json({ error: "A valid Google spreadsheet ID is required." });
    }
    if (typeof sheetName !== "string" || sheetName.trim().length === 0 || sheetName.length > 100) {
      return res.status(400).json({ error: "A valid sheet name is required." });
    }
    // Verify both spreadsheet access and the configured tab using this user's
    // own stored OAuth grant before persisting the configuration.
    const sheetId = await getConfiguredSheetId(req.user.id, spreadsheetId, sheetName.trim());
    if (sheetId === null) {
      return res.status(400).json({ error: `The tab "${sheetName.trim()}" was not found in this spreadsheet. Check the tab name and try again.`, code: "SHEET_TAB_NOT_FOUND" });
    }
    const update = await prisma.user.updateMany({
      where: { id: req.user.id },
      data: { spreadsheetId, sheetName: sheetName.trim() },
    });
    if (update.count === 0) return res.status(401).json({ error: "Authentication is required." });
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: authenticatedUserSelect,
    });
    if (!user) return res.status(401).json({ error: "Authentication is required." });
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  };
}
