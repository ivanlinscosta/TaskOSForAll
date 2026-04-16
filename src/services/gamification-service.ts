import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  writeBatch,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase-config';

// ── XP Actions ─────────────────────────────────────────────────────────────────
export const XP_ACTIONS = {
  ADD_DEVELOPMENT_ITEM: 20,
  START_COURSE: 30,
  COMPLETE_VIDEO: 50,
  COMPLETE_BOOK: 100,
  COMPLETE_COURSE: 150,
  UPDATE_PROGRESS: 10,
  COMPLETE_CHALLENGE: 75,
  COMPLETE_GOAL: 200,
  STREAK_7_DAYS_BONUS: 100,
  STREAK_30_DAYS_BONUS: 500,
  ANALYZE_CAREER: 30,
  SAVE_JOB: 15,
  REGISTER_LEARNING: 25,
} as const;

// ── Level System ───────────────────────────────────────────────────────────────
export interface LevelInfo {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  color: string;
  emoji: string;
}

export const LEVELS: LevelInfo[] = [
  { level: 1,  title: 'Iniciante',    minXP: 0,    maxXP: 100,    color: '#94A3B8', emoji: '🌱' },
  { level: 2,  title: 'Aprendiz',     minXP: 100,  maxXP: 300,    color: '#60A5FA', emoji: '📚' },
  { level: 3,  title: 'Praticante',   minXP: 300,  maxXP: 600,    color: '#34D399', emoji: '⚡' },
  { level: 4,  title: 'Desenvolvido', minXP: 600,  maxXP: 1000,   color: '#A78BFA', emoji: '🚀' },
  { level: 5,  title: 'Avançado',     minXP: 1000, maxXP: 1500,   color: '#F59E0B', emoji: '🔥' },
  { level: 6,  title: 'Expert',       minXP: 1500, maxXP: 2200,   color: '#F97316', emoji: '💎' },
  { level: 7,  title: 'Mestre',       minXP: 2200, maxXP: 3000,   color: '#EF4444', emoji: '👑' },
  { level: 8,  title: 'Elite',        minXP: 3000, maxXP: 4000,   color: '#EC4899', emoji: '🏆' },
  { level: 9,  title: 'Sênior',       minXP: 4000, maxXP: 5500,   color: '#8B5CF6', emoji: '⭐' },
  { level: 10, title: 'Lenda',        minXP: 5500, maxXP: 999999, color: '#F59E0B', emoji: '🌟' },
];

export function getLevelInfo(xp: number): LevelInfo & { progress: number; xpToNextLevel: number } {
  const level =
    LEVELS.slice().reverse().find((l) => xp >= l.minXP) ?? LEVELS[0];
  const progress =
    level.level === 10
      ? 100
      : Math.min(100, Math.round(((xp - level.minXP) / (level.maxXP - level.minXP)) * 100));
  const xpToNextLevel = level.level === 10 ? 0 : Math.max(0, level.maxXP - xp);
  return { ...level, progress, xpToNextLevel };
}

// ── Badge Definitions ─────────────────────────────────────────────────────────
export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
}

export const BADGES: BadgeDefinition[] = [
  { id: 'first_step',  title: 'Primeiro Passo',  description: 'Adicionou o primeiro item ao desenvolvimento', emoji: '👣', color: '#60A5FA' },
  { id: 'reader',      title: 'Leitor',           description: 'Adicionou o primeiro livro',                   emoji: '📖', color: '#8B5CF6' },
  { id: 'student',     title: 'Estudante',         description: 'Iniciou o primeiro curso',                     emoji: '🎓', color: '#0EA5E9' },
  { id: 'curious',     title: 'Curioso',           description: 'Assistiu o primeiro vídeo',                    emoji: '🎬', color: '#EF4444' },
  { id: 'streak_7',    title: 'Dedicado',          description: '7 dias consecutivos de aprendizado',           emoji: '🔥', color: '#F97316' },
  { id: 'streak_30',   title: 'Consistente',       description: '30 dias consecutivos de aprendizado',          emoji: '💪', color: '#EF4444' },
  { id: 'graduate',    title: 'Graduado',          description: 'Concluiu o primeiro curso',                    emoji: '🏅', color: '#F59E0B' },
  { id: 'specialist',  title: 'Especialista',      description: 'Concluiu 5 itens do plano de desenvolvimento', emoji: '⭐', color: '#8B5CF6' },
  { id: 'master',      title: 'Mestre',            description: 'Concluiu 10 itens do plano',                   emoji: '👑', color: '#F59E0B' },
  { id: 'trailblazer', title: 'Trilheiro',         description: 'Concluiu a primeira meta de carreira',         emoji: '🚀', color: '#10B981' },
  { id: 'networker',   title: 'Networker',         description: 'Salvou a primeira vaga de emprego',            emoji: '🤝', color: '#06B6D4' },
];

