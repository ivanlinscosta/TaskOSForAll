/**
 * Investment Portfolio Service
 * Manages user_investments, investment_daily_snapshots, and investment_ai_insights
 * collections in Firestore.
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
  setDoc,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../lib/firebase-config';
import { currentUidOrNull } from '../lib/require-auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvestmentType =
  | 'CDB' | 'LCI' | 'LCA' | 'Tesouro'
  | 'Fundo' | 'Acao' | 'FII' | 'ETF'
  | 'Cripto' | 'Outro';

export type BenchmarkType = 'CDI' | 'Selic' | 'IPCA' | 'Prefixado' | 'Personalizado';

export type LiquidityType = 'diaria' | 'D+1' | 'D+30' | 'D+60' | 'D+90' | 'no_vencimento' | 'nenhuma';

export interface UserInvestment {
  id?: string;
  ownerId: string;
  name: string;
  type: InvestmentType;
  institution: string;
  investedAmount: number;
  currentAmount?: number;
  benchmarkType: BenchmarkType;
  benchmarkPercent: number;  // e.g., 100 for 100% CDI, 0 if not applicable
  fixedRateAnnual?: number;  // for Prefixado or IPCA+ spread
  startDate: string;         // ISO date string
  maturityDate?: string;
  liquidity: LiquidityType;
  ticker?: string;
  currency: 'BRL' | 'USD';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvestmentDailySnapshot {
  id?: string;
  investmentId: string;
  ownerId: string;
  date: string;
  benchmarkRateDaily: number;   // daily % rate
  benchmarkRateAnnual: number;  // annual % rate
  grossValueEstimate: number;
  dailyEarnings: number;
  accumulatedEarnings: number;
  projected30d: number;
  projected90d: number;
  projected180d: number;
  projected365d: number;
  source: string;
  createdAt: Date;
}

export interface InvestmentAIInsight {
  id?: string;
  ownerId: string;
  date: string;
  cenario: string;
  insights: Array<{
    titulo: string;
    descricao: string;
    tipo: 'alerta' | 'dica' | 'oportunidade' | 'observacao';
    icone: string;
  }>;
  basedOn: string;
  createdAt: Date;
}

// ─── Converters ───────────────────────────────────────────────────────────────

function docToInvestment(id: string, data: any): UserInvestment {
  return {
    id,
    ownerId: data.ownerId,
    name: data.name,
    type: data.type,
    institution: data.institution ?? '',
    investedAmount: data.investedAmount ?? 0,
    currentAmount: data.currentAmount,
    benchmarkType: data.benchmarkType ?? 'CDI',
    benchmarkPercent: data.benchmarkPercent ?? 100,
    fixedRateAnnual: data.fixedRateAnnual,
    startDate: data.startDate,
    maturityDate: data.maturityDate,
    liquidity: data.liquidity ?? 'no_vencimento',
    ticker: data.ticker,
    currency: data.currency ?? 'BRL',
    notes: data.notes,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createInvestment(
  investment: Omit<UserInvestment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, COLLECTIONS.USER_INVESTMENTS), {
    ...investment,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateInvestment(
  id: string,
  changes: Partial<Omit<UserInvestment, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.USER_INVESTMENTS, id), {
    ...changes,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteInvestment(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.USER_INVESTMENTS, id));
}

export async function listUserInvestments(): Promise<UserInvestment[]> {
  const uid = currentUidOrNull();
  if (!uid) return [];
  // Sem orderBy para evitar exigência de índice composto no Firestore.
  // Ordenação feita no cliente.
  const q = query(
    collection(db, COLLECTIONS.USER_INVESTMENTS),
    where('ownerId', '==', uid)
  );
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => docToInvestment(d.id, d.data()));
  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return items;
}

// ─── Daily snapshots ──────────────────────────────────────────────────────────

export async function saveInvestmentDailySnapshot(
  snapshot: Omit<InvestmentDailySnapshot, 'id' | 'createdAt'>
): Promise<void> {
  const docId = `${snapshot.investmentId}_${snapshot.date}`;
  await setDoc(
    doc(db, COLLECTIONS.INVESTMENT_DAILY_SNAPSHOTS, docId),
    { ...snapshot, createdAt: Timestamp.now() },
    { merge: true }
  );
}

export async function getLatestDailySnapshots(
  investmentIds: string[]
): Promise<Record<string, InvestmentDailySnapshot>> {
  const uid = currentUidOrNull();
  if (!uid || investmentIds.length === 0) return {};

  const today = new Date().toISOString().split('T')[0];
  const result: Record<string, InvestmentDailySnapshot> = {};

  await Promise.all(
    investmentIds.map(async (id) => {
      const q = query(
        collection(db, COLLECTIONS.INVESTMENT_DAILY_SNAPSHOTS),
        where('investmentId', '==', id),
        where('ownerId', '==', uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        // Sort client-side — avoids composite index requirement
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as InvestmentDailySnapshot) }))
          .sort((a, b) => (b.date > a.date ? 1 : -1));
        result[id] = docs[0];
      }
    })
  );

  return result;
}

// ─── AI Insights ──────────────────────────────────────────────────────────────

export async function saveAIInsights(
  insight: Omit<InvestmentAIInsight, 'id' | 'createdAt'>
): Promise<void> {
  const uid = currentUidOrNull();
  if (!uid) return;
  const docId = `${uid}_${insight.date}`;
  await setDoc(
    doc(db, COLLECTIONS.INVESTMENT_AI_INSIGHTS, docId),
    { ...insight, createdAt: Timestamp.now() },
    { merge: true }
  );
}

export async function getLatestAIInsights(): Promise<InvestmentAIInsight | null> {
  const uid = currentUidOrNull();
  if (!uid) return null;
  const q = query(
    collection(db, COLLECTIONS.INVESTMENT_AI_INSIGHTS),
    where('ownerId', '==', uid)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  // Sort client-side — avoids composite index requirement
  const sorted = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as InvestmentAIInsight) }))
    .sort((a, b) => {
      const ta = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.toMillis?.() ?? 0;
      const tb = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.toMillis?.() ?? 0;
      return tb - ta;
    });
  return sorted[0];
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  CDB: 'CDB',
  LCI: 'LCI',
  LCA: 'LCA',
  Tesouro: 'Tesouro Direto',
  Fundo: 'Fundo de Investimento',
  Acao: 'Ação',
  FII: 'FII',
  ETF: 'ETF',
  Cripto: 'Criptomoeda',
  Outro: 'Outro',
};

export const BENCHMARK_LABELS: Record<BenchmarkType, string> = {
  CDI: 'CDI',
  Selic: 'Selic',
  IPCA: 'IPCA+',
  Prefixado: 'Prefixado',
  Personalizado: 'Personalizado',
};

export const LIQUIDITY_LABELS: Record<LiquidityType, string> = {
  diaria: 'Liquidez diária',
  'D+1': 'D+1',
  'D+30': 'D+30',
  'D+60': 'D+60',
  'D+90': 'D+90',
  no_vencimento: 'No vencimento',
  nenhuma: 'Sem liquidez',
};

export const FIXED_INCOME_TYPES = new Set<InvestmentType>(['CDB', 'LCI', 'LCA', 'Tesouro', 'Fundo']);
export const VARIABLE_TYPES = new Set<InvestmentType>(['Acao', 'FII', 'ETF', 'Cripto']);
