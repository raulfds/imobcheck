-- ──────────────────────────────────────────────────────────────
-- MASTER SCHEMA FIX: AGENCIES & SUBSCRIPTIONS
-- ──────────────────────────────────────────────────────────────

-- 1. Ensure all columns exist in agencies table
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS admin_name TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS acquisition_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual'));
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Ensure subscription_plans table exists (in case it was dropped or not created)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    user_limit INTEGER NOT NULL DEFAULT 3,
    inspection_limit INTEGER NOT NULL DEFAULT 10,
    photo_storage_days INTEGER NOT NULL DEFAULT 30,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Fix foreign key constraint to allow deleting plans
-- First, drop any existing constraint to avoid conflicts
DO $$ 
BEGIN
    -- Drop by common names
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agencies_plan_id_fkey') THEN
        ALTER TABLE agencies DROP CONSTRAINT agencies_plan_id_fkey;
    END IF;
    
    -- Drop any constraint that might be referencing subscription_plans from agencies(plan_id)
    execute (
        select 'alter table agencies drop constraint ' || quote_ident(conname)
        from pg_constraint 
        where conrelid = 'agencies'::regclass 
          and confrelid = 'subscription_plans'::regclass
    );
EXCEPTION WHEN OTHERS THEN 
    -- Ignore errors if constraint doesn't exist
END $$;

-- 4. Re-add the constraint with ON DELETE SET NULL
ALTER TABLE agencies 
ADD CONSTRAINT agencies_plan_id_fkey 
FOREIGN KEY (plan_id) 
REFERENCES subscription_plans(id) 
ON DELETE SET NULL;

-- 5. Data Migration (Optional but helpful)
-- Link existing agencies to plans by name if plan_id is null
UPDATE agencies a 
SET plan_id = p.id 
FROM subscription_plans p 
WHERE a.plan_id IS NULL 
  AND LOWER(a.plan) = LOWER(p.name);
