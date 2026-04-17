/**
 * Investment Calculation Service
 * Computes daily yields and future projections for fixed-income investments.
 *
 * Convention: 252 working days per year (padrão mercado financeiro brasileiro).
 * All projections are clearly estimates based on current benchmark rates.
 */
import type { MarketData } from './investment-market-service';
import type { UserInvestment } from './investment-portfolio-service';
import { FIXED_INCOME_TYPES } from './investment-portfolio-service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvestmentProjection {
  investmentId: string;
  investedAmount: number;
  currentGrossValue: number;
  dailyEarnings: number;
  accumulatedEarnings: number;
  accumulatedPercent: number;
  dailyRatePct: number;
  annualRatePct: number;
  projected30d: number;
  projected90d: number;
  projected180d: number;
  projected365d: number;
  earnings30d: number;
  earnings90d: number;
  earnings180d: number;
  earnings365d: number;
  isFixedIncome: boolean;
  workingDaysElapsed: number;
}

// ─── Core rate helpers ────────────────────────────────────────────────────────

/**
 * Derives the effective annual rate for the investment based on its benchmark.
 * Returns rate as percentage per annum.
 */
export function effectiveAnnualRate(inv: UserInvestment, market: MarketData): number {
  const pct = inv.benchmarkPercent / 100;

  switch (inv.benchmarkType) {
    case 'CDI':
      return market.cdiAnual * pct;

    case 'Selic':
      return market.selicAnual * pct;

    case 'IPCA': {
      // IPCA + fixed spread (fixedRateAnnual). Annualize monthly IPCA first.
      const spread = inv.fixedRateAnnual ?? 0;
      return market.ipcaAnual + spread;
    }

    case 'Prefixado':
      return inv.fixedRateAnnual ?? 0;

    case 'Personalizado':
      return inv.fixedRateAnnual ?? 0;

    default:
      return 0;
  }
}

/**
 * Convert annual % rate to daily rate using 252 business days convention.
 */
export function annualToDailyRate(annualPct: number): number {
  return Math.pow(1 + annualPct / 100, 1 / 252) - 1;
}

/**
 * Estimate elapsed working days between startDate and today.
 * Approximation: calendar_days * (252 / 365).
 */
export function estimateWorkingDays(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const calendarDays = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86_400_000));
  return Math.round(calendarDays * (252 / 365));
}

/**
 * Future working days from today.
 */
function futureWorkingDays(calendarDays: number): number {
  return Math.round(calendarDays * (252 / 365));
}

// ─── Main projection calculator ───────────────────────────────────────────────

export function calcInvestmentProjection(
  inv: UserInvestment,
  market: MarketData
): InvestmentProjection {
  const isFixed = FIXED_INCOME_TYPES.has(inv.type);
  const principal = inv.investedAmount;

  if (!isFixed) {
    // For variable assets (stocks, FIIs, ETFs, crypto):
    // Use currentAmount if available; otherwise treat as unchanged.
    const current = inv.currentAmount ?? principal;
    const accumulated = current - principal;
    return {
      investmentId: inv.id!,
      investedAmount: principal,
      currentGrossValue: current,
      dailyEarnings: 0,
      accumulatedEarnings: accumulated,
      accumulatedPercent: principal > 0 ? (accumulated / principal) * 100 : 0,
      dailyRatePct: 0,
      annualRatePct: 0,
      projected30d: current,
      projected90d: current,
      projected180d: current,
      projected365d: current,
      earnings30d: accumulated,
      earnings90d: accumulated,
      earnings180d: accumulated,
      earnings365d: accumulated,
      isFixedIncome: false,
      workingDaysElapsed: estimateWorkingDays(inv.startDate),
    };
  }

  const annualRatePct = effectiveAnnualRate(inv, market);
  const dailyRate = annualToDailyRate(annualRatePct);
  const workingDays = estimateWorkingDays(inv.startDate);

  // Current estimated gross value (before tax)
  const currentGross = principal * Math.pow(1 + dailyRate, workingDays);
  const dailyEarnings = currentGross * dailyRate;
  const accumulatedEarnings = currentGross - principal;

  // Future projections from today's current value
  const proj = (days: number) => currentGross * Math.pow(1 + dailyRate, futureWorkingDays(days));

  const p30 = proj(30);
  const p90 = proj(90);
  const p180 = proj(180);
  const p365 = proj(365);

  return {
    investmentId: inv.id!,
    investedAmount: principal,
    currentGrossValue: currentGross,
    dailyEarnings,
    accumulatedEarnings,
    accumulatedPercent: principal > 0 ? (accumulatedEarnings / principal) * 100 : 0,
    dailyRatePct: dailyRate * 100,
    annualRatePct,
    projected30d: p30,
    projected90d: p90,
    projected180d: p180,
    projected365d: p365,
    earnings30d: p30 - currentGross,
    earnings90d: p90 - currentGross,
    earnings180d: p180 - currentGross,
    earnings365d: p365 - currentGross,
    isFixedIncome: true,
    workingDaysElapsed: workingDays,
  };
}

export function calcAllProjections(
  investments: UserInvestment[],
  market: MarketData
): InvestmentProjection[] {
  return investments.map((inv) => calcInvestmentProjection(inv, market));
}

// ─── Portfolio-level aggregates ───────────────────────────────────────────────

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalAccumulatedEarnings: number;
  totalAccumulatedPercent: number;
  totalDailyEarnings: number;
  totalProjected365d: number;
  byType: Record<string, number>;
}

export function calcPortfolioSummary(
  investments: UserInvestment[],
  projections: InvestmentProjection[]
): PortfolioSummary {
  const projMap = new Map(projections.map((p) => [p.investmentId, p]));

  let totalInvested = 0;
  let totalCurrentValue = 0;
  let totalDailyEarnings = 0;
  let totalProjected365d = 0;
  const byType: Record<string, number> = {};

  for (const inv of investments) {
    const proj = projMap.get(inv.id!);
    totalInvested += inv.investedAmount;
    if (proj) {
      totalCurrentValue += proj.currentGrossValue;
      totalDailyEarnings += proj.dailyEarnings;
      totalProjected365d += proj.projected365d;
    } else {
      totalCurrentValue += inv.investedAmount;
    }
    byType[inv.type] = (byType[inv.type] ?? 0) + inv.investedAmount;
  }

  return {
    totalInvested,
    totalCurrentValue,
    totalAccumulatedEarnings: totalCurrentValue - totalInvested,
    totalAccumulatedPercent:
      totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0,
    totalDailyEarnings,
    totalProjected365d,
    byType,
  };
}
