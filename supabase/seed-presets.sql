-- ──────────────────────────────────────────────────────────────
-- 1. ENSURE COLUMN AND TABLE EXISTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_templates (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    categories  JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add agency_id if not present
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='room_templates' AND column_name='agency_id') THEN
        ALTER TABLE room_templates ADD COLUMN agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 2. UNIVERSAL UNIQUE INDEX
-- ──────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS room_templates_iso_idx;
DROP INDEX IF EXISTS room_templates_name_agency_idx;
DROP INDEX IF EXISTS room_templates_global_name_idx;

-- Ensure uniqueness handling NULL as a specific value
CREATE UNIQUE INDEX room_templates_iso_idx ON room_templates (name, (COALESCE(agency_id, '00000000-0000-0000-0000-000000000000'::uuid)));

-- ──────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────────
ALTER TABLE room_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read room templates" ON room_templates;
CREATE POLICY "Anyone can read room templates" ON room_templates
    FOR SELECT USING (agency_id IS NULL OR true); 

DROP POLICY IF EXISTS "Super admins can manage room templates" ON room_templates;
CREATE POLICY "Super admins can manage room templates" ON room_templates
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────
-- 4. SEED DATA (Enriched Global Presets)
-- ──────────────────────────────────────────────────────────────
INSERT INTO room_templates (name, agency_id, categories) VALUES
(
    'Banheiro',
    NULL,
    '[
        {
          "nome": "Estrutural",
          "itens": ["Paredes", "Pintura", "Teto/Gesso", "Piso/Revestimento", "Soleira", "Porta", "Batente", "Fechadura", "Janela/Basculante"]
        },
        {
          "nome": "Elétrico",
          "itens": ["Interruptor", "Tomada", "Luminária", "Lâmpada", "Chuveiro", "Resistência", "Exaustor", "Sensor de Presença"]
        },
        {
          "nome": "Hidráulico/Mecânico",
          "itens": ["Vaso Sanitário", "Assento", "Descarga/Caixa Acoplada", "Pia/Cuba", "Torneira", "Sifão", "Ralo", "Box (Vidro/Acrílico)", "Ducha Higiênica", "Registro Geral"]
        },
        {
          "nome": "Mobiliário/Acessórios",
          "itens": ["Gabinete", "Espelho", "Porta-Toalha", "Saboneteira", "Papeleira", "Prateleiras/Nichos"]
        }
    ]'::jsonb
),
(
    'Cozinha',
    NULL,
    '[
        {
          "nome": "Estrutural",
          "itens": ["Paredes", "Piso", "Pintura", "Janela", "Porta", "Rodateto/Gesso", "Soleira"]
        },
        {
          "nome": "Elétrico",
          "itens": ["Pontos de Tomada 20A", "Interruptores", "Luminária", "Ponto para Exaustor/Coifa", "Campainha", "Ponto de TV"]
        },
        {
          "nome": "Hidráulico/Gás",
          "itens": ["Bancada/Pia", "Cuba", "Torneira (Filtro/Misturador)", "Sifão", "Registro de Gás", "Tubulação de Gás", "Ralo", "Ponto para Filtro"]
        },
        {
          "nome": "Mobiliário",
          "itens": ["Armário Suspenso", "Armário Balcão", "Prateleiras", "Despensa", "Torre Quente"]
        }
    ]'::jsonb
),
(
    'Quarto',
    NULL,
    '[
        {
          "nome": "Estrutural",
          "itens": ["Paredes", "Pintura", "Piso/Rodapé", "Teto", "Janela", "Persiana/Cortina", "Porta/Chave"]
        },
        {
          "nome": "Elétrico",
          "itens": ["Interruptores", "Tomadas", "Ponto de TV", "Ponto de Internet (RJ45)", "Ar Condicionado (Controle/Dreno)", "Lustre/Plafon", "USB Wall Outlet"]
        },
        {
          "nome": "Hidráulico",
          "itens": ["Ponto para Pia/Torneira", "Ralo", "Ponto para Ar Condicionado (Dreno)"]
        },
        {
          "nome": "Mobiliário",
          "itens": ["Guarda-roupa", "Painel de TV", "Mesa de Cabeceira", "Escrivaninha/Penteadeira"]
        }
    ]'::jsonb
),
(
    'Hall de Entrada / Corredor',
    NULL,
    '[
        {
          "nome": "Estrutural",
          "itens": ["Porta de Entrada", "Fechadura Eletrônica", "Olho Mágico", "Paredes", "Piso/Rodapé", "Teto/Gesso"]
        },
        {
          "nome": "Elétrico",
          "itens": ["Interruptores", "Tomadas de Passagem", "Luminárias/Balizadores", "Interfone", "Quadro de Energia (Disjuntores)"]
        },
        {
          "nome": "Hidráulico",
          "itens": ["Ralo", "Válvula de Bloqueio"]
        },
        {
          "nome": "Mobiliário",
          "itens": ["Aparador", "Espelho", "Cabideiro", "Sapateira"]
        }
    ]'::jsonb
),
(
    'Garagem',
    NULL,
    '[
        {
          "nome": "Estrutural",
          "itens": ["Piso (Antiderrapante/Epóxi)", "Marcação de Vaga", "Portão Automático", "Paredes/Colunas", "Protetor de Parachoque"]
        },
        {
          "nome": "Elétrico",
          "itens": ["Iluminação Blindada", "Tomada para Carro Elétrico", "Sensor de Movimento", "Câmeras de Segurança"]
        },
        {
          "nome": "Hidráulico",
          "itens": ["Torneira de Jardim", "Ralo Linear/Grelha"]
        },
        {
          "nome": "Mobiliário",
          "itens": ["Armário de Garagem", "Suporte para Bicicleta"]
        }
    ]'::jsonb
),
(
    'Depósito / Área Técnica',
    NULL,
    '[
        {
          "nome": "Estrutural",
          "itens": ["Porta Metálica", "Prateleiras Industriais", "Piso Cimentício", "Ventilação Permanente"]
        },
        {
          "nome": "Elétrico",
          "itens": ["Ponto de Luz", "Tomada de Uso Geral", "Quadro de Rede/VDI"]
        },
        {
          "nome": "Hidráulico",
          "itens": ["Ponto de Dreno", "Torneira de Serviço", "Ralo de Segurança"]
        },
        {
          "nome": "Mobiliário",
          "itens": ["Estantes de Aço", "Ganchos de Parede"]
        }
    ]'::jsonb
)
ON CONFLICT (name, (COALESCE(agency_id, '00000000-0000-0000-0000-000000000000'::uuid))) DO UPDATE 
SET categories = EXCLUDED.categories,
    updated_at = NOW();
