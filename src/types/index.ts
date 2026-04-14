// DualOS - Type Definitions

export type ThemeMode = 'itau' | 'fiap';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'professor' | 'manager';
}

// FIAP Types
export interface Aluno {
  id: string;
  nome: string;
  email: string;
  foto?: string;
  curso: string;
  notas: Nota[];
  observacoes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Nota {
  id: string;
  disciplina: string;
  valor: number;
  data: Date;
  tipo: 'prova' | 'trabalho' | 'participacao';
}

export interface Aula {
  id: string;
  titulo: string;
  disciplina: string;
  descricao: string;
  data: Date;
  duracao: number;
  materiais: Material[];
  tags: string[];
  createdAt: Date;
}

export interface Material {
  id: string;
  nome: string;
  tipo: 'pdf' | 'ppt' | 'link' | 'video' | 'doc';
  url: string;
  tamanho?: string;
  uploadedAt: Date;
}

// Itaú Types
export interface Analista {
  id: string;
  nome: string;
  email: string;
  foto?: string;
  funcao: string;
  salario?: number;
  dataAdmissao: Date;
  avaliacoes: Avaliacao[];
  observacoes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Avaliacao {
  id: string;
  data: Date;
  nota: number;
  comentario: string;
  tipo: 'mensal' | 'trimestral' | 'anual';
}

export interface Feedback {
  id: string;
  analistaId: string;
  data: Date;
  pontosFortes: string[];
  pontosMelhoria: string[];
  combinados: string[];
  proximaRevisao: Date;
  createdAt: Date;
}

export interface Reuniao {
  id: string;
  titulo: string;
  data: Date;
  duracao: number;
  participantes: string[];
  notas: string;
  acoes: Acao[];
  status: 'agendada' | 'concluida' | 'cancelada';
  resumoIA?: string;
  createdAt: Date;
}

export interface Acao {
  id: string;
  descricao: string;
  responsavel: string;
  prazo: Date;
  status: 'pendente' | 'em_progresso' | 'concluida';
}

// Shared Types
export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string;
  contexto: 'fiap' | 'itau';
  status: 'backlog' | 'doing' | 'done';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  dataInicio?: Date;
  dataConclusao?: Date;
  checklist?: ChecklistItem[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistItem {
  id: string;
  texto: string;
  concluido: boolean;
}

export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'reuniao' | 'aula' | 'tarefa' | 'feedback';
  contexto: 'fiap' | 'itau';
  data: Date;
  duracao: number;
  status: 'agendado' | 'em_andamento' | 'concluido';
}

// Dashboard Types
export interface EficienciaScore {
  valor: number;
  historico: HistoricoEficiencia[];
  insights: InsightIA[];
}

export interface HistoricoEficiencia {
  data: Date;
  score: number;
  tarefasConcluidas: number;
  reunioesRealizadas: number;
  feedbacksFeitos: number;
  aulasMinistradas: number;
}

export interface InsightIA {
  id: string;
  tipo: 'alerta' | 'sugestao' | 'elogio';
  mensagem: string;
  prioridade: 'baixa' | 'media' | 'alta';
  data: Date;
}

// AI Types
export interface PlanoAula {
  tema: string;
  serie: string;
  objetivo: string;
  conteudo: {
    introducao: string;
    desenvolvimento: string[];
    conclusao: string;
    recursos: string[];
    avaliacao: string;
  };
  duracao: number;
}

export interface AvaliacaoTimeIA {
  analistaId: string;
  pontuacao: number;
  fortalezas: string[];
  areas_melhoria: string[];
  recomendacoes: string[];
  tendencia: 'crescimento' | 'estavel' | 'atencao';
}

export interface ResumoReuniaoIA {
  reuniaoId: string;
  resumo: string;
  principais_pontos: string[];
  decisoes: string[];
  acoes_sugeridas: Acao[];
  participantes_destaque: string[];
}

// Analytics Types
export interface AnalyticsDashboard {
  produtividadeDiaria: number;
  evolucaoSemanal: number[];
  metricasFIAP: {
    aulasMinistradas: number;
    alunosGerenciados: number;
    materiaisCriados: number;
  };
  metricasItau: {
    reunioesRealizadas: number;
    feedbacksFeitos: number;
    analistasGerenciados: number;
  };
}

// ============================================
// English-named interfaces (used by mockData.ts and KanbanBoard)
// ============================================

export interface Student {
  id: string;
  name: string;
  email: string;
  course: string;
  grades: { subject: string; score: number; date: Date; semester: string }[];
  observations: string;
  enrollmentDate: Date;
  avatar?: string;
}

export interface Analyst {
  id: string;
  name: string;
  email: string;
  role: string;
  squad: string;
  level: string;
  performance: number;
  joinDate: Date;
  avatar?: string;
  skills?: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
  context: 'fiap' | 'itau';
  tags: string[];
  assignedTo?: string;
  checklist: { id: string; text: string; completed: boolean }[];
}

export interface Meeting {
  id: string;
  title: string;
  date: Date;
  duration: number;
  participants: string[];
  notes: string;
  actionItems: { id: string; description: string; assignedTo: string; dueDate: Date; completed: boolean }[];
  context: 'fiap' | 'itau';
  summary?: string;
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  date: Date;
  duration: number;
  materials: { id: string; name: string; type: string; url: string; uploadedAt: Date }[];
  tags: string[];
  description: string;
  studentsPresent: string[];
}

export interface DashboardMetrics {
  efficiencyScore: number;
  tasksCompleted: number;
  tasksTotal: number;
  meetingsToday: number;
  lessonsToday: number;
  feedbacksPending: number;
  weeklyTrend: { day: string; score: number }[];
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'suggestion' | 'achievement';
  message: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  actionable: boolean;
  action?: string;
}

// ============================================
// Vida Pessoal Types
// ============================================

export interface Viagem {
  id?: string;
  destino: string;
  descricao?: string;
  dataIda: Date;
  dataVolta?: Date;
  orcamento: number;
  gastoReal?: number;
  status: 'planejada' | 'em_andamento' | 'concluida' | 'cancelada';
  atividades?: string[];
  notas?: string;
  foto?: string;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

export interface Custo {
  id?: string;
  descricao: string;
  valor: number;
  categoria: 'alimentacao' | 'transporte' | 'lazer' | 'saude' | 'moradia' | 'educacao' | 'vestuario' | 'outros';
  tipo: 'fixa' | 'variavel';
  data: Date;
  viagemId?: string;
  comprovante?: string;
  notas?: string;
  criadoEm?: Date;
}

export interface TarefaPessoal {
  id?: string;
  titulo: string;
  descricao?: string;
  status: 'backlog' | 'doing' | 'done';
  prioridade: 'baixa' | 'media' | 'alta';
  categoria: 'pessoal' | 'saude' | 'financeiro' | 'casa' | 'familia' | 'outros';
  dataVencimento?: Date;
  checklist?: { id: string; texto: string; concluido: boolean }[];
  tags?: string[];
  criadoEm?: Date;
  atualizadoEm?: Date;
}

// ============================================
// WhatsApp Types
// ============================================

export interface WhatsAppMensagem {
  id?: string;
  de: string;
  corpo: string;
  tipoComando?: 'tarefa' | 'reuniao' | 'aula' | 'feedback' | 'viagem' | 'custo' | 'desconhecido';
  entidadeCriada?: string;
  entidadeId?: string;
  processada: boolean;
  erro?: string;
  recebidasEm: Date;
}

export interface Notification {
  id: string;
  type: 'meeting' | 'task' | 'lesson' | 'feedback';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl: string;
  context: 'fiap' | 'itau';
}
