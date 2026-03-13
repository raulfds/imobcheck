-- Add subscription fields to agencies
ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Comment for documentation
COMMENT ON COLUMN agencies.billing_cycle IS 'Cycle for subscription: monthly or annual';
COMMENT ON COLUMN agencies.first_login_at IS 'Timestamp of the first successful login by any user of this agency';
COMMENT ON COLUMN agencies.expires_at IS 'Expiration date for the current subscription cycle';
