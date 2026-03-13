-- Fix foreign key constraint to allow deleting plans
-- First, find the constraint name. It's usually "agencies_plan_id_fkey"
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agencies_plan_id_fkey') THEN
        ALTER TABLE agencies DROP CONSTRAINT agencies_plan_id_fkey;
    END IF;
END $$;

-- Re-add with ON DELETE SET NULL
ALTER TABLE agencies 
ADD CONSTRAINT agencies_plan_id_fkey 
FOREIGN KEY (plan_id) 
REFERENCES subscription_plans(id) 
ON DELETE SET NULL;
