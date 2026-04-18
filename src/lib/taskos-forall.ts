import type { UserPreferences, WorkspaceMode } from './auth-context';
import {
  IconDashboard,
  IconTarefas,
  IconPlanejamento,
  IconFinancas,
  IconCarreira,
  IconDesenvolvimento,
  IconViagens,
  IconChat,
  IconMetas,
} from '../app/components/brand/BrandIcons';

export type BrandIcon = (props: { color?: string; size?: number; className?: string }) => JSX.Element;

export type GoalDefinition = {
  id: string;
  label: string;
  description: string;
};

// ── Objetivos unificados ────────────────────────────────────────────────
// Sem divisão work/life — um único contexto de uso.
export const OBJETIVOS_PLATAFORMA: GoalDefinition[] = [
  {
    id: 'desenvolver_carreira',
    label: 'Desenvolver minha carreira',
    description: 'Análise profissional e recomendações de livros, cursos e vídeos.',
  },
  {
    id: 'organizar_tarefas',
    label: 'Organizar minhas tarefas',
    description: 'Kanban, rotina diária e acompanhamento de pendências.',
  },
  {
    id: 'planejar_agenda',
    label: 'Planejar minha agenda',
    description: 'Compromissos, reuniões, planejamento semanal.',
  },
  {
    id: 'organizar_financas',
    label: 'Organizar minhas finanças',
    description: 'Receitas, despesas, investimentos e objetivos financeiros.',
  },
  {
    id: 'planejar_viagens',
    label: 'Planejar viagens',
    description: 'Guardar viagens, datas, custos e objetivos.',
  },
  {
    id: 'usar_chat_rapido',
    label: 'Cadastrar tudo pelo chat',
    description: 'Usar o chat guiado como atalho principal do sistema.',
  },
];

// Mantidos apenas para backward-compat com código legado do onboarding antigo.
export const WORK_GOALS = OBJETIVOS_PLATAFORMA;
export const LIFE_GOALS = OBJETIVOS_PLATAFORMA;

export type DynamicMenuItem = {
  key: string;
  label: string;
  path: string;
  icon: BrandIcon;
  description: string;
};

// ── Menu principal fixo (único contexto) ────────────────────────────────
// Ordem definida conforme especificação do produto.
export const MAIN_MENU: DynamicMenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: IconDashboard,
    description: 'Visão geral, insights e próximas ações.',
  },
  {
    key: 'tarefas',
    label: 'Tarefas Diárias',
    path: '/tarefas',
    icon: IconTarefas,
    description: 'Kanban e rotina do dia.',
  },
  {
    key: 'planejamento',
    label: 'Planejamento',
    path: '/planejamento',
    icon: IconPlanejamento,
    description: 'Compromissos, reuniões e semana.',
  },
  {
    key: 'financas',
    label: 'Gestão Financeira',
    path: '/financas',
    icon: IconFinancas,
    description: 'Receitas, despesas e metas.',
  },
  {
    key: 'carreira',
    label: 'Gestão de Carreira',
    path: '/carreira',
    icon: IconCarreira,
    description: 'Análise profissional e recomendações.',
  },
  {
    key: 'desenvolvimento',
    label: 'Meu Desenvolvimento',
    path: '/meu-desenvolvimento',
    icon: IconDesenvolvimento,
    description: 'Trilha gamificada com cursos, livros e vídeos.',
  },
  {
    key: 'viagens',
    label: 'Viagens',
    path: '/pessoal/viagens',
    icon: IconViagens,
    description: 'Planeje e acompanhe suas viagens.',
  },
  {
    key: 'chat',
    label: 'Chat Direto',
    path: '/chat',
    icon: IconChat,
    description: 'Cadastre dados por conversa.',
  },
];

/**
 * Retorna o menu principal (mesma lista para todos — sem divisão work/life).
 * Mantém a assinatura antiga para evitar refactor em cascata.
 */
export function getWorkspaceMenuItems(
  _preferences?: UserPreferences | null,
  _workspace?: WorkspaceMode,
): DynamicMenuItem[] {
  return MAIN_MENU;
}

export function getWorkspaceTitle(_workspace?: WorkspaceMode) {
  return 'TaskAll';
}

export function getGoalLabel(goalId: string) {
  return OBJETIVOS_PLATAFORMA.find((g) => g.id === goalId)?.label ?? goalId;
}
