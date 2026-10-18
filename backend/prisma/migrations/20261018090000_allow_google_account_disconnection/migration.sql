-- A user can keep their LeadFlow account while disconnecting Google API access.
-- Dropping NOT NULL preserves every existing encrypted credential.
ALTER TABLE "User" ALTER COLUMN "googleRefreshToken" DROP NOT NULL;
