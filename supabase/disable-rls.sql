-- ============================================================
-- ImobCheck - Desabilitar RLS (modo desenvolvimento)
-- Execute no SQL Editor do Supabase para corrigir o erro 400.
-- Pode reabilitar depois com ENABLE ROW LEVEL SECURITY.
-- ============================================================

ALTER TABLE public.agencies     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlords    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections  DISABLE ROW LEVEL SECURITY;

-- Garantir permissões completas para as chaves do Supabase
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
