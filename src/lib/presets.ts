import { RoomTemplate } from "@/types";

/**
 * These types are exported for use in the app.
 * Note: Main RoomTemplate data is now stored in Supabase in the 'room_templates' table.
 */

// Fallback templates to use if Supabase is not reachable or empty
export const GLOBAL_ROOM_TEMPLATES: RoomTemplate[] = [
    {
      "nome": "Banheiro",
      "categorias": [
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
      ]
    },
    {
      "nome": "Cozinha",
      "categorias": [
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
      ]
    },
    {
      "nome": "Quarto",
      "categorias": [
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
      ]
    },
    {
      "nome": "Hall de Entrada / Corredor",
      "categorias": [
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
      ]
    },
    {
      "nome": "Garagem",
      "categorias": [
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
      ]
    },
    {
      "nome": "Depósito / Área Técnica",
      "categorias": [
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
      ]
    }
];

export const TENANT_ROOM_TEMPLATES: RoomTemplate[] = [];
