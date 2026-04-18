/**
 * Serviço de integração com OpenAI API e Google Gemini API
 */

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// ─── OpenAI ────────────────────────────────────────────────────────────────
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

// ─── Gemini ─────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface GeminiPart { text: string }
interface GeminiContent { role: 'user' | 'model'; parts: GeminiPart[] }
interface GeminiResponse {
  candidates: Array<{ content: { parts: GeminiPart[] } }>;
}

async function callGemini(
  systemPrompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string,
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return generateMockResponse(userMessage);
  }

  // Build contents array: interleave history then the new user turn
  const contents: GeminiContent[] = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 1200 },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Gemini API Error:', err);
      return generateMockResponse(userMessage);
    }

    const data: GeminiResponse = await res.json();
    return data.candidates[0]?.content?.parts[0]?.text ?? '';
  } catch (error) {
    console.error('Erro ao chamar Gemini API:', error);
    return generateMockResponse(userMessage);
  }
}

/**
 * Verifica se a chave de API está configurada
 */
export function isOpenAIConfigured(): boolean {
  return !!OPENAI_API_KEY;
}

/**
 * Faz uma chamada à API do OpenAI
 */
async function callOpenAI(
  messages: OpenAIMessage[],
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.warn('VITE_OPENAI_API_KEY não está configurada, usando mock');
    return generateMockResponse(messages[messages.length - 1]?.content || '');
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API Error:', error);
      // Fallback para mock em caso de erro
      return generateMockResponse(messages[messages.length - 1]?.content || '');
    }

    const data: OpenAIResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Erro ao chamar OpenAI API:', error);
    // Fallback para mock em caso de erro
    return generateMockResponse(messages[messages.length - 1]?.content || '');
  }
}

/**
 * Gera uma resposta mock quando OpenAI não está disponível
 */
function generateMockResponse(prompt: string): string {
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('quantos alunos')) {
    return 'Você tem 45 alunos cadastrados no sistema. Desses, 42 estão ativos e 3 em situação especial.';
  }
  
  if (promptLower.includes('plano de aula')) {
    return `# Plano de Aula\n\n## Objetivos\n- Compreender os conceitos fundamentais\n- Aplicar conhecimentos práticos\n- Desenvolver habilidades críticas\n\n## Metodologia\n- Aula expositiva (30 min)\n- Atividade prática (40 min)\n- Discussão e conclusões (20 min)\n\n## Recursos\n- Apresentação em slides\n- Exemplos práticos\n- Materiais de apoio\n\n## Avaliação\n- Participação em classe\n- Exercícios práticos\n- Discussão final`;
  }
  
  if (promptLower.includes('avaliação') || promptLower.includes('aluno')) {
    return `# Parecer de Avaliação\n\nO aluno demonstrou bom desempenho no período, com média 8.5. Apresenta facilidade em conceitos teóricos e boa participação em atividades práticas. Recomenda-se continuar com o acompanhamento regular.`;
  }
  
  if (promptLower.includes('reunião') || promptLower.includes('resumo')) {
    return `# Resumo da Reunião\n\n- Tópicos discutidos: Planejamento do semestre, avaliações e projetos\n- Decisões: Implementar novo sistema de avaliação\n- Ações: Preparar documentação até próxima semana\n- Responsável: Coordenador Pedagógico`;
  }
  
  if (promptLower.includes('produtividade')) {
    return `# Análise de Produtividade\n\nTaxa de conclusão de 78% indica boa produtividade. Recomenda-se manter o ritmo atual e revisar tarefas pendentes para priorização.`;
  }
  
  if (promptLower.includes('tarefa') || promptLower.includes('kanban')) {
    return `No TaskAll, você gerencia tarefas em um quadro Kanban com 3 colunas: A Fazer, Em Progresso e Concluído.\n\nPara criar uma tarefa: acesse o menu "Tarefas", escolha o workspace (Trabalho ou Vida pessoal) e clique em "+ Nova tarefa". Você também pode usar o Chat Guiado selecionando "Cadastrar tarefa".`;
  }

  if (promptLower.includes('financ') || promptLower.includes('gasto')) {
    return `Na seção de Finanças do TaskAll você pode registrar gastos e receitas, categorizá-los e visualizar seu fluxo de caixa mensal.\n\nPara adicionar um gasto rapidamente, use o Chat Guiado > "Cadastrar gasto".`;
  }

  if (promptLower.includes('planejamento') || promptLower.includes('compromisso') || promptLower.includes('calendário')) {
    return `O módulo de Planejamento é um calendário de compromissos. Você pode criar eventos com título, data, horário e tipo.\n\nAcesse pelo menu lateral > "Planejamento" e escolha o workspace desejado.`;
  }

  if (promptLower.includes('chat') || promptLower.includes('guiado')) {
    return `O Chat Guiado é um assistente conversacional que te ajuda a registrar informações rapidamente. Você pode cadastrar tarefas, gastos, feedbacks e viagens de forma guiada.\n\nBasta escolher uma ação na tela atual e seguir as perguntas do assistente.`;
  }

  return `Sou o assistente do TaskAll! Posso te ajudar com dúvidas sobre qualquer módulo da plataforma: Tarefas (Kanban), Planejamento, Finanças, Carreira, Desenvolvimento e Chat Guiado.\n\nConfigure sua chave VITE_OPENAI_API_KEY para respostas ainda mais completas. O que você gostaria de saber?`;
}

