-- ============================================================
-- ImobCheck - GRANTS para o role anon (chave pública)
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

-- Permite que o anon key (usado pelo frontend) leia e escreva
-- em todas as tabelas. As políticas RLS já controlam o que é visível.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON TABLE public.agencies     TO anon, authenticated;
GRANT ALL ON TABLE public.system_users TO anon, authenticated;
GRANT ALL ON TABLE public.properties   TO anon, authenticated;
GRANT ALL ON TABLE public.landlords    TO anon, authenticated;
GRANT ALL ON TABLE public.clients      TO anon, authenticated;
GRANT ALL ON TABLE public.inspections  TO anon, authenticated;

-- Permite gerar UUIDs (usados como PKs)
GRANT EXECUTE ON FUNCTION uuid_generate_v4() TO anon, authenticated;
