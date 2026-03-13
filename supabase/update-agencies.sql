-- ──────────────────────────────────────────────────────────────
-- UPDATE AGENCIES TABLE WITH NEW FIELDS
-- ──────────────────────────────────────────────────────────────

ALTER TABLE agencies ADD COLUMN IF NOT EXISTS admin_name TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS acquisition_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id);

-- Optional: Migrate existing plan string to plan_id if names match
-- UPDATE agencies a SET plan_id = p.id FROM subscription_plans p WHERE LOWER(a.plan) = LOWER(p.name);
