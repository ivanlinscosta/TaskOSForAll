/**
 * Serviço de Reuniões - Firebase Integration Completo
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

export interface Acao {
  id: string;
  descricao: string;
  responsavel: string;
  prazo: Date;
  status: 'pendente' | 'em_progresso' | 'concluida' | 'cancelada';
}

export interface Reuniao {
  id?: string;
  titulo: string;
  tipo?: string;
  data: Date;
  horario?: string;
  duracao?: number;
  local?: string;
  linkOnline?: string;
  link?: string;
  descricao?: string;
  pauta?: string | string[];
  participantes: string[];
  notas?: string;
  acoes?: Acao[];
  status?: 'agendada' | 'concluida' | 'cancelada';
  resumoIA?: string;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

const COLLECTION_NAME = 'reunioes';

/**
 * Cria uma nova reunião no Firebase
 */
export async function criarReuniao(reuniao: Omit<Reuniao, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<string> {
  try {
    const reuniaoData: any = {
      titulo: reuniao.titulo,
      tipo: reuniao.tipo || 'alinhamento',
      data: Timestamp.fromDate(new Date(reuniao.data)),
      horario: reuniao.horario || '',
      duracao: reuniao.duracao || 60,
      local: reuniao.local || '',
      linkOnline: reuniao.linkOnline || '',
      descricao: reuniao.descricao || '',
      pauta: reuniao.pauta || [],
      participantes: reuniao.participantes || [],
      notas: reuniao.notas || '',
      acoes: (reuniao.acoes || []).map((a) => ({
        ...a,
        prazo: Timestamp.fromDate(new Date(a.prazo)),
      })),
      status: reuniao.status || 'agendada',
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), reuniaoData);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar reunião:', error);
    throw error;
  }
}

/**
 * Atualiza uma reunião existente
 */
export async function atualizarReuniao(id: string, reuniao: Partial<Reuniao>): Promise<void> {
  try {
    const reuniaoRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = { ...reuniao, atualizadoEm: Timestamp.now() };

    if (reuniao.data) {
      updateData.data = Timestamp.fromDate(new Date(reuniao.data));
    }
    if (reuniao.acoes) {
      updateData.acoes = reuniao.acoes.map((a) => ({
        ...a,
        prazo: Timestamp.fromDate(new Date(a.prazo)),
      }));
    }

    await updateDoc(reuniaoRef, updateData);
  } catch (error) {
    console.error('Erro ao atualizar reunião:', error);
    throw error;
  }
}

/**
 * Deleta uma reunião
 */
export async function deletarReuniao(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Erro ao deletar reunião:', error);
    throw error;
  }
}

/**
 * Busca uma reunião por ID
 */
export async function buscarReuniaoPorId(id: string): Promise<Reuniao | null> {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        titulo: data.titulo || '',
        tipo: data.tipo || '',
        data: data.data?.toDate?.() || new Date(),
        horario: data.horario || '',
        duracao: data.duracao || 60,
        local: data.local || '',
        linkOnline: data.linkOnline || '',
        descricao: data.descricao || '',
        pauta: data.pauta || [],
        participantes: data.participantes || [],
        notas: data.notas || '',
        acoes: (data.acoes || []).map((a: any) => ({
          ...a,
          prazo: a.prazo?.toDate?.() || new Date(),
        })),
        status: data.status || 'agendada',
        resumoIA: data.resumoIA || '',
        criadoEm: data.criadoEm?.toDate?.() || new Date(),
        atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
      } as Reuniao;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar reunião:', error);
    throw error;
  }
}

/**
 * Lista todas as reuniões (sem orderBy para evitar necessidade de índice)
 */
export async function listarReunioes(): Promise<Reuniao[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const reunioes = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        titulo: data.titulo || '',
        tipo: data.tipo || '',
        data: data.data?.toDate?.() || new Date(),
        horario: data.horario || '',
        duracao: data.duracao || 60,
        local: data.local || '',
        linkOnline: data.linkOnline || '',
        descricao: data.descricao || '',
        pauta: data.pauta || [],
        participantes: data.participantes || [],
        notas: data.notas || '',
        acoes: (data.acoes || []).map((a: any) => ({
          ...a,
          prazo: a.prazo?.toDate?.() || new Date(),
        })),
        status: data.status || 'agendada',
        resumoIA: data.resumoIA || '',
        criadoEm: data.criadoEm?.toDate?.() || new Date(),
        atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
      } as Reuniao;
    });

    // Ordenar no client-side
    reunioes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return reunioes;
  } catch (error) {
    console.error('Erro ao listar reuniões:', error);
    return [];
  }
}

/**
 * Marca uma reunião como concluída
 */
export async function marcarReuniaoComoConcluida(id: string): Promise<void> {
  return atualizarReuniao(id, { status: 'concluida' });
}

/**
 * Cancela uma reunião
 */
export async function cancelarReuniao(id: string): Promise<void> {
  return atualizarReuniao(id, { status: 'cancelada' });
}
