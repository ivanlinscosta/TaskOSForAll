/**
 * InvestmentTab — Aba de Investimentos dentro do módulo de Finanças do TaskOS.
 *
 * Sections:
 *   1. Resumo de Mercado (BCB + AwesomeAPI)
 *   2. Radar de Mercado — Ações / FIIs / ETFs / Renda Fixa (brapi)
 *   3. Meus Investimentos — CRUD com modal de cadastro
 *   4. Rentabilidade e Projeções (cálculo local)
 *   5. Insights com IA (Cloud Function)
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Lightbulb,
  Loader2,
  Minus,
  PiggyBank,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Trash2,
  Wallet,
  Info,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../../../lib/firebase-config';
import { useAuth } from '../../../../lib/auth-context';
import { formatCurrency } from '../../../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';

import { getOrFetchMarketData, fetchBrapiAssets, buildRendaFixaList, RADAR_TICKERS } from '../../../../services/investment-market-service';
import type { MarketData, MarketAsset, RendaFixaItem } from '../../../../services/investment-market-service';
import {
  createInvestment, updateInvestment, deleteInvestment, listUserInvestments,
  saveAIInsights, getLatestAIInsights,
  INVESTMENT_TYPE_LABELS, BENCHMARK_LABELS, LIQUIDITY_LABELS,
  FIXED_INCOME_TYPES, VARIABLE_TYPES,
} from '../../../../services/investment-portfolio-service';
import type { UserInvestment, InvestmentType, BenchmarkType, LiquidityType, InvestmentAIInsight } from '../../../../services/investment-portfolio-service';
import {
  calcAllProjections, calcPortfolioSummary,
} from '../../../../services/investment-calculation-service';
import type { InvestmentProjection, PortfolioSummary } from '../../../../services/investment-calculation-service';

// ─── AI Projection types (mirrors functions/src/flows/investment-projection-flow.ts) ──

interface AIProjectionPoint {
  label: string;
  date: string;
  grossValue: number;
  netValue: number;
  earnings: number;
  percent: number;
}

interface InvestmentProjectionOutput {
  projectionPoints: AIProjectionPoint[];
  annualYieldEffective: number;
  monthlyYieldEffective: number;
  irAliquot: number;
  irValue: number;
  netEarningsAtMaturity: number;
  grossEarningsAtMaturity: number;
  summary: string;
  riskNote: string;
  benchmarkComparison: string;
}

type AIProjectionState = InvestmentProjectionOutput | 'loading' | 'error';

// ─── Constants ────────────────────────────────────────────────────────────────

const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4', '#F97316'];

const fmt = formatCurrency;

function pctFmt(v: number, decimals = 2): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`;
}

// ─── Empty investment form ────────────────────────────────────────────────────

const EMPTY_FORM: Omit<UserInvestment, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
  name: '',
  type: 'CDB',
  institution: '',
  investedAmount: 0,
  currentAmount: undefined,
  benchmarkType: 'CDI',
  benchmarkPercent: 100,
  fixedRateAnnual: undefined,
  startDate: new Date().toISOString().split('T')[0],
  maturityDate: undefined,
  liquidity: 'no_vencimento',
  ticker: '',
  currency: 'BRL',
  notes: '',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  change,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  change?: number;
  icon: React.ElementType;
  color: string;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[var(--theme-muted-foreground)] truncate">{label}</p>
            <p className="mt-1 text-xl font-bold text-[var(--theme-foreground)] tabular-nums">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-[var(--theme-muted-foreground)]">{sub}</p>}
            {change !== undefined && (
              <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
                {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {pctFmt(change)}
              </div>
            )}
          </div>
          <div className="rounded-xl p-2.5 flex-shrink-0" style={{ background: `${color}18`, color }}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssetCard({ asset }: { asset: MarketAsset }) {
  const positive = asset.changePercent >= 0;
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-3 hover:bg-[var(--theme-background-secondary)] transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[var(--theme-foreground)]">{asset.ticker}</span>
          <div className="flex gap-1 flex-wrap">
            {asset.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: '#3B82F615', color: '#3B82F6' }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-0.5 text-xs text-[var(--theme-muted-foreground)] truncate">{asset.name}</p>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="font-bold text-sm text-[var(--theme-foreground)] tabular-nums">
          {fmt(asset.price)}
        </p>
        <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {pctFmt(asset.changePercent)}
        </div>
      </div>
    </div>
  );
}

function RendaFixaCard({ item }: { item: RendaFixaItem }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-3 hover:bg-[var(--theme-background-secondary)] transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[var(--theme-foreground)]">{item.name}</span>
          <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ background: '#10B98115', color: '#10B981' }}>
            {item.type}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {item.tags.map((t) => (
            <span key={t} className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: '#F59E0B15', color: '#F59E0B' }}>
              {t}
            </span>
          ))}
        </div>
        <p className="mt-0.5 text-xs text-[var(--theme-muted-foreground)]">Liquidez: {item.liquidity}</p>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="font-bold text-sm text-green-600 tabular-nums">{item.yieldLabel}</p>
        <p className="text-[10px] text-[var(--theme-muted-foreground)]">estimativa</p>
      </div>
    </div>
  );
}

function InvestmentCard({
  investment,
  projection,
  aiProjection,
  onDelete,
  onAnalyze,
  expanded,
  onToggle,
}: {
  investment: UserInvestment;
  projection?: InvestmentProjection;
  aiProjection?: AIProjectionState;
  onDelete: (id: string) => void;
  onAnalyze: () => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const typeColor: Record<string, string> = {
    CDB: '#3B82F6', LCI: '#10B981', LCA: '#10B981', Tesouro: '#F59E0B',
    Fundo: '#8B5CF6', Acao: '#EF4444', FII: '#EC4899', ETF: '#06B6D4',
    Cripto: '#F97316', Outro: '#6B7280',
  };
  const color = typeColor[investment.type] ?? '#6B7280';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div
          className="flex cursor-pointer items-center justify-between gap-4 p-4 hover:bg-[var(--theme-background-secondary)] transition-colors"
          onClick={onToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center text-white text-xs font-bold"
              style={{ background: color }}
            >
              {investment.type.substring(0, 3)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[var(--theme-foreground)] truncate">{investment.name}</p>
              <p className="text-xs text-[var(--theme-muted-foreground)]">
                {investment.institution}
                {investment.institution ? ' · ' : ''}
                {BENCHMARK_LABELS[investment.benchmarkType]}
                {investment.benchmarkType !== 'Prefixado' && investment.benchmarkType !== 'Personalizado'
                  ? ` ${investment.benchmarkPercent}%`
                  : investment.fixedRateAnnual
                  ? ` ${investment.fixedRateAnnual}% a.a.`
                  : ''}
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="font-bold text-[var(--theme-foreground)] tabular-nums">{fmt(investment.investedAmount)}</p>
            {projection && projection.isFixedIncome && (
              <p className="text-xs text-green-600 font-medium tabular-nums">
                {fmt(projection.currentGrossValue)} atual (est.)
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(investment.id!); }}
              className="rounded-lg p-1.5 text-[var(--theme-muted-foreground)] hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            {expanded ? <ChevronUp className="h-4 w-4 text-[var(--theme-muted-foreground)]" /> : <ChevronDown className="h-4 w-4 text-[var(--theme-muted-foreground)]" />}
          </div>
        </div>

        {expanded && projection && (
          <div className="border-t border-[var(--theme-border)] bg-[var(--theme-background-secondary)] p-4">
            {projection.isFixedIncome ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-[var(--theme-background)] p-3">
                    <p className="text-xs text-[var(--theme-muted-foreground)]">Rendimento hoje</p>
                    <p className="mt-1 font-bold text-green-600 tabular-nums">{fmt(projection.dailyEarnings)}</p>
                    <p className="text-[10px] text-[var(--theme-muted-foreground)]">{pctFmt(projection.dailyRatePct, 4)} ao dia</p>
                  </div>
                  <div className="rounded-lg bg-[var(--theme-background)] p-3">
                    <p className="text-xs text-[var(--theme-muted-foreground)]">Rendimento acumulado</p>
                    <p className="mt-1 font-bold text-green-600 tabular-nums">{fmt(projection.accumulatedEarnings)}</p>
                    <p className="text-[10px] text-[var(--theme-muted-foreground)]">{pctFmt(projection.accumulatedPercent)}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--theme-background)] p-3">
                    <p className="text-xs text-[var(--theme-muted-foreground)]">Taxa anual efetiva</p>
                    <p className="mt-1 font-bold text-[var(--theme-foreground)] tabular-nums">{projection.annualRatePct.toFixed(2)}% a.a.</p>
                    <p className="text-[10px] text-[var(--theme-muted-foreground)]">{projection.workingDaysElapsed} dias úteis</p>
                  </div>
                  <div className="rounded-lg bg-[var(--theme-background)] p-3">
                    <p className="text-xs text-[var(--theme-muted-foreground)]">Liquidez</p>
                    <p className="mt-1 font-bold text-[var(--theme-foreground)]">{LIQUIDITY_LABELS[investment.liquidity]}</p>
                    {investment.maturityDate && (
                      <p className="text-[10px] text-[var(--theme-muted-foreground)]">vence {investment.maturityDate}</p>
                    )}
                  </div>
                </div>

                {/* AI Projection section */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-[var(--theme-muted-foreground)] uppercase tracking-wide">
                      Projeção até o vencimento (IA)
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 text-xs"
                      onClick={(e) => { e.stopPropagation(); onAnalyze(); }}
                      disabled={aiProjection === 'loading'}
                    >
                      {aiProjection === 'loading'
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Sparkles className="h-3 w-3 text-[var(--theme-accent)]" />}
                      {aiProjection === 'loading' ? 'Analisando…' : (aiProjection && aiProjection !== 'error' ? 'Re-analisar' : 'Analisar com IA')}
                    </Button>
                  </div>

                  {!aiProjection && (
                    <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-[var(--theme-border)] p-5 justify-center">
                      <Brain className="h-5 w-5 text-[var(--theme-muted-foreground)] opacity-40 flex-shrink-0" />
                      <p className="text-xs text-[var(--theme-muted-foreground)]">
                        Clique em <strong>Analisar com IA</strong> para ver a projeção completa até o vencimento com cálculo de IR e comparação de mercado.
                      </p>
                    </div>
                  )}

                  {aiProjection === 'loading' && (
                    <div className="flex items-center justify-center gap-3 py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-[var(--theme-accent)]" />
                      <p className="text-xs text-[var(--theme-muted-foreground)]">Calculando projeção com IA…</p>
                    </div>
                  )}

                  {aiProjection === 'error' && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <p className="text-xs text-red-600">Não foi possível gerar a projeção. Clique em Re-analisar para tentar novamente.</p>
                    </div>
                  )}

                  {aiProjection && aiProjection !== 'loading' && aiProjection !== 'error' && (
                    <div className="space-y-3">
                      {/* Chart: gross vs net */}
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={aiProjection.projectionPoints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={48} />
                            <Tooltip formatter={(v: any) => fmt(Number(v))} />
                            <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                            <Line type="monotone" dataKey="grossValue" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} name="Bruto" />
                            <Line type="monotone" dataKey="netValue" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} name="Líquido (IR)" strokeDasharray={aiProjection.irAliquot > 0 ? undefined : '0'} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Stats at maturity */}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-lg bg-[var(--theme-background)] p-3">
                          <p className="text-xs text-[var(--theme-muted-foreground)]">Rendimento bruto</p>
                          <p className="mt-1 font-bold text-blue-600 tabular-nums">{fmt(aiProjection.grossEarningsAtMaturity)}</p>
                        </div>
                        <div className="rounded-lg bg-[var(--theme-background)] p-3">
                          <p className="text-xs text-[var(--theme-muted-foreground)]">Rendimento líquido</p>
                          <p className="mt-1 font-bold text-green-600 tabular-nums">{fmt(aiProjection.netEarningsAtMaturity)}</p>
                        </div>
                        <div className="rounded-lg bg-[var(--theme-background)] p-3">
                          <p className="text-xs text-[var(--theme-muted-foreground)]">IR estimado</p>
                          <p className="mt-1 font-bold text-[var(--theme-foreground)] tabular-nums">
                            {aiProjection.irAliquot > 0
                              ? `${aiProjection.irAliquot}% — ${fmt(aiProjection.irValue)}`
                              : 'Isento de IR'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-[var(--theme-background)] p-3">
                          <p className="text-xs text-[var(--theme-muted-foreground)]">Taxa efetiva a.a.</p>
                          <p className="mt-1 font-bold text-[var(--theme-foreground)] tabular-nums">
                            {aiProjection.annualYieldEffective.toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      {/* AI narrative */}
                      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--theme-muted-foreground)] mb-1">Resumo</p>
                        <p className="text-xs text-[var(--theme-foreground)]">{aiProjection.summary}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--theme-muted-foreground)] mb-1">Risco e liquidez</p>
                          <p className="text-xs text-[var(--theme-foreground)]">{aiProjection.riskNote}</p>
                        </div>
                        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--theme-muted-foreground)] mb-1">Comparação</p>
                          <p className="text-xs text-[var(--theme-foreground)]">{aiProjection.benchmarkComparison}</p>
                        </div>
                      </div>

                      <p className="flex items-center gap-1 text-[10px] text-[var(--theme-muted-foreground)]">
                        <Info className="h-3 w-3" />
                        Calculado pela IA com taxas de mercado atuais. Não constitui garantia de retorno.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-[var(--theme-background)] p-3">
                  <p className="text-xs text-[var(--theme-muted-foreground)]">Valor investido</p>
                  <p className="mt-1 font-bold tabular-nums">{fmt(investment.investedAmount)}</p>
                </div>
                {investment.currentAmount != null && (
                  <>
                    <div className="rounded-lg bg-[var(--theme-background)] p-3">
                      <p className="text-xs text-[var(--theme-muted-foreground)]">Valor atual</p>
                      <p className="mt-1 font-bold tabular-nums">{fmt(investment.currentAmount)}</p>
                    </div>
                    <div className="rounded-lg bg-[var(--theme-background)] p-3">
                      <p className="text-xs text-[var(--theme-muted-foreground)]">Variação</p>
                      <p className={`mt-1 font-bold tabular-nums ${projection.accumulatedEarnings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {fmt(projection.accumulatedEarnings)} ({pctFmt(projection.accumulatedPercent)})
                      </p>
                    </div>
                  </>
                )}
                {investment.ticker && (
                  <div className="rounded-lg bg-[var(--theme-background)] p-3">
                    <p className="text-xs text-[var(--theme-muted-foreground)]">Ticker</p>
                    <p className="mt-1 font-bold">{investment.ticker}</p>
                  </div>
                )}
                <div className="rounded-lg bg-[var(--theme-background)] p-3">
                  <p className="text-xs text-[var(--theme-muted-foreground)]">Liquidez</p>
                  <p className="mt-1 font-bold">{LIQUIDITY_LABELS[investment.liquidity]}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Investment Form Modal ────────────────────────────────────────────────────

function InvestmentFormModal({
  open,
  onClose,
  onSave,
  ownerId,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (inv: UserInvestment) => void;
  ownerId: string;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const isVariable = VARIABLE_TYPES.has(form.type as InvestmentType);
  const needsRate = form.benchmarkType === 'Prefixado' || form.benchmarkType === 'Personalizado' || form.benchmarkType === 'IPCA';

  const set = (key: keyof typeof EMPTY_FORM, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Informe o nome do investimento'); return; }
    const rawAmount = Number(String(form.investedAmount).replace(',', '.'));
    if (!rawAmount || rawAmount <= 0) { toast.error('Informe o valor investido'); return; }
    if (!ownerId) { toast.error('Usuário não autenticado'); return; }
    try {
      setSaving(true);
      const inv: Omit<UserInvestment, 'id' | 'createdAt' | 'updatedAt'> = {
        ...form,
        ownerId,
        investedAmount: rawAmount,
        currentAmount: form.currentAmount ? Number(String(form.currentAmount).replace(',', '.')) : undefined,
        benchmarkPercent: Number(form.benchmarkPercent) || 100,
        fixedRateAnnual: form.fixedRateAnnual ? Number(form.fixedRateAnnual) : undefined,
        ticker: form.ticker || undefined,
        maturityDate: form.maturityDate || undefined,
        notes: form.notes || undefined,
      };
      const id = await createInvestment(inv);
      onSave({ ...inv, id, createdAt: new Date(), updatedAt: new Date() });
      setForm(EMPTY_FORM);
      onClose();
      toast.success('Investimento cadastrado!');
    } catch (err: any) {
      console.error('Erro ao salvar investimento:', err);
      const msg = err?.code === 'permission-denied'
        ? 'Sem permissão. As regras do Firestore foram deployadas? (firebase deploy --only firestore:rules)'
        : err?.message ?? 'Erro ao salvar investimento';
      toast.error(msg, { duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-[var(--theme-accent)]" />
            Cadastrar investimento
          </DialogTitle>
          <DialogDescription className="sr-only">
            Formulário para cadastrar um novo investimento na carteira
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label>Nome do investimento *</Label>
              <Input
                placeholder="Ex: CDB Banco XP, MXRF11, Tesouro Selic 2027..."
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v as InvestmentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(INVESTMENT_TYPE_LABELS) as InvestmentType[]).map((k) => (
                    <SelectItem key={k} value={k}>{INVESTMENT_TYPE_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Instituição</Label>
              <Input
                placeholder="Ex: Banco XP, NuInvest, B3..."
                value={form.institution}
                onChange={(e) => set('institution', e.target.value)}
              />
            </div>
          </div>

          {/* Financial details */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Valor investido (R$) *</Label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Ex: 10000"
                value={form.investedAmount || ''}
                onChange={(e) => set('investedAmount', e.target.value)}
              />
            </div>

            {isVariable && (
              <div className="space-y-2">
                <Label>Valor atual (R$)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="Opcional"
                  value={form.currentAmount ?? ''}
                  onChange={(e) => set('currentAmount', e.target.value || undefined)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Data de início *</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Data de vencimento</Label>
              <Input
                type="date"
                value={form.maturityDate ?? ''}
                onChange={(e) => set('maturityDate', e.target.value || undefined)}
              />
            </div>
          </div>

          {/* Benchmark — only for fixed income */}
          {!isVariable && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Indexador / benchmark</Label>
                <Select value={form.benchmarkType} onValueChange={(v) => set('benchmarkType', v as BenchmarkType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(BENCHMARK_LABELS) as BenchmarkType[]).map((k) => (
                      <SelectItem key={k} value={k}>{BENCHMARK_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(form.benchmarkType === 'CDI' || form.benchmarkType === 'Selic') && (
                <div className="space-y-2">
                  <Label>% do indexador</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Ex: 100"
                    value={form.benchmarkPercent}
                    onChange={(e) => set('benchmarkPercent', Number(e.target.value))}
                  />
                </div>
              )}

              {needsRate && (
                <div className="space-y-2">
                  <Label>
                    {form.benchmarkType === 'IPCA' ? 'Spread sobre IPCA (% a.a.)' : 'Taxa prefixada (% a.a.)'}
                  </Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Ex: 12.5"
                    value={form.fixedRateAnnual ?? ''}
                    onChange={(e) => set('fixedRateAnnual', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Variable income — ticker */}
          {isVariable && (
            <div className="space-y-2">
              <Label>Ticker (opcional)</Label>
              <Input
                placeholder="Ex: PETR4, MXRF11, BTC..."
                value={form.ticker ?? ''}
                onChange={(e) => set('ticker', e.target.value)}
              />
            </div>
          )}

          {/* Liquidity */}
          <div className="space-y-2">
            <Label>Liquidez</Label>
            <Select value={form.liquidity} onValueChange={(v) => set('liquidity', v as LiquidityType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(LIQUIDITY_LABELS) as LiquidityType[]).map((k) => (
                  <SelectItem key={k} value={k}>{LIQUIDITY_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Anotações extras sobre este investimento..."
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="gap-2 bg-[var(--theme-accent)] text-white"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? 'Salvando…' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── AI Insights panel ────────────────────────────────────────────────────────

function AIInsightsPanel({
  insights,
  loading,
  onGenerate,
}: {
  insights: InvestmentAIInsight | null;
  loading: boolean;
  onGenerate: () => void;
}) {
  const typeIcon: Record<string, React.ElementType> = {
    alerta: AlertTriangle, dica: Lightbulb, oportunidade: TrendingUp, observacao: Info,
  };
  const typeColor: Record<string, string> = {
    alerta: '#EF4444', dica: '#3B82F6', oportunidade: '#10B981', observacao: '#F59E0B',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-[var(--theme-accent)]" />
            Insights com IA
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-8"
            onClick={onGenerate}
            disabled={loading}
          >
            {loading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? 'Analisando…' : 'Gerar análise'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!insights && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--theme-border)] p-8 text-center">
            <Brain className="h-10 w-10 text-[var(--theme-muted-foreground)] opacity-40" />
            <p className="text-sm text-[var(--theme-muted-foreground)]">
              Clique em <strong>Gerar análise</strong> para receber insights personalizados sobre sua carteira com base nos dados de mercado atuais.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--theme-accent)]" />
            <p className="text-sm text-[var(--theme-muted-foreground)]">Analisando sua carteira…</p>
          </div>
        )}

        {insights && !loading && (
          <>
            {insights.cenario && (
              <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-background-secondary)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--theme-muted-foreground)] mb-1">Cenário do dia</p>
                <p className="text-sm text-[var(--theme-foreground)]">{insights.cenario}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {insights.insights.map((item, i) => {
                const IconComp = typeIcon[item.tipo] ?? Info;
                const color = typeColor[item.tipo] ?? '#6B7280';
                return (
                  <div
                    key={i}
                    className="flex gap-3 rounded-xl border border-[var(--theme-border)] p-3"
                    style={{ borderLeftWidth: 3, borderLeftColor: color }}
                  >
                    <div className="flex-shrink-0 mt-0.5 rounded-lg p-1.5" style={{ background: `${color}18`, color }}>
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--theme-foreground)]">{item.titulo}</p>
                      <p className="mt-0.5 text-xs text-[var(--theme-muted-foreground)]">{item.descricao}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="flex items-center gap-1 text-[10px] text-[var(--theme-muted-foreground)]">
              <Clock className="h-3 w-3" />
              Gerado em {new Date(insights.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {' · '}baseado em dados reais de mercado
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main InvestmentTab ───────────────────────────────────────────────────────

export function InvestmentTab() {
  const { user } = useAuth();

  // Market data
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);

  // Radar
  type RadarTab = 'acoes' | 'fiis' | 'etfs' | 'renda_fixa';
  const [radarTab, setRadarTab] = useState<RadarTab>('acoes');
  const [radarAssets, setRadarAssets] = useState<MarketAsset[]>([]);
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarFetched, setRadarFetched] = useState<Set<string>>(new Set());

  // Portfolio
  const [investments, setInvestments] = useState<UserInvestment[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // AI portfolio insights
  const [aiInsights, setAiInsights] = useState<InvestmentAIInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // AI per-investment projections
  const [aiProjections, setAiProjections] = useState<Record<string, AIProjectionState>>({});

  // ─── Load on mount ──────────────────────────────────────────────────────────

  useEffect(() => {
    void loadMarket();
    void loadPortfolio();
    void loadAI();
  }, [user?.uid]);

  const loadMarket = async () => {
    try {
      setMarketLoading(true);
      const data = await getOrFetchMarketData();
      setMarketData(data);
    } catch {
      toast.error('Não foi possível carregar dados de mercado');
    } finally {
      setMarketLoading(false);
    }
  };

  const loadPortfolio = async () => {
    if (!user?.uid) return;
    try {
      setPortfolioLoading(true);
      const list = await listUserInvestments();
      setInvestments(list);
    } finally {
      setPortfolioLoading(false);
    }
  };

  const loadAI = async () => {
    try {
      const insights = await getLatestAIInsights();
      if (insights) setAiInsights(insights);
    } catch {
      // Non-critical
    }
  };

  // ─── Radar lazy fetch ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!marketData || radarTab === 'renda_fixa') return;
    if (radarFetched.has(radarTab)) return;

    const tickers = RADAR_TICKERS[radarTab === 'fiis' ? 'fiis' : radarTab === 'etfs' ? 'etfs' : 'acoes'];

    setRadarLoading(true);
    setRadarAssets([]);

    fetchBrapiAssets(tickers).then((assets) => {
      setRadarAssets(assets);
      setRadarFetched((prev) => new Set([...prev, radarTab]));
    }).catch(() => {
      setRadarAssets([]);
    }).finally(() => {
      setRadarLoading(false);
    });
  }, [radarTab, marketData]);

  // ─── Projections (computed) ──────────────────────────────────────────────────

  const projections = useMemo<InvestmentProjection[]>(() => {
    if (!marketData || investments.length === 0) return [];
    return calcAllProjections(investments, marketData);
  }, [investments, marketData]);

  const portfolioSummary = useMemo<PortfolioSummary | null>(() => {
    if (!marketData || investments.length === 0) return null;
    return calcPortfolioSummary(investments, projections);
  }, [investments, projections, marketData]);

  const projectionMap = useMemo(
    () => new Map(projections.map((p) => [p.investmentId, p])),
    [projections]
  );

  // Pie chart data
  const pieData = useMemo(() => {
    if (!portfolioSummary) return [];
    return Object.entries(portfolioSummary.byType).map(([type, value], i) => ({
      name: INVESTMENT_TYPE_LABELS[type as InvestmentType] ?? type,
      value,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [portfolioSummary]);

  // Area chart — projected growth at 30/90/180/365 days
  const growthChartData = useMemo(() => {
    if (!portfolioSummary) return [];
    const base = portfolioSummary.totalCurrentValue;
    const p365 = portfolioSummary.totalProjected365d;
    const step = (p365 - base) / 4;
    return [
      { label: 'Hoje', valor: base },
      { label: '30d', valor: projections.reduce((s, p) => s + p.projected30d, 0) },
      { label: '90d', valor: projections.reduce((s, p) => s + p.projected90d, 0) },
      { label: '180d', valor: projections.reduce((s, p) => s + p.projected180d, 0) },
      { label: '365d', valor: projections.reduce((s, p) => s + p.projected365d, 0) },
    ];
  }, [portfolioSummary, projections]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Excluir este investimento?')) return;
    try {
      await deleteInvestment(id);
      setInvestments((prev) => prev.filter((i) => i.id !== id));
      toast.success('Investimento removido');
    } catch {
      toast.error('Erro ao excluir');
    }
  }, []);

  const handleSaved = useCallback((inv: UserInvestment) => {
    setInvestments((prev) => [inv, ...prev]);
  }, []);

  const handleAnalyzeProjection = useCallback(async (investment: UserInvestment) => {
    if (!marketData || !investment.id) return;
    const id = investment.id;

    setAiProjections((prev) => ({ ...prev, [id]: 'loading' }));
    try {
      const functions = getFunctions(app, 'us-central1');
      const callFn = httpsCallable<Record<string, unknown>, InvestmentProjectionOutput>(
        functions,
        'investmentProjectionCallable'
      );

      const today = new Date().toISOString().split('T')[0];

      // Genkit rejects null — strip every nullish optional field to undefined
      const payload: Record<string, unknown> = {
        investmentName:   investment.name,
        investmentType:   investment.type,
        investedAmount:   investment.investedAmount,
        benchmarkType:    investment.benchmarkType,
        benchmarkPercent: investment.benchmarkPercent,
        startDate:        investment.startDate,
        liquidity:        investment.liquidity,
        selicAnual:       marketData.selicAnual,
        cdiAnual:         marketData.cdiAnual,
        ipcaMensal:       marketData.ipcaMensal,
        ipcaAnual:        marketData.ipcaAnual,
        todayDate:        today,
      };
      if (investment.institution)   payload.institution     = investment.institution;
      if (investment.fixedRateAnnual != null) payload.fixedRateAnnual = investment.fixedRateAnnual;
      if (investment.maturityDate)  payload.maturityDate    = investment.maturityDate;
      if (investment.ticker)        payload.ticker          = investment.ticker;

      const result = await callFn(payload);

      setAiProjections((prev) => ({ ...prev, [id]: result.data }));
    } catch (err) {
      console.error('investmentProjectionCallable error:', err);
      setAiProjections((prev) => ({ ...prev, [id]: 'error' }));
      toast.error('Não foi possível gerar a projeção. Verifique se a Cloud Function está deployada.');
    }
  }, [marketData]);

  const handleGenerateAI = useCallback(async () => {
    if (!user?.uid || !marketData) return;

    setAiLoading(true);
    try {
      const portfolioText = investments.length === 0
        ? 'Carteira vazia — usuário ainda não cadastrou investimentos.'
        : investments.map((inv) => {
          const proj = projectionMap.get(inv.id!);
          const gain = proj ? ` | Rendimento acumulado estimado: ${fmt(proj.accumulatedEarnings)} (${proj.accumulatedPercent.toFixed(2)}%)` : '';
          return `- ${inv.name} (${inv.type}): R$ ${inv.investedAmount} | ${BENCHMARK_LABELS[inv.benchmarkType]}${inv.benchmarkType !== 'Prefixado' ? ` ${inv.benchmarkPercent}%` : ''} | Liquidez: ${LIQUIDITY_LABELS[inv.liquidity]}${gain}`;
        }).join('\n');

      const marketText = `Selic: ${marketData.selicAnual.toFixed(2)}% a.a. | CDI: ${marketData.cdiAnual.toFixed(2)}% a.a. | IPCA mensal: ${marketData.ipcaMensal}% | USD/BRL: R$ ${marketData.usdBrl}`;

      const functions = getFunctions(app, 'us-central1');
      const callFn = httpsCallable<
        { portfolioSummary: string; marketSummary: string; totalInvested: number; selicAnual: number; cdiAnual: number },
        { cenario: string; insights: Array<{ titulo: string; descricao: string; tipo: string; icone: string }> }
      >(functions, 'investmentInsightsCallable');

      const result = await callFn({
        portfolioSummary: portfolioText,
        marketSummary: marketText,
        totalInvested: portfolioSummary?.totalInvested ?? 0,
        selicAnual: marketData.selicAnual,
        cdiAnual: marketData.cdiAnual,
      });

      const today = new Date().toISOString().split('T')[0];
      const newInsights: InvestmentAIInsight = {
        ownerId: user.uid,
        date: today,
        cenario: result.data.cenario,
        insights: result.data.insights as InvestmentAIInsight['insights'],
        basedOn: marketText,
        createdAt: new Date(),
      };

      await saveAIInsights(newInsights);
      setAiInsights(newInsights);
      toast.success('Análise gerada!');
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível gerar análise. Verifique se a Cloud Function está deployada.');
    } finally {
      setAiLoading(false);
    }
  }, [user?.uid, marketData, investments, projectionMap, portfolioSummary]);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* ── SECTION 1: Resumo de Mercado ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--theme-foreground)]">Resumo de Mercado</h2>
          <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs" onClick={loadMarket} disabled={marketLoading}>
            {marketLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Atualizar
          </Button>
        </div>

        {marketLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--theme-muted)]" />
            ))}
          </div>
        ) : marketData ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <MetricCard
                label="Dólar Comercial"
                value={`R$ ${marketData.usdBrl.toFixed(3)}`}
                change={marketData.usdBrlVariation}
                icon={DollarSign}
                color="#F59E0B"
              />
              <MetricCard
                label="Selic a.a."
                value={`${marketData.selicAnual.toFixed(2)}%`}
                sub="meta Copom"
                icon={TrendingUp}
                color="#10B981"
              />
              <MetricCard
                label="CDI a.a."
                value={`${marketData.cdiAnual.toFixed(2)}%`}
                sub="referência renda fixa"
                icon={BarChart3}
                color="#3B82F6"
              />
              <MetricCard
                label="IPCA mensal"
                value={`${marketData.ipcaMensal.toFixed(2)}%`}
                sub={`~${marketData.ipcaAnual.toFixed(2)}% a.a. proj.`}
                icon={Wallet}
                color="#8B5CF6"
              />
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-background-secondary)] p-3">
              <Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5 text-[var(--theme-accent)]" />
              <div>
                <p className="text-xs font-semibold text-[var(--theme-foreground)]">
                  {marketData.selicAnual > 12
                    ? 'Juros elevados favorecem renda fixa'
                    : 'Juros moderados — bom momento para diversificar'}
                </p>
                <p className="mt-0.5 text-xs text-[var(--theme-muted-foreground)]">
                  Com Selic em <strong>{marketData.selicAnual.toFixed(2)}% a.a.</strong>, investimentos pós-fixados como CDB e Tesouro Selic tendem a superar a poupança.
                  {marketData.usdBrlVariation > 1 ? ' O dólar em alta pode favorecer ativos dolarizados.' : ''}
                  {' '}Fonte: BCB + AwesomeAPI · {marketData.lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--theme-muted-foreground)]">Dados de mercado indisponíveis no momento.</p>
        )}
      </section>

      {/* ── SECTION 2: Radar de Mercado ── */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-[var(--theme-foreground)]">Radar de Mercado</h2>

        <div className="mb-4 flex gap-1 rounded-xl bg-[var(--theme-background-secondary)] p-1">
          {([
            { key: 'acoes', label: 'Ações' },
            { key: 'fiis', label: 'FIIs' },
            { key: 'etfs', label: 'ETFs' },
            { key: 'renda_fixa', label: 'Renda Fixa' },
          ] as { key: RadarTab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setRadarTab(t.key)}
              className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                radarTab === t.key
                  ? 'bg-white shadow-sm text-[var(--theme-accent)]'
                  : 'text-[var(--theme-muted-foreground)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-[var(--theme-muted-foreground)] mb-3 flex items-center gap-1">
          <Info className="h-3 w-3" />
          {radarTab === 'renda_fixa'
            ? 'Referências estimadas com base nas taxas de mercado do dia. Não constituem recomendação.'
            : 'Ativos em evidência. Dados brapi.dev · token demo sujeito a limitação de requisições.'}
        </div>

        {radarTab === 'renda_fixa' ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {marketData
              ? buildRendaFixaList(marketData).map((item) => (
                  <RendaFixaCard key={item.name} item={item} />
                ))
              : <p className="text-sm text-[var(--theme-muted-foreground)]">Aguardando dados de mercado…</p>
            }
          </div>
        ) : radarLoading ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--theme-muted)]" />
            ))}
          </div>
        ) : radarAssets.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {radarAssets.map((asset) => (
              <AssetCard key={asset.ticker} asset={asset} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--theme-border)] p-8 text-center">
            <BarChart3 className="h-8 w-8 text-[var(--theme-muted-foreground)] opacity-40" />
            <p className="text-sm text-[var(--theme-muted-foreground)]">
              Dados não disponíveis. Verifique <strong>VITE_BRAPI_TOKEN</strong> no .env ou tente novamente.
            </p>
          </div>
        )}
      </section>

      {/* ── SECTION 3: Meus Investimentos ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--theme-foreground)]">Meus Investimentos</h2>
          <Button
            className="gap-2 bg-[var(--theme-accent)] text-white hover:opacity-90"
            size="sm"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {portfolioLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--theme-muted)]" />
            ))}
          </div>
        ) : investments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--theme-border)] p-10 text-center">
            <PiggyBank className="h-12 w-12 text-[var(--theme-muted-foreground)] opacity-40" />
            <div>
              <p className="font-semibold text-[var(--theme-foreground)]">Nenhum investimento cadastrado</p>
              <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">
                Cadastre seus investimentos para acompanhar rentabilidade e projeções.
              </p>
            </div>
            <Button className="mt-1 gap-2 bg-[var(--theme-accent)] text-white" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Cadastrar primeiro investimento
            </Button>
          </div>
        ) : (
          <>
            {/* Portfolio summary cards */}
            {portfolioSummary && (
              <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-[var(--theme-muted-foreground)]">Total investido</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">{fmt(portfolioSummary.totalInvested)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-[var(--theme-muted-foreground)]">Valor atual (est.)</p>
                    <p className="mt-1 text-lg font-bold text-green-600 tabular-nums">{fmt(portfolioSummary.totalCurrentValue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-[var(--theme-muted-foreground)]">Rendimento acumulado</p>
                    <p className={`mt-1 text-lg font-bold tabular-nums ${portfolioSummary.totalAccumulatedEarnings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {fmt(portfolioSummary.totalAccumulatedEarnings)}
                    </p>
                    <p className="text-xs text-[var(--theme-muted-foreground)]">{pctFmt(portfolioSummary.totalAccumulatedPercent)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-[var(--theme-muted-foreground)]">Rendimento hoje (est.)</p>
                    <p className="mt-1 text-lg font-bold text-green-600 tabular-nums">{fmt(portfolioSummary.totalDailyEarnings)}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Charts row */}
            {portfolioSummary && (
              <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Pie — allocation */}
                <Card>
                  <CardHeader><CardTitle className="text-sm">Alocação por tipo</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                            {pieData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => fmt(Number(v))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5 mt-2">
                      {pieData.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                            <span>{entry.name}</span>
                          </div>
                          <span className="font-medium tabular-nums">{fmt(entry.value)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Area — projected growth */}
                <Card>
                  <CardHeader><CardTitle className="text-sm">Projeção de crescimento (est.)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={growthChartData}>
                          <defs>
                            <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v: any) => fmt(Number(v))} />
                          <Area
                            type="monotone"
                            dataKey="valor"
                            stroke="#10B981"
                            fill="url(#gradGreen)"
                            strokeWidth={2}
                            name="Valor estimado"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-[10px] text-[var(--theme-muted-foreground)]">
                      <Info className="h-3 w-3" />
                      Projeção estimada para renda fixa. Ativos variáveis não incluem crescimento projetado.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Investment cards list */}
            <div className="space-y-3">
              {investments.map((inv) => (
                <InvestmentCard
                  key={inv.id}
                  investment={inv}
                  projection={projectionMap.get(inv.id!)}
                  aiProjection={aiProjections[inv.id!]}
                  onDelete={handleDelete}
                  onAnalyze={() => handleAnalyzeProjection(inv)}
                  expanded={expandedId === inv.id}
                  onToggle={() => setExpandedId((prev) => (prev === inv.id ? null : inv.id!))}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── SECTION 4: Insights com IA ── */}
      <section>
        <AIInsightsPanel
          insights={aiInsights}
          loading={aiLoading}
          onGenerate={handleGenerateAI}
        />
      </section>

      {/* ── Modal: Add investment ── */}
      <InvestmentFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleSaved}
        ownerId={user?.uid ?? ''}
      />
    </div>
  );
}
