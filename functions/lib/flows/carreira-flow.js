"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.carreiraFlow = void 0;
const zod_1 = require("zod");
const genkit_1 = require("../genkit");
const CarreiraInputSchema = zod_1.z.object({
    cargo: zod_1.z.string().optional(),
    area: zod_1.z.string().optional(),
    anos_experiencia: zod_1.z.string().optional(),
    objetivos: zod_1.z.string().optional(),
    habilidades_atuais: zod_1.z.string().optional(),
    curriculo_texto: zod_1.z.string().optional(),
    // ── Contexto enriquecido (opcional) ─────────────────────────────────
    soft_skills_contexto: zod_1.z.string().optional(), // ex: "Comunicação 4/5 · Liderança 2/5 ..."
    financas_contexto: zod_1.z.string().optional(), // ex: "Renda 8000 · Reserva 5000 · Perfil moderado..."
    objetivos_financeiros: zod_1.z.array(zod_1.z.string()).optional(),
    objetivos_pessoais: zod_1.z.array(zod_1.z.string()).optional(), // ex: ['organizar_tarefas', 'planejar_viagens']
});
const HardSkillSchema = zod_1.z.object({
    skill: zod_1.z.string(),
    nivel: zod_1.z.enum(['basico', 'intermediario', 'avancado']),
    gap: zod_1.z.string(),
});
const SoftSkillSchema = zod_1.z.object({
    skill: zod_1.z.string(),
    avaliacao: zod_1.z.string(),
});
const RecomendacaoCarreiraSchema = zod_1.z.object({
    tipo: zod_1.z.enum(['livro', 'curso', 'video']),
    // profissional → carreira/hard/soft skills técnicas
    // financas    → educação financeira, investimentos, orçamento
    // pessoal     → soft skills, produtividade, bem-estar, hábitos
    categoria: zod_1.z.enum(['profissional', 'financas', 'pessoal']),
    titulo: zod_1.z.string(),
    autor_ou_canal: zod_1.z.string(),
    descricao: zod_1.z.string(),
    motivo: zod_1.z.string(),
});
const VagaCarreiraSchema = zod_1.z.object({
    titulo: zod_1.z.string(),
    empresa: zod_1.z.string(),
    localidade: zod_1.z.string(),
    regime: zod_1.z.string(),
    resumo: zod_1.z.string(),
    link: zod_1.z.string(),
});
const HighlightSchema = zod_1.z.object({
    categoria: zod_1.z.enum(['profissional', 'financas', 'pessoal']),
    titulo: zod_1.z.string(),
    mensagem: zod_1.z.string(),
    acao_sugerida: zod_1.z.string().optional(),
});
const CarreiraOutputSchema = zod_1.z.object({
    analise_perfil: zod_1.z.string(),
    pontos_fortes: zod_1.z.array(zod_1.z.string()),
    pontos_melhorar: zod_1.z.array(zod_1.z.string()),
    hard_skills: zod_1.z.array(HardSkillSchema),
    soft_skills: zod_1.z.array(SoftSkillSchema),
    recomendacoes: zod_1.z.array(RecomendacaoCarreiraSchema),
    highlights: zod_1.z.array(HighlightSchema).optional(),
    mostrar_vagas: zod_1.z.boolean().optional(),
    vagas: zod_1.z.array(VagaCarreiraSchema).optional(),
});
function implicaTransicao(objetivo) {
    if (!objetivo)
        return false;
    const kws = [
        'mudar de area', 'mudar de empresa', 'mudar de carreira', 'recolocacao',
        'transicao', 'nova empresa', 'novo emprego', 'buscar emprego', 'novo trabalho',
        'sair da empresa', 'processo seletivo', 'nova oportunidade', 'migrar para',
        'entrar em', 'mercado de trabalho', 'emprego', 'vaga', 'oportunidade', 'recrutamento',
        'mudar de área', 'recolocação', 'transição',
    ];
    const lower = objetivo.toLowerCase();
    return kws.some((kw) => lower.includes(kw));
}
exports.carreiraFlow = genkit_1.ai.defineFlow({
    name: 'carreiraFlow',
    inputSchema: CarreiraInputSchema,
    outputSchema: CarreiraOutputSchema,
}, async ({ cargo, area, anos_experiencia, objetivos, habilidades_atuais, curriculo_texto, soft_skills_contexto, financas_contexto, objetivos_financeiros, objetivos_pessoais, }) => {
    const perfil = [
        cargo ? `Cargo atual: ${cargo}` : '',
        area ? `Área de atuação: ${area}` : '',
        anos_experiencia ? `Anos de experiência: ${anos_experiencia}` : '',
        objetivos ? `Objetivos de carreira: ${objetivos}` : '',
        habilidades_atuais ? `Habilidades que já domina: ${habilidades_atuais}` : '',
        soft_skills_contexto ? `Perfil comportamental (autoavaliação): ${soft_skills_contexto}` : '',
        financas_contexto ? `Perfil financeiro: ${financas_contexto}` : '',
        objetivos_financeiros?.length ? `Objetivos financeiros: ${objetivos_financeiros.join(', ')}` : '',
        objetivos_pessoais?.length ? `Objetivos pessoais na plataforma: ${objetivos_pessoais.join(', ')}` : '',
        curriculo_texto ? `\nConteúdo do currículo:\n${curriculo_texto}` : '',
    ].filter(Boolean).join('\n');
    const precisaVagas = implicaTransicao(objetivos);
    const vagasSection = precisaVagas ? `
10. mostrar_vagas: true

11. vagas: Gere 4 a 6 sugestões de vagas hipotéticas mas realistas. Para cada vaga:
   - titulo: nome do cargo
   - empresa: empresa real e conhecida no mercado brasileiro (Nubank, iFood, Itaú, Totvs, VTEX, Mercado Livre, etc.)
   - localidade: cidade e modalidade (ex: "São Paulo, SP — Remoto")
   - regime: tipo de contrato (ex: "CLT", "PJ", "Híbrido")
   - resumo: 1-2 frases descrevendo a oportunidade
   - link: URL de busca no LinkedIn Jobs para aquela vaga

   As vagas devem ser coerentes com a área, experiência e objetivo do profissional.` : `
10. mostrar_vagas: false
11. vagas: []`;
    const response = await genkit_1.ai.generate({
        prompt: `Você é um coach de carreira, finanças pessoais e desenvolvimento humano especializado no mercado brasileiro.

Analise o perfil abaixo (carreira + comportamental + financeiro) e forneça:

1. analise_perfil: 2-3 frases resumindo o perfil do usuário, pontos de destaque e posicionamento.

2. pontos_fortes: 3 a 5 pontos fortes reais (carreira, comportamento e finanças combinados).

3. pontos_melhorar: 3 a 5 áreas de melhoria mais impactantes considerando os objetivos declarados (profissionais, financeiros e pessoais).

4. hard_skills: 4 a 8 habilidades técnicas relevantes para a carreira, com nível (basico/intermediario/avancado) e gap específico.

5. soft_skills: 3 a 5 competências comportamentais avaliadas em 1 frase (use os scores autorreportados quando disponíveis).

6. recomendacoes: 9 a 12 recomendações REAIS (livros, cursos ou vídeos), distribuídas OBRIGATORIAMENTE em 3 categorias:
   - categoria "profissional": 3 a 4 itens sobre carreira, hard skills e o objetivo profissional declarado.
   - categoria "financas": 3 a 4 itens sobre educação financeira, orçamento ou investimentos — ALINHADOS aos objetivos financeiros declarados (ex: se o objetivo é "quitar dívidas", recomende conteúdo sobre dívidas; se é "aposentadoria", recomende sobre previdência).
   - categoria "pessoal": 3 a 4 itens sobre soft skills fracas do usuário, hábitos, produtividade, bem-estar ou temas ligados aos objetivos pessoais (ex: se objetivo é "planejar viagens", pode sugerir conteúdo de organização e viagens acessíveis).
   Para cada item: tipo (livro/curso/video), categoria, título real, autor_ou_canal real (Alura, Coursera, YouTube canal X, etc.), descricao curta e motivo explicando POR QUE é relevante para ESTE usuário especificamente.

7. highlights: 3 a 5 destaques personalizados (um por categoria quando fizer sentido). Cada highlight tem titulo, mensagem (1-2 frases) e acao_sugerida opcional (ex: "Abra Gestão Financeira e defina sua reserva"). Use para gerar insights acionáveis no dashboard.

${vagasSection}

Diretrizes estritas:
- Use português brasileiro.
- Seja específico: cite nomes reais de livros, autores, cursos, canais.
- NUNCA recomende o mesmo conteúdo em categorias diferentes.
- O motivo deve conectar explicitamente o conteúdo ao perfil (habilidade fraca, objetivo, faixa de renda, etc.).
- Se algum dado estiver ausente, use defaults razoáveis mas AINDA GERE as 3 categorias.

Perfil completo:
${perfil}`,
        output: { schema: CarreiraOutputSchema },
    });
    return response.output;
});
//# sourceMappingURL=carreira-flow.js.map