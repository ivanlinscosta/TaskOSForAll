import {
  Student,
  Analyst,
  Task,
  Meeting,
  Lesson,
  Feedback,
  DashboardMetrics,
  AIInsight,
  Notification,
  Material,
} from '../types';

// Students Mock Data
export const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Ana Silva',
    email: 'ana.silva@aluno.fiap.com.br',
    course: 'Engenharia de Software',
    grades: [
      { subject: 'IA e Machine Learning', score: 9.5, date: new Date('2026-03-15'), semester: '2026.1' },
      { subject: 'Desenvolvimento Web', score: 8.7, date: new Date('2026-03-10'), semester: '2026.1' },
      { subject: 'Banco de Dados', score: 9.0, date: new Date('2026-03-05'), semester: '2026.1' },
    ],
    observations: 'Excelente performance em projetos práticos. Demonstra forte capacidade analítica.',
    enrollmentDate: new Date('2024-02-01'),
  },
  {
    id: '2',
    name: 'Bruno Costa',
    email: 'bruno.costa@aluno.fiap.com.br',
    course: 'Ciência de Dados',
    grades: [
      { subject: 'IA e Machine Learning', score: 7.5, date: new Date('2026-03-15'), semester: '2026.1' },
      { subject: 'Estatística Avançada', score: 8.0, date: new Date('2026-03-12'), semester: '2026.1' },
    ],
    observations: 'Precisa melhorar participação em aulas. Bom em trabalhos individuais.',
    enrollmentDate: new Date('2024-02-01'),
  },
  {
    id: '3',
    name: 'Carolina Mendes',
    email: 'carolina.mendes@aluno.fiap.com.br',
    course: 'Sistemas de Informação',
    grades: [
      { subject: 'IA e Machine Learning', score: 9.8, date: new Date('2026-03-15'), semester: '2026.1' },
      { subject: 'Arquitetura de Software', score: 9.3, date: new Date('2026-03-08'), semester: '2026.1' },
    ],
    observations: 'Aluna destaque. Lidera projetos em grupo com excelência.',
    enrollmentDate: new Date('2024-02-01'),
  },
];

// Analysts Mock Data
export const mockAnalysts: Analyst[] = [
  {
    id: '1',
    name: 'Pedro Almeida',
    email: 'pedro.almeida@itau.com.br',
    role: 'Analista de Dados Sênior',
    department: 'IA e Analytics',
    salary: 15000,
    evaluations: [
      {
        id: '1',
        analystId: '1',
        date: new Date('2026-03-01'),
        score: 92,
        strengths: ['Excelente conhecimento técnico', 'Proatividade'],
        improvements: ['Comunicação com stakeholders'],
        agreements: ['Participar de treinamento de soft skills'],
        evaluator: 'Dr. Rafael Santos',
      },
    ],
    hireDate: new Date('2023-06-15'),
    observations: 'Profissional de alto desempenho. Referência técnica no time.',
  },
  {
    id: '2',
    name: 'Juliana Ferreira',
    email: 'juliana.ferreira@itau.com.br',
    role: 'Analista de IA Pleno',
    department: 'IA e Analytics',
    salary: 12000,
    evaluations: [
      {
        id: '2',
        analystId: '2',
        date: new Date('2026-02-20'),
        score: 88,
        strengths: ['Criatividade em soluções', 'Trabalho em equipe'],
        improvements: ['Gestão de tempo'],
        agreements: ['Implementar uso de metodologias ágeis'],
        evaluator: 'Dr. Rafael Santos',
      },
    ],
    hireDate: new Date('2024-01-10'),
    observations: 'Crescimento acelerado. Potencial para senioridade.',
  },
  {
    id: '3',
    name: 'Marcos Oliveira',
    email: 'marcos.oliveira@itau.com.br',
    role: 'Analista de Dados Júnior',
    department: 'IA e Analytics',
    salary: 8000,
    evaluations: [],
    hireDate: new Date('2025-08-01'),
    observations: 'Recém-contratado. Em fase de onboarding.',
  },
];

