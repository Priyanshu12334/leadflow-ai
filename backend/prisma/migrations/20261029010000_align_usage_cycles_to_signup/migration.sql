-- Align the active cycle to the latest 30-day boundary from signup without
-- changing existing draft usage or reservations.
UPDATE "User"
SET "usagePeriodStart" = "createdAt" + (
  FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - "createdAt")) / 2592000)::INTEGER
  * INTERVAL '30 days'
)
WHERE "createdAt" <= CURRENT_TIMESTAMP;
