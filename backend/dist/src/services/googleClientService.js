import { google } from "googleapis";
import { prisma } from "../db/prisma.js";
import { decryptToken, encryptToken } from "./tokenEncryptionService.js";
import { config } from "../config/env.js";
export class GoogleConnectionError extends Error {
    constructor(message, cause) {
        super(message, cause === undefined ? undefined : { cause });
        this.name = "GoogleConnectionError";
    }
}
/** Attach a single user's decrypted refresh token to a fresh OAuth client. */
export function configureGoogleClientForUser(userId, user, client) {
    let refreshToken;
    try {
        refreshToken = decryptToken(user.googleRefreshToken);
        client.setCredentials({ refresh_token: refreshToken });
    }
    catch (error) {
        throw new GoogleConnectionError("Google connection could not be decrypted. Please reconnect your account.", error);
    }
    // A rotated token is written only to this user, with CAS protection against reconnect races.
    client.on("tokens", (tokens) => {
        if (!tokens.refresh_token)
            return;
        void prisma.user.updateMany({
            where: { id: userId, googleId: user.googleId, googleRefreshToken: user.googleRefreshToken },
            data: { googleRefreshToken: encryptToken(tokens.refresh_token) },
        }).catch(() => {
            // Never log OAuth library errors here: they can include credential metadata.
            console.error("Could not persist a refreshed Google credential for authenticated user.");
        });
    });
    return { client, user };
}
export async function getGoogleClient(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { googleId: true, googleRefreshToken: true },
    });
    if (!user || !user.googleRefreshToken) {
        throw new GoogleConnectionError("Google account is not connected. Please connect it and try again.");
    }
    const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, config.googleRedirectUri);
    return configureGoogleClientForUser(userId, {
        googleId: user.googleId,
        googleRefreshToken: user.googleRefreshToken,
    }, client);
}
export function isGoogleTokenError(error) {
    if (!(error instanceof Error))
        return false;
    const googleError = error;
    const status = googleError.response?.status || googleError.code;
    const values = [googleError.message];
    const visit = (value, depth = 0) => {
        if (depth > 5 || value === null || value === undefined)
            return;
        if (typeof value === "string") {
            values.push(value);
            return;
        }
        if (Array.isArray(value)) {
            value.forEach((item) => visit(item, depth + 1));
            return;
        }
        if (typeof value === "object")
            Object.values(value).forEach((item) => visit(item, depth + 1));
    };
    visit(googleError.response?.data);
    return status === 401 || status === "invalid_grant" || /invalid_grant|invalid credentials|token.*expired/i.test(values.join(" "));
}