// Tasks Mock Data
export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Preparar aula sobre Deep Learning',
    description: 'Criar apresentação e exercícios práticos sobre redes neurais profundas',
    status: 'doing',
    priority: 'high',
    dueDate: new Date('2026-04-05'),
    createdAt: new Date('2026-03-25'),
    context: 'fiap',
    tags: ['aula', 'IA', 'urgente'],
    checklist: [
      { id: '1', text: 'Criar slides', completed: true },
      { id: '2', text: 'Preparar dataset', completed: false },
      { id: '3', text: 'Criar exercícios', completed: false },
    ],
  },
  {
    id: '2',
    title: 'Revisar modelo de churn do banco',
    description: 'Análise de performance do modelo e propostas de melhoria',
    status: 'doing',
    priority: 'high',
    assignedTo: '1',
    dueDate: new Date('2026-04-02'),
    createdAt: new Date('2026-03-20'),
    context: 'itau',
    tags: ['modelo', 'churn', 'produção'],
    checklist: [
      { id: '1', text: 'Analisar métricas', completed: true },
      { id: '2', text: 'Identificar drift', completed: true },
      { id: '3', text: 'Propor ajustes', completed: false },
    ],
  },
  {
    id: '3',
    title: 'Corrigir provas de IA',
    description: 'Corrigir 45 provas da disciplina de IA e Machine Learning',
    status: 'backlog',
    priority: 'medium',
    dueDate: new Date('2026-04-10'),
    createdAt: new Date('2026-03-28'),
    context: 'fiap',
    tags: ['avaliação'],
    checklist: [],
  },
  {
    id: '4',
    title: 'Apresentação de resultados Q1',
    description: 'Preparar apresentação executiva dos resultados do primeiro trimestre',
    status: 'backlog',
    priority: 'high',
    dueDate: new Date('2026-04-08'),
    createdAt: new Date('2026-03-29'),
    context: 'itau',
    tags: ['apresentação', 'executivo'],
    checklist: [],
  },
  {
    id: '5',
    title: 'Atualizar material didático',
    description: 'Revisar e atualizar apostilas com novos frameworks',
    status: 'done',
    priority: 'low',
    dueDate: new Date('2026-03-30'),
    createdAt: new Date('2026-03-15'),
    context: 'fiap',
    tags: ['material'],
    checklist: [
      { id: '1', text: 'Revisar conteúdo', completed: true },
      { id: '2', text: 'Adicionar exemplos', completed: true },
    ],
  },
];

// Meetings Mock Data
export const mockMeetings: Meeting[] = [
  {
    id: '1',
    title: '1:1 com Pedro Almeida',
    date: new Date('2026-03-31T10:00:00'),
    duration: 30,
    participants: ['1'],
    notes: 'Discussão sobre evolução de carreira e próximos desafios técnicos.',
    actionItems: [
      {
        id: '1',
        description: 'Pedro estudar AWS SageMaker',
        assignedTo: '1',
        dueDate: new Date('2026-04-15'),
        completed: false,
      },
    ],
    context: 'itau',
    summary: 'Reunião produtiva. Pedro está engajado e pronto para novos desafios.',
  },
  {
    id: '2',
    title: 'Reunião de Planejamento - Disciplina IA',
    date: new Date('2026-03-31T14:00:00'),
    duration: 60,
    participants: [],
    notes: 'Planejar próximas 4 aulas e definir projeto final da disciplina.',
    actionItems: [],
    context: 'fiap',
  },
  {
    id: '3',
    title: 'Review Semanal do Time',
    date: new Date('2026-03-31T16:00:00'),
    duration: 45,
    participants: ['1', '2', '3'],
    notes: 'Revisão de sprints e alinhamento de prioridades.',
    actionItems: [
      {
        id: '2',
        description: 'Juliana apresentar POC de modelo NLP',
        assignedTo: '2',
        dueDate: new Date('2026-04-07'),
        completed: false,
      },
    ],
    context: 'itau',
  },
];

// Lessons Mock Data
export const mockLessons: Lesson[] = [
  {
    id: '1',
    title: 'Introdução a Redes Neurais Convolucionais',
    subject: 'IA e Machine Learning',
    date: new Date('2026-04-02T19:00:00'),
    duration: 180,
    materials: [
      {
        id: '1',
        name: 'Slides - CNN Fundamentals',
        type: 'ppt',
        url: '#',
        uploadedAt: new Date('2026-03-28'),
      },
      {
        id: '2',
        name: 'Dataset - CIFAR-10',
        type: 'link',
        url: 'https://www.cs.toronto.edu/~kriz/cifar.html',
        uploadedAt: new Date('2026-03-28'),
      },
    ],
    tags: ['CNN', 'Deep Learning', 'Computer Vision'],
    description: 'Aula prática sobre arquiteturas convolucionais aplicadas a visão computacional.',
    studentsPresent: ['1', '2', '3'],
  },
  {
    id: '2',
    title: 'NLP e Transformers',
    subject: 'IA e Machine Learning',
    date: new Date('2026-04-09T19:00:00'),
    duration: 180,
    materials: [
      {
        id: '3',
        name: 'Artigo - Attention Is All You Need',
        type: 'pdf',
        url: '#',
        uploadedAt: new Date('2026-04-01'),
      },
    ],
    tags: ['NLP', 'Transformers', 'BERT'],
    description: 'Introdução a modelos de linguagem baseados em atenção.',
    studentsPresent: [],
  },
];

