-- ──────────────────────────────────────────────────────────────
-- 1. SUBSCRIPTION PLANS TABLE
-- ──────────────────────────────────────────────────────────────
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

-- ──────────────────────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────────
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read plans" ON subscription_plans;
CREATE POLICY "Anyone can read plans" ON subscription_plans
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admins can manage plans" ON subscription_plans;
CREATE POLICY "Super admins can manage plans" ON subscription_plans
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────
-- 3. INITIAL SEED
-- ──────────────────────────────────────────────────────────────
INSERT INTO subscription_plans (name, user_limit, inspection_limit, photo_storage_days, price)
VALUES 
('Grátis', 1, 3, 7, 0.00),
('Básico', 3, 20, 30, 99.90),
('Profissional', 10, 100, 90, 249.90),
('Enterprise', 100, 9999, 365, 999.90)
ON CONFLICT (name) DO NOTHING;
