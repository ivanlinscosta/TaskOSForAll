import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, FileText, Loader2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import {
  generateFinancialReportNarrative,
  type FinancialReportAI,
} from '../../../lib/openai-service';
import { formatCurrency } from '../../../lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ReportData {
  nomeUsuario: string;
  workspace: string;
  periodo: string;
  receitas: number;
  despesas: number;
  saldo: number;
  gastoMedio: number;
  totalInvestido: number;
  perfilInvestidor: string;
  fixos: number;
  assinaturas: number;
  variaveis: number;
  categorias: Array<{ nome: string; valor: number; color: string }>;
  evolucaoMensal: Array<{ mes: string; receitas: number; despesas: number }>;
}

type LoadingStep = 'idle' | 'ai' | 'render' | 'pdf' | 'done' | 'error';

// ─── Brand ──────────────────────────────────────────────────────────────────

const B = {
  primary:      '#0D5C7A',
  primaryLight: '#1280A8',
  bg:           '#F4F3EF',
  card:         '#FFFFFF',
  text:         '#061F2A',
  muted:        '#7A7068',
  border:       '#EDEAE4',
  green:        '#16A34A',
  red:          '#EF4444',
  amber:        '#F59E0B',
  violet:       '#7C3AED',
  blue:         '#3B82F6',
};

// ─── Loading Modal ───────────────────────────────────────────────────────────

const STEP_LABELS: Record<LoadingStep, string> = {
  idle:   '',
  ai:     'Analisando dados com Gemini AI…',
  render: 'Formatando relatório…',
  pdf:    'Gerando PDF…',
  done:   'Relatório pronto! Download iniciando…',
  error:  'Erro ao gerar relatório. Tente novamente.',
};
const STEP_PCT: Record<LoadingStep, number> = {
  idle: 0, ai: 35, render: 65, pdf: 88, done: 100, error: 0,
};

function LoadingModal({ step }: { step: LoadingStep }) {
  const open  = step !== 'idle';
  const done  = step === 'done';
  const error = step === 'error';
  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-sm"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center gap-5 py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: error ? '#EF444412' : '#0D5C7A12' }}>
            {done  ? <CheckCircle2 className="h-8 w-8" style={{ color: B.primary }} /> :
             error ? <FileText    className="h-8 w-8 text-red-500" /> :
             step === 'ai' ? <Sparkles className="h-8 w-8 animate-pulse" style={{ color: B.primary }} /> :
                   <Loader2 className="h-8 w-8 animate-spin" style={{ color: B.primary }} />}
          </div>
          <div>
            <p className="text-base font-semibold text-[var(--theme-foreground)]">
              {done ? 'Download iniciado!' : error ? 'Algo deu errado' : 'Gerando relatório'}
            </p>
            <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">{STEP_LABELS[step]}</p>
          </div>
          {!error && (
            <div className="w-full h-1.5 rounded-full bg-[var(--theme-muted)] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ background: B.primary, width: `${STEP_PCT[step]}%` }} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Shared mini-components for pages ────────────────────────────────────────

function SectionTitle({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: color }} />
      <h2 style={{ fontSize: 17, fontWeight: 700, color: B.text, margin: 0 }}>{children}</h2>
    </div>
  );
}

function KpiCard({ label, value, color, bg, note }: { label: string; value: number; color: string; bg: string; note?: string }) {
  return (
    <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 12, padding: '14px 16px', flex: 1, boxSizing: 'border-box' }}>
      <p style={{ fontSize: 10, color: B.muted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 800, color, margin: 0 }}>{formatCurrency(Math.abs(value))}</p>
      {note && <p style={{ fontSize: 10, color: B.muted, margin: '4px 0 0' }}>{note}</p>}
    </div>
  );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: B.muted, textTransform: 'capitalize' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: B.text }}>{formatCurrency(value)}</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: '#EDEAE4', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color }} />
      </div>
    </div>
  );
}

