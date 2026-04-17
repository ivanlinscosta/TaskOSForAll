/**
 * Investment Insights Flow
 * Generates AI-powered insights about the user's investment portfolio
 * using real market data passed as input — the AI does NOT invent numbers.
 */
import { z } from 'zod';
import { ai } from '../genkit';

const InputSchema = z.object({
  portfolioSummary: z.string(),   // human-readable portfolio breakdown
  marketSummary: z.string(),      // Selic, CDI, IPCA, USD values
  totalInvested: z.number(),
  selicAnual: z.number(),
  cdiAnual: z.number(),
});

const InsightItemSchema = z.object({
  titulo: z.string().max(80),
  descricao: z.string().max(400),
  tipo: z.enum(['alerta', 'dica', 'oportunidade', 'observacao']),
  icone: z.string(),
});

const OutputSchema = z.object({
  cenario: z.string().max(280),
  insights: z.array(InsightItemSchema).min(2).max(6),
});

export const investmentInsightsFlow = ai.defineFlow(
  {
    name: 'investmentInsightsFlow',
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async ({ portfolioSummary, marketSummary, totalInvested, selicAnual, cdiAnual }) => {
    const response = await ai.generate({
      prompt: `Você é um analista financeiro especializado em investimentos brasileiros.
Seu papel é interpretar dados reais e gerar insights claros e úteis sobre a carteira do usuário.

REGRA CRÍTICA: Use APENAS os dados fornecidos abaixo. Não invente taxas, preços ou rentabilidades.

────────────────────────────────
DADOS DE MERCADO ATUAIS
────────────────────────────────
${marketSummary}

────────────────────────────────
CARTEIRA DO USUÁRIO
────────────────────────────────
${portfolioSummary.trim() || 'Carteira vazia.'}

Total investido: R$ ${totalInvested.toFixed(2)}

────────────────────────────────
INSTRUÇÕES
────────────────────────────────
1. Escreva "cenario": resumo do cenário de juros e câmbio do dia em linguagem natural (máx 280 chars).
2. Gere de 2 a 6 insights sobre a carteira. Para cada um:
   - "titulo": até 80 chars
   - "descricao": até 400 chars, direto e útil
   - "tipo": uma das opções:
     * "alerta" — situação que merece atenção imediata
     * "dica" — sugestão de melhoria
     * "oportunidade" — cenário favorável a explorar
     * "observacao" — fato relevante neutro
   - "icone": emoji representativo (1 emoji)

Foque em: diversificação, liquidez, concentração, adequação ao cenário de juros, risco.
Use português informal mas profissional. Cite valores quando relevante.
NÃO faça recomendações específicas de compra ou venda de ativos.`,
      output: { schema: OutputSchema },
    });

    return response.output!;
  }
);
