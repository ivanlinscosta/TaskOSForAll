import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, FileText, Loader2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import {
  generateFinancialReportNarrative,
  type FinancialReportAI,
} from '../../../lib/openai-service';
import { formatCurrency } from '../../../lib/utils';
import logoPrincipal from '../../../assets/taskall_new_brand/logo_principal.svg';

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
  primaryDark:  '#094A62',
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

// Page dimensions (A4 at 96dpi)
const PW = 794;   // page width px
const PH = 1123;  // page height px
const PAD = 44;   // horizontal padding px

// ─── Loading Modal ───────────────────────────────────────────────────────────

const STEP_LABELS: Record<LoadingStep, string> = {
  idle:   '',
  ai:     'Analisando dados com Gemini AI…',
  render: 'Formatando relatório…',
  pdf:    'Gerando PDF…',
  done:   'Download iniciando…',
  error:  'Erro ao gerar. Tente novamente.',
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
            {done  ? <CheckCircle2 className="h-8 w-8" style={{ color: B.primary }} />
           : error ? <FileText    className="h-8 w-8 text-red-500" />
           : step === 'ai' ? <Sparkles className="h-8 w-8 animate-pulse" style={{ color: B.primary }} />
           : <Loader2 className="h-8 w-8 animate-spin" style={{ color: B.primary }} />}
          </div>
          <div>
            <p className="text-base font-semibold text-[var(--theme-foreground)]">
              {done ? 'Relatório pronto!' : error ? 'Algo deu errado' : 'Gerando relatório'}
            </p>
            <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">{STEP_LABELS[step]}</p>
          </div>
          {!error && (
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--theme-muted)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                   style={{ background: B.primary, width: `${STEP_PCT[step]}%` }} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Shared atoms ────────────────────────────────────────────────────────────

function PBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: B.muted, textTransform: 'capitalize' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: B.text }}>{formatCurrency(value)}</span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: '#E5E3DE', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color }} />
      </div>
    </div>
  );
}

function AiBlock({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').filter(Boolean).map((p, i) => (
        <p key={i} style={{ fontSize: 12.5, color: B.text, lineHeight: 1.78, margin: i > 0 ? '9px 0 0' : 0 }}>{p}</p>
      ))}
    </>
  );
}

/** Shared page footer bar */
function PageFooterBar({ page, total = 4, name, periodo }: { page: number; total?: number; name: string; periodo: string }) {
  return (
    <div style={{
      marginTop: 'auto',
      background: B.primary,
      borderRadius: 10,
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>
        <span style={{ fontWeight: 700, color: '#fff' }}>TaskAll</span> · {name} · {periodo}
      </span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
        Página {page} de {total} · Análise não constitui consultoria financeira
      </span>
    </div>
  );
}

// ─── PAGE 1 — Cover ──────────────────────────────────────────────────────────

function PageCover({ data, generatedAt }: { data: ReportData; generatedAt: string }) {
  return (
    <div id="report-page-0" style={{
      width: PW, height: PH, boxSizing: 'border-box', overflow: 'hidden',
      background: `linear-gradient(145deg, ${B.primaryDark} 0%, ${B.primary} 45%, ${B.primaryLight} 100%)`,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: `48px ${PAD}px 0` }}>
        <img src={logoPrincipal} alt="TaskAll" style={{ height: 36, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
      </div>

      {/* Hero text */}
      <div style={{ padding: `56px ${PAD}px 0`, flex: 1 }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: 3.5, textTransform: 'uppercase', margin: '0 0 16px' }}>
          Relatório Financeiro
        </p>
        <h1 style={{ color: '#fff', fontSize: 44, fontWeight: 900, lineHeight: 1.1, margin: '0 0 14px' }}>
          Análise Financeira<br />Personalizada
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, margin: 0 }}>
          {data.nomeUsuario} · {data.workspace === 'work' ? 'Trabalho' : 'Vida Pessoal'}
        </p>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.18)', margin: '44px 0 36px' }} />

        {/* KPI grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 14 }}>
          {[
            { l: 'Receitas totais',   v: data.receitas,  sign: '' },
            { l: 'Despesas totais',   v: data.despesas,  sign: '' },
            { l: 'Saldo do período',  v: data.saldo,     sign: data.saldo >= 0 ? '+' : '−' },
          ].map(k => (
            <div key={k.l} style={{ background: 'rgba(255,255,255,0.13)', borderRadius: 14, padding: '18px 20px' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.9 }}>{k.l}</p>
              <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 }}>{k.sign}{formatCurrency(Math.abs(k.v))}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[
            { l: 'Gasto médio mensal', v: data.gastoMedio },
            { l: 'Total investido',    v: data.totalInvestido },
            { l: 'Despesas variáveis', v: data.variaveis },
          ].map(k => (
            <div key={k.l} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 20px' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 6px' }}>{k.l}</p>
              <p style={{ color: '#fff', fontSize: 17, fontWeight: 700, margin: 0 }}>{formatCurrency(k.v)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cover footer */}
      <div style={{ padding: `24px ${PAD}px 36px`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 1 }}>Período</p>
          <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0 }}>{data.periodo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 1 }}>Gerado em</p>
          <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0 }}>{generatedAt}</p>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE 2 — Financial Summary ──────────────────────────────────────────────

