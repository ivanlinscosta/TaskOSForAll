import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase-config';
import {
  awardXP,
  incrementChallengeProgress,
  XP_ACTIONS,
  type AwardResult,
} from './gamification-service';

// ── Types ─────────────────────────────────────────────────────────────────────
export type DevelopmentItemType = 'livro' | 'curso' | 'video' | 'vaga';
export type DevelopmentItemStatus = 'nao_iniciado' | 'em_andamento' | 'concluido' | 'pausado';
export type JobApplicationStatus = 'salva' | 'candidatura_enviada' | 'em_acompanhamento' | 'encerrada';

/**
 * Categoria de desenvolvimento (separa trilha profissional das trilhas pessoais).
 *  - profissional → carreira, hard skills
 *  - financas     → educação financeira, investimentos
 *  - pessoal      → soft skills, produtividade, bem-estar, hábitos
 */
export type DevelopmentCategory = 'profissional' | 'financas' | 'pessoal';

export interface DevelopmentItem {
  id?: string;
  ownerId: string;
  type: DevelopmentItemType;
  categoria?: DevelopmentCategory; // default 'profissional' quando ausente (compat)
  titulo: string;
  subtitulo?: string;
  autor?: string;
  plataforma?: string;
  thumbnail?: string;
  link?: string;
  descricao?: string;
  motivo?: string;
  status: DevelopmentItemStatus;
  progress: number;
  progressNote?: string;
  xpEarned: number;
  workspaceType: 'work' | 'life';
  source: 'ai_recommendation' | 'manual' | 'onboarding';
  empresa?: string;
  localidade?: string;
  regime?: string;
  candidaturaStatus?: JobApplicationStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  completedAt: Timestamp | null;
}

// ── Collection ────────────────────────────────────────────────────────────────
const itemsCol = () => collection(db, 'development_items');

// ── Add item ──────────────────────────────────────────────────────────────────
// Saves the item immediately, then fires gamification updates in the background.
// This prevents QUIC timeout from chained sequential Firestore operations.
export async function addDevelopmentItem(
  uid: string,
  item: Omit<DevelopmentItem, 'id' | 'xpEarned' | 'createdAt' | 'updatedAt' | 'completedAt'>,
): Promise<{ itemId: string; award: AwardResult | null }> {
  // ── Step 1: save item (primary, blocking) ────────────────────────────────
  const ref = await addDoc(itemsCol(), {
    ...item,
    ownerId: uid,
    xpEarned: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null,
  });

  // ── Step 2: gamification (secondary, non-blocking) ───────────────────────
  // We fire-and-forget so the UI responds immediately.
  // Errors here are non-critical — the item is already saved.
  let award: AwardResult | null = null;

  try {
    const counters: Record<string, number> = { itemsAdded: 1 };
    if (item.type === 'livro') counters.booksAdded = 1;
    if (item.type === 'curso') counters.coursesStarted = 1;
    if (item.type === 'vaga')  counters.jobsSaved = 1;

    award = await awardXP(
      uid,
      item.type === 'vaga' ? 'SAVE_JOB' : 'ADD_DEVELOPMENT_ITEM',
      counters,
    );

    // Update xpEarned on the item (non-blocking, best-effort)
    updateDoc(doc(db, 'development_items', ref.id), { xpEarned: award.xpGained })
      .catch(console.warn);

    // Challenge progress (non-blocking, best-effort)
    incrementChallengeProgress(uid, 'add_item').catch(console.warn);
    if (item.type === 'livro') incrementChallengeProgress(uid, 'add_book').catch(console.warn);
  } catch (err) {
    console.warn('Gamification update failed (non-critical):', err);
  }

  return { itemId: ref.id, award };
}

// ── Batch add (onboarding) ────────────────────────────────────────────────────
// Saves multiple items from onboarding without blocking on gamification.
export async function batchAddDevelopmentItems(
  uid: string,
  items: Omit<DevelopmentItem, 'id' | 'xpEarned' | 'createdAt' | 'updatedAt' | 'completedAt'>[],
): Promise<string[]> {
  const ids: string[] = [];

  for (const item of items) {
    try {
      const ref = await addDoc(itemsCol(), {
        ...item,
        ownerId: uid,
        xpEarned: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedAt: null,
      });
      ids.push(ref.id);
    } catch (err) {
      console.error('Failed to save item:', item.titulo, err);
    }
  }

  // Award gamification for all items at once in background
  if (ids.length > 0) {
    const bookCount = items.filter((i) => i.type === 'livro').length;
    const courseCount = items.filter((i) => i.type === 'curso').length;
    const counters: Record<string, number> = { itemsAdded: ids.length };
    if (bookCount > 0) counters.booksAdded = bookCount;
    if (courseCount > 0) counters.coursesStarted = courseCount;

    awardXP(uid, 'ADD_DEVELOPMENT_ITEM', counters).catch(console.warn);
  }

  return ids;
}

