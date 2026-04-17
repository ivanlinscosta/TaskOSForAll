import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../lib/firebase-config';
import { requireUid } from '../lib/require-auth';

export interface GuidedTourStep {
  id: string;
  title: string;
  description: string;
  imageAsset: string;
  imageVariant: 'center' | 'left' | 'right';
  ctaLabel?: string;
  ctaAction?: string;
  order: number;
  accentColor: string;
  layoutVariant: 'default' | 'hero' | 'split';
}

export interface GuidedTourCampaign {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  audienceType: 'all' | 'segment' | 'role' | 'workspace';
  audienceRules?: Record<string, unknown>;
  triggerPage: 'dashboard';
  startAt: Date;
  endAt: Date;
  priority: number;
  dismissible: boolean;
  repeatable: boolean;
  version: string;
  themeVariant: 'default' | 'launch' | 'update' | 'feature';
  steps: GuidedTourStep[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export type TourStateStatus = 'unseen' | 'seen' | 'dismissed' | 'completed';

export interface UserGuidedTourState {
  id?: string;
  ownerId: string;
  campaignId: string;
  status: TourStateStatus;
  currentStep: number;
  lastSeenAt: Date;
  completedAt?: Date;
  dismissedAt?: Date;
  source: 'dashboard_auto_open' | 'manual_open';
  createdAt: Date;
  updatedAt: Date;
}

function tsToDate(ts: unknown): Date {
  if (!ts) return new Date();
  if (ts instanceof Date) return ts;
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts) {
    return (ts as { toDate: () => Date }).toDate();
  }
  return new Date(String(ts));
}

export async function fetchCampaignById(
  campaignId: string,
): Promise<GuidedTourCampaign | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.GUIDED_TOUR_CAMPAIGNS, campaignId));
    if (!snap.exists()) return null;
    const d = snap.data();
    const steps: GuidedTourStep[] = (d.steps ?? [])
      .slice()
      .sort((a: GuidedTourStep, b: GuidedTourStep) => (a.order ?? 0) - (b.order ?? 0));
    return {
      id: snap.id,
      title: d.title ?? '',
      subtitle: d.subtitle ?? '',
      description: d.description ?? '',
      status: d.status ?? 'inactive',
      audienceType: d.audienceType ?? 'all',
      audienceRules: d.audienceRules,
      triggerPage: d.triggerPage ?? 'dashboard',
      startAt: tsToDate(d.startAt),
      endAt: tsToDate(d.endAt),
      priority: d.priority ?? 0,
      dismissible: d.dismissible !== false,
      repeatable: d.repeatable === true,
      version: d.version ?? '1',
      themeVariant: d.themeVariant ?? 'default',
      steps,
      createdAt: tsToDate(d.createdAt),
      updatedAt: tsToDate(d.updatedAt),
      createdBy: d.createdBy ?? '',
    };
  } catch (e) {
    console.warn('[GuidedTour] fetchCampaignById error:', e);
    return null;
  }
}

export async function fetchUserTourState(
  campaignId: string,
): Promise<UserGuidedTourState | null> {
  const uid = requireUid();
  try {
    const q = query(
      collection(db, COLLECTIONS.USER_GUIDED_TOUR_STATES),
      where('ownerId', '==', uid),
      where('campaignId', '==', campaignId),
    );
    const snaps = await getDocs(q);
    if (snaps.empty) return null;
    const s = snaps.docs[0];
    const d = s.data();
    return {
      id: s.id,
      ownerId: d.ownerId,
      campaignId: d.campaignId,
      status: d.status ?? 'unseen',
      currentStep: d.currentStep ?? 0,
      lastSeenAt: tsToDate(d.lastSeenAt),
      completedAt: d.completedAt ? tsToDate(d.completedAt) : undefined,
      dismissedAt: d.dismissedAt ? tsToDate(d.dismissedAt) : undefined,
      source: d.source ?? 'dashboard_auto_open',
      createdAt: tsToDate(d.createdAt),
      updatedAt: tsToDate(d.updatedAt),
    };
  } catch {
    return null;
  }
}

export async function saveUserTourState(
  campaignId: string,
  update: Partial<Omit<UserGuidedTourState, 'id' | 'ownerId' | 'campaignId' | 'createdAt'>>,
): Promise<void> {
  const uid = requireUid();
  const stateId = `${uid}_${campaignId}`;
  const now = Timestamp.now();

  const existing = await fetchUserTourState(campaignId);
  const payload = existing
    ? { updatedAt: now, ...serializeUpdate(update) }
    : {
        ownerId: uid,
        campaignId,
        status: 'seen' as TourStateStatus,
        currentStep: 0,
        source: 'dashboard_auto_open' as const,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
        ...serializeUpdate(update),
      };

  await setDoc(doc(db, COLLECTIONS.USER_GUIDED_TOUR_STATES, stateId), payload, {
    merge: true,
  });
}

function serializeUpdate(
  update: Partial<Omit<UserGuidedTourState, 'id' | 'ownerId' | 'campaignId' | 'createdAt'>>,
) {
  const result: Record<string, unknown> = { ...update };
  for (const key of ['lastSeenAt', 'completedAt', 'dismissedAt'] as const) {
    if (update[key] instanceof Date) {
      result[key] = Timestamp.fromDate(update[key] as Date);
    }
  }
  return result;
}

export function isCampaignEligible(
  campaign: GuidedTourCampaign,
  state: UserGuidedTourState | null,
  forceShow: boolean,
): boolean {
  if (forceShow) return true;
  if (campaign.status !== 'active') return false;
  const now = new Date();
  if (now < campaign.startAt || now > campaign.endAt) return false;
  if (!state) return true;
  if (state.status === 'completed') return campaign.repeatable;
  if (state.status === 'dismissed') return campaign.repeatable;
  return true;
}
