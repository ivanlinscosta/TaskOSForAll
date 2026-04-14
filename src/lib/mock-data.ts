import { 
  Aluno, 
  Analista, 
  Tarefa, 
  Reuniao, 
  Feedback, 
  Aula, 
  Evento,
  EficienciaScore,
  HistoricoEficiencia,
  InsightIA
} from '../types';

// Mock Alunos
export const mockAlunos: Aluno[] = [
  {
    id: '1',
    nome: 'Lucas Silva',
    email: 'lucas.silva@fiap.com.br',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    curso: 'Análise e Desenvolvimento de Sistemas',
    notas: [
      { id: '1', disciplina: 'Inteligência Artificial', valor: 9.5, data: new Date('2026-03-15'), tipo: 'prova' },
      { id: '2', disciplina: 'Machine Learning', valor: 8.8, data: new Date('2026-03-20'), tipo: 'trabalho' },
    ],
    observacoes: 'Aluno destaque, excelente participação em aula.',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-03-25'),
  },
  {
    id: '2',
    nome: 'Ana Costa',
    email: 'ana.costa@fiap.com.br',
    foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    curso: 'Ciência de Dados',
    notas: [
      { id: '3', disciplina: 'Data Science', valor: 9.8, data: new Date('2026-03-18'), tipo: 'prova' },
      { id: '4', disciplina: 'Python Avançado', valor: 9.2, data: new Date('2026-03-22'), tipo: 'trabalho' },
    ],
    observacoes: 'Lidera grupo de estudos, muito proativa.',
    createdAt: new Date('2026-01-12'),
    updatedAt: new Date('2026-03-26'),
  },
  {
    id: '3',
    nome: 'Pedro Santos',
    email: 'pedro.santos@fiap.com.br',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    curso: 'Engenharia de Software',
    notas: [
      { id: '5', disciplina: 'Arquitetura de Software', valor: 8.5, data: new Date('2026-03-10'), tipo: 'prova' },
      { id: '6', disciplina: 'DevOps', valor: 9.0, data: new Date('2026-03-17'), tipo: 'trabalho' },
    ],
    observacoes: 'Precisa melhorar pontualidade nas entregas.',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-03-24'),
  },
];

// Mock Analistas
export const mockAnalistas: Analista[] = [
  {
    id: '1',
    nome: 'Mariana Oliveira',
    email: 'mariana.oliveira@itau.com.br',
    foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    funcao: 'Analista de Dados Sênior',
    salario: 12000,
    dataAdmissao: new Date('2024-06-01'),
    avaliacoes: [
      { id: '1', data: new Date('2026-03-01'), nota: 9.2, comentario: 'Excelente performance em projetos de IA', tipo: 'trimestral' },
    ],
    observacoes: 'Liderança técnica forte, mentora de júniors.',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2026-03-25'),
  },
  {
    id: '2',
    nome: 'Rafael Mendes',
    email: 'rafael.mendes@itau.com.br',
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    funcao: 'Cientista de Dados',
    salario: 15000,
    dataAdmissao: new Date('2023-03-15'),
    avaliacoes: [
      { id: '2', data: new Date('2026-02-15'), nota: 9.5, comentario: 'Resultados excepcionais em modelagem preditiva', tipo: 'trimestral' },
    ],
    observacoes: 'Especialista em deep learning, publicou artigos.',
    createdAt: new Date('2023-03-15'),
    updatedAt: new Date('2026-03-20'),
  },
  {
    id: '3',
    nome: 'Juliana Ferreira',
    email: 'juliana.ferreira@itau.com.br',
    foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
    funcao: 'Engenheira de Machine Learning',
    salario: 13500,
    dataAdmissao: new Date('2024-01-20'),
    avaliacoes: [
      { id: '3', data: new Date('2026-03-10'), nota: 8.8, comentario: 'Ótima evolução técnica, precisa desenvolver soft skills', tipo: 'trimestral' },
    ],
    observacoes: 'Focada em MLOps, implementou pipelines críticos.',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2026-03-22'),
  },
];