// ── Get items ─────────────────────────────────────────────────────────────────
export async function getDevelopmentItems(uid: string): Promise<DevelopmentItem[]> {
  // NOTA: não usamos orderBy() aqui para não exigir índice composto
  // (ownerId + createdAt). Ordenamos client-side.
  const q = query(itemsCol(), where('ownerId', '==', uid));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DevelopmentItem));
  items.sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? 0;
    const bt = b.createdAt?.toMillis?.() ?? 0;
    return bt - at;
  });
  return items;
}

// ── Update progress ───────────────────────────────────────────────────────────
export async function updateItemProgress(
  uid: string,
  item: DevelopmentItem,
  newProgress: number,
  newStatus: DevelopmentItemStatus,
  progressNote?: string,
): Promise<AwardResult | null> {
  if (!item.id) return null;

  const isCompleting = newStatus === 'concluido' && item.status !== 'concluido';
  const itemRef = doc(db, 'development_items', item.id);

  // Save progress (blocking)
  await updateDoc(itemRef, {
    progress: newProgress,
    status: newStatus,
    progressNote: progressNote ?? item.progressNote ?? '',
    completedAt: isCompleting ? serverTimestamp() : (item.completedAt ?? null),
    updatedAt: serverTimestamp(),
  });

  // Gamification (non-blocking on completion, best-effort)
  try {
    if (isCompleting) {
      const counters: Record<string, number> = { itemsCompleted: 1 };
      let action: keyof typeof XP_ACTIONS = 'UPDATE_PROGRESS';

      if (item.type === 'video') {
        action = 'COMPLETE_VIDEO';
        counters.videosWatched = 1;
        incrementChallengeProgress(uid, 'complete_video').catch(console.warn);
      } else if (item.type === 'livro') {
        action = 'COMPLETE_BOOK';
        counters.booksCompleted = 1;
      } else if (item.type === 'curso') {
        action = 'COMPLETE_COURSE';
        counters.coursesCompleted = 1;
        incrementChallengeProgress(uid, 'complete_course').catch(console.warn);
      }

      return awardXP(uid, action, counters);
    }

    return awardXP(uid, 'UPDATE_PROGRESS');
  } catch (err) {
    console.warn('XP award failed (non-critical):', err);
    return null;
  }
}

export async function updateJobStatus(itemId: string, candidaturaStatus: JobApplicationStatus): Promise<void> {
  await updateDoc(doc(db, 'development_items', itemId), {
    candidaturaStatus,
    updatedAt: serverTimestamp(),
  });
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export interface DevelopmentStats {
  total: number;
  active: number;
  completed: number;
  byType: Record<DevelopmentItemType, number>;
  completedByType: Record<DevelopmentItemType, number>;
  byCategory: Record<DevelopmentCategory, number>;
  completedByCategory: Record<DevelopmentCategory, number>;
}

export function computeStats(items: DevelopmentItem[]): DevelopmentStats {
  const stats: DevelopmentStats = {
    total: items.length,
    active: 0,
    completed: 0,
    byType: { livro: 0, curso: 0, video: 0, vaga: 0 },
    completedByType: { livro: 0, curso: 0, video: 0, vaga: 0 },
    byCategory: { profissional: 0, financas: 0, pessoal: 0 },
    completedByCategory: { profissional: 0, financas: 0, pessoal: 0 },
  };
  for (const item of items) {
    const cat: DevelopmentCategory = item.categoria ?? 'profissional';
    stats.byType[item.type]++;
    stats.byCategory[cat]++;
    if (item.status === 'concluido') {
      stats.completed++;
      stats.completedByType[item.type]++;
      stats.completedByCategory[cat]++;
    } else if (item.status === 'em_andamento') stats.active++;
  }
  return stats;
}

/** Filtra itens por categoria (tratando ausência como profissional). */
export function filterByCategory(
  items: DevelopmentItem[],
  category: DevelopmentCategory,
): DevelopmentItem[] {
  return items.filter((i) => (i.categoria ?? 'profissional') === category);
}

// ── Next best action ──────────────────────────────────────────────────────────
export function getNextBestAction(items: DevelopmentItem[]): string {
  if (items.length === 0)
    return 'Analise seu perfil de carreira e adicione seu primeiro conteúdo ao plano de desenvolvimento.';

  const videos = items.filter((i) => i.type === 'video' && i.status === 'nao_iniciado');
  const coursesInProgress = items.filter((i) => i.type === 'curso' && i.status === 'em_andamento');
  const notStarted = items.filter((i) => i.status === 'nao_iniciado');
  const inProgress = items.filter((i) => i.status === 'em_andamento');

  if (videos.length > 0)
    return `Assista ao vídeo "${videos[0].titulo}" — leva poucos minutos e vale ${XP_ACTIONS.COMPLETE_VIDEO} XP.`;
  if (coursesInProgress.length > 0)
    return `Continue o curso "${coursesInProgress[0].titulo}" — você está ${coursesInProgress[0].progress}% concluído.`;
  if (notStarted.length > 0)
    return `Inicie "${notStarted[0].titulo}" e registre seu progresso para ganhar XP.`;
  if (inProgress.length > 0)
    return `Atualize o progresso de "${inProgress[0].titulo}" para manter seu streak ativo.`;

  return 'Parabéns! Você está em dia. Explore novas recomendações para continuar evoluindo.';
}