/**
 * Gera um plano de aula usando IA
 */
export async function generateLessonPlanWithAI(
  topic: string,
  grade: string,
  objectives: string
): Promise<string> {
  const systemMessage = `Você é um especialista em educação e pedagogia. 
Crie um plano de aula detalhado e bem estruturado em português.
Inclua: introdução, objetivos, conteúdo programático, atividades práticas, 
recursos necessários e critérios de avaliação.
Adapte o conteúdo para o nível de escolaridade especificado.`;

  const userMessage = `Crie um plano de aula para:
Tema: ${topic}
Série/Turma: ${grade}
Objetivos principais: ${objectives}

Forneça um plano completo e pronto para ser implementado em sala de aula.`;

  return callOpenAI(
    [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ],
    0.7,
    2500
  );
}

/**
 * Avalia um aluno com feedback detalhado
 */
export async function evaluateStudentWithAI(
  studentName: string,
  grades: number[],
  behavior: string,
  observations: string
): Promise<string> {
  const averageGrade = grades.reduce((a, b) => a + b, 0) / grades.length;

  const systemMessage = `Você é um especialista em educação e avaliação pedagógica.
Forneça uma avaliação completa e construtiva do aluno em português.
Inclua: diagnóstico geral, pontos fortes, áreas de melhoria e recomendações específicas.
Seja empático e motivador, focando no desenvolvimento do aluno.`;

  const userMessage = `Avalie o aluno:
Nome: ${studentName}
Notas: ${grades.join(', ')} (Média: ${averageGrade.toFixed(2)})
Comportamento: ${behavior}
Observações: ${observations}

Forneça uma avaliação detalhada com recomendações pedagógicas.`;

  return callOpenAI(
    [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ],
    0.7,
    2000
  );
}

/**
 * Gera feedback para um analista/colaborador
 */
export async function generateTeamFeedbackWithAI(
  analystName: string,
  role: string,
  period: string,
  achievements: string,
  improvements: string
): Promise<string> {
  const systemMessage = `Você é um especialista em gestão de pessoas e feedback corporativo.
Forneça um feedback profissional e construtivo em português.
Inclua: análise de desempenho, competências técnicas, liderança, comunicação,
trabalho em equipe, produtividade e recomendações de desenvolvimento.
Seja específico, mensurável e motivador.`;

  const userMessage = `Gere feedback para:
Nome: ${analystName}
Função: ${role}
Período: ${period}
Conquistas: ${achievements}
Áreas de melhoria: ${improvements}

Forneça um feedback estruturado e profissional.`;

  return callOpenAI(
    [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ],
    0.7,
    2000
  );
}

