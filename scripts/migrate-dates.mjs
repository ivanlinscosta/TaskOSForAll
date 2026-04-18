/**
 * migrate-dates.mjs
 *
 * Corrige datas quebradas nas coleções `custos` e `receitas`:
 *
 *   1. Strings 'YYYY-MM-DD' → Timestamp de meia-noite local (UTC-3).
 *      Geradas por createOwnedRecord() antes do fix de 2026-04-18.
 *
 *   2. Timestamps de meia-noite UTC (00:00:00Z) → meia-noite local (03:00:00Z).
 *      Gerados por `new Date('YYYY-MM-DD')` na edição de despesas/receitas
 *      antes do fix, que criava uma data UTC ao invés de local.
 *
 * Uso:
 *   node scripts/migrate-dates.mjs [--dry-run]
 *
 * Requer gcloud CLI autenticado:
 *   gcloud auth login
 *   gcloud config set project taskos-forall
 */

import { execSync } from 'child_process';

const PROJECT    = 'taskos-forall';
const BASE_URL   = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
// UTC offset do Brasil (BRT = UTC-3). Ajuste se o servidor usa outro fuso.
const LOCAL_OFFSET_HOURS = -3;
const DRY_RUN = process.argv.includes('--dry-run');

// ─── Auth ────────────────────────────────────────────────────────────────────

function getToken() {
  try {
    return execSync('gcloud auth print-access-token', { stdio: ['pipe', 'pipe', 'pipe'] })
      .toString().trim();
  } catch {
    console.error('❌  gcloud não encontrado ou não autenticado.');
    console.error('    Execute: gcloud auth login && gcloud config set project taskos-forall');
    process.exit(1);
  }
}

// ─── Firestore REST helpers ───────────────────────────────────────────────────

async function listAllDocs(token, collection) {
  const docs = [];
  let pageToken = null;
  do {
    const url = `${BASE_URL}/${collection}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Firestore list error ${res.status}: ${await res.text()}`);
    const body = await res.json();
    if (body.documents) docs.push(...body.documents);
    pageToken = body.nextPageToken ?? null;
  } while (pageToken);
  return docs;
}

async function patchDateField(token, docName, isoTimestamp) {
  const url = `https://firestore.googleapis.com/v1/${docName}?updateMask.fieldPaths=data`;
  const body = JSON.stringify({
    fields: { data: { timestampValue: isoTimestamp } },
  });
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body,
  });
  if (!res.ok) throw new Error(`Firestore patch error ${res.status}: ${await res.text()}`);
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Dada uma string 'YYYY-MM-DD', retorna o ISO 8601 de meia-noite local.
 * Ex.: '2026-04-18' + offset -3h → '2026-04-18T03:00:00Z'
 */
function stringToLocalMidnightISO(dateStr) {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  // meia-noite local = UTC + |offset| horas (para UTC-3: 03:00Z)
  const utcH = (-LOCAL_OFFSET_HOURS) % 24; // 3 para UTC-3
  return `${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T${String(utcH).padStart(2,'0')}:00:00Z`;
}

/**
 * Detecta se um timestampValue ISO representa meia-noite UTC (00:00:00Z).
 * Esses são provenientes de `new Date('YYYY-MM-DD')` (bug anterior).
 */
function isUTCMidnight(isoStr) {
  return /T00:00:00(\.0+)?Z$/.test(isoStr);
}

/**
 * Corrige meia-noite UTC → meia-noite local somando |offset| horas.
 * '2026-04-18T00:00:00Z' + 3h → '2026-04-18T03:00:00Z'
 */
function shiftUTCMidnightToLocal(isoStr) {
  const date = new Date(isoStr);
  date.setUTCHours(date.getUTCHours() + (-LOCAL_OFFSET_HOURS));
  return date.toISOString().replace(/\.\d+Z$/, 'Z');
}

// ─── Migration ────────────────────────────────────────────────────────────────

async function migrateCollection(token, collection) {
  console.log(`\n📂  ${collection}`);
  const docs = await listAllDocs(token, collection);
  console.log(`    ${docs.length} documentos lidos`);

  let stringFixed = 0;
  let utcFixed    = 0;
  let skipped     = 0;
  const errors    = [];

  for (const doc of docs) {
    const rawDate = doc.fields?.data;
    if (!rawDate) { skipped++; continue; }

    let newISO = null;

    // Caso 1: data armazenada como string 'YYYY-MM-DD'
    if (rawDate.stringValue && /^\d{4}-\d{2}-\d{2}/.test(rawDate.stringValue)) {
      newISO = stringToLocalMidnightISO(rawDate.stringValue);
      stringFixed++;

    // Caso 2: Timestamp de meia-noite UTC (bug do `new Date('YYYY-MM-DD')`)
    } else if (rawDate.timestampValue && isUTCMidnight(rawDate.timestampValue)) {
      newISO = shiftUTCMidnightToLocal(rawDate.timestampValue);
      utcFixed++;

    } else {
      skipped++;
      continue;
    }

    const shortName = doc.name.split('/').pop();
    if (DRY_RUN) {
      const before = rawDate.stringValue ?? rawDate.timestampValue;
      console.log(`    [DRY] ${shortName}  ${before}  →  ${newISO}`);
    } else {
      try {
        await patchDateField(token, doc.name, newISO);
      } catch (err) {
        errors.push({ id: shortName, err: err.message });
      }
    }
  }

  console.log(`    ✅  strings corrigidas : ${stringFixed}`);
  console.log(`    ✅  UTC-midnight fix   : ${utcFixed}`);
  console.log(`    ⏭   sem alteração      : ${skipped}`);
  if (errors.length) {
    console.error(`    ❌  erros (${errors.length}):`);
    errors.forEach(e => console.error(`        ${e.id}: ${e.err}`));
  }
  return { stringFixed, utcFixed, skipped, errors: errors.length };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  if (DRY_RUN) console.log('🔍  MODO DRY-RUN — nenhum dado será alterado\n');
  else         console.log('🚀  Iniciando migração de datas…\n');

  const token = getToken();

  const results = {};
  for (const col of ['custos', 'receitas']) {
    results[col] = await migrateCollection(token, col);
  }

  const totalFixed = Object.values(results).reduce((s, r) => s + r.stringFixed + r.utcFixed, 0);
  const totalErrors = Object.values(results).reduce((s, r) => s + r.errors, 0);

  console.log('\n─────────────────────────────────');
  if (DRY_RUN) {
    console.log(`📋  ${totalFixed} registro(s) seriam corrigidos.`);
    console.log('    Rode sem --dry-run para aplicar.');
  } else {
    console.log(`✅  ${totalFixed} registro(s) corrigidos.`);
    if (totalErrors) console.log(`❌  ${totalErrors} erro(s). Veja acima.`);
  }
})();
