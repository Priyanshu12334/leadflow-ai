import { config } from "./env.js";
export const GOOGLE_SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.metadata",
];
export const PLAN_LIMITS = {
    free: config.freeDraftLimit,
    pro: config.proDraftLimit,
};
export const PROCESSING_STATUS = {
    PROCESSING: "processing",
    DRAFT_CREATED: "draft_created",
    SENT: "sent",
    FAILED: "failed",
};