function AiText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').filter(Boolean).map((p, i) => (
        <p key={i} style={{ fontSize: 12.5, color: B.text, lineHeight: 1.75, margin: i > 0 ? '10px 0 0' : 0 }}>{p}</p>
      ))}
    </>
  );
}

// ─── PAGE 1 — Cover ──────────────────────────────────────────────────────────

function PageCover({ data, generatedAt }: { data: ReportData; generatedAt: string }) {
  const saldo = data.saldo;
  return (
    <div id="report-page-0" style={{ width: 794, height: 1123, boxSizing: 'border-box', overflow: 'hidden',
      background: `linear-gradient(145deg, ${B.primary} 0%, ${B.primaryLight} 60%, #1A9BC4 100%)`,
      display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '52px 64px 0', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 72 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>T</span>
          </div>
          <span style={{ color: '#fff', fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>TaskAll</span>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 14px' }}>
          Relatório Financeiro
        </p>
        <h1 style={{ color: '#fff', fontSize: 42, fontWeight: 900, lineHeight: 1.1, margin: '0 0 16px' }}>
          Análise Financeira<br />Personalizada
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, margin: 0 }}>
          {data.nomeUsuario} · {data.workspace === 'work' ? 'Trabalho' : 'Vida Pessoal'}
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', margin: '48px 0 36px' }} />

        {/* Snapshot KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'Receitas totais', value: data.receitas, sign: '' },
            { label: 'Despesas totais', value: data.despesas, sign: '' },
            { label: 'Saldo do período', value: saldo, sign: saldo < 0 ? '−' : '+' },
          ].map((k) => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '20px 22px' }}>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.8 }}>{k.label}</p>
              <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 }}>
                {k.sign}{formatCurrency(Math.abs(k.value))}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
          {[
            { label: 'Gasto médio mensal', value: data.gastoMedio },
            { label: 'Total investido', value: data.totalInvestido },
            { label: 'Despesas variáveis', value: data.variaveis },
          ].map((k) => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 22px' }}>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: '0 0 6px' }}>{k.label}</p>
              <p style={{ color: '#fff', fontSize: 17, fontWeight: 700, margin: 0 }}>{formatCurrency(k.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '28px 64px', borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 1 }}>Período</p>
          <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0 }}>{data.periodo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 1 }}>Gerado em</p>
          <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0 }}>{generatedAt}</p>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE 2 — Data Summary ────────────────────────────────────────────────────

function PageSummary({ data }: { data: ReportData }) {
  const maxCat   = Math.max(...data.categorias.map((c) => c.valor), 1);
  const maxMonth = Math.max(...data.evolucaoMensal.flatMap((m) => [m.receitas, m.despesas]), 1);
  const totalDespesasTipo = data.fixos + data.assinaturas + data.variaveis;

  return (
    <div id="report-page-1" style={{ width: 794, height: 1123, background: B.bg, boxSizing: 'border-box', overflow: 'hidden', padding: '48px 56px' }}>
      <SectionTitle color={B.primary}>Resumo Financeiro</SectionTitle>

      {/* Row 1: Main KPIs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <KpiCard label="Receitas"   value={data.receitas}       color={B.green}   bg="#16A34A12" />
        <KpiCard label="Despesas"   value={data.despesas}       color={B.red}     bg="#EF444412" />
        <KpiCard label="Saldo"      value={data.saldo}          color={data.saldo >= 0 ? B.green : B.red} bg={data.saldo >= 0 ? '#16A34A12' : '#EF444412'} note={data.saldo >= 0 ? 'positivo' : 'negativo'} />
        <KpiCard label="Investido"  value={data.totalInvestido} color={B.primary} bg="#0D5C7A12" />
      </div>

      {/* Row 2: Secondary KPIs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <KpiCard label="Gasto médio mensal" value={data.gastoMedio}   color={B.text} bg={B.bg} />
        <KpiCard label="Despesas fixas"     value={data.fixos}        color={B.amber} bg="#F59E0B12" />
        <KpiCard label="Assinaturas"        value={data.assinaturas}  color={B.violet} bg="#7C3AED12" />
        <KpiCard label="Variáveis"          value={data.variaveis}    color={B.red} bg="#EF444412" />
      </div>

      {/* Row 3: Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Categories */}
        <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: B.muted, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 14px' }}>Por Categoria</p>
          {data.categorias.slice(0, 7).map((cat) => (
            <ProgressBar key={cat.nome} label={cat.nome} value={cat.valor} max={maxCat} color={cat.color} />
          ))}
          {data.categorias.length === 0 && <p style={{ fontSize: 12, color: B.muted, textAlign: 'center', padding: 16 }}>Sem dados</p>}
        </div>

        {/* Monthly + Composition */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Monthly bars */}
          <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 14, padding: '18px 20px', flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: B.muted, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 14px' }}>Evolução Mensal</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 88 }}>
              {data.evolucaoMensal.slice(-6).map((m) => {
                const rH = maxMonth > 0 ? Math.max((m.receitas / maxMonth) * 72, 4) : 4;
                const dH = maxMonth > 0 ? Math.max((m.despesas / maxMonth) * 72, 4) : 4;
                return (
                  <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
                      <div style={{ width: 11, height: rH, borderRadius: '3px 3px 0 0', background: B.green }} />
                      <div style={{ width: 11, height: dH, borderRadius: '3px 3px 0 0', background: B.red }} />
                    </div>
                    <span style={{ fontSize: 9, color: B.muted }}>{m.mes}</span>
                  </div>
                );
              })}
              {data.evolucaoMensal.length === 0 && <p style={{ fontSize: 11, color: B.muted, margin: 'auto' }}>Sem dados</p>}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
              {[{ c: B.green, l: 'Receitas' }, { c: B.red, l: 'Despesas' }].map((x) => (
                <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 9, height: 9, borderRadius: 2, background: x.c }} />
                  <span style={{ fontSize: 10, color: B.muted }}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Composition */}
          <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 14, padding: '16px 20px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: B.muted, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 12px' }}>Composição das Despesas</p>
            {[
              { label: 'Fixas',       value: data.fixos,       color: B.amber  },
              { label: 'Assinaturas', value: data.assinaturas, color: B.violet },
              { label: 'Variáveis',   value: data.variaveis,   color: B.red    },
            ].map((t) => (
              <ProgressBar key={t.label} label={t.label} value={t.value} max={totalDespesasTipo || 1} color={t.color} />
            ))}
          </div>
        </div>
      </div>

      {/* Perfil investidor */}
      <div style={{ background: `${B.primary}0D`, border: `1px solid ${B.primary}25`, borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          <span style={{ fontSize: 11, color: B.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Perfil do investidor</span>
          <p style={{ fontSize: 15, fontWeight: 700, color: B.primary, margin: '2px 0 0', textTransform: 'capitalize' }}>{data.perfilInvestidor}</p>
        </div>
        <div style={{ width: 1, height: 36, background: B.border }} />
        <div>
          <span style={{ fontSize: 11, color: B.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Patrimônio investido</span>
          <p style={{ fontSize: 15, fontWeight: 700, color: B.primary, margin: '2px 0 0' }}>{formatCurrency(data.totalInvestido)}</p>
        </div>
        <div style={{ width: 1, height: 36, background: B.border }} />
        <div>
          <span style={{ fontSize: 11, color: B.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Taxa de poupança estimada</span>
          <p style={{ fontSize: 15, fontWeight: 700, color: data.saldo >= 0 ? B.green : B.red, margin: '2px 0 0' }}>
            {data.receitas > 0 ? `${((data.saldo / data.receitas) * 100).toFixed(1)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Page footer */}
      <PageFooter page={2} />
    </div>
  );
}

// ─── PAGE 3 — AI Analysis ────────────────────────────────────────────────────

function PageAIAnalysis({ ai }: { ai: FinancialReportAI }) {
  return (
    <div id="report-page-2" style={{ width: 794, height: 1123, background: B.bg, boxSizing: 'border-box', overflow: 'hidden', padding: '48px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 4, height: 22, borderRadius: 2, background: B.violet }} />
        <h2 style={{ fontSize: 17, fontWeight: 700, color: B.text, margin: 0 }}>Análise com Inteligência Artificial</h2>
        <div style={{ marginLeft: 8, background: '#7C3AED14', borderRadius: 99, padding: '3px 12px' }}>
          <span style={{ fontSize: 10, color: B.violet, fontWeight: 700 }}>✦ Gemini AI</span>
        </div>
      </div>

      {/* Resumo executivo */}
      <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: B.primary, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>Resumo Executivo</p>
        <AiText text={ai.resumoExecutivo} />
      </div>

      {/* Análise de gastos */}
      <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: B.amber, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>Análise de Gastos</p>
        <AiText text={ai.analiseGastos} />
      </div>

      {/* Tendência + análise categorias side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: B.blue, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>Tendência Mensal</p>
          <AiText text={ai.analiseTendencia ?? 'Sem dados históricos suficientes para análise de tendência.'} />
        </div>
        <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: B.green, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>Análise de Categorias</p>
          <AiText text={ai.analiseCategorias ?? 'Distribua seus gastos em categorias para uma análise detalhada.'} />
        </div>
      </div>

      <PageFooter page={3} />
    </div>
  );
}

// ─── PAGE 4 — Recommendations ────────────────────────────────────────────────

function PageRecommendations({ ai, data, generatedAt }: { ai: FinancialReportAI; data: ReportData; generatedAt: string }) {
  const tipoConfig = {
    positivo: { bg: '#16A34A0F', cor: B.green,  label: '✓ Positivo' },
    atencao:  { bg: '#F59E0B0F', cor: B.amber,  label: '⚠ Atenção'  },
    acao:     { bg: '#0D5C7A0F', cor: B.primary, label: '→ Ação'     },
  } as const;

  return (
    <div id="report-page-3" style={{ width: 794, height: 1123, background: B.bg, boxSizing: 'border-box', overflow: 'hidden', padding: '48px 56px' }}>
      <SectionTitle color={B.green}>Recomendações Personalizadas</SectionTitle>

      {/* Recommendation cards — 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        {ai.recomendacoes.map((rec, i) => {
          const cfg = tipoConfig[rec.tipo] ?? tipoConfig.acao;
          return (
            <div key={i} style={{ background: cfg.bg, border: `1px solid ${cfg.cor}30`, borderRadius: 14, padding: '16px 18px', boxSizing: 'border-box' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', background: `${cfg.cor}18`, borderRadius: 99, padding: '2px 10px', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: cfg.cor }}>{cfg.label}</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: B.text, margin: '0 0 6px' }}>{rec.titulo}</p>
              <p style={{ fontSize: 12, color: B.muted, lineHeight: 1.65, margin: 0 }}>{rec.texto}</p>
            </div>
          );
        })}
      </div>

      {/* Perspectiva */}
      <div style={{ background: `linear-gradient(135deg, ${B.primary}0D, ${B.primaryLight}0D)`, border: `1px solid ${B.primary}28`, borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: B.primary, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>Perspectiva e Próximos Passos</p>
        <AiText text={ai.perspectiva} />
      </div>

      {/* Final footer */}
      <div style={{ borderTop: `1px solid ${B.border}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: B.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 900 }}>T</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: B.primary }}>TaskAll</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: B.muted, margin: 0 }}>
            {data.nomeUsuario} · {data.periodo} · Gerado em {generatedAt}
          </p>
          <p style={{ fontSize: 10, color: B.muted, margin: '3px 0 0' }}>
            Análise baseada em Inteligência Artificial — não constitui consultoria financeira profissional
          </p>
        </div>
      </div>
    </div>
  );
}

function PageFooter({ page }: { page: number }) {
  return (
    <div style={{ position: 'absolute', bottom: 28, left: 56, right: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 10, color: B.muted }}>TaskAll · Relatório Financeiro</span>
      <span style={{ fontSize: 10, color: B.muted }}>Página {page} de 4</span>
    </div>
  );
}

// ─── Full Report (portal) ─────────────────────────────────────────────────────

function ReportPages({ data, ai, generatedAt }: { data: ReportData; ai: FinancialReportAI; generatedAt: string }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1, pointerEvents: 'none' }}>
      <PageCover    data={data} generatedAt={generatedAt} />
      <div style={{ position: 'relative' }}><PageSummary      data={data} /></div>
      <div style={{ position: 'relative' }}><PageAIAnalysis   ai={ai} /></div>
      <div style={{ position: 'relative' }}><PageRecommendations ai={ai} data={data} generatedAt={generatedAt} /></div>
    </div>
  );
}

