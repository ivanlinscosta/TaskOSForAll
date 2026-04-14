/**
 * Serviço de Custos/Finanças Pessoais - Firebase Integration
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

export type CategoriaCusto =
  | 'alimentacao'
  | 'transporte'
  | 'lazer'
  | 'saude'
  | 'moradia'
  | 'educacao'
  | 'vestuario'
  | 'outros';

export type TipoCusto = 'fixa' | 'assinatura' | 'variavel';

export interface Custo {
  id?: string;
  descricao: string;
  valor: number;
  categoria: CategoriaCusto;
  tipo: TipoCusto;
  data: Date;
  viagemId?: string;
  comprovante?: string;
  notas?: string;
  criadoEm?: Date;
}

function docToCusto(id: string, data: any): Custo {
  return {
    id,
    descricao: data.descricao || '',
    valor: data.valor || 0,
    categoria: data.categoria || 'outros',
    tipo: data.tipo || 'variavel',
    data: data.data?.toDate?.() || new Date(),
    viagemId: data.viagemId || '',
    comprovante: data.comprovante || '',
    notas: data.notas || '',
    criadoEm: data.criadoEm?.toDate?.() || new Date(),
  };
}

export async function criarCusto(custo: Omit<Custo, 'id' | 'criadoEm'>): Promise<string> {
  const data: any = {
    ...custo,
    data: Timestamp.fromDate(new Date(custo.data)),
    criadoEm: Timestamp.now(),
  };
  const ref = await addDoc(collection(db, COLLECTIONS.CUSTOS), data);
  return ref.id;
}

export async function atualizarCusto(id: string, custo: Partial<Custo>): Promise<void> {
  const data: any = { ...custo };
  if (custo.data) data.data = Timestamp.fromDate(new Date(custo.data));
  await updateDoc(doc(db, COLLECTIONS.CUSTOS, id), data);
}

export async function deletarCusto(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.CUSTOS, id));
}

export async function buscarCustoPorId(id: string): Promise<Custo | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.CUSTOS, id));
  if (!snap.exists()) return null;
  return docToCusto(snap.id, snap.data());
}

export async function listarCustos(): Promise<Custo[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.CUSTOS));
  const custos = snap.docs.map((d) => docToCusto(d.id, d.data()));
  custos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  return custos;
}

export async function listarCustosPorViagem(viagemId: string): Promise<Custo[]> {
  const todos = await listarCustos();
  return todos.filter((c) => c.viagemId === viagemId);
}

export const TIPOS_CUSTO_LABELS: Record<TipoCusto, string> = {
  fixa: 'Fixo',
  assinatura: 'Assinatura',
  variavel: 'Variável',
};

export const CATEGORIAS_LABELS: Record<CategoriaCusto, string> = {
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  lazer: 'Lazer',
  saude: 'Saúde',
  moradia: 'Moradia',
  educacao: 'Educação',
  vestuario: 'Vestuário',
  outros: 'Outros',
};

export const CATEGORIAS_CORES: Record<CategoriaCusto, string> = {
  alimentacao: '#F59E0B',
  transporte: '#3B82F6',
  lazer: '#8B5CF6',
  saude: '#EF4444',
  moradia: '#10B981',
  educacao: '#06B6D4',
  vestuario: '#EC4899',
  outros: '#6B7280',
};
