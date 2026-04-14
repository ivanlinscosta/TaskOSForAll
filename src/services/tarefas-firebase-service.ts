/**
 * Serviço de Tarefas com integração Firebase
 * Responsável por CRUD de tarefas e sincronização com Firestore
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase-config';
import { Task } from '../types';

const COLLECTION_NAME = 'tarefas';

/**
 * Converte um documento do Firestore para o formato Task
 */
function convertFirestoreToTask(docId: string, data: any): Task {
  return {
    id: docId,
    title: data.titulo || data.title || '',
    description: data.descricao || data.description || '',
    status: data.status || 'backlog',
    priority: data.prioridade || data.priority || 'medium',
    context: data.contexto || data.context || 'fiap',
    tags: data.tags || [],
    dueDate: data.dueDate?.toDate?.() || undefined,
    checklist: data.checklist || [],
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
    assignedTo: data.assignedTo || undefined,
  };
}

/**
 * Cria uma nova tarefa
 */
export async function createTask(task: Task, userId: string): Promise<string> {
  try {
    const tarefaData: any = {
      titulo: task.title,
      descricao: task.description,
      status: task.status,
      prioridade: task.priority,
      contexto: task.context,
      tags: task.tags || [],
      checklist: task.checklist || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId,
    };

    if (task.dueDate) {
      tarefaData.dueDate = Timestamp.fromDate(new Date(task.dueDate));
    }
    if (task.assignedTo) {
      tarefaData.assignedTo = task.assignedTo;
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), tarefaData);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    throw error;
  }
}

/**
 * Atualiza uma tarefa existente
 */
export async function updateTask(taskId: string, task: Partial<Task>, userId: string): Promise<void> {
  try {
    const taskRef = doc(db, COLLECTION_NAME, taskId);
    const updateData: any = { updatedAt: Timestamp.now() };

    if (task.title !== undefined) updateData.titulo = task.title;
    if (task.description !== undefined) updateData.descricao = task.description;
    if (task.status !== undefined) updateData.status = task.status;
    if (task.priority !== undefined) updateData.prioridade = task.priority;
    if (task.tags !== undefined) updateData.tags = task.tags;
    if (task.dueDate !== undefined) updateData.dueDate = Timestamp.fromDate(new Date(task.dueDate));
    if (task.checklist !== undefined) updateData.checklist = task.checklist;

    await updateDoc(taskRef, updateData);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    throw error;
  }
}

/**
 * Atualiza apenas o status de uma tarefa (para o Kanban drag-and-drop)
 */
export async function updateTaskStatus(
  taskId: string,
  newStatus: 'backlog' | 'doing' | 'done'
): Promise<void> {
  try {
    const taskRef = doc(db, COLLECTION_NAME, taskId);
    await updateDoc(taskRef, {
      status: newStatus,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erro ao atualizar status da tarefa:', error);
    throw error;
  }
}

/**
 * Deleta uma tarefa
 */
export async function deleteTask(taskId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, taskId));
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    throw error;
  }
}

/**
 * Busca uma tarefa por ID
 */
export async function getTaskById(taskId: string): Promise<Task | null> {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, taskId));
    if (docSnap.exists()) {
      return convertFirestoreToTask(docSnap.id, docSnap.data());
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    throw error;
  }
}

/**
 * Lista todas as tarefas de um contexto específico
 * Usa query simples (sem orderBy composto) para evitar necessidade de índice
 */
export async function listTasksByContext(context: 'fiap' | 'itau'): Promise<Task[]> {
  try {
    // Query simples - filtra apenas por contexto, ordena no client-side
    const q = query(
      collection(db, COLLECTION_NAME),
      where('contexto', '==', context)
    );
    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map((d) => convertFirestoreToTask(d.id, d.data()));
    // Ordenar no client-side para evitar necessidade de índice composto
    tasks.sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });
    return tasks;
  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    // Se falhar, tentar sem filtro
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      const allTasks = snapshot.docs.map((d) => convertFirestoreToTask(d.id, d.data()));
      return allTasks.filter(t => t.context === context);
    } catch (err2) {
      console.error('Erro ao listar todas as tarefas:', err2);
      return [];
    }
  }
}

/**
 * Lista tarefas filtradas por status
 */
export async function listTasksByStatus(
  context: 'fiap' | 'itau',
  status: 'backlog' | 'doing' | 'done'
): Promise<Task[]> {
  try {
    const allTasks = await listTasksByContext(context);
    return allTasks.filter(t => t.status === status);
  } catch (error) {
    console.error('Erro ao listar tarefas por status:', error);
    return [];
  }
}

/**
 * Lista tarefas filtradas por prioridade
 */
export async function listTasksByPriority(
  context: 'fiap' | 'itau',
  priority: 'low' | 'medium' | 'high'
): Promise<Task[]> {
  try {
    const allTasks = await listTasksByContext(context);
    return allTasks.filter(t => t.priority === priority);
  } catch (error) {
    console.error('Erro ao listar tarefas por prioridade:', error);
    return [];
  }
}

/**
 * Busca tarefas por tag
 */
export async function listTasksByTag(context: 'fiap' | 'itau', tag: string): Promise<Task[]> {
  try {
    const allTasks = await listTasksByContext(context);
    return allTasks.filter(t => t.tags.includes(tag));
  } catch (error) {
    console.error('Erro ao listar tarefas por tag:', error);
    return [];
  }
}

/**
 * Atualiza o checklist de uma tarefa
 */
export async function updateTaskChecklist(
  taskId: string,
  checklist: Array<{ id: string; text: string; completed: boolean }>
): Promise<void> {
  try {
    const taskRef = doc(db, COLLECTION_NAME, taskId);
    await updateDoc(taskRef, {
      checklist,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erro ao atualizar checklist:', error);
    throw error;
  }
}

/**
 * Marca uma tarefa como concluída
 */
export async function completeTask(taskId: string): Promise<void> {
  return updateTaskStatus(taskId, 'done');
}

/**
 * Move uma tarefa para em progresso
 */
export async function startTask(taskId: string): Promise<void> {
  return updateTaskStatus(taskId, 'doing');
}

/**
 * Move uma tarefa de volta para backlog
 */
export async function backlogTask(taskId: string): Promise<void> {
  return updateTaskStatus(taskId, 'backlog');
}

/**
 * Lista TODAS as tarefas (sem filtro de contexto)
 */
export async function listAllTasks(): Promise<Task[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map((d) => convertFirestoreToTask(d.id, d.data()));
  } catch (error) {
    console.error('Erro ao listar todas as tarefas:', error);
    return [];
  }
}
