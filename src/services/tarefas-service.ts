/**
 * Serviço de Tarefas - Firebase Integration
 */

import { COLLECTIONS } from '../lib/firebase-config';

export interface Tarefa {
  id?: string;
  titulo: string;
  descricao: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  categoria: string;
  dataEntrega: Date;
  responsavel?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  contexto: 'fiap' | 'itau';
  squad?: string;
  sprint?: string;
  tags?: string[];
  criadoEm?: Date;
  atualizadoEm?: Date;
}

export async function criarTarefa(tarefa: Omit<Tarefa, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<string> {
  console.log('Mock: Criando tarefa', tarefa);
  return Promise.resolve('mock-id-' + Date.now());
  
  // Firebase implementation:
  /*
  const db = getDb();
  if (!db) throw new Error('Firebase não inicializado');
  
  const tarefaData = {
    ...tarefa,
    dataEntrega: Timestamp.fromDate(tarefa.dataEntrega),
    criadoEm: Timestamp.now(),
    atualizadoEm: Timestamp.now(),
  };
  
  const docRef = await addDoc(collection(db, COLLECTIONS.TAREFAS), tarefaData);
  return docRef.id;
  */
}

export async function atualizarTarefa(id: string, tarefa: Partial<Tarefa>): Promise<void> {
  console.log('Mock: Atualizando tarefa', id, tarefa);
  return Promise.resolve();
}

export async function deletarTarefa(id: string): Promise<void> {
  console.log('Mock: Deletando tarefa', id);
  return Promise.resolve();
}

export async function buscarTarefaPorId(id: string): Promise<Tarefa | null> {
  console.log('Mock: Buscando tarefa', id);
  return Promise.resolve(null);
}

export async function listarTarefas(filtros?: { 
  contexto?: 'fiap' | 'itau'; 
  status?: string;
  prioridade?: string;
}): Promise<Tarefa[]> {
  console.log('Mock: Listando tarefas', filtros);
  return Promise.resolve([]);
}

export async function mudarStatusTarefa(id: string, novoStatus: Tarefa['status']): Promise<void> {
  return atualizarTarefa(id, { status: novoStatus });
}

export async function mudarPrioridadeTarefa(id: string, novaPrioridade: Tarefa['prioridade']): Promise<void> {
  return atualizarTarefa(id, { prioridade: novaPrioridade });
}
