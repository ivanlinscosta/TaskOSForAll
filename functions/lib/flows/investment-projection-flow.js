"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.investmentProjectionFlow = void 0;
/**
 * Investment Projection Flow
 * Calcula projeção de rendimento de um investimento até o vencimento/liquidez.
 * Usa taxas reais fornecidas pelo frontend — a IA não inventa números.
 * Aplica IR regressivo para renda fixa (LCI/LCA são isentos).
 */
const zod_1 = require("zod");
const genkit_1 = require("../genkit");
const InputSchema = zod_1.z.object({
    investmentName: zod_1.z.string(),
    investmentType: zod_1.z.string(), // CDB | LCI | LCA | Tesouro | Fundo | Acao | ...
    institution: zod_1.z.string().optional(),
    investedAmount: zod_1.z.number(),
    benchmarkType: zod_1.z.string(), // CDI | Selic | IPCA | Prefixado | Personalizado
    benchmarkPercent: zod_1.z.number(), // ex: 100 (100% CDI)
    fixedRateAnnual: zod_1.z.number().optional(), // para Prefixado/IPCA+
    startDate: zod_1.z.string(), // YYYY-MM-DD
    maturityDate: zod_1.z.string().optional(),
    liquidity: zod_1.z.string(),
    ticker: zod_1.z.string().optional(),
    selicAnual: zod_1.z.number(),
    cdiAnual: zod_1.z.number(),
    ipcaMensal: zod_1.z.number(),
    ipcaAnual: zod_1.z.number(),
    todayDate: zod_1.z.string(), // YYYY-MM-DD
});
const ProjectionPointSchema = zod_1.z.object({
    label: zod_1.z.string(), // "Hoje", "3 meses", "6 meses", "Vencimento"
    date: zod_1.z.string(), // YYYY-MM-DD
    grossValue: zod_1.z.number(),
    netValue: zod_1.z.number(), // após IR (igual ao bruto para isentos)
    earnings: zod_1.z.number(), // rendimento acumulado bruto
    percent: zod_1.z.number(), // % de rendimento bruto
});
const OutputSchema = zod_1.z.object({
    projectionPoints: zod_1.z.array(ProjectionPointSchema),
    annualYieldEffective: zod_1.z.number(),
    monthlyYieldEffective: zod_1.z.number(),
    irAliquot: zod_1.z.number(), // alíquota IR aplicável (0 se isento)
    irValue: zod_1.z.number(), // valor do IR no vencimento
    netEarningsAtMaturity: zod_1.z.number(),
    grossEarningsAtMaturity: zod_1.z.number(),
    summary: zod_1.z.string().max(300),
    riskNote: zod_1.z.string().max(200),
    benchmarkComparison: zod_1.z.string().max(200),
});
exports.investmentProjectionFlow = genkit_1.ai.defineFlow({
    name: 'investmentProjectionFlow',
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
}, async (input) => {
    const { investmentName, investmentType, institution, investedAmount, benchmarkType, benchmarkPercent, fixedRateAnnual, startDate, maturityDate, liquidity, selicAnual, cdiAnual, ipcaMensal, ipcaAnual, todayDate, } = input;
    const isIRExempt = ['LCI', 'LCA'].includes(investmentType);
    const isVariableIncome = ['Acao', 'FII', 'ETF', 'Cripto'].includes(investmentType);
    const irTable = `
IR Regressivo (renda fixa tributável):
- Até 180 dias: 22,5%
- De 181 a 360 dias: 20%
- De 361 a 720 dias: 17,5%
- Acima de 720 dias: 15%
${isIRExempt ? `\n⚠️ ${investmentType} É ISENTO DE IR — não aplicar IR nos cálculos.` : ''}
${isVariableIncome ? `\n⚠️ ${investmentType} é renda variável — não projete rendimento fixo, use o valor investido como referência.` : ''}`;
    const benchmarkDesc = benchmarkType === 'CDI' ? `${benchmarkPercent}% do CDI (${(cdiAnual * benchmarkPercent / 100).toFixed(2)}% a.a. efetivo)` :
        benchmarkType === 'Selic' ? `${benchmarkPercent}% da Selic (${(selicAnual * benchmarkPercent / 100).toFixed(2)}% a.a. efetivo)` :
            benchmarkType === 'IPCA' ? `IPCA + ${fixedRateAnnual ?? 0}% a.a. (~${(ipcaAnual + (fixedRateAnnual ?? 0)).toFixed(2)}% a.a. efetivo)` :
                benchmarkType === 'Prefixado' ? `${fixedRateAnnual ?? 0}% a.a. prefixado` :
                    `${fixedRateAnnual ?? 0}% a.a. personalizado`;
    const response = await genkit_1.ai.generate({
        prompt: `Você é especialista em matemática financeira brasileira. Calcule com precisão.

REGRA ABSOLUTA: Use APENAS as taxas abaixo. Calcule com juros compostos, 252 dias úteis/ano.

━━━ TAXAS DE MERCADO (${todayDate}) ━━━
Selic: ${selicAnual}% a.a. | CDI: ${cdiAnual}% a.a.
IPCA mensal: ${ipcaMensal}% | IPCA anual projetado: ${ipcaAnual}%

━━━ INVESTIMENTO ━━━
Nome: ${investmentName}
Tipo: ${investmentType}${institution ? ` | Instituição: ${institution}` : ''}
Valor investido: R$ ${investedAmount.toFixed(2)}
Indexador: ${benchmarkDesc}
Data de início: ${startDate}
${maturityDate ? `Data de vencimento: ${maturityDate}` : `Liquidez: ${liquidity} (sem data de vencimento definida)`}
Data de hoje: ${todayDate}

${irTable}

━━━ O QUE CALCULAR ━━━
${isVariableIncome ? `
Para renda variável: não projete rendimento fixo.
Use investedAmount como valor de referência para todos os projectionPoints.
annualYieldEffective = 0, irAliquot = 0, irValue = 0.
Gere 4 pontos: Hoje, 6 meses, 1 ano, 2 anos.
` : `
1. Taxa diária efetiva: (1 + taxa_anual/100)^(1/252) - 1
2. Projete o valor bruto em cada ponto usando: PV × (1 + taxa_diaria)^(dias_uteis)
   onde dias_uteis ≈ dias_corridos × (252/365)
3. Calcule IR usando a tabela regressiva baseada nos DIAS DO INÍCIO ao ponto de projeção
4. netValue = grossValue - IR (0 se isento)
5. Gere pontos em: Hoje, 3 meses, 6 meses, 1 ano${maturityDate ? ', Vencimento' : ', 2 anos'}
   Se vencimento estiver entre dois pontos, substitua o mais próximo pelo vencimento.
`}

Retorne JSON com o schema solicitado. Valores monetários com 2 casas decimais.
summary: explique o investimento em linguagem simples (máx 300 chars).
riskNote: risco e liquidez (máx 200 chars).
benchmarkComparison: compare com CDI 100% e poupança (máx 200 chars).`,
        output: { schema: OutputSchema },
    });
    return response.output;
});
//# sourceMappingURL=investment-projection-flow.js.map