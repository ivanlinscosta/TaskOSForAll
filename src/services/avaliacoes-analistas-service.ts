import {
  addDoc,
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase-config';

const COLLECTION_NAME = 'avaliacoes_analistas';

export interface PlanoAcaoAnalista {
  plano: string;
  tipo: string;
  dataCombinada: string;
}

export interface AvaliacaoAnalista {
  id?: string;
  analistaId: string;
  analistaNome: string;
  tipo: string;
  conceito: 'destaca-se' | 'alinhado' | 'abaixo-do-esperado';
  data: string;
  comentario: string;
  planosAcao: PlanoAcaoAnalista[];
  criadoEm?: Date;
}

function mapFirestoreToAvaliacao(id: string, data: any): AvaliacaoAnalista {
  return {
    id,
    analistaId: data.analistaId,
    analistaNome: data.analistaNome,
    tipo: data.tipo,
    conceito: data.conceito,
    data: data.data,
    comentario: data.comentario,
    planosAcao: data.planosAcao || [],
    criadoEm: data.criadoEm?.toDate?.() || new Date(),
  };
}

export async function salvarAvaliacaoAnalista(
  avaliacao: Omit<AvaliacaoAnalista, 'id' | 'criadoEm'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...avaliacao,
      planosAcao: avaliacao.planosAcao || [],
      criadoEm: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Erro ao salvar avaliação do analista:', error);
    throw error;
  }
}

export async function listarAvaliacoesAnalista(
  analistaId: string
): Promise<AvaliacaoAnalista[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('analistaId', '==', analistaId)
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
    console.error('Erro ao listar avaliações do analista:', error);
    return [];
  }
}