// Mock Tarefas
export const mockTarefas: Tarefa[] = [
  {
    id: '1',
    titulo: 'Revisar provas de IA',
    descricao: 'Corrigir e dar feedback nas provas de Inteligência Artificial',
    contexto: 'fiap',
    status: 'doing',
    prioridade: 'alta',
    dataInicio: new Date('2026-03-28'),
    checklist: [
      { id: '1', texto: 'Corrigir questões objetivas', concluido: true },
      { id: '2', texto: 'Avaliar questões dissertativas', concluido: false },
      { id: '3', texto: 'Dar feedback individual', concluido: false },
    ],
    tags: ['academico', 'urgente'],
    createdAt: new Date('2026-03-27'),
    updatedAt: new Date('2026-03-30'),
  },
  {
    id: '2',
    titulo: 'Preparar apresentação Q2',
    descricao: 'Montar deck de resultados do time de IA para diretoria',
    contexto: 'itau',
    status: 'doing',
    prioridade: 'critica',
    dataInicio: new Date('2026-03-29'),
    checklist: [
      { id: '4', texto: 'Coletar métricas do trimestre', concluido: true },
      { id: '5', texto: 'Criar visualizações', concluido: true },
      { id: '6', texto: 'Montar narrativa', concluido: false },
    ],
    tags: ['gestao', 'apresentacao'],
    createdAt: new Date('2026-03-25'),
    updatedAt: new Date('2026-03-30'),
  },
  {
    id: '3',
    titulo: 'Atualizar material de Data Science',
    descricao: 'Incluir novos cases de mercado no material',
    contexto: 'fiap',
    status: 'backlog',
    prioridade: 'media',
    tags: ['conteudo'],
    createdAt: new Date('2026-03-20'),
    updatedAt: new Date('2026-03-20'),
  },
  {
    id: '4',
    titulo: 'Review de código do time',
    descricao: 'Revisar PRs de implementação do modelo de churn',
    contexto: 'itau',
    status: 'done',
    prioridade: 'alta',
    dataInicio: new Date('2026-03-26'),
    dataConclusao: new Date('2026-03-28'),
    tags: ['tecnico', 'code-review'],
    createdAt: new Date('2026-03-26'),
    updatedAt: new Date('2026-03-28'),
  },
];

// Mock Reuniões
export const mockReunioes: Reuniao[] = [
  {
    id: '1',
    titulo: 'Alinhamento semanal - Squad IA',
    data: new Date('2026-04-01T10:00:00'),
    duracao: 60,
    participantes: ['Mariana Oliveira', 'Rafael Mendes', 'Juliana Ferreira'],
    notas: 'Discussão sobre roadmap Q2 e priorização de features',
    acoes: [
      { id: '1', descricao: 'Finalizar doc técnico do modelo', responsavel: 'Rafael Mendes', prazo: new Date('2026-04-05'), status: 'em_progresso' },
      { id: '2', descricao: 'Setup de infraestrutura MLOps', responsavel: 'Juliana Ferreira', prazo: new Date('2026-04-10'), status: 'pendente' },
    ],
    status: 'agendada',
    createdAt: new Date('2026-03-25'),
  },
  {
    id: '2',
    titulo: 'Feedback 1:1 - Mariana',
    data: new Date('2026-04-02T14:00:00'),
    duracao: 45,
    participantes: ['Mariana Oliveira'],
    notas: '',
    acoes: [],
    status: 'agendada',
    createdAt: new Date('2026-03-28'),
  },
  {
    id: '3',
    titulo: 'Demo para stakeholders',
    data: new Date('2026-03-28T15:00:00'),
    duracao: 90,
    participantes: ['Time completo', 'Diretoria'],
    notas: 'Apresentação do modelo preditivo de inadimplência',
    acoes: [
      { id: '3', descricao: 'Ajustar threshold do modelo', responsavel: 'Rafael Mendes', prazo: new Date('2026-04-01'), status: 'concluida' },
    ],
    status: 'concluida',
    resumoIA: 'Reunião bem-sucedida. Diretoria aprovou implementação em produção. Principais feedbacks: melhorar explicabilidade do modelo e criar dashboard executivo.',
    createdAt: new Date('2026-03-20'),
  },
];

// Mock Feedbacks
export const mockFeedbacks: Feedback[] = [
  {
    id: '1',
    analistaId: '1',
    data: new Date('2026-03-15'),
    pontosFortes: [
      'Liderança técnica excepcional',
      'Mentoria ativa de analistas júnior',
      'Entrega consistente de resultados',
    ],
    pontosMelhoria: [
      'Melhorar documentação de código',
      'Participar mais ativamente de comunidades técnicas',
    ],
    combinados: [
      'Criar templates de documentação para o time',
      'Apresentar talk técnica no próximo meetup interno',
    ],
    proximaRevisao: new Date('2026-06-15'),
    createdAt: new Date('2026-03-15'),
  },
  {
    id: '2',
    analistaId: '2',
    data: new Date('2026-02-28'),
    pontosFortes: [
      'Expertise técnica em deep learning',
      'Inovação em soluções de IA',
      'Contribuição para comunidade (artigos publicados)',
    ],
    pontosMelhoria: [
      'Trabalhar habilidades de comunicação com não-técnicos',
      'Gestão de tempo em projetos paralelos',
    ],
    combinados: [
      'Participar de workshop de comunicação executiva',
      'Usar framework de priorização (Eisenhower)',
    ],
    proximaRevisao: new Date('2026-05-28'),
    createdAt: new Date('2026-02-28'),
  },
];

