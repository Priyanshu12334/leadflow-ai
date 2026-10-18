import { google } from "googleapis";
import { GOOGLE_SCOPES } from "../config/constants.js";
import { config } from "../config/env.js";
export function createOAuthClient() {
    return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, config.googleRedirectUri);
}
export function getGoogleAuthorizationUrl(state) {
    return createOAuthClient().generateAuthUrl({
        access_type: "offline",
        include_granted_scopes: true,
        prompt: "consent select_account",
        scope: [...GOOGLE_SCOPES],
        state,
    });
}
export async function exchangeCodeForGoogleAccount(code) {
    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data } = await oauth2.userinfo.get();
    if (!data.id || !data.email) {
        throw new Error("Google did not return an account identity.");
    }
    return { tokens, profile: data };
}