function PageSummary({ data }: { data: ReportData }) {
  const maxCat   = Math.max(...data.categorias.map(c => c.valor), 1);
  const maxMonth = Math.max(...data.evolucaoMensal.flatMap(m => [m.receitas, m.despesas]), 1);
  const totalTipo = data.fixos + data.assinaturas + data.variaveis || 1;
  const taxaPoupanca = data.receitas > 0 ? ((data.saldo / data.receitas) * 100).toFixed(1) : '—';

  const kpiRows = [
    [
      { l: 'Receitas',   v: data.receitas,       cor: B.green,   note: undefined },
      { l: 'Despesas',   v: data.despesas,        cor: B.red,     note: undefined },
      { l: 'Saldo',      v: data.saldo,           cor: data.saldo >= 0 ? B.green : B.red, note: data.saldo >= 0 ? 'positivo' : 'negativo' },
      { l: 'Investido',  v: data.totalInvestido,  cor: B.primary, note: undefined },
    ],
    [
      { l: 'Gasto médio / mês', v: data.gastoMedio,   cor: B.text,   note: undefined },
      { l: 'Despesas fixas',    v: data.fixos,         cor: B.amber,  note: undefined },
      { l: 'Assinaturas',       v: data.assinaturas,   cor: B.violet, note: undefined },
      { l: 'Variáveis',         v: data.variaveis,     cor: B.red,    note: undefined },
    ],
  ];

  const cardW = `${(PW - PAD * 2 - 3 * 10) / 4}px`;

  return (
    <div id="report-page-1" style={{
      width: PW, height: PH, background: B.bg, boxSizing: 'border-box', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', padding: `40px ${PAD}px 28px`,
    }}>
      {/* Section title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 4, height: 20, borderRadius: 2, background: B.primary }} />
        <h2 style={{ fontSize: 16, fontWeight: 700, color: B.text, margin: 0 }}>Resumo Financeiro</h2>
      </div>

      {/* KPI rows */}
      {kpiRows.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          {row.map(k => (
            <div key={k.l} style={{ width: cardW, background: B.card, border: `1px solid ${B.border}`, borderRadius: 11, padding: '12px 14px', boxSizing: 'border-box', flexShrink: 0 }}>
              <p style={{ fontSize: 9.5, color: B.muted, margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: 0.7, whiteSpace: 'nowrap' }}>{k.l}</p>
              <p style={{ fontSize: 17, fontWeight: 800, color: k.cor, margin: 0, whiteSpace: 'nowrap' }}>{formatCurrency(Math.abs(k.v))}</p>
              {k.note && <p style={{ fontSize: 9.5, color: B.muted, margin: '3px 0 0' }}>{k.note}</p>}
            </div>
          ))}
        </div>
      ))}

      {/* Two-column section — fills remaining space */}
      <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0, marginBottom: 10, marginTop: 4 }}>

        {/* Categories */}
        <div style={{ flex: 1, background: B.card, border: `1px solid ${B.border}`, borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: B.muted, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 12px' }}>Por Categoria</p>
          <div style={{ flex: 1 }}>
            {data.categorias.slice(0, 8).map(cat => (
              <PBar key={cat.nome} label={cat.nome} value={cat.valor} max={maxCat} color={cat.color} />
            ))}
            {data.categorias.length === 0 && (
              <p style={{ fontSize: 12, color: B.muted, textAlign: 'center', marginTop: 24 }}>Sem categorias no período</p>
            )}
          </div>
        </div>

        {/* Right column: chart + composition */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Monthly chart */}
          <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 12, padding: '16px 18px', flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: B.muted, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 12px' }}>Evolução Mensal</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90, marginBottom: 8 }}>
              {data.evolucaoMensal.slice(-6).map(m => {
                const rH = Math.max((m.receitas / maxMonth) * 76, 4);
                const dH = Math.max((m.despesas / maxMonth) * 76, 4);
                return (
                  <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
                      <div style={{ width: 13, height: rH, borderRadius: '3px 3px 0 0', background: B.green }} />
                      <div style={{ width: 13, height: dH, borderRadius: '3px 3px 0 0', background: B.red }} />
                    </div>
                    <span style={{ fontSize: 9, color: B.muted }}>{m.mes}</span>
                  </div>
                );
              })}
              {data.evolucaoMensal.length === 0 && (
                <p style={{ fontSize: 11, color: B.muted, margin: 'auto' }}>Sem dados</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              {[{ c: B.green, l: 'Receitas' }, { c: B.red, l: 'Despesas' }].map(x => (
                <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 9, height: 9, borderRadius: 2, background: x.c }} />
                  <span style={{ fontSize: 10, color: B.muted }}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Composition */}
          <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 12, padding: '16px 18px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: B.muted, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 10px' }}>Composição das Despesas</p>
            {[
              { label: 'Fixas',       value: data.fixos,       color: B.amber  },
              { label: 'Assinaturas', value: data.assinaturas, color: B.violet },
              { label: 'Variáveis',   value: data.variaveis,   color: B.red    },
            ].map(t => <PBar key={t.label} label={t.label} value={t.value} max={totalTipo} color={t.color} />)}
          </div>
        </div>
      </div>

      {/* Investor strip */}
      <div style={{ background: `${B.primary}0D`, border: `1px solid ${B.primary}22`, borderRadius: 10, padding: '11px 18px', display: 'flex', gap: 28, alignItems: 'center', marginBottom: 12 }}>
        {[
          { l: 'Perfil do investidor', v: data.perfilInvestidor, cor: B.primary },
          { l: 'Patrimônio investido',  v: formatCurrency(data.totalInvestido), cor: B.primary },
          { l: 'Taxa de poupança', v: `${taxaPoupanca}%`, cor: Number(taxaPoupanca) >= 20 ? B.green : B.red },
          { l: 'Período analisado', v: data.periodo, cor: B.text },
        ].map((k, i) => (
          <div key={k.l} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {i > 0 && <div style={{ width: 1, height: 28, background: B.border }} />}
            <div>
              <p style={{ fontSize: 9.5, color: B.muted, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.7 }}>{k.l}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: k.cor, margin: 0, textTransform: 'capitalize' }}>{k.v}</p>
            </div>
          </div>
        ))}
      </div>

      <PageFooterBar page={2} name={data.nomeUsuario} periodo={data.periodo} />
    </div>
  );
}

