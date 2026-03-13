-- ============================================================
-- IMOBCHECK: COMPLETE AGENCY FIX SCRIPT
-- ============================================================

-- 1. Ensure the schema table is fully structured properly
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS admin_name TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS acquisition_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual'));
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Drop constraints that might be corrupting insertions
DO $$ 
BEGIN
    -- Drop any old constraint on plan column if it exists in agencies
    execute (
        select 'alter table agencies drop constraint ' || quote_ident(conname)
        from pg_constraint 
        where conrelid = 'agencies'::regclass 
          and contype = 'c' -- CHECK constraint
          and pg_get_constraintdef(oid) ILIKE '%plan%basic%'
    );
EXCEPTION WHEN OTHERS THEN 
    -- Ignore errors if constraint doesn't exist
END $$;

-- 3. Force API Cache Reload (fixes PostgREST 400 bad request error)
NOTIFY pgrst, 'reload schema';
