ALTER TABLE "LeadProcessing" ADD COLUMN "draftFollowUpDate" DATE;

UPDATE "LeadProcessing"
SET "draftFollowUpDate" = "nextFollowUpDate"
WHERE "status" = 'draft_created'
  AND "gmailDraftId" IS NOT NULL
  AND "nextFollowUpDate" IS NOT NULL;