// ─── PAGE 3 — AI Analysis ────────────────────────────────────────────────────

function PageAIAnalysis({ ai, data }: { ai: FinancialReportAI; data: ReportData }) {
  return (
    <div id="report-page-2" style={{
      width: PW, height: PH, background: B.bg, boxSizing: 'border-box', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', padding: `40px ${PAD}px 28px`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 4, height: 20, borderRadius: 2, background: B.violet }} />
        <h2 style={{ fontSize: 16, fontWeight: 700, color: B.text, margin: 0 }}>Análise com Inteligência Artificial</h2>
        <div style={{ marginLeft: 8, background: '#7C3AED14', borderRadius: 99, padding: '3px 12px' }}>
          <span style={{ fontSize: 9.5, color: B.violet, fontWeight: 700, letterSpacing: 0.5 }}>✦ GEMINI AI</span>
        </div>
      </div>

      {/* Resumo executivo — fills most of the page */}
      <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 12, padding: '18px 22px', marginBottom: 12, flex: 2 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: B.primary, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 11px' }}>Resumo Executivo</p>
        <AiBlock text={ai.resumoExecutivo} />
      </div>

      {/* Análise de gastos */}
      <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 12, padding: '18px 22px', marginBottom: 12, flex: 1.5 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: B.amber, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 11px' }}>Análise de Gastos</p>
        <AiBlock text={ai.analiseGastos} />
      </div>

      {/* Tendência + Categorias — side by side */}
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0, marginBottom: 12 }}>
        <div style={{ flex: 1, background: B.card, border: `1px solid ${B.border}`, borderRadius: 12, padding: '16px 18px', overflow: 'hidden' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: B.blue, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>Tendência Mensal</p>
          <AiBlock text={ai.analiseTendencia ?? 'Adicione dados de mais meses para análise de tendência.'} />
        </div>
        <div style={{ flex: 1, background: B.card, border: `1px solid ${B.border}`, borderRadius: 12, padding: '16px 18px', overflow: 'hidden' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: B.green, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>Análise de Categorias</p>
          <AiBlock text={ai.analiseCategorias ?? 'Categorize suas despesas para análise detalhada.'} />
        </div>
      </div>

      <PageFooterBar page={3} name={data.nomeUsuario} periodo={data.periodo} />
    </div>
  );
}

// ─── PAGE 4 — Recommendations ────────────────────────────────────────────────

function PageRecommendations({ ai, data }: { ai: FinancialReportAI; data: ReportData }) {
  const tipoConfig = {
    positivo: { bg: '#16A34A0E', cor: B.green,   label: '✓ Positivo' },
    atencao:  { bg: '#F59E0B0E', cor: B.amber,   label: '⚠ Atenção'  },
    acao:     { bg: '#0D5C7A0E', cor: B.primary, label: '→ Ação'     },
  } as const;

  return (
    <div id="report-page-3" style={{
      width: PW, height: PH, background: B.bg, boxSizing: 'border-box', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', padding: `40px ${PAD}px 28px`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 4, height: 20, borderRadius: 2, background: B.green }} />
        <h2 style={{ fontSize: 16, fontWeight: 700, color: B.text, margin: 0 }}>Recomendações Personalizadas</h2>
      </div>

      {/* Recommendation cards — 2 columns, grows to fill */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, marginBottom: 14, alignContent: 'start' }}>
        {ai.recomendacoes.map((rec, i) => {
          const cfg = tipoConfig[rec.tipo] ?? tipoConfig.acao;
          return (
            <div key={i} style={{ background: cfg.bg, border: `1px solid ${cfg.cor}2A`, borderRadius: 12, padding: '15px 17px', boxSizing: 'border-box' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', background: `${cfg.cor}1A`, borderRadius: 99, padding: '2px 10px', marginBottom: 8 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: cfg.cor }}>{cfg.label}</span>
              </div>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: B.text, margin: '0 0 6px', lineHeight: 1.3 }}>{rec.titulo}</p>
              <p style={{ fontSize: 11.5, color: B.muted, lineHeight: 1.65, margin: 0 }}>{rec.texto}</p>
            </div>
          );
        })}
      </div>

      {/* Perspectiva */}
      <div style={{ background: `linear-gradient(135deg, ${B.primary}0C, ${B.primaryLight}0C)`, border: `1px solid ${B.primary}25`, borderRadius: 12, padding: '18px 22px', marginBottom: 14 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: B.primary, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 11px' }}>Perspectiva e Próximos Passos</p>
        <AiBlock text={ai.perspectiva} />
      </div>

      <PageFooterBar page={4} name={data.nomeUsuario} periodo={data.periodo} />
    </div>
  );
}

// ─── Portal wrapper ───────────────────────────────────────────────────────────

function ReportPortal({ data, ai, generatedAt }: { data: ReportData; ai: FinancialReportAI; generatedAt: string }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1, pointerEvents: 'none', visibility: 'hidden' }}>
      <PageCover           data={data} generatedAt={generatedAt} />
      <PageSummary         data={data} />
      <PageAIAnalysis      ai={ai}     data={data} />
      <PageRecommendations ai={ai}     data={data} />
    </div>
  );
}

// ─── Main Export Button ───────────────────────────────────────────────────────

export function FinancialReportExporter({ data }: { data: ReportData }) {
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('idle');
  const [reportContent, setReportContent] = useState<{ ai: FinancialReportAI; generatedAt: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!reportContent) return;

    timerRef.current = setTimeout(async () => {
      setLoadingStep('pdf');
      try {
        const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
          import('jspdf'),
          import('html2canvas'),
        ]);

        const pdf  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const PAGE_IDS = ['report-page-0', 'report-page-1', 'report-page-2', 'report-page-3'];

        for (let i = 0; i < PAGE_IDS.length; i++) {
          const el = document.getElementById(PAGE_IDS[i]);
          if (!el) continue;

          // Make visible briefly for capture
          (el.parentElement as HTMLElement).style.visibility = 'visible';

          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: i === 0 ? B.primaryDark : B.bg,
            logging: false,
            width: PW,
            height: PH,
          });

          (el.parentElement as HTMLElement).style.visibility = 'hidden';

          if (i > 0) pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
        }

        pdf.save(`relatorio-financeiro-taskall-${new Date().toISOString().slice(0, 10)}.pdf`);
        setLoadingStep('done');

        setTimeout(() => {
          setLoadingStep('idle');
          setReportContent(null);
        }, 2200);
      } catch (err) {
        console.error('PDF error:', err);
        setLoadingStep('error');
        setTimeout(() => {
          setLoadingStep('idle');
          setReportContent(null);
        }, 3000);
      }
    }, 700);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [reportContent]);

  const handleExport = async () => {
    if (loadingStep !== 'idle') return;
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
      const generatedAt = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      setReportContent({ ai, generatedAt });
    } catch (err) {
      console.error('Report error:', err);
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

      {reportContent && createPortal(
        <ReportPortal data={data} ai={reportContent.ai} generatedAt={reportContent.generatedAt} />,
        document.body,
      )}
    </>
  );
}
