import { google } from "googleapis";
import { prisma } from "../db/prisma.js";
import { decryptToken } from "./tokenEncryptionService.js";
import { config } from "../config/env.js";
export class GoogleConnectionError extends Error {
    constructor(message, cause) {
        super(message, cause === undefined ? undefined : { cause });
        this.name = "GoogleConnectionError";
    }
}
export async function getGoogleClient(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { googleRefreshToken: true },
    });
    if (!user || !user.googleRefreshToken) {
        throw new GoogleConnectionError("Google account is not connected. Please connect it and try again.");
    }
    const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, config.googleRedirectUri);
    try {
        client.setCredentials({ refresh_token: decryptToken(user.googleRefreshToken) });
    }
    catch (error) {
        throw new GoogleConnectionError("Google connection could not be decrypted. Please reconnect your account.", error);
    }
    return { client, user };
}
export function isGoogleTokenError(error) {
    if (!(error instanceof Error))
        return false;
    const googleError = error;
    const status = googleError.response?.status || googleError.code;
    const reason = googleError.response?.data?.error || googleError.message;
    return status === 401 || reason === "invalid_grant" || /invalid_grant|invalid credentials|token.*expired/i.test(reason);
}
