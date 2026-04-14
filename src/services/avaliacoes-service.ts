/**
 * Serviço de Avaliações - Firebase Integration Completo
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

export interface Avaliacao {
  id?: string;
  alunoId?: string;
  analistaId?: string;
  disciplina?: string;
  tipo: 'prova' | 'trabalho' | 'participacao' | 'projeto' | 'mensal' | 'trimestral' | 'anual';
  nota: number;
  data: Date;
  comentario: string;
  contexto: 'fiap' | 'itau';
  criadoEm?: Date;
  atualizadoEm?: Date;
}

const COLLECTION_NAME = 'avaliacoes';

/**
 * Cria uma nova avaliação no Firebase
 */
export async function criarAvaliacao(avaliacao: Omit<Avaliacao, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<string> {
  try {
    const avaliacaoData = {
      ...avaliacao,
      data: Timestamp.fromDate(new Date(avaliacao.data)),
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), avaliacaoData);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    throw error;
  }
}

/**
 * Atualiza uma avaliação existente
 */
export async function atualizarAvaliacao(id: string, avaliacao: Partial<Avaliacao>): Promise<void> {
  try {
    const avaliacaoRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = { ...avaliacao };

    if (avaliacao.data) {
      updateData.data = Timestamp.fromDate(new Date(avaliacao.data));
    }

    updateData.atualizadoEm = Timestamp.now();

    await updateDoc(avaliacaoRef, updateData);
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    throw error;
  }
}

/**
 * Deleta uma avaliação
 */
export async function deletarAvaliacao(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Erro ao deletar avaliação:', error);
    throw error;
  }
}

/**
 * Busca uma avaliação por ID
 */
export async function buscarAvaliacaoPorId(id: string): Promise<Avaliacao | null> {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        data: data.data?.toDate?.() || new Date(),
        criadoEm: data.criadoEm?.toDate?.() || new Date(),
        atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
      } as Avaliacao;
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar avaliação:', error);
    throw error;
  }
}

/**
 * Lista avaliações de um aluno
 */
export async function listarAvaliacoesPorAluno(alunoId: string): Promise<Avaliacao[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('alunoId', '==', alunoId),
      orderBy('data', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        data: data.data?.toDate?.() || new Date(),
        criadoEm: data.criadoEm?.toDate?.() || new Date(),
        atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
      } as Avaliacao;
    });
  } catch (error) {
    console.error('Erro ao listar avaliações do aluno:', error);
    throw error;
  }
}

/**
 * Lista avaliações de um analista
 */
export async function listarAvaliacoesPorAnalista(analistaId: string): Promise<Avaliacao[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('analistaId', '==', analistaId),
      orderBy('data', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        data: data.data?.toDate?.() || new Date(),
        criadoEm: data.criadoEm?.toDate?.() || new Date(),
        atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
      } as Avaliacao;
    });
  } catch (error) {
    console.error('Erro ao listar avaliações do analista:', error);
    throw error;
  }
}

/**
 * Lista todas as avaliações de um contexto
 */
export async function listarAvaliacoesPorContexto(contexto: 'fiap' | 'itau'): Promise<Avaliacao[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('contexto', '==', contexto),
      orderBy('data', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        data: data.data?.toDate?.() || new Date(),
        criadoEm: data.criadoEm?.toDate?.() || new Date(),
        atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
      } as Avaliacao;
    });
  } catch (error) {
    console.error('Erro ao listar avaliações por contexto:', error);
    throw error;
  }
}

/**
 * Calcula a média de notas de um aluno
 */
export async function calcularMediaAluno(alunoId: string): Promise<number> {
  try {
    const avaliacoes = await listarAvaliacoesPorAluno(alunoId);
    if (avaliacoes.length === 0) return 0;

    const soma = avaliacoes.reduce((acc, av) => acc + av.nota, 0);
    return soma / avaliacoes.length;
  } catch (error) {
    console.error('Erro ao calcular média:', error);
    throw error;
  }
}

/**
 * Calcula a média de notas de um analista
 */
export async function calcularMediaAnalista(analistaId: string): Promise<number> {
  try {
    const avaliacoes = await listarAvaliacoesPorAnalista(analistaId);
    if (avaliacoes.length === 0) return 0;

    const soma = avaliacoes.reduce((acc, av) => acc + av.nota, 0);
    return soma / avaliacoes.length;
  } catch (error) {
    console.error('Erro ao calcular média:', error);
    throw error;
  }
}
