"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vagasFlow = exports.vagasOutputSchema = exports.vagasInputSchema = void 0;
const zod_1 = require("zod");
const genkit_1 = require("../genkit");
const VagaSchema = zod_1.z.object({
    titulo: zod_1.z.string(),
    empresa: zod_1.z.string(),
    localizacao: zod_1.z.string(),
    modeloTrabalho: zod_1.z.enum(['Remoto', 'Híbrido', 'Presencial']),
    salario: zod_1.z.string().optional(),
    descricao: zod_1.z.string(),
    skills: zod_1.z.array(zod_1.z.string()),
    fonte: zod_1.z.string(),
    link: zod_1.z.string(),
    area: zod_1.z.string(),
});
exports.vagasInputSchema = zod_1.z.object({
    cargo: zod_1.z.string().optional(),
    areaAtuacao: zod_1.z.string().optional(),
    anosExperiencia: zod_1.z.string().optional(),
    habilidadesAtuais: zod_1.z.string().optional(),
    objetivoCarreira: zod_1.z.string().optional(),
    curriculoTexto: zod_1.z.string().optional(),
});
exports.vagasOutputSchema = zod_1.z.object({
    vagas: zod_1.z.array(VagaSchema),
});
exports.vagasFlow = genkit_1.ai.defineFlow({
    name: 'vagasFlow',
    inputSchema: exports.vagasInputSchema,
    outputSchema: exports.vagasOutputSchema,
}, async (input) => {
    const perfilTexto = [
        input.cargo && `Cargo atual: ${input.cargo}`,
        input.areaAtuacao && `Área de atuação: ${input.areaAtuacao}`,
        input.anosExperiencia && `Anos de experiência: ${input.anosExperiencia}`,
        input.habilidadesAtuais && `Habilidades: ${input.habilidadesAtuais}`,
        input.objetivoCarreira && `Objetivo de carreira: ${input.objetivoCarreira}`,
        input.curriculoTexto && `Currículo:\n${(input.curriculoTexto ?? '').slice(0, 800)}`,
    ].filter(Boolean).join('\n');
    const response = await genkit_1.ai.generate({
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
        output: { schema: exports.vagasOutputSchema },
    });
    if (!response.output)
        throw new Error('IA não retornou resultado');
    return response.output;
});
//# sourceMappingURL=vagas-flow.js.map