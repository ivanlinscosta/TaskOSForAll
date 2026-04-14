import {
  addDoc,
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase-config';

const COLLECTION_NAME = 'avaliacoes_alunos';

export interface CriteriosAluno {
  participacao: number;
  engajamento: number;
  colaboracao: number;
  entrega: number;
}

export interface AvaliacaoAluno {
  id?: string;
  alunoId: string;
  alunoNome: string;
  disciplina: string;
  tipo: 'Prova' | 'Trabalho' | 'Projeto' | 'Apresentação' | 'Checkpoint' | 'Global Solution' | 'Challenge';
  nota: number;
  peso: number;
  data: string;
  comentario: string;
  criterios: CriteriosAluno;
  observacoesPedagogicas?: string;
  criadoEm?: Date;
}

function mapFirestoreToAvaliacao(id: string, data: any): AvaliacaoAluno {
  return {
    id,
    alunoId: data.alunoId,
    alunoNome: data.alunoNome,
    disciplina: data.disciplina,
    tipo: data.tipo,
    nota: Number(data.nota || 0),
    peso: Number(data.peso || 1),
    data: data.data,
    comentario: data.comentario || '',
    criterios: {
      participacao: Number(data.criterios?.participacao || 0),
      engajamento: Number(data.criterios?.engajamento || 0),
      colaboracao: Number(data.criterios?.colaboracao || 0),
      entrega: Number(data.criterios?.entrega || 0),
    },
    observacoesPedagogicas: data.observacoesPedagogicas || '',
    criadoEm: data.criadoEm?.toDate?.() || new Date(),
  };
}

export async function salvarAvaliacaoAluno(
  avaliacao: Omit<AvaliacaoAluno, 'id' | 'criadoEm'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...avaliacao,
      criadoEm: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Erro ao salvar avaliação do aluno:', error);
    throw error;
  }
}

export async function listarAvaliacoesAluno(alunoId: string): Promise<AvaliacaoAluno[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('alunoId', '==', alunoId)
    );

    const snapshot = await getDocs(q);

    const avaliacoes = snapshot.docs.map((doc) =>
      mapFirestoreToAvaliacao(doc.id, doc.data())
    );

    avaliacoes.sort((a, b) => {
      const dataA = new Date(a.data).getTime();
      const dataB = new Date(b.data).getTime();
      return dataB - dataA;
    });

    return avaliacoes;
  } catch (error) {
    console.error('Erro ao listar avaliações do aluno:', error);
    return [];
  }
}