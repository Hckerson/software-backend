-- Constraints Prisma cannot express. Idempotent: safe to run after every db push.

-- A user may hold at most one ACTIVE subscription, but any number of historical
-- CANCELED/SUSPENDED/PAST_DUE rows. The old composite unique on (userId, status)
-- allowed only one row per status ever, which made billing history impossible.
DROP INDEX IF EXISTS "Subscription_userId_status_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_one_active_per_user"
    ON "Subscription" ("userId")
    WHERE status = 'ACTIVE';
