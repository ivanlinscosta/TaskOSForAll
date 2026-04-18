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

const STEP_LABELS: Record<LoadingStep, string> = {
  idle:   '',
  ai:     'Analisando dados com Gemini AI…',
  render: 'Formatando relatório…',
  pdf:    'Gerando PDF…',
  done:   'Relatório pronto!',
  error:  'Erro ao gerar relatório',
};

// ─── Loading Modal ───────────────────────────────────────────────────────────

function LoadingModal({ step }: { step: LoadingStep }) {
  const open = step !== 'idle';
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
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: done ? '#0D5C7A12' : error ? '#EF444412' : '#0D5C7A12' }}
          >
            {done ? (
              <CheckCircle2 className="h-8 w-8" style={{ color: '#0D5C7A' }} />
            ) : error ? (
              <FileText className="h-8 w-8 text-red-500" />
            ) : step === 'ai' ? (
              <Sparkles className="h-8 w-8 animate-pulse" style={{ color: '#0D5C7A' }} />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#0D5C7A' }} />
            )}
          </div>

          <div>
            <p className="text-base font-semibold text-[var(--theme-foreground)]">
              {done ? 'Download iniciado!' : error ? 'Algo deu errado' : 'Gerando relatório'}
            </p>
            <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">
              {STEP_LABELS[step]}
            </p>
          </div>

          {/* Progress bar */}
          {!done && !error && (
            <div className="w-full rounded-full bg-[var(--theme-muted)] h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  background: '#0D5C7A',
                  width: step === 'ai' ? '40%' : step === 'render' ? '70%' : step === 'pdf' ? '90%' : '0%',
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Report Template (off-screen) ───────────────────────────────────────────

const BRAND = {
  primary: '#0D5C7A',
  primaryLight: '#1280A8',
  bg: '#F4F3EF',
  card: '#FFFFFF',
  text: '#061F2A',
  muted: '#7A7068',
  border: '#EDEAE4',
  green: '#16A34A',
  red: '#EF4444',
  amber: '#F59E0B',
  violet: '#7C3AED',
};

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: BRAND.muted, textTransform: 'capitalize' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: BRAND.text }}>{formatCurrency(value)}</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: '#EDEAE4', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color }} />
      </div>
    </div>
  );
}

function MonthBar({ mes, receitas, despesas, maxVal }: { mes: string; receitas: number; despesas: number; maxVal: number }) {
  const rPct = maxVal > 0 ? (receitas / maxVal) * 100 : 0;
  const dPct = maxVal > 0 ? (despesas / maxVal) * 100 : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 80 }}>
        <div style={{ width: 14, height: `${rPct}%`, minHeight: 4, borderRadius: '4px 4px 0 0', background: BRAND.green }} />
        <div style={{ width: 14, height: `${dPct}%`, minHeight: 4, borderRadius: '4px 4px 0 0', background: BRAND.red }} />
      </div>
      <span style={{ fontSize: 9, color: BRAND.muted, textAlign: 'center' }}>{mes}</span>
    </div>
  );
}

interface ReportTemplateProps {
  data: ReportData;
  ai: FinancialReportAI;
  generatedAt: string;
}

