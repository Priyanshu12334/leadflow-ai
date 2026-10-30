ALTER TABLE "LeadProcessing" ALTER COLUMN "status" DROP NOT NULL;
ALTER TABLE "LeadProcessing" ADD COLUMN "nextFollowUpDate" DATE;
