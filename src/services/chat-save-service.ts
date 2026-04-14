import { createOwnedRecord } from './forall-data-service';
import { COLLECTIONS } from '../lib/firebase-config';

export type ChatAction = 'tarefa' | 'gasto' | 'feedback' | 'viagem';
export type ChatWorkspace = 'work' | 'life';

type SaveContext = {
  ownerId: string;
  ownerName?: string;
  ownerGoals?: string[];
};

export async function saveChatData(
  action: ChatAction,
  workspace: ChatWorkspace,
  answers: Record<string, string>,
  context: SaveContext,
): Promise<string> {
  switch (action) {
    case 'tarefa':
      return saveTarefa(workspace, answers, context);
    case 'gasto':
      return saveGasto(workspace, answers, context);
    case 'feedback':
      return saveFeedback(workspace, answers, context);
    case 'viagem':
      return saveViagem(workspace, answers, context);
    default:
      throw new Error('Ação não suportada');
  }
}

async function saveTarefa(
  workspace: ChatWorkspace,
  answers: Record<string, string>,
  context: SaveContext,
) {
  const collectionName =
    workspace === 'work' ? COLLECTIONS.TAREFAS : COLLECTIONS.TAREFAS_PESSOAIS;

  return createOwnedRecord(collectionName, {
    ownerId: context.ownerId,
    ownerName: context.ownerName || '',
    ownerGoals: context.ownerGoals || [],
    workspaceType: workspace,
    title: answers.titulo,
    description: answers.descricao || '',
    dueDateText: answers.prazo || '',
    priority: answers.prioridade || 'medium',
    status: 'backlog',
    source: 'chat_guided',
  });
}

async function saveGasto(
  workspace: ChatWorkspace,
  answers: Record<string, string>,
  context: SaveContext,
) {
  return createOwnedRecord(COLLECTIONS.CUSTOS, {
    ownerId: context.ownerId,
    ownerName: context.ownerName || '',
    ownerGoals: context.ownerGoals || [],
    workspaceType: workspace,
    descricao: answers.descricao,
    valor: Number(String(answers.valor || '0').replace(',', '.')),
    categoria: answers.categoria || 'outros',
    data: answers.data || '',
    tipo: workspace === 'work' ? 'trabalho' : 'pessoal',
    source: 'chat_guided',
  });
}

async function saveFeedback(
  workspace: ChatWorkspace,
  answers: Record<string, string>,
  context: SaveContext,
) {
  return createOwnedRecord(COLLECTIONS.FEEDBACKS, {
    ownerId: context.ownerId,
    ownerName: context.ownerName || '',
    ownerGoals: context.ownerGoals || [],
    workspaceType: workspace,
    pessoa: answers.pessoa,
    tipo: answers.tipo || 'geral',
    contexto: answers.contexto || '',
    descricao: answers.descricao,
    source: 'chat_guided',
  });
}

async function saveViagem(
  workspace: ChatWorkspace,
  answers: Record<string, string>,
  context: SaveContext,
) {
  return createOwnedRecord(COLLECTIONS.VIAGENS, {
    ownerId: context.ownerId,
    ownerName: context.ownerName || '',
    ownerGoals: context.ownerGoals || [],
    workspaceType: workspace,
    destino: answers.destino,
    dataIda: answers.dataIda,
    dataVolta: answers.dataVolta || '',
    objetivo: answers.objetivo || '',
    status: 'planejada',
    source: 'chat_guided',
  });
}
