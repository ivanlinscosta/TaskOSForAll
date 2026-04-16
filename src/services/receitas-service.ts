/**
 * Serviço de Receitas (Entradas) - Firebase Integration
 */
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';

import { db } from '../lib/firebase-config';
import { requireUid, currentUidOrNull } from '../lib/require-auth';
import { notificarSilencioso } from './notifications-service';

export type CategoriaReceita =
  | 'salario'
  | 'freelance'
  | 'investimento'
  | 'bonus'
  | 'aluguel'
  | 'outros';

export interface Receita {
  id?: string;
  descricao: string;
  valor: number;
  categoria: CategoriaReceita;
  data: Date;
  recorrente: boolean;
  notas?: string;
  criadoEm?: Date;
}

const COLLECTION_NAME = 'receitas';

function docToReceita(id: string, data: any): Receita {
  return {
    id,
    descricao: data.descricao || '',
    valor: data.valor || 0,
    categoria: data.categoria || 'outros',
    data: data.data?.toDate?.() || new Date(),
    recorrente: data.recorrente ?? false,
    notas: data.notas || '',
    criadoEm: data.criadoEm?.toDate?.() || new Date(),
  };
}

export async function criarReceita(receita: Omit<Receita, 'id' | 'criadoEm'>): Promise<string> {
  const uid = requireUid();
  const ref = await addDoc(collection(db, COLLECTION_NAME), {
    ...receita,
    ownerId: uid,
    data: Timestamp.fromDate(new Date(receita.data)),
    criadoEm: Timestamp.now(),
  });
  notificarSilencioso({
    titulo: 'Nova receita registrada',
    mensagem: `${receita.descricao} — R$ ${receita.valor.toFixed(2)}`,
    tipo: 'receita',
    lida: false,
    contexto: 'pessoal',
    userId: uid,
  });
  return ref.id;
}

export async function atualizarReceita(id: string, receita: Partial<Receita>): Promise<void> {
  const data: any = { ...receita };
  if (receita.data) data.data = Timestamp.fromDate(new Date(receita.data));
  await updateDoc(doc(db, COLLECTION_NAME, id), data);
}

export async function deletarReceita(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}

export async function listarReceitas(): Promise<Receita[]> {
  const uid = currentUidOrNull();
  if (!uid) return [];
  const q = query(collection(db, COLLECTION_NAME), where('ownerId', '==', uid));
  const snap = await getDocs(q);
  const lista = snap.docs.map((d) => docToReceita(d.id, d.data()));
  lista.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  return lista;
}

export const CATEGORIAS_RECEITA_LABELS: Record<CategoriaReceita, string> = {
  salario:      'Salário',
  freelance:    'Freelance',
  investimento: 'Investimento',
  bonus:        'Bônus',
  aluguel:      'Aluguel',
  outros:       'Outros',
};

export const CATEGORIAS_RECEITA_CORES: Record<CategoriaReceita, string> = {
  salario:      '#10B981',
  freelance:    '#6366F1',
  investimento: '#F59E0B',
  bonus:        '#EC4899',
  aluguel:      '#14B8A6',
  outros:       '#6B7280',
};
