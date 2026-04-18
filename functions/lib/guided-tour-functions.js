"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateGuidedTourCampaign = exports.publishGuidedTourCampaign = exports.validateGuidedTourCampaign = void 0;
const https_1 = require("firebase-functions/https");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const CAMPAIGNS = 'guided_tour_campaigns';
function validateSteps(steps) {
    if (!Array.isArray(steps) || steps.length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'A campanha deve ter pelo menos um step.');
    }
    for (const [i, s] of steps.entries()) {
        if (!s.title)
            throw new https_1.HttpsError('invalid-argument', `Step ${i + 1}: título obrigatório.`);
        if (!s.description)
            throw new https_1.HttpsError('invalid-argument', `Step ${i + 1}: descrição obrigatória.`);
        if (!s.imageAsset)
            throw new https_1.HttpsError('invalid-argument', `Step ${i + 1}: imageAsset obrigatório.`);
    }
}
/** Validates campaign structure without publishing it. */
exports.validateGuidedTourCampaign = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Autenticação necessária.');
    const { campaignId } = request.data;
    if (!campaignId)
        throw new https_1.HttpsError('invalid-argument', 'campaignId é obrigatório.');
    const snap = await db.collection(CAMPAIGNS).doc(campaignId).get();
    if (!snap.exists)
        throw new https_1.HttpsError('not-found', 'Campanha não encontrada.');
    const d = snap.data();
    const errors = [];
    if (!d.title)
        errors.push('Título obrigatório.');
    if (!d.startAt)
        errors.push('startAt obrigatório.');
    if (!d.endAt)
        errors.push('endAt obrigatório.');
    if (d.startAt && d.endAt && d.startAt.toDate() >= d.endAt.toDate()) {
        errors.push('startAt deve ser anterior a endAt.');
    }
    try {
        validateSteps(d.steps ?? []);
    }
    catch (e) {
        if (e instanceof https_1.HttpsError)
            errors.push(e.message);
    }
    return { valid: errors.length === 0, errors };
});
/** Publishes a campaign: validates then sets status to 'active'. */
exports.publishGuidedTourCampaign = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Autenticação necessária.');
    const { campaignId } = request.data;
    if (!campaignId)
        throw new https_1.HttpsError('invalid-argument', 'campaignId é obrigatório.');
    const ref = db.collection(CAMPAIGNS).doc(campaignId);
    const snap = await ref.get();
    if (!snap.exists)
        throw new https_1.HttpsError('not-found', 'Campanha não encontrada.');
    const d = snap.data();
    try {
        validateSteps(d.steps ?? []);
    }
    catch (e) {
        if (e instanceof https_1.HttpsError)
            throw e;
    }
    if (!d.startAt || !d.endAt) {
        throw new https_1.HttpsError('invalid-argument', 'startAt e endAt são obrigatórios para publicar.');
    }
    await ref.update({
        status: 'active',
        updatedAt: firestore_1.Timestamp.now(),
        publishedBy: request.auth.uid,
        publishedAt: firestore_1.Timestamp.now(),
    });
    return { success: true, campaignId };
});
/** Deactivates a campaign (sets status to 'inactive'). */
exports.deactivateGuidedTourCampaign = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Autenticação necessária.');
    const { campaignId } = request.data;
    if (!campaignId)
        throw new https_1.HttpsError('invalid-argument', 'campaignId é obrigatório.');
    await db.collection(CAMPAIGNS).doc(campaignId).update({
        status: 'inactive',
        updatedAt: firestore_1.Timestamp.now(),
    });
    return { success: true };
});
//# sourceMappingURL=guided-tour-functions.js.map