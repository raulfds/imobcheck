-- Migration: Add Landlords and Support for Insurance Compliance in Inspections

-- 1. Create Landlords Table
CREATE TABLE IF NOT EXISTS public.landlords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS Policies for Landlords
ALTER TABLE public.landlords ENABLE ROW LEVEL SECURITY;

-- Note: Using system_users table for policy check
CREATE POLICY "Landlords are viewable by agency members" ON public.landlords
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM public.system_users WHERE agency_id = landlords.agency_id
    ));

CREATE POLICY "Landlords are insertable by agency members" ON public.landlords
    FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT id FROM public.system_users WHERE agency_id = landlords.agency_id
    ));

-- 2. Update Inspections Table
ALTER TABLE public.inspections 
ADD COLUMN IF NOT EXISTS landlord_id UUID REFERENCES public.landlords(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS start_time TEXT,
ADD COLUMN IF NOT EXISTS meters JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS keys JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS agreement_term TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS signatures JSONB DEFAULT '{"inspector": false, "landlord": false, "tenant": false}'::jsonb;

-- 3. Add column to track update timestamps for landlords
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_landlords_updated_at') THEN
        CREATE TRIGGER update_landlords_updated_at
            BEFORE UPDATE ON public.landlords
            FOR EACH ROW
            EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;
