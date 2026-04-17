/**
 * deploy-campaign.mjs
 *
 * Usage:
 *   node scripts/deploy-campaign.mjs <campaign-json-file>
 *
 * Example:
 *   node scripts/deploy-campaign.mjs scripts/campaigns/welcome-v1.json
 *
 * Requires: gcloud CLI authenticated (gcloud auth login)
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const PROJECT = 'taskos-forall';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const RC_URL = `https://firebaseremoteconfig.googleapis.com/v1/projects/${PROJECT}/remoteConfig`;

// ── helpers ──────────────────────────────────────────────────────────────────

function getToken() {
  try {
    return execSync('gcloud auth print-access-token', { stdio: ['pipe', 'pipe', 'pipe'] })
      .toString()
      .trim();
  } catch {
    console.error('❌ gcloud not found or not authenticated. Run: gcloud auth login');
    process.exit(1);
  }
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === 'string') {
    // detect ISO timestamps
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return { timestampValue: value };
    return { stringValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function toFirestoreDocument(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return { fields };
}

async function request(url, method, token, body, extraHeaders = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-goog-user-project': PROJECT,
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`❌ HTTP ${res.status}:`, text);
    process.exit(1);
  }
  return JSON.parse(text);
}

// ── main ─────────────────────────────────────────────────────────────────────

const [, , campaignFile] = process.argv;
if (!campaignFile) {
  console.error('Usage: node scripts/deploy-campaign.mjs <campaign-json-file>');
  process.exit(1);
}

let campaign;
try {
  campaign = JSON.parse(readFileSync(campaignFile, 'utf8'));
} catch (e) {
  console.error('❌ Could not read campaign file:', e.message);
  process.exit(1);
}

const { id, ...fields } = campaign;
if (!id) {
  console.error('❌ Campaign JSON must have an "id" field (used as Firestore document ID).');
  process.exit(1);
}

console.log(`\n🚀 Deploying campaign "${id}" to project "${PROJECT}"...\n`);

const token = getToken();

// 1. Write Firestore document
console.log('📄 Writing Firestore document...');
const docUrl = `${FIRESTORE_BASE}/guided_tour_campaigns/${id}`;
await request(docUrl, 'PATCH', token, toFirestoreDocument(fields));
console.log(`   ✅ guided_tour_campaigns/${id} created/updated`);

// 2. Update Remote Config
console.log('⚙️  Updating Remote Config...');
const rcBody = {
  parameters: {
    guided_tour_enabled:            { defaultValue: { value: 'true' } },
    guided_tour_active_campaign_id: { defaultValue: { value: id } },
    guided_tour_force_show:         { defaultValue: { value: 'false' } },
    guided_tour_debug_mode:         { defaultValue: { value: 'false' } },
  },
};
await request(RC_URL, 'PUT', token, rcBody, { 'If-Match': '*' });
console.log(`   ✅ Remote Config → guided_tour_active_campaign_id = ${id}`);

console.log(`\n✨ Done! Campaign "${id}" is live.\n`);