/**
 * Gera um resumo de reunião a partir das notas
 */
export async function summarizeMeetingWithAI(
  meetingTitle: string,
  meetingNotes: string,
  participants: string[]
): Promise<string> {
  const systemMessage = `Você é um especialista em gestão de reuniões e documentação.
Crie um resumo estruturado da reunião em português.
Inclua: resumo executivo, principais pontos discutidos, decisões tomadas,
ações necessárias (com responsáveis e prazos) e próximos passos.
Seja conciso mas completo.`;

  const userMessage = `Resuma a reunião:
Título: ${meetingTitle}
Participantes: ${participants.join(', ')}
Notas: ${meetingNotes}

Forneça um resumo estruturado e acionável.`;

  return callOpenAI(
    [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ],
    0.7,
    2000
  );
}

/**
 * Gera sugestões de tarefas baseado em contexto
 */
export async function generateTaskSuggestionsWithAI(
  context: string,
  currentTasks: string[],
  goals: string
): Promise<string> {
  const systemMessage = `Você é um especialista em gestão de projetos e produtividade.
Sugira tarefas práticas e alcançáveis em português.
Inclua: descrição clara, prioridade, prazo estimado e recursos necessários.
Considere o contexto e os objetivos fornecidos.`;

  const userMessage = `Sugira tarefas para:
Contexto: ${context}
Tarefas atuais: ${currentTasks.join(', ')}
Objetivos: ${goals}

Forneça sugestões de tarefas bem estruturadas e priorizadas.`;

  return callOpenAI(
    [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ],
    0.7,
    1500
  );
}

/**
 * Gera insights de produtividade
 */
export async function generateProductivityInsightsWithAI(
  tasksCompleted: number,
  tasksTotal: number,
  meetingsAttended: number,
  workHours: number,
  context: 'fiap' | 'itau'
): Promise<string> {
  const completionRate = ((tasksCompleted / tasksTotal) * 100).toFixed(1);
  const contextName = context === 'fiap' ? 'FIAP (Educação)' : 'Itaú (Corporativo)';

  const systemMessage = `Você é um especialista em análise de produtividade e bem-estar corporativo.
Forneça insights perspicazes e recomendações em português.
Inclua: análise de desempenho, pontos positivos, oportunidades de melhoria e sugestões práticas.
Seja motivador e construtivo.`;

  const userMessage = `Analise a produtividade:
Contexto: ${contextName}
Tarefas concluídas: ${tasksCompleted}/${tasksTotal} (${completionRate}%)
Reuniões: ${meetingsAttended}
Horas de trabalho: ${workHours}

Forneça insights de produtividade e recomendações.`;

  return callOpenAI(
    [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ],
    0.7,
    1500
  );
}

/**
 * Responde perguntas sobre a plataforma TaskAll
 */
