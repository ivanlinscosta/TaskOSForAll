import { z } from 'zod';
import { ai } from '../genkit';

const InsightsInputSchema = z.object({
  resumo: z.string().min(1),
  contexto: z.enum(['visao', 'despesas', 'cartao']),
});

const RecomendacaoSchema = z.object({
  titulo: z.string(),
  descricao: z.string(),
  tipo: z.enum(['alerta', 'dica', 'economia']),
});

const InsightsOutputSchema = z.object({
  recomendacoes: z.array(RecomendacaoSchema),
});

export const insightsFlow = ai.defineFlow(
  {
    name: 'insightsFlow',
    inputSchema: InsightsInputSchema,
    outputSchema: InsightsOutputSchema,
  },
  async ({ resumo, contexto }) => {
    const foco = {
      visao: 'visão geral das finanças, saldo mensal e evolução do patrimônio',
      despesas: 'controle e otimização de despesas fixas, variáveis e assinaturas',
      cartao: 'uso do cartão de crédito, parcelamentos em aberto e projeções de comprometimento',
    }[contexto];

    const response = await ai.generate({
      prompt: `Você é um consultor financeiro pessoal especializado em finanças brasileiras.

Analise os dados financeiros abaixo e gere de 3 a 5 recomendações inteligentes focadas em: ${foco}.

Diretrizes:
- Cite valores e categorias específicos dos dados (não seja genérico)
- Use português brasileiro informal mas profissional
- Cada título: até 60 caracteres
- Cada descrição: até 180 caracteres, seja objetivo e direto
- Classifique cada recomendação como:
  "alerta" → situação preocupante que exige ação imediata
  "dica" → sugestão de melhoria financeira
  "economia" → oportunidade concreta de economizar dinheiro

Dados financeiros:
${resumo}`,
      output: { schema: InsightsOutputSchema },
    });

    return response.output!;
  }
);
