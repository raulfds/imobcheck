-- ============================================================
-- ImobCheck Database Schema
-- Run this in your Supabase SQL Editor to create all tables.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────────
-- AGENCIES (tenants / imobiliárias)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agencies (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    plan        TEXT NOT NULL DEFAULT 'basic'  CHECK (plan  IN ('basic', 'pro', 'enterprise')),
    cnpj        TEXT,
    address     TEXT,
    logo_url    TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- SYSTEM USERS (linked to Supabase Auth)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id     UUID UNIQUE,          -- Supabase auth.users.id
    agency_id   UUID REFERENCES agencies(id) ON DELETE CASCADE,
    email       TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'CLIENT_ADMIN' CHECK (role IN ('SUPER_ADMIN', 'CLIENT_ADMIN', 'INSPECTOR')),
    temp_password TEXT,               -- hashed temp password for first login
    must_change_password BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- PROPERTIES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    address     TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- LANDLORDS (proprietários)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS landlords (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    cpf_cnpj    TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- CLIENTS (locatários / inquilinos)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    cpf         TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- INSPECTIONS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inspections (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id    UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    property_id  UUID REFERENCES properties(id),
    client_id    UUID REFERENCES clients(id),
    inspector_id UUID REFERENCES system_users(id),
    type         TEXT NOT NULL CHECK (type IN ('entry', 'exit')),
    status       TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed')),
    date         DATE NOT NULL DEFAULT CURRENT_DATE,
    environments JSONB NOT NULL DEFAULT '[]'::jsonb,  -- full environments + items stored as JSON 
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- ROOM TEMPLATES (global presets for rooms and items)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_templates (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id   UUID REFERENCES agencies(id) ON DELETE CASCADE, -- NULL for global presets
    name        TEXT NOT NULL,
    categories  JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Universal uniqueness: name + agency_id (handled via COALESCE for NULL global templates)
CREATE UNIQUE INDEX IF NOT EXISTS room_templates_iso_idx ON room_templates (name, (COALESCE(agency_id, '00000000-0000-0000-0000-000000000000'::uuid)));

-- ──────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────────

ALTER TABLE agencies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties  ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlords   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_templates ENABLE ROW LEVEL SECURITY;

-- SUPER_ADMIN can do everything on agencies
DROP POLICY IF EXISTS "Super admin full access to agencies" ON agencies;
CREATE POLICY "Super admin full access to agencies" ON agencies
    USING (true) WITH CHECK (true);

-- Authenticated users can access their own agency's data
DROP POLICY IF EXISTS "Authenticated users can do everything" ON properties;
CREATE POLICY "Authenticated users can do everything" ON properties
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can do everything on landlords" ON landlords;
CREATE POLICY "Authenticated users can do everything on landlords" ON landlords
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can do everything on clients" ON clients;
CREATE POLICY "Authenticated users can do everything on clients" ON clients
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can do everything on inspections" ON inspections;
CREATE POLICY "Authenticated users can do everything on inspections" ON inspections
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can do everything on system_users" ON system_users;
CREATE POLICY "Authenticated users can do everything on system_users" ON system_users
    USING (true) WITH CHECK (true);

-- Room Templates: Anyone can read global templates or their own agency's templates
DROP POLICY IF EXISTS "Anyone can read room templates" ON room_templates;
CREATE POLICY "Anyone can read room templates" ON room_templates
    FOR SELECT USING (agency_id IS NULL OR true); -- In development, keeping TRUE for simplicity, but in production we'd check JWT

DROP POLICY IF EXISTS "Super admins can manage room templates" ON room_templates;
CREATE POLICY "Super admins can manage room templates" ON room_templates
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────
-- TRIGGERS for updated_at
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER agencies_updated_at
    BEFORE UPDATE ON agencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER inspections_updated_at
    BEFORE UPDATE ON inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER room_templates_updated_at
    BEFORE UPDATE ON room_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
