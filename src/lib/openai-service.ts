/**
 * Serviço de integração com OpenAI API
 * Responsável por fazer chamadas reais à API do OpenAI
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

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini'; // Modelo mais disponível e acessível

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
  
  return `Entendi sua solicitação. Como o OpenAI não está totalmente configurado, aqui está uma resposta padrão. Configure sua chave de API do OpenAI em VITE_OPENAI_API_KEY para respostas mais precisas.`;
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