// ── Types ─────────────────────────────────────────────────────────────────────
export interface GamificationProfile {
  ownerId: string;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  itemsAdded: number;
  itemsCompleted: number;
  booksAdded: number;
  booksCompleted: number;
  coursesStarted: number;
  coursesCompleted: number;
  videosWatched: number;
  jobsSaved: number;
  goalsCompleted: number;
  challengesCompleted: number;
  earnedBadges: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface UserChallenge {
  id?: string;
  ownerId: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  moduleType: 'career' | 'finance';
  xpReward: number;
  status: 'active' | 'completed' | 'expired';
  progress: number;
  target: number;
  actionType: string;
  createdAt: Timestamp | null;
  expiresAt: Timestamp | null;
  completedAt: Timestamp | null;
}

export interface AwardResult {
  xpGained: number;
  newBadges: BadgeDefinition[];
  levelUp: boolean;
  newLevelInfo?: LevelInfo;
  newStreak: number;
}

// ── Firestore helpers ─────────────────────────────────────────────────────────
const profileRef = (uid: string) => doc(db, 'gamification_profiles', uid);
const challengesCol = () => collection(db, 'user_challenges');

// ── Profile ───────────────────────────────────────────────────────────────────
export async function getOrCreateProfile(uid: string): Promise<GamificationProfile> {
  const ref = profileRef(uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as GamificationProfile;

  const empty: GamificationProfile = {
    ownerId: uid,
    xp: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: '',
    itemsAdded: 0,
    itemsCompleted: 0,
    booksAdded: 0,
    booksCompleted: 0,
    coursesStarted: 0,
    coursesCompleted: 0,
    videosWatched: 0,
    jobsSaved: 0,
    goalsCompleted: 0,
    challengesCompleted: 0,
    earnedBadges: [],
    createdAt: null,
    updatedAt: null,
  };
  await setDoc(ref, { ...empty, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return empty;
}

// ── Streak helpers ────────────────────────────────────────────────────────────
function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(a: string, b: string): number {
  if (!a) return 999;
  return Math.round(Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

// ── Badge conditions ──────────────────────────────────────────────────────────
const BADGE_CONDITIONS: Record<string, (p: GamificationProfile) => boolean> = {
  first_step:  (p) => p.itemsAdded >= 1,
  reader:      (p) => p.booksAdded >= 1,
  student:     (p) => p.coursesStarted >= 1,
  curious:     (p) => p.videosWatched >= 1,
  streak_7:    (p) => p.longestStreak >= 7,
  streak_30:   (p) => p.longestStreak >= 30,
  graduate:    (p) => p.coursesCompleted >= 1,
  specialist:  (p) => p.itemsCompleted >= 5,
  master:      (p) => p.itemsCompleted >= 10,
  trailblazer: (p) => p.goalsCompleted >= 1,
  networker:   (p) => p.jobsSaved >= 1,
};

// ── Award XP ──────────────────────────────────────────────────────────────────
export async function awardXP(
  uid: string,
  action: keyof typeof XP_ACTIONS,
  countersToIncrement?: Partial<Record<keyof GamificationProfile, number>>,
): Promise<AwardResult> {
  const xpGained = XP_ACTIONS[action];
  const profile = await getOrCreateProfile(uid);
  const oldLevel = getLevelInfo(profile.xp);

  // Streak calculation
  const today = todayStr();
  let newStreak = profile.currentStreak;
  if (profile.lastActivityDate !== today) {
    const diff = daysBetween(profile.lastActivityDate, today);
    newStreak = diff === 1 ? profile.currentStreak + 1 : 1;
  }
  const newLongest = Math.max(newStreak, profile.longestStreak);

  // Streak bonuses
  let bonusXP = 0;
  if (newStreak === 7 && profile.currentStreak < 7) bonusXP += XP_ACTIONS.STREAK_7_DAYS_BONUS;
  if (newStreak === 30 && profile.currentStreak < 30) bonusXP += XP_ACTIONS.STREAK_30_DAYS_BONUS;

  const finalXPGained = xpGained + bonusXP;
  const newXP = profile.xp + finalXPGained;
  const newLevelInfo = getLevelInfo(newXP);
  const levelUp = newLevelInfo.level > oldLevel.level;

  // Build projected profile for badge check
  const projected: GamificationProfile = { ...profile, xp: newXP, currentStreak: newStreak, longestStreak: newLongest };
  if (countersToIncrement) {
    for (const [key, val] of Object.entries(countersToIncrement)) {
      if (val && val > 0) (projected as any)[key] = ((profile as any)[key] ?? 0) + val;
    }
  }

  // Check badges
  const newBadges: BadgeDefinition[] = [];
  const earned = new Set(profile.earnedBadges);
  for (const badge of BADGES) {
    if (!earned.has(badge.id) && BADGE_CONDITIONS[badge.id]?.(projected)) {
      earned.add(badge.id);
      newBadges.push(badge);
    }
  }

  // Build Firestore update
  const updates: Record<string, any> = {
    xp: increment(finalXPGained),
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastActivityDate: today,
    earnedBadges: Array.from(earned),
    updatedAt: serverTimestamp(),
  };
  if (countersToIncrement) {
    for (const [key, val] of Object.entries(countersToIncrement)) {
      if (val && val > 0) updates[key] = increment(val);
    }
  }

  await updateDoc(profileRef(uid), updates);

  return {
    xpGained: finalXPGained,
    newBadges,
    levelUp,
    newLevelInfo: levelUp ? newLevelInfo : undefined,
    newStreak,
  };
}

// ── Challenges ────────────────────────────────────────────────────────────────
// NOTE: Single-field where query — no composite index needed
export async function getUserChallenges(uid: string): Promise<UserChallenge[]> {
  try {
    const q = query(challengesCol(), where('ownerId', '==', uid));
    const snap = await getDocs(q);
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserChallenge));
    // Filter and sort client-side to avoid composite index requirements
    return all
      .filter((c) => c.status === 'active')
      .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
  } catch {
    return [];
  }
}

export async function ensureDefaultChallenges(uid: string): Promise<void> {
  try {
    const existing = await getUserChallenges(uid);
    if (existing.length > 0) return;

    const now = Timestamp.now();
    const nextWeek = Timestamp.fromDate(new Date(Date.now() + 7 * 86400000));
    const nextMonth = Timestamp.fromDate(new Date(Date.now() + 30 * 86400000));

    const defaults: Omit<UserChallenge, 'id'>[] = [
      {
        ownerId: uid, title: 'Primeiro Passo',
        description: 'Adicione 1 item ao seu plano de desenvolvimento',
        type: 'weekly', moduleType: 'career', xpReward: 75, status: 'active',
        progress: 0, target: 1, actionType: 'add_item',
        createdAt: now, expiresAt: nextWeek, completedAt: null,
      },
      {
        ownerId: uid, title: 'Maratona de Vídeos',
        description: 'Assista 2 vídeos recomendados esta semana',
        type: 'weekly', moduleType: 'career', xpReward: 100, status: 'active',
        progress: 0, target: 2, actionType: 'complete_video',
        createdAt: now, expiresAt: nextWeek, completedAt: null,
      },
      {
        ownerId: uid, title: 'Trilha do Mês',
        description: 'Conclua 1 curso este mês',
        type: 'monthly', moduleType: 'career', xpReward: 200, status: 'active',
        progress: 0, target: 1, actionType: 'complete_course',
        createdAt: now, expiresAt: nextMonth, completedAt: null,
      },
      {
        ownerId: uid, title: 'Leitor Ativo',
        description: 'Adicione 1 livro ao seu plano esta semana',
        type: 'weekly', moduleType: 'career', xpReward: 60, status: 'active',
        progress: 0, target: 1, actionType: 'add_book',
        createdAt: now, expiresAt: nextWeek, completedAt: null,
      },
    ];

    // Use batch write for atomicity and performance
    const batch = writeBatch(db);
    for (const ch of defaults) {
      const ref = doc(challengesCol());
      batch.set(ref, ch);
    }
    await batch.commit();
  } catch (err) {
    console.warn('ensureDefaultChallenges failed (non-critical):', err);
  }
}

export async function incrementChallengeProgress(uid: string, actionType: string): Promise<void> {
  try {
    const challenges = await getUserChallenges(uid);
    const batch = writeBatch(db);
    let hasUpdates = false;

    for (const ch of challenges) {
      if (ch.actionType === actionType && ch.id) {
        const newProgress = Math.min(ch.progress + 1, ch.target);
        const ref = doc(db, 'user_challenges', ch.id);
        if (newProgress >= ch.target) {
          batch.update(ref, { status: 'completed', progress: newProgress, completedAt: serverTimestamp() });
          hasUpdates = true;
          // Award XP for completed challenge in background
          awardXP(uid, 'COMPLETE_CHALLENGE', { challengesCompleted: 1 }).catch(console.warn);
        } else {
          batch.update(ref, { progress: newProgress });
          hasUpdates = true;
        }
      }
    }

    if (hasUpdates) await batch.commit();
  } catch (err) {
    console.warn('incrementChallengeProgress failed (non-critical):', err);
  }
}
