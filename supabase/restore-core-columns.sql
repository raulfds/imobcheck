-- ============================================================
-- IMOBCHECK: RESTORE MISSING CORE COLUMNS ON AGENCIES
-- ============================================================

-- 1. Restore the core original columns that are completely missing
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Ensure all other new columns exist
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS admin_name TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS acquisition_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 3. Just in case, force API cache reload
NOTIFY pgrst, 'reload schema';
