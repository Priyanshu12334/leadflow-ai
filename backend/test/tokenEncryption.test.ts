import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

process.env.TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64");
const { decryptToken, encryptToken } = await import("../src/services/tokenEncryptionService.js");

test("Google refresh tokens encrypt with a random IV and decrypt successfully", () => {
  const token = "google-refresh-token-for-user-a";
  const firstEncrypted = encryptToken(token);
  const secondEncrypted = encryptToken(token);

  assert.notEqual(firstEncrypted, secondEncrypted);
  assert.equal(decryptToken(firstEncrypted), token);
  assert.equal(decryptToken(secondEncrypted), token);
});

test("tampered encrypted Google refresh tokens are rejected", () => {
  const encrypted = encryptToken("google-refresh-token-for-user-b");
  assert.throws(() => decryptToken(`${encrypted}tampered`));
});
