import "dotenv/config";

const required = [
  "DATABASE_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GEMINI_API_KEY",
  "JWT_SECRET",
  "TOKEN_ENCRYPTION_KEY",
];

export function validateEnvironment() {
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const encryptionKey = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, "base64");
  if (encryptionKey.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  }
}

export function getRequiredEnvironmentValue(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}.`);
  return value;
}

export const config = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/auth/google/callback",
  clientSuccessUrl: process.env.CLIENT_SUCCESS_URL || "http://localhost:5173/dashboard",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  cookieSecure: process.env.NODE_ENV === "production",
  freeDraftLimit: Number(process.env.FREE_DRAFT_LIMIT || 20),
  proDraftLimit: Number(process.env.PRO_DRAFT_LIMIT || 1000),
};
