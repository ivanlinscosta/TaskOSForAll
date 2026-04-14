import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase-config';

const COLLECTION_NAME = 'alunos';

export interface AvaliacaoAluno {
  disciplina: string;
  tipo: 'Prova' | 'Trabalho' | 'Projeto' | 'Checkpoint' | 'Global Solution' | 'Challenge';
  nota: number;
  peso: number;
  data: string;
  comentario?: string;
  desempenho?: {
    participacao?: string;
    engajamento?: string;
    entrega?: string;
    frequencia?: string;
  };
  createdAt?: any;
}

export interface Aluno {
  id?: string;
  nome: string;
  email: string;
  telefone?: string;
  turma?: string;
  periodo?: string;
  curso: string;
  ra?: string;
  dataNascimento?: Date;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  foto?: string;
  avaliacoes?: AvaliacaoAluno[];
  createdAt?: Date;
  updatedAt?: Date;
}

function mapFirestoreToAluno(id: string, data: any): Aluno {
  return {
    id,
    ...data,
    foto: data.foto || '',
    dataNascimento: data.dataNascimento?.toDate?.() || undefined,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
    avaliacoes: (data.avaliacoes || []).map((av: any) => ({
      ...av,
      createdAt: av.createdAt?.toDate?.() || undefined,
    })),
  };
}

export async function criarAluno(
  aluno: Omit<Aluno, 'id' | 'createdAt' | 'updatedAt'>
) {
  const alunoData: any = {
    ...aluno,
    foto: aluno.foto || '',
    avaliacoes: aluno.avaliacoes || [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  if (aluno.dataNascimento) {
    alunoData.dataNascimento = Timestamp.fromDate(new Date(aluno.dataNascimento));
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), alunoData);
  return docRef.id;
}

export async function atualizarAluno(id: string, aluno: Partial<Aluno>) {
  const updateData: any = {
    ...aluno,
    updatedAt: Timestamp.now(),
  };

  if (aluno.dataNascimento) {
    updateData.dataNascimento = Timestamp.fromDate(new Date(aluno.dataNascimento));
  }

  await updateDoc(doc(db, COLLECTION_NAME, id), updateData);
}

export async function deletarAluno(id: string) {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}

export async function buscarAlunoPorId(id: string): Promise<Aluno | null> {
  const snap = await getDoc(doc(db, COLLECTION_NAME, id));
  if (!snap.exists()) return null;
  return mapFirestoreToAluno(snap.id, snap.data());
}

export async function listarAlunos(): Promise<Aluno[]> {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  const alunos = snapshot.docs.map((d) => mapFirestoreToAluno(d.id, d.data()));
  alunos.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  return alunos;
}

export async function adicionarAvaliacaoAluno(
  alunoId: string,
  avaliacao: Omit<AvaliacaoAluno, 'createdAt'>
) {
  const ref = doc(db, COLLECTION_NAME, alunoId);

  await updateDoc(ref, {
    avaliacoes: arrayUnion({
      ...avaliacao,
      createdAt: Timestamp.now(),
    }),
    updatedAt: Timestamp.now(),
  });
}