/**
 * Serviço de Viagens - Firebase Integration
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
import { db, COLLECTIONS } from '../lib/firebase-config';
import { requireUid, currentUidOrNull } from '../lib/require-auth';
import { notificarSilencioso } from './notifications-service';

export interface Atividade {
  id: string;
  nome: string;
  data?: string;    // YYYY-MM-DD
  horario?: string; // HH:mm
}

export type CategoriaOrcamento = 'passagem' | 'hospedagem' | 'passeios' | 'alimentacao' | 'transporte';

export interface ItemOrcamento {
  categoria: CategoriaOrcamento;
  valor: number;
  formaPagamento: 'a_vista' | 'a_prazo';
  parcelas?: number;            // só quando a_prazo
  dataPrimeiraParcela?: string; // YYYY-MM-DD
}

export interface Viagem {
  id?: string;
  destino: string;
  descricao?: string;
  dataIda: Date;
  dataVolta?: Date;
  orcamento: number;            // soma calculada do orcamentoDetalhado
  gastoReal?: number;
  status: 'planejada' | 'em_andamento' | 'concluida' | 'cancelada';
  atividades?: Atividade[];
  orcamentoDetalhado?: ItemOrcamento[];
  notas?: string;
  foto?: string;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

export const CATEGORIAS_ORCAMENTO_LABELS: Record<CategoriaOrcamento, string> = {
  passagem:    'Passagem',
  hospedagem:  'Hospedagem',
  passeios:    'Passeios',
  alimentacao: 'Alimentação',
  transporte:  'Transporte',
};

export const CATEGORIAS_ORCAMENTO_CORES: Record<CategoriaOrcamento, string> = {
  passagem:    '#6366F1',
  hospedagem:  '#F59E0B',
  passeios:    '#10B981',
  alimentacao: '#EF4444',
  transporte:  '#3B82F6',
};

/** Calcula a data da última parcela a partir da primeira + quantidade */
export function calcularDataUltimaParcela(dataPrimeira: string, parcelas: number): string {
  if (!dataPrimeira || parcelas <= 1) return dataPrimeira || '';
  const d = new Date(dataPrimeira);
  d.setMonth(d.getMonth() + parcelas - 1);
  return d.toISOString().split('T')[0];
}

/** Soma os valores de orcamentoDetalhado */
export function calcularTotalOrcamento(itens: ItemOrcamento[]): number {
  return itens.reduce((s, i) => s + (i.valor || 0), 0);
}

function docToViagem(id: string, data: any): Viagem {
  return {
    id,
    destino: data.destino || '',
    descricao: data.descricao || '',
    dataIda: data.dataIda?.toDate?.() || new Date(),
    dataVolta: data.dataVolta?.toDate?.() || undefined,
    orcamento: data.orcamento || 0,
    gastoReal: data.gastoReal || 0,
    status: data.status || 'planejada',
    atividades: data.atividades || [],
    orcamentoDetalhado: data.orcamentoDetalhado || [],
    notas: data.notas || '',
    foto: data.foto || '',
    criadoEm: data.criadoEm?.toDate?.() || new Date(),
    atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
  };
}

export async function criarViagem(viagem: Omit<Viagem, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<string> {
  const uid = requireUid();
  const data: any = {
    ...viagem,
    ownerId: uid,
    dataIda: Timestamp.fromDate(new Date(viagem.dataIda)),
    dataVolta: viagem.dataVolta ? Timestamp.fromDate(new Date(viagem.dataVolta)) : null,
    criadoEm: Timestamp.now(),
    atualizadoEm: Timestamp.now(),
  };
  const ref = await addDoc(collection(db, COLLECTIONS.VIAGENS), data);
  notificarSilencioso({
    titulo: 'Nova viagem planejada',
    mensagem: `${viagem.destino} — ${viagem.status === 'planejada' ? 'planejada' : viagem.status}`,
    tipo: 'viagem',
    lida: false,
    contexto: 'pessoal',
    userId: uid,
  });
  return ref.id;
}

export async function atualizarViagem(id: string, viagem: Partial<Viagem>): Promise<void> {
  const data: any = { ...viagem, atualizadoEm: Timestamp.now() };
  if (viagem.dataIda) data.dataIda = Timestamp.fromDate(new Date(viagem.dataIda));
  if (viagem.dataVolta) data.dataVolta = Timestamp.fromDate(new Date(viagem.dataVolta));
  await updateDoc(doc(db, COLLECTIONS.VIAGENS, id), data);
}

export async function deletarViagem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.VIAGENS, id));
}

export async function buscarViagemPorId(id: string): Promise<Viagem | null> {
  const uid = currentUidOrNull();
  const snap = await getDoc(doc(db, COLLECTIONS.VIAGENS, id));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (uid && data.ownerId && data.ownerId !== uid) return null;
  return docToViagem(snap.id, data);
}

export async function listarViagens(): Promise<Viagem[]> {
  const uid = currentUidOrNull();
  if (!uid) return [];
  const q = query(collection(db, COLLECTIONS.VIAGENS), where('ownerId', '==', uid));
  const snap = await getDocs(q);
  const viagens = snap.docs.map((d) => docToViagem(d.id, d.data()));
  viagens.sort((a, b) => new Date(b.dataIda).getTime() - new Date(a.dataIda).getTime());
  return viagens;
}
