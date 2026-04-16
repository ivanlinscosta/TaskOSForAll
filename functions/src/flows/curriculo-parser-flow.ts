import { z } from 'zod';
import { ai } from '../genkit';

const CurriculoInputSchema = z.object({
  textoCV: z.string().min(10),
});

const CurriculoOutputSchema = z.object({
  nome: z.string().describe('Nome completo do candidato'),
  cargo: z.string().describe('Cargo/posição atual'),
  empresa_atual: z.string().describe('Empresa atual ou última empresa'),
  area: z.string().describe('Área de atuação principal'),
  atividades_profissionais: z.string().describe('Resumo das principais atividades e responsabilidades atuais (2-4 frases)'),
  anos_experiencia: z.string().describe('Estimativa de anos de experiência total'),
  habilidades_atuais: z.string().describe('Habilidades técnicas e comportamentais, separadas por vírgula'),
  objetivo_carreira: z.string().describe('Objetivo profissional extraído ou inferido'),
  profissao: z.string().describe('Profissão/título profissional'),
});

export const curriculoParserFlow = ai.defineFlow(
  {
    name: 'curriculoParserFlow',
    inputSchema: CurriculoInputSchema,
    outputSchema: CurriculoOutputSchema,
  },
  async ({ textoCV }) => {
    const response = await ai.generate({
      prompt: `Você é um headhunter sênior brasileiro. Analise o currículo abaixo e extraia as informações profissionais de forma estruturada.

Diretrizes:
- Se uma informação não estiver explícita, faça uma inferência razoável baseada no contexto.
- "atividades_profissionais" deve ser um resumo conciso das responsabilidades atuais (não liste todas, resuma as principais).
- "anos_experiencia" deve ser um número aproximado (ex: "5", "10+").
- "habilidades_atuais" deve incluir tanto hard skills quanto soft skills identificáveis.
- Use português brasileiro.
- Se o nome não aparecer, coloque string vazia.

Texto do currículo:
${textoCV}`,
      output: { schema: CurriculoOutputSchema },
    });

    return response.output!;
  }
);
