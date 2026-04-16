import { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, Lightbulb, PiggyBank } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../lib/firebase-config';

type TipoRecomendacao = 'alerta' | 'dica' | 'economia';

interface Recomendacao {
  titulo: string;
  descricao: string;
  tipo: TipoRecomendacao;
}

interface InsightsResult {
  recomendacoes: Recomendacao[];
}

const TIPO_CONFIG: Record<TipoRecomendacao, { cor: string; bg: string; Icon: React.ElementType; label: string }> = {
  alerta:   { cor: '#EF4444', bg: '#EF444412', Icon: AlertTriangle, label: 'Alerta'   },
  dica:     { cor: '#3B82F6', bg: '#3B82F612', Icon: Lightbulb,     label: 'Dica'     },
  economia: { cor: '#10B981', bg: '#10B98112', Icon: PiggyBank,     label: 'Economia' },
};

interface InsightsPanelProps {
  contexto: 'visao' | 'despesas' | 'cartao';
  resumo: string;
}

export function InsightsPanel({ contexto, resumo }: InsightsPanelProps) {
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const atualizar = async () => {
    if (!resumo.trim()) return;
    setIsLoading(true);
    setErro(null);
    try {
      const functions = getFunctions(app, 'us-central1');
      const call = httpsCallable<{ resumo: string; contexto: string }, InsightsResult>(
        functions,
        'financasInsightsCallable'
      );
      const result = await call({ resumo, contexto });
      setRecomendacoes(result.data.recomendacoes ?? []);
    } catch (err) {
      console.error('Insights error:', err);
      setErro('Não foi possível gerar recomendações. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: '#8B5CF6' }} />
            Recomendações com IA
          </CardTitle>
          <Button
            onClick={atualizar}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8 flex-shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analisando…' : recomendacoes ? 'Atualizar' : 'Gerar recomendações'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!recomendacoes && !isLoading && !erro && (
          <p className="text-sm text-center py-5 text-[var(--theme-muted-foreground)]">
            Clique em "Gerar recomendações" para uma análise personalizada com Gemini AI.
          </p>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8 gap-2 text-sm text-[var(--theme-muted-foreground)]">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Gerando análise com Gemini AI…
          </div>
        )}

        {erro && !isLoading && (
          <p className="text-sm text-center py-5 text-red-500">{erro}</p>
        )}

        {recomendacoes && !isLoading && (
          <div className="space-y-3">
            {recomendacoes.map((r, i) => {
              const config = TIPO_CONFIG[r.tipo] ?? TIPO_CONFIG.dica;
              const { Icon } = config;
              return (
                <div key={i} className="flex gap-3 rounded-xl p-3" style={{ background: config.bg }}>
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${config.cor}20` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: config.cor }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-semibold text-[var(--theme-foreground)]">{r.titulo}</p>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: `${config.cor}20`, color: config.cor }}
                      >
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--theme-muted-foreground)] leading-relaxed">{r.descricao}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
