-- Supabase Schema for ImobCheck SaaS

CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    logo_url TEXT,
    plan TEXT DEFAULT 'standard',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
    full_name TEXT,
    email TEXT UNIQUE,
    role TEXT CHECK (role IN ('super_admin', 'agency_admin', 'inspector')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    type TEXT,
    owner_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    inspector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tenant_name TEXT,
    type TEXT DEFAULT 'entry', -- entry, exit, periodical
    status TEXT DEFAULT 'draft', -- draft, completed
    room_data JSONB DEFAULT '[]', -- Detailed room/item checklist
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can do everything" ON public.agencies;
CREATE POLICY "Authenticated users can do everything" ON public.agencies FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can do everything" ON public.profiles;
CREATE POLICY "Authenticated users can do everything" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can do everything" ON public.properties;
CREATE POLICY "Authenticated users can do everything" ON public.properties FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can do everything" ON public.inspections;
CREATE POLICY "Authenticated users can do everything" ON public.inspections FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.agencies;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.inspections;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Ambiente Options (Global vs Tenant Specific)
CREATE TABLE IF NOT EXISTS public.ambiente_opcoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    -- If company_id (agency_id) is NULL, the item is "Global" (Admin)
    -- If it has an ID, it belongs to a specific real estate agency
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE, 
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ambiente_opcoes ENABLE ROW LEVEL SECURITY;

-- Policy 1: Read - Users can see global items (agency_id IS NULL) OR items from their own agency
DROP POLICY IF EXISTS "Usuarios veem itens globais e os próprios" ON public.ambiente_opcoes;
CREATE POLICY "Usuarios veem itens globais e os próprios" 
ON public.ambiente_opcoes FOR SELECT
USING (agency_id IS NULL OR agency_id::text = auth.jwt() ->> 'agency_id');

-- Policy 2: Insert - Agencies can only insert items with their own ID
DROP POLICY IF EXISTS "Imobiliarias inserem seus próprios itens" ON public.ambiente_opcoes;
CREATE POLICY "Imobiliarias inserem seus próprios itens" 
ON public.ambiente_opcoes FOR INSERT
WITH CHECK (agency_id::text = auth.jwt() ->> 'agency_id');

-- Policy 3: Admin - Only Super Admin can insert global items (agency_id IS NULL)
DROP POLICY IF EXISTS "Super Admin insere itens globais" ON public.ambiente_opcoes;
CREATE POLICY "Super Admin insere itens globais" 
ON public.ambiente_opcoes FOR ALL
USING (auth.jwt() ->> 'email' = 'raul_fds@hotmail.com');
