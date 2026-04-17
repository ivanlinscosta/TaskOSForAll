"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.faturaParserFlow = exports.faturaOutputSchema = exports.faturaInputSchema = void 0;
const zod_1 = require("zod");
const genkit_1 = require("../genkit");
const CategoriaSchema = zod_1.z.enum([
    'alimentacao', 'transporte', 'lazer', 'saude',
    'moradia', 'educacao', 'vestuario', 'outros',
]);
const TipoSchema = zod_1.z.enum(['fixo', 'variavel', 'assinatura']);
const TransacaoSchema = zod_1.z.object({
    data: zod_1.z.string(),
    descricao: zod_1.z.string(),
    categoria: CategoriaSchema,
    tipo: TipoSchema,
    valor: zod_1.z.number(),
    parcelaAtual: zod_1.z.number().nullable(),
    parcelaTotal: zod_1.z.number().nullable(),
    isInternacional: zod_1.z.boolean(),
});
exports.faturaInputSchema = zod_1.z.object({
    textoFatura: zod_1.z.string().min(1),
});
exports.faturaOutputSchema = zod_1.z.object({
    titular: zod_1.z.string(),
    totalFatura: zod_1.z.number(),
    vencimento: zod_1.z.string(),
    transacoes: zod_1.z.array(TransacaoSchema),
});
exports.faturaParserFlow = genkit_1.ai.defineFlow({
    name: 'faturaParserFlow',
    inputSchema: exports.faturaInputSchema,
    outputSchema: exports.faturaOutputSchema,
}, async ({ textoFatura }) => {
    const response = await genkit_1.ai.generate({
        prompt: `Extraia TODAS as transações de compra desta fatura de cartão de crédito.

IGNORE: estornos, pagamentos, boletos, anuidade, encargos, IOF, "próximas faturas".
INCLUA: compras em lojas, sites, apps, assinaturas, serviços.

Regras:
- Categorias válidas: alimentacao, transporte, lazer, saude, moradia, educacao, vestuario, outros
- Campo "data": SEMPRE no formato DD/MM numérico (sem ano, sem nome de mês). Converta qualquer formato como "10/NOV", "10/novembro", "10-nov", "10-NOV" para DD/MM numérico. Ex: "10/NOV"→"10/11", "05/fev"→"05/02", "15/03"→"15/03"
- Campo "vencimento": SEMPRE no formato DD/MM/AAAA. Ex: "10/04/2026"
- Campo "tipo": classifique como:
  - "assinatura": serviços recorrentes mensais — Netflix, Spotify, Disney+, HBO Max, Amazon Prime, Apple One/iCloud/TV, Microsoft 365/Office, Xbox Game Pass, PlayStation Plus, YouTube Premium, Google One, Dropbox, Adobe, Canva, Notion, Slack, Zoom, Deezer, Globoplay, Paramount+, Crunchyroll, Nintendo Online, Twitch, OpenAI/ChatGPT, GitHub, Antivirus (Norton, McAfee, Kaspersky, AVG), VPN, qualquer outro serviço com cobrança mensal recorrente
  - "fixo": despesas mensais fixas — aluguel, condomínio, financiamento, parcela de empréstimo
  - "variavel": tudo que não é assinatura nem fixo (compras em lojas, restaurantes, postos, etc.)
- Parcela "XX/YY" → parcelaAtual=XX, parcelaTotal=YY. Sem parcela → null para ambos
- Limpe nomes de estabelecimentos: "MERCADOLIVRE*3PROD"→"Mercado Livre", "AMAZONMKTPLC*X"→"Amazon", "PAG*JoseSilva"→"Pag José Silva", "IFOOD*IFOOD"→"iFood"
- Valores SEMPRE positivos em reais: "298,31"→298.31, "1.234,56"→1234.56
- isInternacional: true se moeda estrangeira (USD, EUR, etc.)
- titular: primeiro nome do titular do cartão
- totalFatura: valor total da fatura (número positivo)

Fatura:
${textoFatura}`,
        output: { schema: exports.faturaOutputSchema },
    });
    if (!response.output) {
        throw new Error('Não foi possível extrair os dados da fatura. Verifique o arquivo.');
    }
    return response.output;
});
//# sourceMappingURL=fatura-parser-flow.js.map