export async function askPlatformHelp(
  question: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  const systemMessage = `Você é o Assistente Inteligente do TaskAll, uma plataforma de produtividade pessoal e profissional que ajuda as pessoas a organizarem sua vida, carreira e finanças em um só lugar.

Responda sempre em português, de forma clara, amigável e direta. Use linguagem acessível e seja prestativo. Quando relevante, indique o caminho exato no menu para o usuário encontrar a funcionalidade.

=== SOBRE O TASKALL ===
O TaskAll é uma plataforma dual (vida pessoal + trabalho) que combina gestão de tarefas, planejamento, finanças, carreira, desenvolvimento pessoal e um assistente de IA — tudo em um só lugar.

=== MÓDULOS DA PLATAFORMA ===

📊 DASHBOARD
- Visão geral com resumo do dia: tarefas pendentes, gastos recentes, próximos compromissos
- Card "Próxima melhor ação" — sugestão inteligente da IA baseada nos seus objetivos ativos
- Métricas rápidas de produtividade

✅ TAREFAS (Kanban Board)
- Quadro Kanban com 3 colunas: A Fazer (backlog), Em Progresso (doing), Concluído (done)
- Disponível em dois workspaces: Trabalho e Vida pessoal
- Campos: título, descrição, prioridade (baixa/média/alta), prazo e status
- Arraste e solte os cards para mudar o status
- Criação via formulário ("+ Nova tarefa") ou via Chat Guiado
- O botão "Chat guiado" abre o assistente para criar tarefas de forma conversacional

📅 PLANEJAMENTO (Compromissos)
- Calendário visual de compromissos e eventos
- Criação de eventos com título, data, horário e tipo (reunião, médico, escola, etc.)
- Disponível nos workspaces de Trabalho e Vida pessoal

💰 FINANÇAS
- Registro de gastos e receitas por categoria
- Separação entre gastos pessoais e profissionais
- Resumo mensal com totais e categorias
- Adicione gastos via formulário ou pelo Chat Guiado

💼 CARREIRA
- Gestão de objetivos e metas de carreira
- Registro de feedbacks recebidos e fornecidos
- Acompanhamento do desenvolvimento profissional

📚 DESENVOLVIMENTO
- Trilhas de aprendizado personalizadas
- Registro de cursos, livros e certificações
- Conteúdos recomendados com base no seu perfil

💬 CHAT GUIADO (esta tela)
- Assistente conversacional para registrar informações rapidamente
- Ações disponíveis: Cadastrar tarefa, Cadastrar gasto, Registrar feedback, Cadastrar viagem
- A experiência é personalizada com base nos objetivos configurados no perfil
- Acesse pelo menu lateral > "Chat" ou pelo botão "Chat guiado" em qualquer módulo
- "Pedir ajuda" abre esta conversa para tirar dúvidas sobre a plataforma

🎯 OBJETIVOS E GAMIFICAÇÃO
- Configure seus objetivos de trabalho e vida pessoal no onboarding ou no Perfil
- A plataforma personaliza sugestões e exibe apenas as ações mais relevantes para você
- Sistema de conquistas por uso consistente da plataforma

👤 PERFIL E CONFIGURAÇÕES
- Edição de nome, cargo e foto de perfil
- Configuração de objetivos por workspace (trabalho e vida pessoal)
- Preferências de notificações e aparência

🔄 WORKSPACES
- O TaskAll separa seu mundo em dois contextos: Trabalho e Vida pessoal
- Cada workspace tem seus próprios dados, tarefas, gastos e compromissos
- Alterne pelo menu lateral

=== DICAS RÁPIDAS ===
- Criar tarefa rapidamente: menu Tarefas > "+ Nova tarefa" ou Chat > "Cadastrar tarefa"
- Ver gastos do mês: menu Finanças, filtre por período
- Adicionar compromisso: menu Planejamento, clique no dia desejado
- Configurar objetivos: menu Perfil > Preferências
- O Dashboard sempre mostra o resumo mais importante do dia

Seja direto e útil. Se o usuário perguntar sobre dados específicos da conta dele (ex.: quantas tarefas tem), explique que ele pode verificar no módulo correspondente.`;

  return callGemini(systemMessage, conversationHistory, question);
}

/**
 * Responde perguntas genéricas do assistente de IA
 */
export async function askAIAssistant(
  question: string,
  context: 'fiap' | 'itau',
  conversationHistory: OpenAIMessage[] = []
): Promise<string> {
  const contextName = context === 'fiap' ? 'FIAP (Educação)' : 'Itaú (Corporativo)';

  const systemMessage = `Você é um assistente inteligente para o sistema TaskOS.
Seu contexto é: ${contextName}
Forneça respostas úteis, precisas e bem estruturadas em português.
Quando apropriado, sugira ações específicas que o usuário pode tomar no sistema.
Seja amigável, profissional e prestativo.`;

  const messages: OpenAIMessage[] = [
    { role: 'system', content: systemMessage },
    ...conversationHistory,
    { role: 'user', content: question },
  ];

  return callOpenAI(messages, 0.7, 1500);
}
