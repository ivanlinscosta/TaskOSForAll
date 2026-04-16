"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.viagemPlanningFlow = void 0;
const zod_1 = require("zod");
const genkit_1 = require("../genkit");
/* ── Schemas ──────────────────────────────────────────────────────── */
const ModoSchema = zod_1.z.enum([
    'destino_sem_data',
    'sem_destino',
    'destino_com_budget',
]);
const TipoViagemSchema = zod_1.z.enum(['nacional', 'internacional']);
const MeioTransporteSchema = zod_1.z.enum(['carro', 'onibus', 'aviao']);
const ViagemPlanInputSchema = zod_1.z.object({
    modo: ModoSchema,
    destino: zod_1.z.string().nullish(),
    budget: zod_1.z.number().nullish(),
    datasPreferidas: zod_1.z.string().nullish(),
    duracaoDias: zod_1.z.number().nullish(),
    interesses: zod_1.z.array(zod_1.z.string()).nullish(),
    numViajantes: zod_1.z.number().nullish(),
    observacoes: zod_1.z.string().nullish(),
    origem: zod_1.z.string().nullish(),
    tipoViagem: TipoViagemSchema.nullish(),
    meioTransporte: MeioTransporteSchema.nullish(),
});
const AtividadeSugeridaSchema = zod_1.z.object({
    nome: zod_1.z.string(),
    data: zod_1.z.string(),
    horario: zod_1.z.string(),
});
const OrcamentoItemSchema = zod_1.z.object({
    categoria: zod_1.z.enum(['passagem', 'hospedagem', 'passeios', 'alimentacao', 'transporte']),
    valor: zod_1.z.number(),
    formaPagamento: zod_1.z.enum(['a_vista', 'a_prazo']),
    parcelas: zod_1.z.number().optional(),
    sugestao: zod_1.z.string(),
});
const ViagemPlanOutputSchema = zod_1.z.object({
    destino: zod_1.z.string(),
    descricao: zod_1.z.string(),
    dataIda: zod_1.z.string(),
    dataVolta: zod_1.z.string(),
    orcamentoTotal: zod_1.z.number(),
    orcamentoDetalhado: zod_1.z.array(OrcamentoItemSchema),
    atividades: zod_1.z.array(AtividadeSugeridaSchema),
    notas: zod_1.z.string(),
    explicacao: zod_1.z.string(),
});
/* ── Flow ──────────────────────────────────────────────────────────── */
exports.viagemPlanningFlow = genkit_1.ai.defineFlow({
    name: 'viagemPlanningFlow',
    inputSchema: ViagemPlanInputSchema,
    outputSchema: ViagemPlanOutputSchema,
}, async (input) => {
    const descricaoModo = {
        destino_sem_data: 'O viajante já sabe para onde quer ir, mas precisa de ajuda para escolher as melhores datas e montar um roteiro.',
        sem_destino: 'O viajante não sabe para onde ir, mas tem um orçamento definido. Sugira um destino viável dentro do budget.',
        destino_com_budget: 'O viajante sabe o destino e tem um budget. Monte o melhor roteiro possível dentro do orçamento.',
    }[input.modo];
    const hoje = new Date().toISOString().split('T')[0];
    const meioTransporteLabel = {
        carro: 'Carro próprio',
        onibus: 'Ônibus',
        aviao: 'Avião',
    };
    const prompt = `Você é um agente de viagens brasileiro experiente.

Cenário: ${descricaoModo}

Dados do viajante:
- Local de partida: ${input.origem || 'Não informado'}
- Tipo de viagem: ${input.tipoViagem === 'internacional' ? 'Internacional' : 'Nacional (Brasil)'}
${input.tipoViagem === 'nacional' && input.meioTransporte ? `- Meio de transporte preferido: ${meioTransporteLabel[input.meioTransporte] || input.meioTransporte}` : ''}
- Destino: ${input.destino || 'Não definido (sugira um)'}
- Orçamento: ${input.budget ? `R$ ${input.budget.toFixed(2)}` : 'Não informado'}
- Datas preferidas: ${input.datasPreferidas || 'Flexível'}
- Duração: ${input.duracaoDias ? `${input.duracaoDias} dias` : 'A definir'}
- Interesses: ${input.interesses?.join(', ') || 'Não especificados'}
- Viajantes: ${input.numViajantes || 1}
- Observações: ${input.observacoes || 'Nenhuma'}
- Data de hoje: ${hoje}

Regras:
1. Valores realistas em R$ para o mercado brasileiro.
2. Distribua o orçamento em 5 categorias: passagem, hospedagem, passeios, alimentacao, transporte.
3. Crie 4-8 atividades com datas (YYYY-MM-DD) e horários (HH:mm) FUTUROS (após ${hoje}).
4. Se destino não informado, escolha o melhor para o budget e interesses.
5. Se datas não definidas, escolha épocas ideais (clima/temporada).
6. Explicação amigável em 1ª pessoa.
7. Se o meio de transporte for carro, considere custos de combustível e pedágio na categoria transporte.
8. Se viagem internacional, inclua dicas sobre passaporte, visto e câmbio nas notas.
9. formaPagamento: 'a_vista' para valores menores, 'a_prazo' para passagens/hospedagem caras (2-12x).
10. descricao: 2-3 frases sobre a viagem. notas: dicas sobre documentação, clima, moeda.
11. IMPORTANTE — campo "sugestao" de cada item do orcamentoDetalhado: sugira locais, companhias ou sites REAIS para compra. Exemplos:
    - passagem: "LATAM ou GOL via Google Flights (google.com/flights) ou Decolar (decolar.com)"
    - hospedagem: "Hotel Ibis Copacabana ou Pousada Mar Azul via Booking.com ou Airbnb"
    - passeios: "Tour pelo centro histórico com Free Walking Tour Salvador"
    - alimentacao: "Restaurante Aconchego Carioca (Praça da Bandeira) — média R$60/pessoa"
    - transporte: "Uber/99 ou aluguel de carro via Localiza (localiza.com)"
    Seja específico com nomes reais de companhias, hotéis, restaurantes e sites de compra.

Retorne JSON no formato do schema.`;
    try {
        const response = await genkit_1.ai.generate({
            prompt,
            output: { schema: ViagemPlanOutputSchema },
        });
        const output = response.output;
        if (!output) {
            throw new Error('A IA não conseguiu gerar um plano válido. Tente novamente com informações diferentes.');
        }
        return output;
    }
    catch (err) {
        console.error('[viagemPlanningFlow] Erro:', err?.message || err);
        throw new Error(err?.message?.includes('não conseguiu')
            ? err.message
            : 'Falha ao gerar plano de viagem. Verifique os dados e tente novamente.');
    }
});
//# sourceMappingURL=viagem-planning-flow.js.map