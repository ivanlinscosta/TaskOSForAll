/**
 * DualOS - System Constants
 * Constantes e configurações do sistema
 */

// Temas
export const THEMES = {
  FIAP: 'fiap',
  ITAU: 'itau',
} as const;

// Cores dos Temas
export const THEME_COLORS = {
  fiap: {
    primary: '#6A0DAD',
    secondary: '#8B2FCF',
    background: '#000000',
    foreground: '#FFFFFF',
  },
  itau: {
    primary: '#EC7000',
    secondary: '#003A8F',
    background: '#FFFFFF',
    foreground: '#1A1A1A',
  },
} as const;

// Contextos
export const CONTEXTS = {
  FIAP: 'fiap',
  ITAU: 'itau',
} as const;

// Status de Tarefas
export const TASK_STATUS = {
  BACKLOG: 'backlog',
  DOING: 'doing',
  DONE: 'done',
} as const;

// Prioridades
export const PRIORITIES = {
  BAIXA: 'baixa',
  MEDIA: 'media',
  ALTA: 'alta',
  CRITICA: 'critica',
} as const;

// Status de Reuniões
export const MEETING_STATUS = {
  AGENDADA: 'agendada',
  CONCLUIDA: 'concluida',
  CANCELADA: 'cancelada',
} as const;

// Status de Ações
export const ACTION_STATUS = {
  PENDENTE: 'pendente',
  EM_PROGRESSO: 'em_progresso',
  CONCLUIDA: 'concluida',
} as const;

// Tipos de Materiais
export const MATERIAL_TYPES = {
  PDF: 'pdf',
  PPT: 'ppt',
  DOC: 'doc',
  LINK: 'link',
  VIDEO: 'video',
} as const;

// Ícones de Materiais
export const MATERIAL_ICONS: Record<string, string> = {
  pdf: '📄',
  ppt: '📊',
  doc: '📝',
  link: '🔗',
  video: '🎥',
};

// Tipos de Notas
export const GRADE_TYPES = {
  PROVA: 'prova',
  TRABALHO: 'trabalho',
  PARTICIPACAO: 'participacao',
} as const;

// Tipos de Avaliações
export const EVALUATION_TYPES = {
  MENSAL: 'mensal',
  TRIMESTRAL: 'trimestral',
  ANUAL: 'anual',
} as const;

// Tipos de Insights IA
export const INSIGHT_TYPES = {
  ALERTA: 'alerta',
  SUGESTAO: 'sugestao',
  ELOGIO: 'elogio',
} as const;

// Prioridades de Insights
export const INSIGHT_PRIORITIES = {
  BAIXA: 'baixa',
  MEDIA: 'media',
  ALTA: 'alta',
} as const;

// Features de IA
export const AI_FEATURES = {
  PLANO_AULA: 'plano-aula',
  AVALIACAO_ALUNOS: 'avaliacao-alunos',
  AVALIACAO_TIME: 'avaliacao-time',
  RESUMO_REUNIAO: 'resumo-reuniao',
} as const;

// Tipos de Eventos
export const EVENT_TYPES = {
  REUNIAO: 'reuniao',
  AULA: 'aula',
  TAREFA: 'tarefa',
  FEEDBACK: 'feedback',
} as const;

// Roles de Usuário
export const USER_ROLES = {
  PROFESSOR: 'professor',
  MANAGER: 'manager',
} as const;

// Configurações de Paginação
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

// Limites
export const LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_UPLOAD_FILES: 5,
  MAX_CHECKLIST_ITEMS: 20,
  MAX_TAGS: 10,
  MAX_PARTICIPANTS: 50,
} as const;

// Mensagens
export const MESSAGES = {
  SUCCESS: {
    SAVED: 'Salvo com sucesso!',
    DELETED: 'Excluído com sucesso!',
    UPDATED: 'Atualizado com sucesso!',
  },
  ERROR: {
    GENERIC: 'Ocorreu um erro. Tente novamente.',
    NETWORK: 'Erro de conexão. Verifique sua internet.',
    NOT_FOUND: 'Item não encontrado.',
    UNAUTHORIZED: 'Você não tem permissão para esta ação.',
  },
  CONFIRMATION: {
    DELETE: 'Tem certeza que deseja excluir?',
    CANCEL: 'Tem certeza que deseja cancelar?',
  },
} as const;

// Rotas
export const ROUTES = {
  HOME: '/',
  FIAP: '/fiap',
  FIAP_AULAS: '/fiap/aulas',
  FIAP_ALUNOS: '/fiap/alunos',
  FIAP_CRONOGRAMA: '/fiap/cronograma',
  FIAP_KANBAN: '/fiap/kanban',
  ITAU: '/itau',
  ITAU_ANALISTAS: '/itau/analistas',
  ITAU_FEEDBACKS: '/itau/feedbacks',
  ITAU_REUNIOES: '/itau/reunioes',
  ITAU_KANBAN: '/itau/kanban',
  AI: '/ai',
} as const;

// LocalStorage Keys
export const STORAGE_KEYS = {
  THEME: 'dualos-theme',
  USER: 'dualos-user',
  TOKEN: 'dualos-token',
  PREFERENCES: 'dualos-preferences',
} as const;

// Configurações de Score de Eficiência
export const EFFICIENCY_CONFIG = {
  WEIGHTS: {
    TAREFAS: 3,
    REUNIOES: 2,
    FEEDBACKS: 4,
    AULAS: 3,
  },
  MAX_SCORE: 100,
  MAX_EXPECTED_WEEKLY: 50,
  THRESHOLDS: {
    EXCELLENT: 90,
    GOOD: 75,
    AVERAGE: 60,
    NEEDS_IMPROVEMENT: 45,
  },
} as const;

// Configurações de Gráficos
export const CHART_COLORS = [
  '#EC7000', // Itaú Orange
  '#003A8F', // Itaú Blue
  '#6A0DAD', // FIAP Purple
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
] as const;

// Breakpoints Responsivos
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
} as const;

// Durations de Animação
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Z-Index Layers
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
} as const;

// URLs Externas (futuro)
export const EXTERNAL_URLS = {
  FIAP_SITE: 'https://www.fiap.com.br',
  ITAU_SITE: 'https://www.itau.com.br',
  SUPPORT: '#',
  DOCS: '#',
} as const;

// Versão do Sistema
export const VERSION = '1.0.0';
export const BUILD_DATE = '2026-03-31';
export const SYSTEM_NAME = 'DualOS';
export const SYSTEM_DESCRIPTION = 'Personal Operating System for Hybrid Management';
