/**
 * Serviço de Analistas - Firebase Integration Completo
 * Queries simplificadas (sem orderBy no Firestore) para evitar necessidade de índice
 * Suporte a foto via Firebase Storage, mantendo as regras atuais do Firestore
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
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../lib/firebase-config';

export interface Analista {
  id?: string;
  nome: string;
  email: string;
  telefone?: string;
  funcao: string;
  squad?: string;
  senioridade?: string;
  salario?: number;
  foto?: string;
  fotoPath?: string;
  dataAdmissao?: Date;
  dataNascimento?: Date;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  skills?: string[];
  avaliacoes?: Array<{
    id: string;
    data: Date;
    nota: number;
    comentario: string;
    tipo: string;
  }>;
  observacoes?: string;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

const COLLECTION_NAME = 'analistas';

function mapFirestoreToAnalista(id: string, data: any): Analista {
  return {
    id,
    ...data,
    foto: data.foto || '',
    fotoPath: data.fotoPath || '',
    dataAdmissao: data.dataAdmissao?.toDate?.() || undefined,
    dataNascimento: data.dataNascimento?.toDate?.() || undefined,
    criadoEm: data.criadoEm?.toDate?.() || new Date(),
    atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
    avaliacoes: (data.avaliacoes || []).map((av: any) => ({
      ...av,
      data: av.data?.toDate?.() || new Date(),
    })),
  } as Analista;
}

/**
 * Cria um novo analista no Firebase
 */
export async function criarAnalista(
  analista: Omit<Analista, 'id' | 'criadoEm' | 'atualizadoEm'>
): Promise<string> {
  try {
    const analistaData: any = {
      ...analista,
      avaliacoes: analista.avaliacoes || [],
      skills: analista.skills || [],
      foto: analista.foto || '',
      fotoPath: analista.fotoPath || '',
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    };

    if (analista.dataAdmissao) {
      analistaData.dataAdmissao = Timestamp.fromDate(new Date(analista.dataAdmissao));
    }
    if (analista.dataNascimento) {
      analistaData.dataNascimento = Timestamp.fromDate(new Date(analista.dataNascimento));
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), analistaData);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar analista:', error);
    throw error;
  }
}

/**
 * Atualiza um analista existente
 */
export async function atualizarAnalista(id: string, analista: Partial<Analista>): Promise<void> {
  try {
    const analistaRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = { ...analista };

    if (analista.dataAdmissao) {
      updateData.dataAdmissao = Timestamp.fromDate(new Date(analista.dataAdmissao));
    }
    if (analista.dataNascimento) {
      updateData.dataNascimento = Timestamp.fromDate(new Date(analista.dataNascimento));
    }

    updateData.atualizadoEm = Timestamp.now();

    await updateDoc(analistaRef, updateData);
  } catch (error) {
    console.error('Erro ao atualizar analista:', error);
    throw error;
  }
}

/**
 * Faz upload da foto do analista no Firebase Storage
 * e salva a URL no documento do Firestore
 */
export async function uploadFotoAnalista(
  id: string,
  file: File
): Promise<{ foto: string; fotoPath: string }> {
  try {
    const extensao = file.name.split('.').pop() || 'jpg';
    const fotoPath = `analistas/${id}/perfil.${extensao}`;
    const storageRef = ref(storage, fotoPath);

    await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
    });

    const foto = await getDownloadURL(storageRef);

    await updateDoc(doc(db, COLLECTION_NAME, id), {
      foto,
      fotoPath,
      atualizadoEm: Timestamp.now(),
    });

    return { foto, fotoPath };
  } catch (error) {
    console.error('Erro ao fazer upload da foto do analista:', error);
    throw error;
  }
}

/**
 * Remove a foto do analista
 */
export async function removerFotoAnalista(id: string): Promise<void> {
  try {
    const analista = await buscarAnalistaPorId(id);

    if (analista?.fotoPath) {
      try {
        await deleteObject(ref(storage, analista.fotoPath));
      } catch (error) {
        console.warn('Arquivo da foto não encontrado ou já removido:', error);
      }
    }

    await updateDoc(doc(db, COLLECTION_NAME, id), {
      foto: '',
      fotoPath: '',
      atualizadoEm: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erro ao remover foto do analista:', error);
    throw error;
  }
}

/**
 * Deleta um analista
 */
export async function deletarAnalista(id: string): Promise<void> {
  try {
    const analista = await buscarAnalistaPorId(id);

    if (analista?.fotoPath) {
      try {
        await deleteObject(ref(storage, analista.fotoPath));
      } catch (error) {
        console.warn('Não foi possível remover a foto ao deletar analista:', error);
      }
    }

    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Erro ao deletar analista:', error);
    throw error;
  }
}

/**
 * Busca um analista por ID
 */
export async function buscarAnalistaPorId(id: string): Promise<Analista | null> {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));

    if (docSnap.exists()) {
      return mapFirestoreToAnalista(docSnap.id, docSnap.data());
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar analista:', error);
    throw error;
  }
}

/**
 * Lista todos os analistas (sem orderBy para evitar necessidade de índice)
 */
export async function listarAnalistas(
  filtros?: { funcao?: string; squad?: string }
): Promise<Analista[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));

    let analistas = snapshot.docs.map((d) =>
      mapFirestoreToAnalista(d.id, d.data())
    );

    if (filtros?.funcao) {
      analistas = analistas.filter((a) => a.funcao === filtros.funcao);
    }
    if (filtros?.squad) {
      analistas = analistas.filter((a) => a.squad === filtros.squad);
    }

    analistas.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

    return analistas;
  } catch (error) {
    console.error('Erro ao listar analistas:', error);
    return [];
  }
}

/**
 * Lista analistas por função
 */
export async function listarAnalistasPorFuncao(funcao: string): Promise<Analista[]> {
  return listarAnalistas({ funcao });
}

/**
 * Busca um analista por email
 */
export async function buscarAnalistaPorEmail(email: string): Promise<Analista | null> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docItem = snapshot.docs[0];
    return mapFirestoreToAnalista(docItem.id, docItem.data());
  } catch (error) {
    console.error('Erro ao buscar analista por email:', error);
    throw error;
  }
}

/**
 * Lista analistas por squad
 */
export async function listarAnalistasPorSquad(squad: string): Promise<Analista[]> {
  return listarAnalistas({ squad });
}