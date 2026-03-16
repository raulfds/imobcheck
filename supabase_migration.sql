-- DEFINITIVE DATABASE MIGRATION - ImobCheck
-- This script ensures ALL required tables and columns exist and policies are open.

-- 0. Helper function for adding columns safely
CREATE OR REPLACE FUNCTION add_column_if_not_exists(t_name TEXT, c_name TEXT, c_type TEXT) 
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t_name AND COLUMN_NAME = c_name) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN %I %s', t_name, c_name, c_type);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 1. AGENCIES
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
SELECT add_column_if_not_exists('agencies', 'email', 'TEXT');
SELECT add_column_if_not_exists('agencies', 'admin_name', 'TEXT');
SELECT add_column_if_not_exists('agencies', 'phone', 'TEXT');
SELECT add_column_if_not_exists('agencies', 'status', 'TEXT');
SELECT add_column_if_not_exists('agencies', 'plan', 'TEXT');
SELECT add_column_if_not_exists('agencies', 'plan_id', 'UUID');
SELECT add_column_if_not_exists('agencies', 'acquisition_date', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('agencies', 'cnpj', 'TEXT');
SELECT add_column_if_not_exists('agencies', 'address', 'TEXT');
SELECT add_column_if_not_exists('agencies', 'logo_url', 'TEXT');
SELECT add_column_if_not_exists('agencies', 'billing_cycle', 'TEXT DEFAULT ''monthly''');
SELECT add_column_if_not_exists('agencies', 'first_login_at', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('agencies', 'expires_at', 'TIMESTAMPTZ');

-- 2. SYSTEM_USERS
CREATE TABLE IF NOT EXISTS public.system_users (
    id UUID PRIMARY KEY, -- Usually maps to auth.users.id
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
SELECT add_column_if_not_exists('system_users', 'agency_id', 'UUID REFERENCES public.agencies(id) ON DELETE CASCADE');
SELECT add_column_if_not_exists('system_users', 'email', 'TEXT');
SELECT add_column_if_not_exists('system_users', 'name', 'TEXT');
SELECT add_column_if_not_exists('system_users', 'role', 'TEXT');

-- 3. LANDLORDS
CREATE TABLE IF NOT EXISTS public.landlords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cpf TEXT NOT NULL DEFAULT '000.000.000-00',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
SELECT add_column_if_not_exists('landlords', 'cpf', 'TEXT NOT NULL DEFAULT ''000.000.000-00''');
SELECT add_column_if_not_exists('landlords', 'email', 'TEXT');
SELECT add_column_if_not_exists('landlords', 'phone', 'TEXT');
SELECT add_column_if_not_exists('landlords', 'updated_at', 'TIMESTAMPTZ DEFAULT NOW()');
ALTER TABLE public.landlords ALTER COLUMN cpf DROP DEFAULT;

-- 4. CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
SELECT add_column_if_not_exists('clients', 'cpf', 'TEXT NOT NULL DEFAULT ''000.000.000-00''');
SELECT add_column_if_not_exists('clients', 'email', 'TEXT');
SELECT add_column_if_not_exists('clients', 'phone', 'TEXT');
ALTER TABLE public.clients ALTER COLUMN cpf DROP DEFAULT;

-- 5. PROPERTIES
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
SELECT add_column_if_not_exists('properties', 'description', 'TEXT DEFAULT ''''');
SELECT add_column_if_not_exists('properties', 'cep', 'TEXT');
SELECT add_column_if_not_exists('properties', 'logradouro', 'TEXT');
SELECT add_column_if_not_exists('properties', 'numero', 'TEXT');
SELECT add_column_if_not_exists('properties', 'complemento', 'TEXT');
SELECT add_column_if_not_exists('properties', 'bairro', 'TEXT');
SELECT add_column_if_not_exists('properties', 'cidade', 'TEXT');
SELECT add_column_if_not_exists('properties', 'estado', 'TEXT');

-- 6. INSPECTIONS
CREATE TABLE IF NOT EXISTS public.inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
SELECT add_column_if_not_exists('inspections', 'property_id', 'UUID REFERENCES public.properties(id)');
SELECT add_column_if_not_exists('inspections', 'client_id', 'UUID REFERENCES public.clients(id)');
SELECT add_column_if_not_exists('inspections', 'landlord_id', 'UUID REFERENCES public.landlords(id)');
SELECT add_column_if_not_exists('inspections', 'type', 'TEXT');
SELECT add_column_if_not_exists('inspections', 'status', 'TEXT');
SELECT add_column_if_not_exists('inspections', 'date', 'TEXT');
SELECT add_column_if_not_exists('inspections', 'start_time', 'TEXT');
SELECT add_column_if_not_exists('inspections', 'environments', 'JSONB DEFAULT ''[]''::jsonb');
SELECT add_column_if_not_exists('inspections', 'meters', 'JSONB DEFAULT ''{}''::jsonb');
SELECT add_column_if_not_exists('inspections', 'keys', 'JSONB DEFAULT ''[]''::jsonb');
SELECT add_column_if_not_exists('inspections', 'agreement_term', 'TEXT DEFAULT ''''');
SELECT add_column_if_not_exists('inspections', 'signatures', 'JSONB DEFAULT ''{"inspector": false, "landlord": false, "tenant": false}''::jsonb');

-- 7. ROOM_TEMPLATES
CREATE TABLE IF NOT EXISTS public.room_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    categories JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SUBSCRIPTION_PLANS
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    user_limit INTEGER DEFAULT 0,
    inspection_limit INTEGER DEFAULT 0,
    photo_storage_days INTEGER DEFAULT 0,
    price NUMERIC DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Open RLS Policies (as requested)
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Broad access for ALL tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('agencies', 'system_users', 'properties', 'landlords', 'clients', 'inspections', 'room_templates', 'subscription_plans')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Allow all" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;

-- 10. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('landlords', 'room_templates', 'subscription_plans')
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_' || t || '_updated_at') THEN
            EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()', 'update_' || t || '_updated_at', t);
        END IF;    
    END LOOP;
END $$;
