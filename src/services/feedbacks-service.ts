/**
 * Serviço de Feedbacks - Firebase Integration Completo
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
import { db } from '../lib/firebase-config';

export interface Feedback {
  id?: string;
  analistaId: string;
  avaliadorId?: string;
  titulo?: string;
  descricao?: string;
  categoria?: 'tecnico' | 'comportamental' | 'lideranca' | 'comunicacao' | 'outro';
  rating?: number;
  pontosFortes?: string[];
  pontosMelhoria?: string[];
  combinados?: string[];
  data: Date;
  proximaRevisao?: Date;
  status?: 'pendente' | 'respondido' | 'arquivado';
  resposta?: string;
  dataResposta?: Date;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

const COLLECTION_NAME = 'feedbacks_gestao';

/**
 * Cria um novo feedback no Firebase
 */
export async function criarFeedback(feedback: Omit<Feedback, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<string> {
  try {
    const feedbackData: any = {
      ...feedback,
      data: Timestamp.fromDate(new Date(feedback.data)),
      proximaRevisao: feedback.proximaRevisao ? Timestamp.fromDate(new Date(feedback.proximaRevisao)) : null,
      dataResposta: feedback.dataResposta ? Timestamp.fromDate(new Date(feedback.dataResposta)) : null,
      status: feedback.status || 'pendente',
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), feedbackData);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar feedback:', error);
    throw error;
  }
}

/**
 * Atualiza um feedback existente
 */
export async function atualizarFeedback(id: string, feedback: Partial<Feedback>): Promise<void> {
  try {
    const feedbackRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = { ...feedback, atualizadoEm: Timestamp.now() };

    if (feedback.data) updateData.data = Timestamp.fromDate(new Date(feedback.data));
    if (feedback.proximaRevisao) updateData.proximaRevisao = Timestamp.fromDate(new Date(feedback.proximaRevisao));
    if (feedback.dataResposta) updateData.dataResposta = Timestamp.fromDate(new Date(feedback.dataResposta));

    await updateDoc(feedbackRef, updateData);
  } catch (error) {
    console.error('Erro ao atualizar feedback:', error);
    throw error;
  }
}

/**
 * Deleta um feedback
 */
export async function deletarFeedback(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Erro ao deletar feedback:', error);
    throw error;
  }
}

/**
 * Busca um feedback por ID
 */
export async function buscarFeedbackPorId(id: string): Promise<Feedback | null> {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        data: data.data?.toDate?.() || new Date(),
        proximaRevisao: data.proximaRevisao?.toDate?.() || undefined,
        dataResposta: data.dataResposta?.toDate?.() || undefined,
        criadoEm: data.criadoEm?.toDate?.() || new Date(),
        atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
      } as Feedback;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar feedback:', error);
    throw error;
  }
}

/**
 * Lista todos os feedbacks (sem orderBy para evitar necessidade de índice)
 */
export async function listarFeedbacks(): Promise<Feedback[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const feedbacks = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        data: data.data?.toDate?.() || new Date(),
        proximaRevisao: data.proximaRevisao?.toDate?.() || undefined,
        dataResposta: data.dataResposta?.toDate?.() || undefined,
        criadoEm: data.criadoEm?.toDate?.() || new Date(),
        atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
      } as Feedback;
    });

    // Ordenar no client-side
    feedbacks.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return feedbacks;
  } catch (error) {
    console.error('Erro ao listar feedbacks:', error);
    return [];
  }
}

/**
 * Responde um feedback
 */
export async function responderFeedback(id: string, resposta: string): Promise<void> {
  return atualizarFeedback(id, {
    resposta,
    status: 'respondido',
    dataResposta: new Date(),
  });
}

/**
 * Arquiva um feedback
 */
export async function arquivarFeedback(id: string): Promise<void> {
  return atualizarFeedback(id, { status: 'arquivado' });
}
