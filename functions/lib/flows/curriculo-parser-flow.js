"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.curriculoParserFlow = void 0;
const zod_1 = require("zod");
const genkit_1 = require("../genkit");
const CurriculoInputSchema = zod_1.z.object({
    textoCV: zod_1.z.string().min(10),
});
const CurriculoOutputSchema = zod_1.z.object({
    nome: zod_1.z.string().describe('Nome completo do candidato'),
    cargo: zod_1.z.string().describe('Cargo/posição atual'),
    empresa_atual: zod_1.z.string().describe('Empresa atual ou última empresa'),
    area: zod_1.z.string().describe('Área de atuação principal'),
    atividades_profissionais: zod_1.z.string().describe('Resumo das principais atividades e responsabilidades atuais (2-4 frases)'),
    anos_experiencia: zod_1.z.string().describe('Estimativa de anos de experiência total'),
    habilidades_atuais: zod_1.z.string().describe('Habilidades técnicas e comportamentais, separadas por vírgula'),
    objetivo_carreira: zod_1.z.string().describe('Objetivo profissional extraído ou inferido'),
    profissao: zod_1.z.string().describe('Profissão/título profissional'),
});
exports.curriculoParserFlow = genkit_1.ai.defineFlow({
    name: 'curriculoParserFlow',
    inputSchema: CurriculoInputSchema,
    outputSchema: CurriculoOutputSchema,
}, async ({ textoCV }) => {
    const response = await genkit_1.ai.generate({
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
    return response.output;
});
//# sourceMappingURL=curriculo-parser-flow.js.map