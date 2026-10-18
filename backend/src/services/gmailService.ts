import { google } from "googleapis";
import { getGoogleClient, GoogleConnectionError, isGoogleTokenError } from "./googleClientService.js";
import type { EmailContent } from "../types/domain.js";
import { errorMessage } from "../types/errors.js";

export function buildRawEmail({ to, subject, body }: { to: string } & EmailContent): string {
  return [
    `To: ${to}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    `Subject: ${subject}`,
    "",
    body,
  ].join("\r\n");
}

function mapGoogleError(error: unknown): never {
  if (isGoogleTokenError(error)) {
    throw new GoogleConnectionError("Google connection expired or was revoked. Please reconnect your account.", error);
  }
  throw new Error(errorMessage(error) || "Google request failed.", { cause: error });
}

export async function createDraft(userId: string, emailData: { to: string } & EmailContent) {
  const email = buildRawEmail(emailData);
  try {
    const { client } = await getGoogleClient(userId);
    const gmail = google.gmail({ version: "v1", auth: client });
    const response = await gmail.users.drafts.create({
      userId: "me",
      requestBody: { message: { raw: Buffer.from(email).toString("base64url") } },
    });
    return response.data;
  } catch (error) {
    mapGoogleError(error);
  }
}
