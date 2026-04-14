/**
 * Serviço de Tarefas Pessoais - Firebase Integration
 */
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../lib/firebase-config';

export type CategoriaTarefaPessoal = 'pessoal' | 'saude' | 'financeiro' | 'casa' | 'familia' | 'outros';

export interface TarefaPessoal {
  id?: string;
  titulo: string;
  descricao?: string;
  status: 'backlog' | 'doing' | 'done';
  prioridade: 'baixa' | 'media' | 'alta';
  categoria: CategoriaTarefaPessoal;
  dataVencimento?: Date;
  checklist?: { id: string; texto: string; concluido: boolean }[];
  tags?: string[];
  criadoEm?: Date;
  atualizadoEm?: Date;
}

function docToTarefa(id: string, data: any): TarefaPessoal {
  return {
    id,
    titulo: data.titulo || '',
    descricao: data.descricao || '',
    status: data.status || 'backlog',
    prioridade: data.prioridade || 'media',
    categoria: data.categoria || 'pessoal',
    dataVencimento: data.dataVencimento?.toDate?.() || undefined,
    checklist: data.checklist || [],
    tags: data.tags || [],
    criadoEm: data.criadoEm?.toDate?.() || new Date(),
    atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
  };
}

export async function criarTarefaPessoal(tarefa: Omit<TarefaPessoal, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<string> {
  const data: any = {
    ...tarefa,
    dataVencimento: tarefa.dataVencimento ? Timestamp.fromDate(new Date(tarefa.dataVencimento)) : null,
    criadoEm: Timestamp.now(),
    atualizadoEm: Timestamp.now(),
  };
  const ref = await addDoc(collection(db, COLLECTIONS.TAREFAS_PESSOAIS), data);
  return ref.id;
}

export async function atualizarTarefaPessoal(id: string, tarefa: Partial<TarefaPessoal>): Promise<void> {
  const data: any = { ...tarefa, atualizadoEm: Timestamp.now() };
  if (tarefa.dataVencimento) data.dataVencimento = Timestamp.fromDate(new Date(tarefa.dataVencimento));
  await updateDoc(doc(db, COLLECTIONS.TAREFAS_PESSOAIS, id), data);
}

export async function deletarTarefaPessoal(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.TAREFAS_PESSOAIS, id));
}

export async function buscarTarefaPorId(id: string): Promise<TarefaPessoal | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.TAREFAS_PESSOAIS, id));
  if (!snap.exists()) return null;
  return docToTarefa(snap.id, snap.data());
}

export async function listarTarefasPessoais(): Promise<TarefaPessoal[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.TAREFAS_PESSOAIS));
  return snap.docs.map((d) => docToTarefa(d.id, d.data()));
}

export const CATEGORIAS_TAREFAS_LABELS: Record<CategoriaTarefaPessoal, string> = {
  pessoal: 'Pessoal',
  saude: 'Saúde',
  financeiro: 'Financeiro',
  casa: 'Casa',
  familia: 'Família',
  outros: 'Outros',
};
