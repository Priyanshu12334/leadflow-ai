-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('free', 'pro');

-- CreateEnum
CREATE TYPE "LeadProcessingStatus" AS ENUM ('processing', 'draft_created', 'sent', 'failed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "email" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "googleRefreshToken" TEXT NOT NULL,
    "plan" "UserPlan" NOT NULL DEFAULT 'free',
    "draftsUsed" INTEGER NOT NULL DEFAULT 0,
    "draftsReserved" INTEGER NOT NULL DEFAULT 0,
    "draftLimit" INTEGER NOT NULL,
    "usagePeriodStart" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "spreadsheetId" TEXT,
    "sheetName" VARCHAR(100) NOT NULL DEFAULT 'Sheet1',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User"
    ADD CONSTRAINT "User_draftsUsed_nonnegative" CHECK ("draftsUsed" >= 0),
    ADD CONSTRAINT "User_draftsReserved_nonnegative" CHECK ("draftsReserved" >= 0),
    ADD CONSTRAINT "User_draftLimit_positive" CHECK ("draftLimit" >= 1);

-- CreateTable
CREATE TABLE "LeadProcessing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spreadsheetId" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "leadFingerprint" TEXT NOT NULL,
    "status" "LeadProcessingStatus" NOT NULL DEFAULT 'processing',
    "gmailDraftId" TEXT,
    "gmailMessageId" TEXT,
    "gmailThreadId" TEXT,
    "usageCommitted" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "LeadProcessing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "LeadProcessing_userId_idx" ON "LeadProcessing"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadProcessing_userId_spreadsheetId_sheetName_rowNumber_key" ON "LeadProcessing"("userId", "spreadsheetId", "sheetName", "rowNumber");

-- AddForeignKey
ALTER TABLE "LeadProcessing" ADD CONSTRAINT "LeadProcessing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
