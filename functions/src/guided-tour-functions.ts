import { onCall, HttpsError } from 'firebase-functions/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';

if (!getApps().length) initializeApp();

const db = getFirestore();
const CAMPAIGNS = 'guided_tour_campaigns';

interface CampaignStep {
  id: string;
  title: string;
  description: string;
  imageAsset: string;
  order: number;
  accentColor: string;
}

function validateSteps(steps: unknown[]): void {
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new HttpsError('invalid-argument', 'A campanha deve ter pelo menos um step.');
  }
  for (const [i, s] of (steps as CampaignStep[]).entries()) {
    if (!s.title) throw new HttpsError('invalid-argument', `Step ${i + 1}: título obrigatório.`);
    if (!s.description) throw new HttpsError('invalid-argument', `Step ${i + 1}: descrição obrigatória.`);
    if (!s.imageAsset) throw new HttpsError('invalid-argument', `Step ${i + 1}: imageAsset obrigatório.`);
  }
}

/** Validates campaign structure without publishing it. */
export const validateGuidedTourCampaign = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Autenticação necessária.');

  const { campaignId } = request.data as { campaignId: string };
  if (!campaignId) throw new HttpsError('invalid-argument', 'campaignId é obrigatório.');

  const snap = await db.collection(CAMPAIGNS).doc(campaignId).get();
  if (!snap.exists) throw new HttpsError('not-found', 'Campanha não encontrada.');

  const d = snap.data()!;
  const errors: string[] = [];

  if (!d.title) errors.push('Título obrigatório.');
  if (!d.startAt) errors.push('startAt obrigatório.');
  if (!d.endAt) errors.push('endAt obrigatório.');
  if (d.startAt && d.endAt && d.startAt.toDate() >= d.endAt.toDate()) {
    errors.push('startAt deve ser anterior a endAt.');
  }

  try {
    validateSteps(d.steps ?? []);
  } catch (e: unknown) {
    if (e instanceof HttpsError) errors.push(e.message);
  }

  return { valid: errors.length === 0, errors };
});

/** Publishes a campaign: validates then sets status to 'active'. */
export const publishGuidedTourCampaign = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Autenticação necessária.');

  const { campaignId } = request.data as { campaignId: string };
  if (!campaignId) throw new HttpsError('invalid-argument', 'campaignId é obrigatório.');

  const ref = db.collection(CAMPAIGNS).doc(campaignId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Campanha não encontrada.');

  const d = snap.data()!;

  try {
    validateSteps(d.steps ?? []);
  } catch (e: unknown) {
    if (e instanceof HttpsError) throw e;
  }

  if (!d.startAt || !d.endAt) {
    throw new HttpsError('invalid-argument', 'startAt e endAt são obrigatórios para publicar.');
  }

  await ref.update({
    status: 'active',
    updatedAt: Timestamp.now(),
    publishedBy: request.auth.uid,
    publishedAt: Timestamp.now(),
  });

  return { success: true, campaignId };
});

/** Deactivates a campaign (sets status to 'inactive'). */
export const deactivateGuidedTourCampaign = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Autenticação necessária.');

  const { campaignId } = request.data as { campaignId: string };
  if (!campaignId) throw new HttpsError('invalid-argument', 'campaignId é obrigatório.');

  await db.collection(CAMPAIGNS).doc(campaignId).update({
    status: 'inactive',
    updatedAt: Timestamp.now(),
  });

  return { success: true };
});
