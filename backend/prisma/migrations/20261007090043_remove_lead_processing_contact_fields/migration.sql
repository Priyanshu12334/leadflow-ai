/*
  Warnings:

  - You are about to drop the column `company` on the `LeadProcessing` table. All the data in the column will be lost.
  - You are about to drop the column `leadEmail` on the `LeadProcessing` table. All the data in the column will be lost.
  - You are about to drop the column `leadName` on the `LeadProcessing` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LeadProcessing" DROP COLUMN "company",
DROP COLUMN "leadEmail",
DROP COLUMN "leadName";
