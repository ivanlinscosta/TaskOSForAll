"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.investmentInsightsFlow = void 0;
/**
 * Investment Insights Flow
 * Generates AI-powered insights about the user's investment portfolio
 * using real market data passed as input — the AI does NOT invent numbers.
 */
const zod_1 = require("zod");
const genkit_1 = require("../genkit");
const InputSchema = zod_1.z.object({
    portfolioSummary: zod_1.z.string(), // human-readable portfolio breakdown
    marketSummary: zod_1.z.string(), // Selic, CDI, IPCA, USD values
    totalInvested: zod_1.z.number(),
    selicAnual: zod_1.z.number(),
    cdiAnual: zod_1.z.number(),
});
const InsightItemSchema = zod_1.z.object({
    titulo: zod_1.z.string().max(80),
    descricao: zod_1.z.string().max(400),
    tipo: zod_1.z.enum(['alerta', 'dica', 'oportunidade', 'observacao']),
    icone: zod_1.z.string(),
});
const OutputSchema = zod_1.z.object({
    cenario: zod_1.z.string().max(280),
    insights: zod_1.z.array(InsightItemSchema).min(2).max(6),
});
exports.investmentInsightsFlow = genkit_1.ai.defineFlow({
    name: 'investmentInsightsFlow',
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
}, async ({ portfolioSummary, marketSummary, totalInvested, selicAnual, cdiAnual }) => {
    const response = await genkit_1.ai.generate({
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
    return response.output;
});
//# sourceMappingURL=investment-insights-flow.js.map