// Feedbacks Mock Data
export const mockFeedbacks: Feedback[] = [
  {
    id: '1',
    analystId: '1',
    date: new Date('2026-03-25'),
    strengths: 'Excelente entrega do modelo de fraud detection. Código limpo e bem documentado.',
    improvements: 'Pode melhorar a comunicação de status em reuniões diárias.',
    agreements: 'Enviar updates diários no Slack sobre progresso dos projetos.',
    givenBy: 'Dr. Rafael Santos',
  },
  {
    id: '2',
    analystId: '2',
    date: new Date('2026-03-20'),
    strengths: 'Criatividade na solução do problema de latência do pipeline.',
    improvements: 'Gerenciar melhor o tempo em tarefas administrativas.',
    agreements: 'Usar técnica Pomodoro para tarefas não-técnicas.',
    followUp: new Date('2026-04-20'),
    givenBy: 'Dr. Rafael Santos',
  },
];

// Dashboard Metrics Mock Data
export const mockDashboardMetrics: DashboardMetrics = {
  efficiencyScore: 87,
  tasksCompleted: 12,
  tasksTotal: 18,
  meetingsToday: 3,
  lessonsToday: 1,
  feedbacksPending: 2,
  weeklyTrend: [
    { day: 'Seg', score: 78 },
    { day: 'Ter', score: 82 },
    { day: 'Qua', score: 85 },
    { day: 'Qui', score: 91 },
    { day: 'Sex', score: 87 },
    { day: 'Sáb', score: 75 },
    { day: 'Dom', score: 68 },
  ],
};

// AI Insights Mock Data
export const mockAIInsights: AIInsight[] = [
  {
    id: '1',
    type: 'warning',
    message: 'Você está 15% abaixo da média em conclusão de tarefas esta semana.',
    priority: 'high',
    createdAt: new Date('2026-03-31T08:00:00'),
    actionable: true,
    action: 'Reorganizar prioridades',
  },
  {
    id: '2',
    type: 'suggestion',
    message: 'Considere agendar 1:1 com Marcos Oliveira - sem feedback há 30 dias.',
    priority: 'medium',
    createdAt: new Date('2026-03-31T09:00:00'),
    actionable: true,
    action: 'Agendar reunião',
  },
  {
    id: '3',
    type: 'achievement',
    message: 'Parabéns! 95% de presença em reuniões agendadas este mês.',
    priority: 'low',
    createdAt: new Date('2026-03-30T18:00:00'),
    actionable: false,
  },
];

// Notifications Mock Data
export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'meeting',
    title: 'Reunião em 30 minutos',
    message: '1:1 com Pedro Almeida começa às 10:00',
    read: false,
    createdAt: new Date('2026-03-31T09:30:00'),
    actionUrl: '/itau/meetings',
    context: 'itau',
  },
  {
    id: '2',
    type: 'task',
    title: 'Prazo próximo',
    message: 'Revisar modelo de churn vence amanhã',
    read: false,
    createdAt: new Date('2026-03-31T08:00:00'),
    actionUrl: '/itau/kanban',
    context: 'itau',
  },
  {
    id: '3',
    type: 'lesson',
    title: 'Aula amanhã',
    message: 'CNN - Preparação 80% completa',
    read: true,
    createdAt: new Date('2026-03-30T20:00:00'),
    actionUrl: '/fiap/lessons',
    context: 'fiap',
  },
  {
    id: '4',
    type: 'feedback',
    message: '2 feedbacks pendentes para o time',
    title: 'Feedbacks pendentes',
    read: false,
    createdAt: new Date('2026-03-29T14:00:00'),
    actionUrl: '/itau/feedbacks',
    context: 'itau',
  },
];

// Materials Mock Data
export const mockMaterials: Material[] = [
  {
    id: '1',
    name: 'Roadmap Q2 2026 - IA & Analytics',
    type: 'ppt',
    url: '#',
    uploadedAt: new Date('2026-03-28'),
    size: 2500000,
  },
  {
    id: '2',
    name: 'Relatório de Performance - Modelos ML',
    type: 'excel',
    url: '#',
    uploadedAt: new Date('2026-03-25'),
    size: 1800000,
  },
  {
    id: '3',
    name: 'Documentação Técnica - API Gateway',
    type: 'pdf',
    url: '#',
    uploadedAt: new Date('2026-03-20'),
    size: 3200000,
  },
  {
    id: '4',
    name: 'Proposta - Nova Arquitetura de Dados',
    type: 'doc',
    url: '#',
    uploadedAt: new Date('2026-03-15'),
    size: 950000,
  },
];
