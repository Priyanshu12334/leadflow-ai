import { GoogleGenAI } from "@google/genai";
import { errorMessage } from "../types/errors.js";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MAX_GEMINI_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 250;
function getGeminiStatus(error) {
    if (!(error instanceof Error))
        return null;
    const details = error;
    const status = Number(details.status ?? details.statusCode ?? details.response?.status ?? details.code);
    if (status === 503 || status === 429)
        return status;
    const message = error.message.toUpperCase();
    if (/\b503\b|UNAVAILABLE/.test(message))
        return 503;
    if (/\b429\b|RESOURCE_EXHAUSTED|TOO MANY REQUESTS/.test(message))
        return 429;
    return null;
}
function wait(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
export async function withGeminiRetries(request, delay = wait) {
    let retries = 0;
    while (true) {
        try {
            return await request();
        }
        catch (error) {
            const status = getGeminiStatus(error);
            if ((status !== 503 && status !== 429) || retries >= MAX_GEMINI_RETRIES) {
                const category = status === 503
                    ? "Gemini 503 UNAVAILABLE"
                    : status === 429
                        ? "Gemini 429 RESOURCE_EXHAUSTED"
                        : "Gemini generation error";
                throw new Error(`${category}: ${errorMessage(error) || "The generation request failed."}`, { cause: error });
            }
            await delay(INITIAL_RETRY_DELAY_MS * (2 ** retries));
            retries += 1;
        }
    }
}
export async function generateEmail(lead) {
    const prompt = `
You are an AI sales assistant helping a software development company respond quickly to new business leads.

Create a short, professional, personalized email for this lead.

Lead details:
Name: ${lead.name}
Company: ${lead.company}
Website: ${lead.website || "Not provided"}
Lead context: ${lead.context || "Not provided"}

Instructions:
- Address the lead by their first name.
- Mention their company naturally.
- Specifically acknowledge their context when it is provided.
- Use the website only when it helps personalize the reply; do not claim to have visited it.
- Do not invent facts about the company or services.
- Do not mention that AI generated the email.
- Keep the email concise and professional.
- End with a clear call-to-action for a short discussion.
- Return ONLY valid JSON in this format:
{"subject":"email subject","body":"email body"}
`;
    const response = await withGeminiRetries(() => ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
        contents: prompt,
    }));
    let email;
    try {
        const cleanText = (response.text || "").trim()
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
        email = JSON.parse(cleanText);
    }
    catch (error) {
        throw new Error(`Gemini validation error: its response was not valid JSON (${errorMessage(error)}).`, { cause: error });
    }
    if (typeof email !== "object"
        || email === null
        || !("subject" in email)
        || !("body" in email)
        || typeof email.subject !== "string"
        || typeof email.body !== "string"
        || !email.subject
        || !email.body) {
        throw new Error("Gemini validation error: the response must include a subject and body.");
    }
    return { subject: email.subject, body: email.body };
}
