import { z } from 'zod';
import { ai } from '../genkit';

/* ── Schemas ──────────────────────────────────────────────────────── */

const ModoSchema = z.enum([
  'destino_sem_data',
  'sem_destino',
  'destino_com_budget',
]);

const TipoViagemSchema = z.enum(['nacional', 'internacional']);
const MeioTransporteSchema = z.enum(['carro', 'onibus', 'aviao']);

const ViagemPlanInputSchema = z.object({
  modo: ModoSchema,
  destino: z.string().nullish(),
  budget: z.number().nullish(),
  datasPreferidas: z.string().nullish(),
  duracaoDias: z.number().nullish(),
  interesses: z.array(z.string()).nullish(),
  numViajantes: z.number().nullish(),
  observacoes: z.string().nullish(),
  origem: z.string().nullish(),
  tipoViagem: TipoViagemSchema.nullish(),
  meioTransporte: MeioTransporteSchema.nullish(),
});

const AtividadeSugeridaSchema = z.object({
  nome: z.string(),
  data: z.string(),
  horario: z.string(),
});

const OrcamentoItemSchema = z.object({
  categoria: z.enum(['passagem', 'hospedagem', 'passeios', 'alimentacao', 'transporte']),
  valor: z.number(),
  formaPagamento: z.enum(['a_vista', 'a_prazo']),
  parcelas: z.number().optional(),
  sugestao: z.string(),
});

const ViagemPlanOutputSchema = z.object({
  destino: z.string(),
  descricao: z.string(),
  dataIda: z.string(),
  dataVolta: z.string(),
  orcamentoTotal: z.number(),
  orcamentoDetalhado: z.array(OrcamentoItemSchema),
  atividades: z.array(AtividadeSugeridaSchema),
  notas: z.string(),
  explicacao: z.string(),
});

/* ── Flow ──────────────────────────────────────────────────────────── */

export const viagemPlanningFlow = ai.defineFlow(
  {
    name: 'viagemPlanningFlow',
    inputSchema: ViagemPlanInputSchema,
    outputSchema: ViagemPlanOutputSchema,
  },
  async (input) => {
    const descricaoModo = {
      destino_sem_data:
        'O viajante já sabe para onde quer ir, mas precisa de ajuda para escolher as melhores datas e montar um roteiro.',
      sem_destino:
        'O viajante não sabe para onde ir, mas tem um orçamento definido. Sugira um destino viável dentro do budget.',
      destino_com_budget:
        'O viajante sabe o destino e tem um budget. Monte o melhor roteiro possível dentro do orçamento.',
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
      const response = await ai.generate({
        prompt,
        output: { schema: ViagemPlanOutputSchema },
      });

      const output = response.output;
      if (!output) {
        throw new Error('A IA não conseguiu gerar um plano válido. Tente novamente com informações diferentes.');
      }

      return output;
    } catch (err: any) {
      console.error('[viagemPlanningFlow] Erro:', err?.message || err);
      throw new Error(
        err?.message?.includes('não conseguiu')
          ? err.message
          : 'Falha ao gerar plano de viagem. Verifique os dados e tente novamente.'
      );
    }
  }
);
