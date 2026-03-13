-- ──────────────────────────────────────────────────────────────
-- REMOVE THE OLD "PLAN" CHECK CONSTRAINT
-- ──────────────────────────────────────────────────────────────

-- 1. Remove the old CHECK constraint from the "plan" column inside "agencies".
-- Since users can agora create any custom plan (like "Plano Vistorify"),
-- restricting values to ('basic', 'pro', 'enterprise') causes a 400 Bad Request
-- when creating new agencies.

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint 
        WHERE conrelid = 'agencies'::regclass 
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%plan%' AND pg_get_constraintdef(oid) ILIKE '%basic%'
    ) LOOP
        EXECUTE 'ALTER TABLE agencies DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;
