import { BookOpen, GraduationCap, Play, ExternalLink, Plus, Check } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { RecomendacaoCarreira } from '../../../services/carreira-service';
import { gerarLinkRecomendacao } from '../../../services/carreira-service';

// ── Platform palette ──────────────────────────────────────────────────────────
const PLATFORM_PALETTE: Record<string, { bg: string; color: string }> = {
  alura:       { bg: '#1CE0E220', color: '#1CE0E2' },
  udemy:       { bg: '#A435F020', color: '#A435F0' },
  coursera:    { bg: '#0056D220', color: '#0056D2' },
  linkedin:    { bg: '#0A66C220', color: '#0A66C2' },
  youtube:     { bg: '#FF000020', color: '#FF0000' },
  rocketseat:  { bg: '#8257E520', color: '#8257E5' },
  hotmart:     { bg: '#F01F6420', color: '#F01F64' },
  dio:         { bg: '#00ADEF20', color: '#00ADEF' },
};

function getPlatformStyle(autor: string): { bg: string; color: string } {
  const lower = autor.toLowerCase();
  for (const [key, val] of Object.entries(PLATFORM_PALETTE)) {
    if (lower.includes(key)) return val;
  }
  return { bg: '#6B728020', color: '#6B7280' };
}

const TIPO_CONFIG: Record<RecomendacaoCarreira['tipo'], {
  Icon: React.ElementType;
  label: string;
  cardBg: string;
  accentColor: string;
  linkLabel: string;
}> = {
  livro: {
    Icon: BookOpen,
    label: 'Livro',
    cardBg: '#8B5CF608',
    accentColor: '#8B5CF6',
    linkLabel: 'Buscar na Amazon',
  },
  curso: {
    Icon: GraduationCap,
    label: 'Curso',
    cardBg: '#0EA5E908',
    accentColor: '#0EA5E9',
    linkLabel: 'Acessar curso',
  },
  video: {
    Icon: Play,
    label: 'Vídeo',
    cardBg: '#EF444408',
    accentColor: '#EF4444',
    linkLabel: 'Assistir no YouTube',
  },
};

interface RecommendationCardProps {
  rec: RecomendacaoCarreira;
  onAdd?: (rec: RecomendacaoCarreira) => void;
  added?: boolean;
  isAdding?: boolean;
}

export function RecommendationCard({ rec, onAdd, added = false, isAdding = false }: RecommendationCardProps) {
  const config = TIPO_CONFIG[rec.tipo];
  const { Icon } = config;
  const link = gerarLinkRecomendacao(rec);
  const platformStyle = getPlatformStyle(rec.autor_ou_canal);

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-4 transition-all hover:shadow-md"
      style={{
        background: config.cardBg,
        border: `1px solid ${config.accentColor}20`,
      }}
    >
      {/* Top area: icon + title + badges */}
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${config.accentColor}18` }}
        >
          <Icon className="h-5 w-5" style={{ color: config.accentColor }} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <Badge
              className="text-[10px] h-4 px-1.5"
              style={{ background: `${config.accentColor}18`, color: config.accentColor, border: 'none' }}
            >
              {config.label}
            </Badge>
            {rec.tipo !== 'livro' && (
              <Badge
                className="text-[10px] h-4 px-1.5"
                style={{ background: platformStyle.bg, color: platformStyle.color, border: 'none' }}
              >
                {rec.autor_ou_canal}
              </Badge>
            )}
          </div>
          <p className="text-sm font-semibold text-[var(--theme-foreground)] leading-tight">{rec.titulo}</p>
          {rec.tipo === 'livro' && (
            <p className="text-xs text-[var(--theme-muted-foreground)] mt-0.5">{rec.autor_ou_canal}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {rec.descricao && (
        <p className="text-xs text-[var(--theme-muted-foreground)] leading-relaxed">{rec.descricao}</p>
      )}

      {/* Motivo */}
      {rec.motivo && (
        <div
          className="rounded-xl px-3 py-2"
          style={{ background: `${config.accentColor}10` }}
        >
          <p className="text-xs leading-relaxed" style={{ color: config.accentColor }}>
            <span className="font-semibold">Por que?</span> {rec.motivo}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ background: `${config.accentColor}18`, color: config.accentColor }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {config.linkLabel}
        </a>

        {onAdd && (
          <Button
            size="sm"
            className="h-9 gap-1.5 text-xs font-medium flex-shrink-0"
            disabled={added || isAdding}
            onClick={() => onAdd(rec)}
            style={
              added
                ? { background: '#10B98118', color: '#10B981', border: 'none' }
                : { background: 'var(--theme-accent)', color: '#fff' }
            }
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Adicionado
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Ao meu desenvolvimento
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
