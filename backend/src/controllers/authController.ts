import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { CookieOptions, RequestHandler } from "express";
import { config, getRequiredEnvironmentValue } from "../config/env.js";
import { PLAN_LIMITS } from "../config/constants.js";
import { prisma } from "../db/prisma.js";
import { encryptToken } from "../services/tokenEncryptionService.js";
import { exchangeCodeForGoogleAccount, getGoogleAuthorizationUrl } from "../services/googleOAuthService.js";

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: config.cookieSecure,
  // The callback is nested under /api/auth/google, while authenticated APIs
  // live under /api/users and /api/leads. Scope both cookies to the whole site.
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

interface OAuthState extends jwt.JwtPayload {
  purpose: "google_oauth";
  userId?: string;
}

function isOAuthState(value: string | jwt.JwtPayload): value is OAuthState {
  return typeof value === "object"
    && value !== null
    && value.purpose === "google_oauth"
    && (value.userId === undefined || typeof value.userId === "string");
}

function issueAccessToken(user: { id: string }): string {
  return jwt.sign({ sub: user.id }, getRequiredEnvironmentValue("JWT_SECRET"), { expiresIn: "7d" });
}

function oauthErrorUrl(code: string, userId?: string): string {
  const destination = userId ? config.clientSuccessUrl : config.frontendOrigin;
  const url = new URL(destination, config.frontendOrigin);
  url.searchParams.set("authError", code);
  return url.toString();
}

function safeOAuthFailure(error: unknown, stage: string) {
  const value = typeof error === "object" && error !== null
    ? error as { name?: unknown; code?: unknown; response?: { status?: unknown }; status?: unknown; message?: unknown }
    : undefined;
  const message = typeof value?.message === "string" ? value.message.toLowerCase() : "";
  const rawCode = value?.code;
  const normalizedCode = typeof rawCode === "string" ? rawCode.toLowerCase() : "";
  const code = (typeof rawCode === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(rawCode)) || typeof rawCode === "number"
    ? rawCode
    : undefined;
  const status = typeof value?.response?.status === "number"
    ? value.response.status
    : typeof value?.status === "number" ? value.status : undefined;
  const category = /invalid_grant/.test(message) ? "google_invalid_grant"
    : /invalid_client|unauthorized_client/.test(message) ? "google_client_configuration"
      : /redirect_uri_mismatch/.test(message) ? "google_redirect_uri_mismatch"
        : /p2002|unique constraint/.test(message) ? "database_unique_constraint"
        : /p2021|p2022|does not exist|unknown column/.test(message) ? "database_schema_mismatch"
            : /jwt_secret|missing required environment/.test(message) ? "server_configuration"
            : /p1001|p1002|p1008|econnrefused|etimedout|ehostunreach|enotfound/.test(normalizedCode) || /p1001|p1002|p1008|econnrefused|etimedout|ehostunreach|enotfound/.test(message) ? "network_connection_error"
              : /jsonwebtokenerror|tokenexpirederror/.test(String(value?.name || "").toLowerCase()) ? "oauth_state_invalid_or_expired"
              : "unclassified";
  return {
    stage,
    category,
    name: typeof value?.name === "string" ? value.name : "UnknownError",
    ...(code === undefined ? {} : { code }),
    ...(status === undefined ? {} : { status }),
  };
}

function clearCookieAtPath(res: Parameters<RequestHandler>[1], name: string, path: string) {
  // Also expire legacy default-path cookies created before path was explicit.
  res.clearCookie(name, { ...COOKIE_OPTIONS, path });
}

export const beginGoogleOAuth: RequestHandler = (req, res) => {
  const state = jwt.sign(
    { purpose: "google_oauth", nonce: crypto.randomUUID(), userId: req.user?.id },
    getRequiredEnvironmentValue("JWT_SECRET"),
    { expiresIn: "10m" },
  );
  res.cookie("google_oauth_state", state, { ...COOKIE_OPTIONS, maxAge: 10 * 60 * 1000 });
  res.redirect(getGoogleAuthorizationUrl(state));
};