function ReportTemplate({ data, ai, generatedAt }: ReportTemplateProps) {
  const maxCat = Math.max(...data.categorias.map((c) => c.valor), 1);
  const maxMonth = Math.max(...data.evolucaoMensal.flatMap((m) => [m.receitas, m.despesas]), 1);

  const tipoConfig = {
    positivo: { bg: '#16A34A12', cor: '#16A34A', label: '✓ Positivo' },
    atencao:  { bg: '#F59E0B12', cor: '#F59E0B', label: '⚠ Atenção' },
    acao:     { bg: '#0D5C7A12', cor: '#0D5C7A', label: '→ Ação' },
  } as const;

  const saldoPositivo = data.saldo >= 0;

  return (
    <div
      id="financial-report-template"
      style={{
        width: 794,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: BRAND.bg,
        color: BRAND.text,
      }}
    >
      {/* ── COVER PAGE ──────────────────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          minHeight: 400,
          background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryLight} 100%)`,
          padding: '56px 64px 48px',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 60 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>T</span>
          </div>
          <span style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>TaskAll</span>
        </div>

        <div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 2 }}>
            Relatório Financeiro
          </p>
          <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.1 }}>
            Análise Financeira<br />Personalizada
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, margin: 0 }}>
            {data.nomeUsuario} · {data.workspace === 'work' ? 'Trabalho' : 'Vida Pessoal'}
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', margin: '40px 0 24px' }} />

        <div style={{ display: 'flex', gap: 40 }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Período</p>
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{data.periodo}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Gerado em</p>
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{generatedAt}</p>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <div style={{ padding: '48px 64px', boxSizing: 'border-box' }}>

        {/* SECTION: Resumo Executivo */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 4, height: 22, borderRadius: 2, background: BRAND.primary }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: BRAND.text, margin: 0 }}>Resumo Executivo</h2>
          </div>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Receitas', value: data.receitas, color: BRAND.green, bg: '#16A34A12' },
              { label: 'Despesas', value: data.despesas, color: BRAND.red, bg: '#EF444412' },
              { label: 'Saldo', value: data.saldo, color: saldoPositivo ? BRAND.green : BRAND.red, bg: saldoPositivo ? '#16A34A12' : '#EF444412' },
              { label: 'Investido', value: data.totalInvestido, color: BRAND.primary, bg: '#0D5C7A12' },
            ].map((kpi) => (
              <div key={kpi.label} style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: '14px 16px', boxSizing: 'border-box' }}>
                <p style={{ fontSize: 11, color: BRAND.muted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.8 }}>{kpi.label}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: kpi.color, margin: 0 }}>
                  {kpi.label === 'Saldo' && data.saldo < 0 ? '- ' : ''}{formatCurrency(Math.abs(kpi.value))}
                </p>
              </div>
            ))}
          </div>

          {/* Secondary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Gasto médio mensal', value: data.gastoMedio },
              { label: 'Despesas fixas', value: data.fixos },
              { label: 'Assinaturas', value: data.assinaturas },
            ].map((k) => (
              <div key={k.label} style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: '14px 16px', boxSizing: 'border-box' }}>
                <p style={{ fontSize: 11, color: BRAND.muted, margin: '0 0 6px' }}>{k.label}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: BRAND.text, margin: 0 }}>{formatCurrency(k.value)}</p>
              </div>
            ))}
          </div>

          {/* AI Resumo */}
          <div style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: '20px 24px', boxSizing: 'border-box' }}>
            {ai.resumoExecutivo.split('\n').filter(Boolean).map((p, i) => (
              <p key={i} style={{ fontSize: 13, color: BRAND.text, lineHeight: 1.7, margin: i > 0 ? '12px 0 0' : 0 }}>{p}</p>
            ))}
          </div>
        </div>

        {/* SECTION: Distribuição & Evolução */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 48 }}>

          {/* Categories */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 4, height: 18, borderRadius: 2, background: BRAND.amber }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: BRAND.text, margin: 0 }}>Por Categoria</h3>
            </div>
            <div style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: '16px 20px', boxSizing: 'border-box' }}>
              {data.categorias.slice(0, 8).map((cat) => (
                <MiniBar key={cat.nome} label={cat.nome} value={cat.valor} max={maxCat} color={cat.color} />
              ))}
              {data.categorias.length === 0 && (
                <p style={{ fontSize: 12, color: BRAND.muted, textAlign: 'center', padding: '16px 0' }}>Sem categorias no período</p>
              )}
            </div>
          </div>

          {/* Monthly chart */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 4, height: 18, borderRadius: 2, background: BRAND.violet }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: BRAND.text, margin: 0 }}>Evolução Mensal</h3>
            </div>
            <div style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: '20px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, paddingBottom: 20 }}>
                {data.evolucaoMensal.slice(-8).map((m) => (
                  <MonthBar key={m.mes} mes={m.mes} receitas={m.receitas} despesas={m.despesas} maxVal={maxMonth} />
                ))}
                {data.evolucaoMensal.length === 0 && (
                  <p style={{ fontSize: 12, color: BRAND.muted, margin: 'auto' }}>Sem dados</p>
                )}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: BRAND.green }} />
                  <span style={{ fontSize: 10, color: BRAND.muted }}>Receitas</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: BRAND.red }} />
                  <span style={{ fontSize: 10, color: BRAND.muted }}>Despesas</span>
                </div>
              </div>

              {/* Tipos despesa */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BRAND.border}` }}>
                <p style={{ fontSize: 11, color: BRAND.muted, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Composição das despesas</p>
                {[
                  { label: 'Fixas', value: data.fixos, color: BRAND.amber },
                  { label: 'Assinaturas', value: data.assinaturas, color: BRAND.violet },
                  { label: 'Variáveis', value: data.variaveis, color: BRAND.red },
                ].map((t) => (
                  <MiniBar key={t.label} label={t.label} value={t.value} max={data.despesas || 1} color={t.color} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: Análise com IA */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 4, height: 22, borderRadius: 2, background: BRAND.violet }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: BRAND.text, margin: 0 }}>Análise com Inteligência Artificial</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 8, background: '#7C3AED12', borderRadius: 99, padding: '3px 10px' }}>
              <span style={{ fontSize: 10, color: BRAND.violet, fontWeight: 600 }}>✦ Gemini AI</span>
            </div>
          </div>

          {/* Análise de gastos */}
          <div style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 16, boxSizing: 'border-box' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>Análise de Gastos</p>
            {ai.analiseGastos.split('\n').filter(Boolean).map((p, i) => (
              <p key={i} style={{ fontSize: 13, color: BRAND.text, lineHeight: 1.7, margin: i > 0 ? '10px 0 0' : 0 }}>{p}</p>
            ))}
          </div>

          {/* Recommendations */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
            {ai.recomendacoes.map((rec, i) => {
              const cfg = tipoConfig[rec.tipo] ?? tipoConfig.acao;
              return (
                <div key={i} style={{ background: cfg.bg, border: `1px solid ${cfg.cor}30`, borderRadius: 12, padding: '14px 16px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.cor, background: `${cfg.cor}20`, borderRadius: 99, padding: '2px 8px' }}>
                      {cfg.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: BRAND.text, margin: '0 0 5px' }}>{rec.titulo}</p>
                  <p style={{ fontSize: 12, color: BRAND.muted, lineHeight: 1.6, margin: 0 }}>{rec.texto}</p>
                </div>
              );
            })}
          </div>

          {/* Perspectiva */}
          <div style={{ background: `linear-gradient(135deg, ${BRAND.primary}0D, ${BRAND.primaryLight}0D)`, border: `1px solid ${BRAND.primary}30`, borderRadius: 12, padding: '20px 24px', boxSizing: 'border-box' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: BRAND.primary, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>Perspectiva</p>
            <p style={{ fontSize: 13, color: BRAND.text, lineHeight: 1.7, margin: 0 }}>{ai.perspectiva}</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 11, color: BRAND.muted, margin: 0 }}>
            Gerado pelo <strong style={{ color: BRAND.primary }}>TaskAll</strong> · {generatedAt}
          </p>
          <p style={{ fontSize: 11, color: BRAND.muted, margin: 0 }}>
            Análise baseada em IA — não constitui consultoria financeira
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export Button Component ────────────────────────────────────────────

interface FinancialReportExporterProps {
  data: ReportData;
}

export function FinancialReportExporter({ data }: FinancialReportExporterProps) {
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('idle');
  const [reportContent, setReportContent] = useState<{ ai: FinancialReportAI; generatedAt: string } | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const captureReady = useRef(false);

  // When report content is set → wait one tick for DOM to paint → capture
  useEffect(() => {
    if (!reportContent || !captureReady.current) return;
    captureReady.current = false;

    const run = async () => {
      setLoadingStep('pdf');
      try {
        const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
          import('jspdf'),
          import('html2canvas'),
        ]);

        const el = document.getElementById('financial-report-template');
        if (!el) throw new Error('Template element not found');

        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: BRAND.bg,
          logging: false,
          windowWidth: 794,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.93);
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const pdfW  = pdf.internal.pageSize.getWidth();
        const pdfH  = pdf.internal.pageSize.getHeight();
        const ratio = pdfW / canvas.width;
        const totalH = canvas.height * ratio;

        let offset = 0;
        while (offset < totalH) {
          if (offset > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, -offset, pdfW, totalH);
          offset += pdfH;
        }

        const date = new Date().toISOString().slice(0, 10);
        pdf.save(`relatorio-financeiro-taskall-${date}.pdf`);
        setLoadingStep('done');
        setTimeout(() => {
          setLoadingStep('idle');
          setReportContent(null);
        }, 2000);
      } catch (err) {
        console.error(err);
        setLoadingStep('error');
        setTimeout(() => { setLoadingStep('idle'); setReportContent(null); }, 3000);
      }
    };

    void run();
  }, [reportContent]);

  // Mark capture ready after template is painted
  const handleTemplateRef = (node: HTMLDivElement | null) => {
    (captureRef as any).current = node;
    if (node && reportContent) {
      captureReady.current = true;
      // Trigger effect re-run via a micro-task
      setTimeout(() => {
        if (captureReady.current) {
          captureReady.current = false;
          setReportContent((prev) => prev ? { ...prev } : prev);
        }
      }, 300);
    }
  };

  const handleExport = async () => {
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
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });

      captureReady.current = true;
      setReportContent({ ai, generatedAt });
    } catch (err) {
      console.error(err);
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
        style={{
          borderColor: BRAND.primary,
          color: BRAND.primary,
          background: '#0D5C7A0D',
        }}
      >
        <FileText className="h-4 w-4" />
        Exportar relatório PDF
      </button>

      <LoadingModal step={loadingStep} />

      {/* Off-screen template rendered only when needed */}
      {reportContent &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: '-9999px',
              zIndex: -1,
              pointerEvents: 'none',
            }}
          >
            <div ref={handleTemplateRef}>
              <ReportTemplate data={data} ai={reportContent.ai} generatedAt={reportContent.generatedAt} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
