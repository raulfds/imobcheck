import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');

// Manual parsing of .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length > 0) {
    env[key.trim()] = value.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or Service Role Key not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const presets = [
    {
      "nome": "Banheiro",
      "categorias": [
        {
          "nome": "Estrutural",
          "itens": ["Paredes", "Pintura", "Teto/Gesso", "Piso/Revestimento", "Porta", "Batente", "Fechadura", "Janela/Basculante"]
        },
        {
          "nome": "Elétrico",
          "itens": ["Interruptor", "Tomada", "Luminária", "Lâmpada", "Chuveiro", "Resistência"]
        },
        {
          "nome": "Hidráulico/Mecânico",
          "itens": ["Vaso Sanitário", "Assento", "Descarga/Caixa Acoplada", "Pia/Cuba", "Torneira", "Sifão", "Ralo", "Box (Vidro/Acrílico)", "Ducha Higiênica"]
        },
        {
          "nome": "Mobiliário/Acessórios",
          "itens": ["Gabinete", "Espelho", "Porta-Toalha", "Saboneteira", "Papeleira"]
        }
      ]
    },
    {
      "nome": "Cozinha",
      "categorias": [
        {
          "nome": "Estrutural",
          "itens": ["Paredes", "Piso", "Pintura", "Janela", "Porta"]
        },
        {
          "nome": "Elétrico",
          "itens": ["Pontos de Tomada 20A", "Interruptores", "Luminária", "Ponto para Exaustor"]
        },
        {
          "nome": "Hidráulico",
          "itens": ["Bancada/Pia", "Cuba", "Torneira (Filtro/Misturador)", "Sifão", "Registro de Gás"]
        },
        {
          "nome": "Mobiliário",
          "itens": ["Armário Suspenso", "Armário Balcão", "Prateleiras"]
        }
      ]
    },
    {
      "nome": "Quarto",
      "categorias": [
        {
          "nome": "Estrutural",
          "itens": ["Paredes", "Pintura", "Piso/Rodapé", "Teto", "Janela", "Persiana", "Porta/Chave"]
        },
        {
          "nome": "Elétrico",
          "itens": ["Interruptores", "Tomadas", "Ponto de TV", "Ar Condicionado (Controle/Dreno)", "Lustre/Plafon"]
        },
        {
          "nome": "Mobiliário",
          "itens": ["Guarda-roupa", "Painel de TV", "Mesa de Cabeceira"]
        }
      ]
    }
];

async function seed() {
  console.log('Seeding room_templates...');
  
  for (const preset of presets) {
    const { data, error } = await supabase
      .from('room_templates')
      .upsert({
        name: preset.nome,
        categories: preset.categorias,
        updated_at: new Date()
      }, { onConflict: 'name' });
      
    if (error) {
      console.error(`Error upserting ${preset.nome}:`, error);
    } else {
      console.log(`Successfully seeded ${preset.nome}`);
    }
  }
  
  console.log('Seeding complete!');
}

seed();
