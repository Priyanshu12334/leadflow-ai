import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { config, getRequiredEnvironmentValue } from "../config/env.js";
import { PLAN_LIMITS } from "../config/constants.js";
import { prisma } from "../db/prisma.js";
import { encryptToken } from "../services/tokenEncryptionService.js";
import { exchangeCodeForGoogleAccount, getGoogleAuthorizationUrl } from "../services/googleOAuthService.js";
const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: "lax",
    secure: config.cookieSecure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
function isOAuthState(value) {
    return typeof value === "object"
        && value !== null
        && value.purpose === "google_oauth"
        && (value.userId === undefined || typeof value.userId === "string");
}
function issueAccessToken(user) {
    return jwt.sign({ sub: user.id }, getRequiredEnvironmentValue("JWT_SECRET"), { expiresIn: "7d" });
}
export const beginGoogleOAuth = (req, res) => {
    const state = jwt.sign({ purpose: "google_oauth", nonce: crypto.randomUUID(), userId: req.user?.id }, getRequiredEnvironmentValue("JWT_SECRET"), { expiresIn: "10m" });
    res.cookie("google_oauth_state", state, { ...COOKIE_OPTIONS, maxAge: 10 * 60 * 1000 });
    res.redirect(getGoogleAuthorizationUrl(state));
};
export const completeGoogleOAuth = async (req, res, next) => {
    try {
        const stateCookie = req.cookies?.google_oauth_state;
        const decodedState = jwt.verify(stateCookie || "", getRequiredEnvironmentValue("JWT_SECRET"));
        if (!isOAuthState(decodedState) || stateCookie !== req.query.state) {
            return res.status(400).json({ error: "Invalid or expired Google OAuth state." });
        }
        const state = decodedState;
        if (!req.query.code || typeof req.query.code !== "string") {
            return res.status(400).json({ error: "Google did not return an authorization code." });
        }
        const { tokens, profile } = await exchangeCodeForGoogleAccount(req.query.code);
        const user = state.userId
            ? await prisma.user.findUnique({
                where: { id: state.userId },
                select: { id: true, googleId: true, googleRefreshToken: true },
            })
            : profile.id
                ? await prisma.user.findUnique({
                    where: { googleId: profile.id },
                    select: { id: true, googleId: true, googleRefreshToken: true },
                })
                : null;
        const owner = profile.id
            ? await prisma.user.findUnique({
                where: { googleId: profile.id },
                select: { id: true },
            })
            : null;
        if (state.userId && owner && owner.id !== state.userId) {
            return res.status(409).json({ error: "That Google account is already connected to another user." });
        }
        const googleRefreshToken = tokens.refresh_token
            ? encryptToken(tokens.refresh_token)
            : user?.googleRefreshToken;
        if (!googleRefreshToken) {
            return res.status(400).json({ error: "Google did not return a refresh token. Please reconnect and approve access." });
        }
        const email = profile.email?.trim().toLowerCase();
        if (!email || !profile.id)
            return res.status(400).json({ error: "Google did not return an account identity." });
        const values = {
            name: (profile.name || email).trim(),
            email,
            googleId: profile.id,
            googleRefreshToken,
        };
        let account;
        if (user) {
            account = await prisma.user.update({
                where: { id: user.id },
                data: values,
                select: { id: true },
            });
        }
        else {
            account = await prisma.user.create({
                data: {
                    ...values,
                    plan: "free",
                    draftsUsed: 0,
                    draftsReserved: 0,
                    draftLimit: PLAN_LIMITS.free,
                    usagePeriodStart: new Date(),
                    spreadsheetId: null,
                    sheetName: "Sheet1",
                },
                select: { id: true },
            });
        }
        res.clearCookie("google_oauth_state", COOKIE_OPTIONS);
        res.cookie("access_token", issueAccessToken(account), COOKIE_OPTIONS);
        res.redirect(config.clientSuccessUrl);
    }
    catch (error) {
        next(error);
    }
};
export const logout = (_req, res) => {
    res.clearCookie("access_token", COOKIE_OPTIONS);
    res.status(204).send();
};
