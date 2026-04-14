import {
  LessonPlanRequest,
  LessonPlanResponse,
  StudentEvaluationRequest,
  StudentEvaluationResponse,
  TeamEvaluationRequest,
  TeamEvaluationResponse,
  MeetingSummaryRequest,
  MeetingSummaryResponse,
  AIInsight,
} from '../types';

// Simula chamada para OpenAI API
// Em produção, isso seria uma chamada real para a API
async function mockAICall<T>(data: T, delay: number = 1500): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

export async function generateLessonPlan(
  request: LessonPlanRequest
): Promise<LessonPlanResponse> {
  // Simula processamento da IA
  const response: LessonPlanResponse = {
    topic: request.topic,
    objectives: [
      `Compreender os conceitos fundamentais de ${request.topic}`,
      `Aplicar técnicas práticas relacionadas ao tema`,
      `Desenvolver pensamento crítico sobre ${request.topic}`,
      `Criar soluções inovadoras utilizando os conhecimentos adquiridos`,
    ],
    content: {
      introduction: `Introdução ao tema ${request.topic}, contextualizando sua relevância no mercado atual e suas aplicações práticas. Discussão sobre os principais desafios e oportunidades relacionados.`,
      development: [
        `Apresentação dos conceitos teóricos fundamentais de ${request.topic}`,
        `Demonstração prática através de exemplos do mundo real`,
        `Exercícios hands-on para fixação do conteúdo`,
        `Discussão em grupo sobre casos de uso e melhores práticas`,
        `Projeto prático aplicando os conhecimentos adquiridos`,
      ],
      conclusion: `Recapitulação dos pontos principais, discussão sobre próximos passos e recursos adicionais para aprofundamento. Apresentação dos projetos desenvolvidos pelos alunos.`,
    },
    activities: [
      `Quiz interativo sobre conceitos básicos`,
      `Laboratório prático com dataset real`,
      `Projeto em grupo para resolver problema do mercado`,
      `Apresentação de soluções desenvolvidas`,
    ],
    evaluation: `Avaliação composta por: participação em aula (20%), exercícios práticos (30%), projeto final (40%), e apresentação (10%). Critérios: qualidade técnica, inovação, e aplicabilidade prática.`,
    resources: [
      `Artigos científicos recentes sobre ${request.topic}`,
      `Documentação oficial de frameworks e bibliotecas`,
      `Datasets públicos para prática`,
      `Vídeos complementares e tutoriais`,
      `Comunidades online e fóruns de discussão`,
    ],
  };

  return mockAICall(response);
}

export async function evaluateStudent(
  request: StudentEvaluationRequest
): Promise<StudentEvaluationResponse> {
  const avgGrade =
    request.grades.reduce((sum, grade) => sum + grade.score, 0) / request.grades.length;

  const response: StudentEvaluationResponse = {
    studentId: request.studentId,
    diagnosis:
      avgGrade >= 9
        ? 'Aluno exemplar com excelente desempenho acadêmico. Demonstra domínio completo dos conteúdos e capacidade de aplicação prática.'
        : avgGrade >= 7
        ? 'Bom desempenho geral. O aluno compreende os conceitos principais mas pode aprofundar em alguns tópicos específicos.'
        : 'Necessita de suporte adicional. Identificadas dificuldades em alguns conceitos fundamentais que precisam ser trabalhados.',
    strengths:
      avgGrade >= 9
        ? [
            'Excelente compreensão teórica dos conceitos',
            'Capacidade notável de resolver problemas complexos',
            'Proatividade e engajamento em aulas',
            'Habilidade de trabalhar em equipe',
          ]
        : avgGrade >= 7
        ? [
            'Boa base teórica',
            'Participação consistente em aulas',
            'Esforço demonstrado nas atividades',
          ]
        : ['Pontualidade', 'Interesse em melhorar'],
    areasForImprovement:
      avgGrade >= 9
        ? ['Pode compartilhar mais conhecimento com colegas', 'Explorar tópicos avançados']
        : avgGrade >= 7
        ? [
            'Aprofundar conhecimento em fundamentos',
            'Aumentar participação em discussões',
            'Dedicar mais tempo a exercícios práticos',
          ]
        : [
            'Revisar conceitos básicos',
            'Buscar acompanhamento individualizado',
            'Praticar mais exercícios',
            'Melhorar gestão de tempo de estudo',
          ],
    recommendations:
      avgGrade >= 9
        ? [
            'Desafiar o aluno com projetos mais complexos',
            'Incentivar participação em competições e hackathons',
            'Sugerir tópicos de pesquisa avançada',
            'Propor mentoria de colegas com dificuldades',
          ]
        : avgGrade >= 7
        ? [
            'Oferecer material complementar sobre tópicos específicos',
            'Criar grupo de estudos',
            'Propor exercícios extras para prática',
          ]
        : [
            'Agendar aulas de reforço individualizadas',
            'Desenvolver plano de estudos personalizado',
            'Oferecer material didático adicional',
            'Acompanhamento semanal de progresso',
          ],
  };

  return mockAICall(response);
}