// Mock Aulas
export const mockAulas: Aula[] = [
  {
    id: '1',
    titulo: 'Introdução a Redes Neurais',
    disciplina: 'Inteligência Artificial',
    descricao: 'Fundamentos de redes neurais artificiais, perceptron e backpropagation',
    data: new Date('2026-04-03T19:00:00'),
    duracao: 180,
    materiais: [
      { id: '1', nome: 'Slides - Redes Neurais.pdf', tipo: 'pdf', url: '#', tamanho: '2.5 MB', uploadedAt: new Date('2026-03-30') },
      { id: '2', nome: 'Notebook - Implementação Perceptron.ipynb', tipo: 'link', url: '#', uploadedAt: new Date('2026-03-30') },
      { id: '3', nome: 'Artigo - Deep Learning.pdf', tipo: 'pdf', url: '#', tamanho: '1.8 MB', uploadedAt: new Date('2026-03-29') },
    ],
    tags: ['deep-learning', 'neural-networks', 'python'],
    createdAt: new Date('2026-03-25'),
  },
  {
    id: '2',
    titulo: 'Machine Learning na Prática',
    disciplina: 'Ciência de Dados',
    descricao: 'Cases reais de implementação de ML em produção',
    data: new Date('2026-04-05T19:00:00'),
    duracao: 180,
    materiais: [
      { id: '4', nome: 'Apresentação - ML em Produção.ppt', tipo: 'ppt', url: '#', tamanho: '5.2 MB', uploadedAt: new Date('2026-04-01') },
      { id: '5', nome: 'Case Itaú - Modelo de Churn.pdf', tipo: 'pdf', url: '#', tamanho: '3.1 MB', uploadedAt: new Date('2026-04-01') },
    ],
    tags: ['machine-learning', 'mlops', 'case-study'],
    createdAt: new Date('2026-03-28'),
  },
];

// Mock Eventos (Timeline do Dashboard)
export const mockEventos: Evento[] = [
  {
    id: '1',
    titulo: 'Alinhamento semanal - Squad IA',
    descricao: 'Reunião de alinhamento',
    tipo: 'reuniao',
    contexto: 'itau',
    data: new Date('2026-04-01T10:00:00'),
    duracao: 60,
    status: 'agendado',
  },
  {
    id: '2',
    titulo: 'Aula - Redes Neurais',
    descricao: 'Introdução a Redes Neurais',
    tipo: 'aula',
    contexto: 'fiap',
    data: new Date('2026-04-01T19:00:00'),
    duracao: 180,
    status: 'agendado',
  },
  {
    id: '3',
    titulo: 'Feedback 1:1 - Mariana',
    descricao: 'Reunião de feedback individual',
    tipo: 'feedback',
    contexto: 'itau',
    data: new Date('2026-04-02T14:00:00'),
    duracao: 45,
    status: 'agendado',
  },
  {
    id: '4',
    titulo: 'Revisar provas de IA',
    descricao: 'Tarefa urgente',
    tipo: 'tarefa',
    contexto: 'fiap',
    data: new Date('2026-04-01T16:00:00'),
    duracao: 120,
    status: 'em_andamento',
  },
];

// Mock Score de Eficiência
export const mockHistoricoEficiencia: HistoricoEficiencia[] = [
  { data: new Date('2026-03-24'), score: 78, tarefasConcluidas: 5, reunioesRealizadas: 3, feedbacksFeitos: 1, aulasMinistradas: 2 },
  { data: new Date('2026-03-25'), score: 82, tarefasConcluidas: 6, reunioesRealizadas: 2, feedbacksFeitos: 2, aulasMinistradas: 2 },
  { data: new Date('2026-03-26'), score: 85, tarefasConcluidas: 7, reunioesRealizadas: 4, feedbacksFeitos: 1, aulasMinistradas: 1 },
  { data: new Date('2026-03-27'), score: 88, tarefasConcluidas: 8, reunioesRealizadas: 3, feedbacksFeitos: 3, aulasMinistradas: 2 },
  { data: new Date('2026-03-28'), score: 92, tarefasConcluidas: 9, reunioesRealizadas: 5, feedbacksFeitos: 2, aulasMinistradas: 3 },
  { data: new Date('2026-03-29'), score: 87, tarefasConcluidas: 6, reunioesRealizadas: 3, feedbacksFeitos: 1, aulasMinistradas: 2 },
  { data: new Date('2026-03-30'), score: 90, tarefasConcluidas: 8, reunioesRealizadas: 4, feedbacksFeitos: 2, aulasMinistradas: 2 },
];

export const mockInsights: InsightIA[] = [
  {
    id: '1',
    tipo: 'sugestao',
    mensagem: 'Você tem 3 feedbacks pendentes esta semana. Considere priorizar as conversas 1:1.',
    prioridade: 'alta',
    data: new Date('2026-03-31'),
  },
  {
    id: '2',
    tipo: 'alerta',
    mensagem: 'Taxa de conclusão de tarefas FIAP está 15% abaixo da média. Revise prioridades.',
    prioridade: 'media',
    data: new Date('2026-03-31'),
  },
  {
    id: '3',
    tipo: 'elogio',
    mensagem: 'Excelente! Você superou a meta de reuniões produtivas esta semana (+30%).',
    prioridade: 'baixa',
    data: new Date('2026-03-30'),
  },
];

export const mockEficienciaScore: EficienciaScore = {
  valor: 90,
  historico: mockHistoricoEficiencia,
  insights: mockInsights,
};
