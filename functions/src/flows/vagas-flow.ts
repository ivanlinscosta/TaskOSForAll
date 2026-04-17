import { z } from 'zod';
import { ai } from '../genkit';

const VagaSchema = z.object({
  titulo: z.string(),
  empresa: z.string(),
  localizacao: z.string(),
  modeloTrabalho: z.enum(['Remoto', 'Híbrido', 'Presencial']),
  salario: z.string().optional(),
  descricao: z.string(),
  skills: z.array(z.string()),
  fonte: z.string(),
  link: z.string(),
  area: z.string(),
});

export const vagasInputSchema = z.object({
  cargo: z.string().optional(),
  areaAtuacao: z.string().optional(),
  anosExperiencia: z.string().optional(),
  habilidadesAtuais: z.string().optional(),
  objetivoCarreira: z.string().optional(),
  curriculoTexto: z.string().optional(),
});

export const vagasOutputSchema = z.object({
  vagas: z.array(VagaSchema),
});

export type VagasOutput = z.infer<typeof vagasOutputSchema>;

export const vagasFlow = ai.defineFlow(
  {
    name: 'vagasFlow',
    inputSchema: vagasInputSchema,
    outputSchema: vagasOutputSchema,
  },
  async (input) => {
    const perfilTexto = [
      input.cargo          && `Cargo atual: ${input.cargo}`,
      input.areaAtuacao    && `Área de atuação: ${input.areaAtuacao}`,
      input.anosExperiencia&& `Anos de experiência: ${input.anosExperiencia}`,
      input.habilidadesAtuais && `Habilidades: ${input.habilidadesAtuais}`,
      input.objetivoCarreira  && `Objetivo de carreira: ${input.objetivoCarreira}`,
      input.curriculoTexto    && `Currículo:\n${(input.curriculoTexto ?? '').slice(0, 800)}`,
    ].filter(Boolean).join('\n');

    const response = await ai.generate({
      prompt: `Você é um especialista em recrutamento e mercado de trabalho brasileiro.
Com base no perfil profissional abaixo, retorne 8 vagas altamente relevantes.

PERFIL:
${perfilTexto || 'Profissional brasileiro buscando oportunidades.'}

Regras:
- modeloTrabalho: exatamente "Remoto", "Híbrido" ou "Presencial"
- area: tecnologia | design | financas | marketing | rh | administrativo | saude | educacao | vendas | outros
- fonte: LinkedIn | Indeed | Catho | Gupy | Vagas.com  (varie entre as 8 vagas)
- link: URL de busca real do portal substituindo espaços conforme padrão:
    LinkedIn  → https://www.linkedin.com/jobs/search/?keywords=TITULO+VAGA
    Indeed    → https://br.indeed.com/jobs?q=TITULO+VAGA
    Catho     → https://www.catho.com.br/vagas/TITULO-VAGA/
    Gupy      → https://portal.gupy.io/job-search/term?searchTerm=TITULO+VAGA
    Vagas.com → https://www.vagas.com.br/vagas-de-TITULO-VAGA
- salario: opcional, omita se incerto
- descricao: 2 frases objetivas sobre responsabilidades
- skills: 3 a 5 habilidades esperadas`,
      output: { schema: vagasOutputSchema },
    });

    if (!response.output) throw new Error('IA não retornou resultado');
    return response.output;
  }
);
