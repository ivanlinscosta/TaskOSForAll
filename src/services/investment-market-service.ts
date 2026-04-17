/**
 * Investment Market Service
 * Sources:
 *   - Banco Central do Brasil (api.bcb.gov.br) — Selic, CDI, IPCA
 *   - AwesomeAPI (economia.awesomeapi.com.br) — USD/BRL, EUR/BRL
 *   - brapi (brapi.dev) — Ações, FIIs, ETFs brasileiros
 *
 * All endpoints are public/CORS-enabled and require no auth for basic usage.
 * Configure VITE_BRAPI_TOKEN in .env for higher rate limits on brapi.
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../lib/firebase-config';

const BRAPI_TOKEN = import.meta.env.VITE_BRAPI_TOKEN || 'demo';
const BRAPI_BASE = 'https://brapi.dev/api';
const AWESOME_BASE = 'https://economia.awesomeapi.com.br/json';
const BCB_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarketData {
  usdBrl: number;
  usdBrlVariation: number;
  eurBrl: number;
  selicAnual: number;
  cdiAnual: number;
  ipcaMensal: number;
  ipcaAnual: number;
  lastUpdate: Date;
  source: string;
}

export interface MarketAsset {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sector?: string;
  type: 'acao' | 'fii' | 'etf';
  tags: string[];
  logoUrl?: string;
}

export interface RendaFixaItem {
  name: string;
  type: string;
  yieldLabel: string;
  yieldAnual: number;
  tags: string[];
  liquidity: string;
  isEstimate: true;
}

// ─── BCB Helpers ──────────────────────────────────────────────────────────────

async function fetchBCBSeries(seriesId: number): Promise<number | null> {
  try {
    const res = await fetch(`${BCB_BASE}.${seriesId}/dados/ultimos/1?formato=json`);
    if (!res.ok) return null;
    const data: Array<{ valor: string; data: string }> = await res.json();
    if (!Array.isArray(data) || !data[0]) return null;
    return parseFloat(String(data[0].valor).replace(',', '.'));
  } catch {
    return null;
  }
}

// BCB series 11 and 12 return daily rates as % (e.g., 0.0513 = 0.0513%/day)
// Convert to annual using 252 working days convention
function dailyPctToAnnualPct(dailyPct: number): number {
  return (Math.pow(1 + dailyPct / 100, 252) - 1) * 100;
}

// ─── Fetch from AwesomeAPI ────────────────────────────────────────────────────

async function fetchAwesomePair(pair: string): Promise<{ bid: number; pctChange: number } | null> {
  try {
    const res = await fetch(`${AWESOME_BASE}/last/${pair}`);
    if (!res.ok) return null;
    const data: Record<string, { bid: string; pctChange: string }> = await res.json();
    const key = pair.replace('-', '');
    const rate = data[key];
    if (!rate) return null;
    return { bid: parseFloat(rate.bid), pctChange: parseFloat(rate.pctChange) };
  } catch {
    return null;
  }
}

// ─── Main market data fetch ───────────────────────────────────────────────────

export async function fetchMarketData(): Promise<MarketData> {
  const [usd, eur, selicDaily, cdiDaily, ipcaMensal] = await Promise.all([
    fetchAwesomePair('USD-BRL'),
    fetchAwesomePair('EUR-BRL'),
    fetchBCBSeries(11),   // Taxa Selic diária % a.d.
    fetchBCBSeries(12),   // CDI diária % a.d.
    fetchBCBSeries(433),  // IPCA % a.m.
  ]);

  // Convert daily rates to annual. Fall back to recent known values if API fails.
  const selicAnual = selicDaily !== null ? dailyPctToAnnualPct(selicDaily) : 14.75;
  const cdiAnual = cdiDaily !== null ? dailyPctToAnnualPct(cdiDaily) : selicAnual - 0.1;
  const ipca = ipcaMensal ?? 0.44;
  const ipcaAnual = (Math.pow(1 + ipca / 100, 12) - 1) * 100;

  return {
    usdBrl: usd?.bid ?? 5.85,
    usdBrlVariation: usd?.pctChange ?? 0,
    eurBrl: eur?.bid ?? 6.40,
    selicAnual: parseFloat(selicAnual.toFixed(2)),
    cdiAnual: parseFloat(cdiAnual.toFixed(2)),
    ipcaMensal: ipca,
    ipcaAnual: parseFloat(ipcaAnual.toFixed(2)),
    lastUpdate: new Date(),
    source: 'BCB + AwesomeAPI',
  };
}

// ─── Cached fetch (Firestore snapshot, refreshes every 4 h) ──────────────────

export async function getOrFetchMarketData(): Promise<MarketData> {
  const today = new Date().toISOString().split('T')[0];

  try {
    const cacheRef = doc(db, COLLECTIONS.INVESTMENT_MARKET_SNAPSHOTS, today);
    const snap = await getDoc(cacheRef);
    if (snap.exists()) {
      const d = snap.data() as any;
      const age = Date.now() - new Date(d.createdAt?.toDate?.() ?? d.createdAt).getTime();
      if (age < 4 * 60 * 60 * 1000) {
        return {
          usdBrl: d.usdBrl,
          usdBrlVariation: d.usdBrlVariation,
          eurBrl: d.eurBrl,
          selicAnual: d.selicAnual,
          cdiAnual: d.cdiAnual,
          ipcaMensal: d.ipcaMensal,
          ipcaAnual: d.ipcaAnual,
          lastUpdate: new Date(d.createdAt?.toDate?.() ?? d.createdAt),
          source: d.source,
        };
      }
    }
  } catch {
    // Cache unavailable — proceed to fresh fetch
  }

  const fresh = await fetchMarketData();

  try {
    const cacheRef = doc(db, COLLECTIONS.INVESTMENT_MARKET_SNAPSHOTS, today);
    await setDoc(
      cacheRef,
      {
        date: today,
        usdBrl: fresh.usdBrl,
        usdBrlVariation: fresh.usdBrlVariation,
        eurBrl: fresh.eurBrl,
        selicAnual: fresh.selicAnual,
        cdiAnual: fresh.cdiAnual,
        ipcaMensal: fresh.ipcaMensal,
        ipcaAnual: fresh.ipcaAnual,
        source: fresh.source,
        createdAt: fresh.lastUpdate,
      },
      { merge: true }
    );
  } catch {
    // Non-critical — cache write failure
  }

  return fresh;
}

// ─── brapi market assets ──────────────────────────────────────────────────────

const FII_SET = new Set(['MXRF11', 'HGLG11', 'XPML11', 'KNRI11', 'BTLG11', 'VISC11', 'HCTR11', 'RBRF11']);
const ETF_SET = new Set(['IVVB11', 'BOVA11', 'SMAL11', 'HASH11', 'GOLD11', 'SPXI11']);

// Máx 5 tickers por request no plano free da brapi
export const RADAR_TICKERS = {
  acoes: ['PETR4', 'VALE3', 'ITUB4', 'WEGE3', 'ABEV3'],
  fiis:  ['MXRF11', 'HGLG11', 'XPML11', 'KNRI11', 'BTLG11'],
  etfs:  ['IVVB11', 'BOVA11', 'SMAL11', 'HASH11', 'GOLD11'],
};

function brapiResultToAsset(item: any): MarketAsset {
  const ticker: string = item.symbol ?? '';
  const type: MarketAsset['type'] = FII_SET.has(ticker) ? 'fii' : ETF_SET.has(ticker) ? 'etf' : 'acao';
  const pctChange: number = item.regularMarketChangePercent ?? 0;

  const tags: string[] = [];
  if (pctChange > 2) tags.push('alta do dia');
  else if (pctChange < -2) tags.push('queda do dia');
  if (type === 'fii') tags.push('dividendos');
  if (type === 'etf') tags.push('diversificado');
  if (ticker.includes('IVVB') || ticker.includes('SPXI')) tags.push('internacional');
  if (ticker.includes('GOLD')) tags.push('proteção');

  return {
    ticker,
    name: item.longName || item.shortName || ticker,
    price: item.regularMarketPrice ?? 0,
    change: item.regularMarketChange ?? 0,
    changePercent: pctChange,
    sector: item.sector,
    type,
    tags,
    logoUrl: item.logourl,
  };
}

export async function fetchBrapiAssets(tickers: string[]): Promise<MarketAsset[]> {
  if (tickers.length === 0) return [];

  // Fetch in batches of 5 to respect free-plan limits
  const BATCH = 5;
  const results: MarketAsset[] = [];

  for (let i = 0; i < tickers.length; i += BATCH) {
    const batch = tickers.slice(i, i + BATCH);
    try {
      const url = `${BRAPI_BASE}/quote/${batch.join(',')}?token=${BRAPI_TOKEN}&fundamental=false`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`brapi ${res.status} for batch ${batch.join(',')}`);
        continue;
      }
      const data = await res.json();
      if (Array.isArray(data?.results)) {
        results.push(...data.results.map(brapiResultToAsset));
      }
    } catch (err) {
      console.warn('brapi fetch error:', err);
    }
  }

  return results;
}

// ─── Renda Fixa synthetic list (built from market rates, no API needed) ───────

export function buildRendaFixaList(marketData: MarketData): RendaFixaItem[] {
  const { cdiAnual, selicAnual, ipcaAnual } = marketData;

  return [
    {
      name: 'CDB 100% CDI',
      type: 'CDB',
      yieldLabel: `~${cdiAnual.toFixed(2)}% a.a.`,
      yieldAnual: cdiAnual,
      tags: ['liquidez diária', 'pós-fixado'],
      liquidity: 'Diária',
      isEstimate: true,
    },
    {
      name: 'CDB 110% CDI',
      type: 'CDB',
      yieldLabel: `~${(cdiAnual * 1.1).toFixed(2)}% a.a.`,
      yieldAnual: cdiAnual * 1.1,
      tags: ['rentabilidade', 'pós-fixado'],
      liquidity: 'No vencimento',
      isEstimate: true,
    },
    {
      name: 'LCI 90% CDI',
      type: 'LCI',
      yieldLabel: `~${(cdiAnual * 0.9).toFixed(2)}% a.a. (isento IR)`,
      yieldAnual: cdiAnual * 0.9,
      tags: ['isento IR', 'imobiliário', 'pós-fixado'],
      liquidity: 'No vencimento',
      isEstimate: true,
    },
    {
      name: 'LCA 90% CDI',
      type: 'LCA',
      yieldLabel: `~${(cdiAnual * 0.9).toFixed(2)}% a.a. (isento IR)`,
      yieldAnual: cdiAnual * 0.9,
      tags: ['isento IR', 'agronegócio', 'pós-fixado'],
      liquidity: 'No vencimento',
      isEstimate: true,
    },
    {
      name: 'Tesouro Selic',
      type: 'Tesouro',
      yieldLabel: `~${selicAnual.toFixed(2)}% a.a.`,
      yieldAnual: selicAnual,
      tags: ['seguro', 'liquidez D+1', 'governo federal'],
      liquidity: 'D+1',
      isEstimate: true,
    },
    {
      name: 'CDB IPCA + 6%',
      type: 'CDB',
      yieldLabel: `~${(ipcaAnual + 6).toFixed(2)}% a.a.`,
      yieldAnual: ipcaAnual + 6,
      tags: ['proteção inflação', 'híbrido'],
      liquidity: 'No vencimento',
      isEstimate: true,
    },
    {
      name: 'Tesouro IPCA+ 2029',
      type: 'Tesouro',
      yieldLabel: `IPCA + ~5.5% a.a.`,
      yieldAnual: ipcaAnual + 5.5,
      tags: ['proteção inflação', 'governo federal', 'longo prazo'],
      liquidity: 'D+1 (mercado)',
      isEstimate: true,
    },
  ];
}