export const completeGoogleOAuth: RequestHandler = async (req, res) => {
  const clearOAuthState = () => {
    clearCookieAtPath(res, "google_oauth_state", "/");
    clearCookieAtPath(res, "google_oauth_state", "/api/auth");
  };
  let stateUserId: string | undefined;
  let callbackStage = "state_validation";
  try {
    const stateCookie = req.cookies?.google_oauth_state;
    const decodedState = jwt.verify(stateCookie || "", getRequiredEnvironmentValue("JWT_SECRET"));
    if (!isOAuthState(decodedState) || stateCookie !== req.query.state) {
      console.warn("Google OAuth callback rejected:", { stage: "state_validation", category: "state_cookie_missing_or_mismatched" });
      clearOAuthState();
      return res.redirect(oauthErrorUrl("oauth_failed", stateUserId));
    }
    const state = decodedState;
    stateUserId = state.userId;
    if (!req.query.code || typeof req.query.code !== "string") {
      clearOAuthState();
      return res.redirect(oauthErrorUrl("google_denied", stateUserId));
    }

    callbackStage = "google_code_exchange";
    const { tokens, profile } = await exchangeCodeForGoogleAccount(req.query.code);
    callbackStage = "user_lookup";
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

    // A reconnect may only replace credentials for the identity already attached
    // to this app user. Switching Google accounts requires signing out first.
    if (state.userId && (!user || user.googleId !== profile.id)) {
      clearOAuthState();
      return res.redirect(oauthErrorUrl("account_mismatch", stateUserId));
    }

    const owner = profile.id
      ? await prisma.user.findUnique({
        where: { googleId: profile.id },
        select: { id: true },
      })
      : null;
    if (state.userId && owner && owner.id !== state.userId) {
      clearOAuthState();
      return res.redirect(oauthErrorUrl("account_in_use", stateUserId));
    }
    const googleRefreshToken = tokens.refresh_token
      ? (callbackStage = "token_encryption", encryptToken(tokens.refresh_token))
      : user?.googleRefreshToken;
    if (!googleRefreshToken) {
      clearOAuthState();
      return res.redirect(oauthErrorUrl("missing_refresh_token", stateUserId));
    }
    const email = profile.email?.trim().toLowerCase();
    if (!email || !profile.id) {
      clearOAuthState();
      return res.redirect(oauthErrorUrl("missing_identity", stateUserId));
    }

    const values = {
      name: (profile.name || email).trim(),
      email,
      googleId: profile.id,
      googleRefreshToken,
    };
    let account: { id: string };
    callbackStage = "user_persistence";
    if (user) {
      account = await prisma.user.update({
        where: { id: user.id },
        data: values,
        select: { id: true },
      });
    } else {
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

    clearOAuthState();
    clearCookieAtPath(res, "access_token", "/api/auth/google");
    callbackStage = "session_cookie_issue";
    res.cookie("access_token", issueAccessToken(account), COOKIE_OPTIONS);
    res.redirect(config.clientSuccessUrl);
  } catch (error) {
    // Do not leak provider responses, OAuth codes, or token details to the browser.
    clearOAuthState();
    const failure = safeOAuthFailure(error, callbackStage);
    console.error("Google OAuth callback failed:", failure);
    const userError = failure.category === "network_connection_error"
      && (callbackStage === "user_lookup" || callbackStage === "user_persistence")
      ? "database_unavailable"
      : "oauth_failed";
    res.redirect(oauthErrorUrl(userError, stateUserId));
  }
};

export const logout: RequestHandler = (_req, res) => {
  clearCookieAtPath(res, "access_token", "/");
  clearCookieAtPath(res, "access_token", "/api/auth/google");
  res.status(204).send();
};
