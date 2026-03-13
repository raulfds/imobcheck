-- ──────────────────────────────────────────────────────────────
-- DEFINITIVE FIX FOR PLAN DELETION (GRÁTIS)
-- ──────────────────────────────────────────────────────────────

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- 1. Find and drop ANY foreign key constraints targeting 'subscription_plans'
    -- This ensures we remove any hidden locks.
    FOR r IN (
        SELECT conname, relname
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE confrelid = (SELECT oid FROM pg_class WHERE relname = 'subscription_plans')
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.relname) || ' DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;

    -- 2. Force delete the 'Grátis' plan (case insensitive)
    DELETE FROM subscription_plans WHERE LOWER(name) = 'grátis';

    -- 3. Ensure the 'plan_id' column exists in agencies
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'plan_id') THEN
        ALTER TABLE agencies ADD COLUMN plan_id UUID;
    END IF;

    -- 4. Re-create the foreign key with ON DELETE SET NULL
    -- This allows deleting ANY plan in the future without errors.
    ALTER TABLE agencies 
    ADD CONSTRAINT agencies_plan_id_fkey 
    FOREIGN KEY (plan_id) 
    REFERENCES subscription_plans(id) 
    ON DELETE SET NULL;

    -- 5. Cleanup: If any agency was using 'Grátis' string, set it to something else or null
    UPDATE agencies SET plan = 'Básico' WHERE LOWER(plan) = 'grátis';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'An error occurred: %', SQLERRM;
END $$;
