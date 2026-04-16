"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extratoParserFlow = exports.extratoOutputSchema = exports.extratoInputSchema = void 0;
const zod_1 = require("zod");
const genkit_1 = require("../genkit");
const CategoriaDespesaSchema = zod_1.z.enum([
    'alimentacao', 'transporte', 'lazer', 'saude',
    'moradia', 'educacao', 'vestuario', 'outros',
]);
const CategoriaReceitaSchema = zod_1.z.enum([
    'salario', 'freelance', 'investimento', 'bonus', 'aluguel', 'outros',
]);
const TipoTransacaoSchema = zod_1.z.enum(['entrada', 'saida']);
const ExtratoTransacaoSchema = zod_1.z.object({
    data: zod_1.z.string().describe('Data da transação no formato DD/MM/AAAA'),
    descricao: zod_1.z.string().describe('Descrição limpa e legível do lançamento'),
    tipo: TipoTransacaoSchema,
    /** Quando tipo = 'saida' usa categoria de despesa; quando 'entrada' usa categoria de receita. */
    categoriaDespesa: CategoriaDespesaSchema.nullable(),
    categoriaReceita: CategoriaReceitaSchema.nullable(),
    valor: zod_1.z.number().describe('Valor em reais, SEMPRE positivo, independente de ser entrada ou saída'),
});
exports.extratoInputSchema = zod_1.z.object({
    textoExtrato: zod_1.z.string().min(1),
});
exports.extratoOutputSchema = zod_1.z.object({
    banco: zod_1.z.string().nullable(),
    conta: zod_1.z.string().nullable(),
    periodo: zod_1.z.string().nullable(),
    saldoFinal: zod_1.z.number().nullable(),
    transacoes: zod_1.z.array(ExtratoTransacaoSchema),
});
exports.extratoParserFlow = genkit_1.ai.defineFlow({
    name: 'extratoParserFlow',
    inputSchema: exports.extratoInputSchema,
    outputSchema: exports.extratoOutputSchema,
}, async ({ textoExtrato }) => {
    const response = await genkit_1.ai.generate({
        prompt: `
Você receberá o texto bruto extraído de um EXTRATO DE CONTA BANCÁRIA.

O extrato contém tanto ENTRADAS (depósitos, salários, rendimentos, transferências recebidas, PIX recebido)
quanto SAÍDAS (pagamentos, compras, transferências enviadas, PIX enviado, tarifas, débitos).

Para cada linha de lançamento, extraia:
- data: no formato "DD/MM/AAAA" (se o extrato mostrar só DD/MM, use o ano do período/cabeçalho)
- descricao: nome limpo e compreensível do lançamento (remova códigos e ids internos)
  Exemplos: "TED RECEBIDA JOÃO SILVA" → "TED — João Silva", "COMPRA DEBITO UBER*TRIP" → "Uber"
- tipo: "entrada" se o valor é POSITIVO/crédito, "saida" se é NEGATIVO/débito.
  Use sinal explícito (-), colunas separadas (débito/crédito), ou palavras-chave (SAQUE, COMPRA, PAGAMENTO,
  TARIFA, TRANSFERENCIA ENVIADA → saida; DEPOSITO, REND, SALARIO, TRANSFERENCIA RECEBIDA, PIX RECEBIDO → entrada).
- valor: valor absoluto em reais como número decimal POSITIVO (ex: "R$ -120,50" → 120.50; "+R$ 1.500,00" → 1500.00).
- categoriaDespesa (preencher APENAS quando tipo = 'saida', senão null):
    alimentacao → supermercado, restaurante, delivery
    transporte → Uber, 99, gasolina, estacionamento, metrô
    lazer → streaming, cinema, bares, hotéis, turismo
    saude → farmácia, academia, planos de saúde, consultas
    moradia → aluguel, condomínio, água, luz, gás, internet
    educacao → cursos, livros, escola, faculdade
    vestuario → roupas, calçados
    outros → tudo que não se encaixa
- categoriaReceita (preencher APENAS quando tipo = 'entrada', senão null):
    salario → ordenado/folha de pagamento
    freelance → pagamentos de serviços prestados
    investimento → rendimentos, dividendos, resgates
    bonus → PLR, bônus, prêmios
    aluguel → receita de aluguel
    outros → outras entradas (reembolsos, estornos, transferências pessoais)

IGNORE linhas de SALDO (saldo anterior, saldo do dia, saldo disponível) — elas não são transações.
IGNORE linhas totalizadoras.

Do cabeçalho, extraia (ou retorne null se ausente):
- banco: nome do banco
- conta: número/identificador da conta (pode mascarar)
- periodo: período do extrato (ex: "01/03/2026 a 31/03/2026")
- saldoFinal: saldo final da conta como número decimal

Texto do extrato:
${textoExtrato}
`,
        output: { schema: exports.extratoOutputSchema },
    });
    return response.output;
});
//# sourceMappingURL=extrato-parser-flow.js.map