// ─── Main Export Button ───────────────────────────────────────────────────────

interface FinancialReportExporterProps { data: ReportData }

export function FinancialReportExporter({ data }: FinancialReportExporterProps) {
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('idle');
  const [reportContent, setReportContent] = useState<{ ai: FinancialReportAI; generatedAt: string } | null>(null);
  const captureScheduled = useRef(false);

  // Trigger PDF capture after the portal has painted
  useEffect(() => {
    if (!reportContent || captureScheduled.current) return;
    captureScheduled.current = true;

    const timer = setTimeout(async () => {
      setLoadingStep('pdf');
      try {
        const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
          import('jspdf'),
          import('html2canvas'),
        ]);

        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const PAGE_IDS = ['report-page-0', 'report-page-1', 'report-page-2', 'report-page-3'];

        for (let i = 0; i < PAGE_IDS.length; i++) {
          const el = document.getElementById(PAGE_IDS[i]);
          if (!el) continue;

          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: i === 0 ? B.primary : B.bg,
            logging: false,
            width: 794,
            height: 1123,
          });

          if (i > 0) pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 210, 297);
        }

        const date = new Date().toISOString().slice(0, 10);
        pdf.save(`relatorio-financeiro-taskall-${date}.pdf`);

        setLoadingStep('done');
        setTimeout(() => {
          setLoadingStep('idle');
          setReportContent(null);
          captureScheduled.current = false;
        }, 2200);
      } catch (err) {
        console.error('PDF generation error:', err);
        setLoadingStep('error');
        setTimeout(() => {
          setLoadingStep('idle');
          setReportContent(null);
          captureScheduled.current = false;
        }, 3000);
      }
    }, 600); // Give React time to paint the portal

    return () => clearTimeout(timer);
  }, [reportContent]);

  const handleExport = async () => {
    if (loadingStep !== 'idle') return;
    captureScheduled.current = false;

    try {
      setLoadingStep('ai');
      const ai = await generateFinancialReportNarrative({
        nomeUsuario:      data.nomeUsuario,
        workspace:        data.workspace,
        periodo:          data.periodo,
        receitas:         data.receitas,
        despesas:         data.despesas,
        saldo:            data.saldo,
        gastoMedio:       data.gastoMedio,
        totalInvestido:   data.totalInvestido,
        perfilInvestidor: data.perfilInvestidor,
        fixos:            data.fixos,
        assinaturas:      data.assinaturas,
        variaveis:        data.variaveis,
        categorias:       data.categorias,
        evolucaoMensal:   data.evolucaoMensal,
      });

      setLoadingStep('render');
      const generatedAt = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
      });

      setReportContent({ ai, generatedAt });
    } catch (err) {
      console.error('Report AI error:', err);
      setLoadingStep('error');
      setTimeout(() => setLoadingStep('idle'), 3000);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleExport()}
        disabled={loadingStep !== 'idle'}
        className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all hover:shadow-sm disabled:opacity-50"
        style={{ borderColor: B.primary, color: B.primary, background: '#0D5C7A0D' }}
      >
        <FileText className="h-4 w-4" />
        Exportar relatório PDF
      </button>

      <LoadingModal step={loadingStep} />

      {reportContent &&
        createPortal(
          <ReportPages data={data} ai={reportContent.ai} generatedAt={reportContent.generatedAt} />,
          document.body,
        )}
    </>
  );
}
