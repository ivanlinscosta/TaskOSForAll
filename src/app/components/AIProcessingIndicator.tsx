/**
 * Indicador visual para processamento de IA (Gemini).
 *
 * Troca o "loader travado" por:
 *  - Orb animado com gradiente + partículas pulsando
 *  - Barra de progresso indeterminada
 *  - Mensagens rotativas ("thinking steps") que sinalizam vida
 *
 * Uso:
 *   <AIProcessingIndicator
 *     title="Analisando sua fatura"
 *     steps={['Lendo o PDF…', 'Classificando gastos…', 'Organizando categorias…']}
 *   />
 */
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface AIProcessingIndicatorProps {
  title?: string;
  subtitle?: string;
  steps?: string[];
  /** Intervalo entre trocas de step (ms) */
  stepIntervalMs?: number;
}

const DEFAULT_STEPS = [
  'Conectando ao Gemini…',
  'Analisando os dados…',
  'Organizando as informações…',
  'Quase pronto…',
];

export function AIProcessingIndicator({
  title = 'Processando com IA',
  subtitle,
  steps = DEFAULT_STEPS,
  stepIntervalMs = 2500,
}: AIProcessingIndicatorProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setStepIdx((i) => (i + 1) % steps.length);
    }, stepIntervalMs);
    return () => clearInterval(t);
  }, [steps.length, stepIntervalMs]);

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10 px-4 w-full">
      {/* Orb animado */}
      <div className="relative h-24 w-24">
        {/* pulso externo */}
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ background: 'var(--theme-accent)' }}
        />
        {/* anel rotativo */}
        <div
          className="absolute inset-2 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, var(--theme-accent), transparent, var(--theme-accent))`,
            animation: 'ai-spin 2.5s linear infinite',
          }}
        />
        {/* núcleo */}
        <div
          className="absolute inset-4 rounded-full flex items-center justify-center"
          style={{
            background: 'var(--theme-background)',
            boxShadow: '0 0 24px var(--theme-accent)',
          }}
        >
          <Sparkles
            className="h-7 w-7"
            style={{ color: 'var(--theme-accent)', animation: 'ai-pulse 1.6s ease-in-out infinite' }}
          />
        </div>
      </div>

      {/* Título */}
      <div className="text-center space-y-1">
        <p className="font-semibold text-[var(--theme-foreground)]">{title}</p>
        {subtitle && (
          <p className="text-sm text-[var(--theme-muted-foreground)]">{subtitle}</p>
        )}
      </div>

      {/* Barra de progresso indeterminada */}
      <div
        className="relative h-1.5 w-full max-w-sm overflow-hidden rounded-full"
        style={{ background: 'var(--theme-muted)' }}
      >
        <div
          className="absolute top-0 h-full w-1/3 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, var(--theme-accent), transparent)`,
            animation: 'ai-slide 1.8s ease-in-out infinite',
          }}
        />
      </div>

      {/* Step atual */}
      <div className="h-5 text-sm text-[var(--theme-muted-foreground)] transition-opacity">
        <span key={stepIdx} style={{ animation: 'ai-fade 0.4s ease' }}>
          {steps[stepIdx]}
        </span>
      </div>

      {/* Tempo decorrido */}
      {elapsed > 6 && (
        <p className="text-xs text-[var(--theme-muted-foreground)] opacity-70">
          {elapsed}s · o Gemini está processando, isso pode levar alguns instantes
        </p>
      )}

      <style>{`
        @keyframes ai-spin { to { transform: rotate(360deg); } }
        @keyframes ai-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
        @keyframes ai-slide {
          0% { left: -33%; }
          100% { left: 100%; }
        }
        @keyframes ai-fade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