export async function evaluateTeam(
  request: TeamEvaluationRequest
): Promise<TeamEvaluationResponse> {
  const response: TeamEvaluationResponse = {
    teamPerformance: 85,
    individualScores: request.analystIds.map((id) => ({
      analystId: id,
      score: Math.floor(Math.random() * 20) + 80, // 80-100
    })),
    insights: [
      'O time demonstra excelente sinergia e colaboração',
      'Entregas técnicas consistentemente de alta qualidade',
      'Comunicação interna pode ser otimizada',
      'Forte capacidade de resolução de problemas complexos',
      'Boa gestão de prazos e compromissos',
    ],
    recommendations: [
      'Implementar reuniões diárias mais estruturadas (daily standups)',
      'Criar programa de mentoria interna',
      'Investir em treinamentos sobre novas tecnologias',
      'Estabelecer OKRs claros para o próximo trimestre',
      'Promover mais sessões de pair programming',
    ],
  };

  return mockAICall(response);
}

export async function summarizeMeeting(
  request: MeetingSummaryRequest
): Promise<MeetingSummaryResponse> {
  const response: MeetingSummaryResponse = {
    summary: `Reunião produtiva com foco em alinhamento estratégico e definição de próximos passos. Foram discutidos os principais desafios atuais do projeto e as oportunidades de melhoria. Todos os participantes contribuíram ativamente com sugestões e feedback construtivo.`,
    keyPoints: [
      'Revisão do progresso atual dos projetos em andamento',
      'Discussão sobre bloqueios técnicos e suas soluções',
      'Alinhamento de expectativas e prazos',
      'Definição de responsabilidades e ownership',
      'Planejamento das próximas sprints',
    ],
    actionItems: [
      'Atualizar documentação técnica do projeto principal',
      'Agendar sessão de pair programming sobre arquitetura',
      'Revisar e aprovar PRs pendentes até sexta-feira',
      'Preparar apresentação de resultados para stakeholders',
      'Organizar workshop sobre novas tecnologias',
    ],
    decisions: [
      'Aprovada migração para nova arquitetura de microserviços',
      'Definido stack tecnológico para novo projeto',
      'Estabelecido cronograma de entregas do Q2',
      'Aprovado budget para treinamentos do time',
    ],
  };

  return mockAICall(response);
}

export async function generateProductivityInsights(
  tasksCompleted: number,
  tasksTotal: number,
  meetingsAttended: number,
  score: number
): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];

  if (tasksCompleted / tasksTotal < 0.5) {
    insights.push({
      id: '1',
      type: 'warning',
      message: `Taxa de conclusão de tarefas está em ${Math.round((tasksCompleted / tasksTotal) * 100)}%. Considere revisar prioridades.`,
      priority: 'high',
      createdAt: new Date(),
      actionable: true,
      action: 'Reorganizar tarefas',
    });
  }

  if (meetingsAttended > 5) {
    insights.push({
      id: '2',
      type: 'suggestion',
      message: `${meetingsAttended} reuniões hoje. Considere consolidar algumas para aumentar tempo de deep work.`,
      priority: 'medium',
      createdAt: new Date(),
      actionable: true,
      action: 'Otimizar agenda',
    });
  }

  if (score >= 90) {
    insights.push({
      id: '3',
      type: 'achievement',
      message: 'Performance excepcional! Você está no top 10% de produtividade.',
      priority: 'low',
      createdAt: new Date(),
      actionable: false,
    });
  }

  return mockAICall(insights, 800);
}

// Endpoint simulation for API calls
// Em produção, essas funções fariam chamadas HTTP reais
export const aiAPI = {
  generateLessonPlan,
  evaluateStudent,
  evaluateTeam,
  summarizeMeeting,
  generateProductivityInsights,
};
