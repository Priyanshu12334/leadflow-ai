import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
process.env.TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64");
const [{ google }, { configureGoogleClientForUser }, { encryptToken }] = await Promise.all([
    import("googleapis"),
    import("../src/services/googleClientService.js"),
    import("../src/services/tokenEncryptionService.js"),
]);
test("two users receive separate OAuth clients configured with their own stored refresh token", () => {
    const userA = { googleId: "google-user-a", googleRefreshToken: encryptToken("refresh-token-a") };
    const userB = { googleId: "google-user-b", googleRefreshToken: encryptToken("refresh-token-b") };
    const { client: clientA } = configureGoogleClientForUser("user-a", userA, new google.auth.OAuth2());
    const { client: clientB } = configureGoogleClientForUser("user-b", userB, new google.auth.OAuth2());
    assert.equal(clientA.credentials.refresh_token, "refresh-token-a");
    assert.equal(clientB.credentials.refresh_token, "refresh-token-b");
    assert.notEqual(clientA, clientB);
    assert.notEqual(clientA.credentials.refresh_token, clientB.credentials.refresh_token);
});
