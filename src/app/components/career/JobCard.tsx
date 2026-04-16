import { Briefcase, MapPin, Clock, ExternalLink, Bookmark, BookmarkCheck } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { VagaCarreira } from '../../../services/carreira-service';
import { gerarLinkVaga } from '../../../services/carreira-service';

interface JobCardProps {
  vaga: VagaCarreira;
  onSave?: (vaga: VagaCarreira) => void;
  saved?: boolean;
  isSaving?: boolean;
}

// Color-coded companies
const COMPANY_ACCENTS: Record<string, string> = {
  nubank:     '#820AD1',
  ifood:      '#EA1D2C',
  itaú:       '#F47920',
  itau:       '#F47920',
  vtex:       '#F71963',
  mercado:    '#FFE600',
  totvs:      '#1F6FEB',
  cielo:      '#1A3668',
  stone:      '#00A868',
  pagseguro:  '#05A352',
  picpay:     '#21C25E',
  inter:      '#FF8700',
  xp:         '#0AC996',
  b3:         '#0059A3',
};

function getCompanyColor(empresa: string): string {
  const lower = empresa.toLowerCase();
  for (const [key, val] of Object.entries(COMPANY_ACCENTS)) {
    if (lower.includes(key)) return val;
  }
  return '#6366F1';
}

export function JobCard({ vaga, onSave, saved = false, isSaving = false }: JobCardProps) {
  const link = gerarLinkVaga(vaga);
  const accentColor = getCompanyColor(vaga.empresa);

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-4 transition-all hover:shadow-md"
      style={{
        background: 'var(--theme-background-secondary)',
        border: `1px solid ${accentColor}20`,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Company initials avatar */}
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
          style={{ background: accentColor }}
        >
          {vaga.empresa.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--theme-foreground)] leading-tight">{vaga.titulo}</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: accentColor }}>
            {vaga.empresa}
          </p>
        </div>

        <div className="flex-shrink-0">
          {vaga.regime && (
            <Badge
              className="text-[10px] h-5 px-2"
              style={{ background: `${accentColor}15`, color: accentColor, border: 'none' }}
            >
              {vaga.regime}
            </Badge>
          )}
        </div>
      </div>

      {/* Meta: location */}
      {vaga.localidade && (
        <div className="flex items-center gap-1 text-xs text-[var(--theme-muted-foreground)]">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span>{vaga.localidade}</span>
        </div>
      )}

      {/* Resumo */}
      {vaga.resumo && (
        <p className="text-xs text-[var(--theme-muted-foreground)] leading-relaxed">{vaga.resumo}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ background: `${accentColor}15`, color: accentColor }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ver vaga
        </a>

        {onSave && (
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 text-xs flex-shrink-0"
            disabled={saved || isSaving}
            onClick={() => onSave(vaga)}
            style={
              saved
                ? { background: '#10B98110', color: '#10B981', borderColor: '#10B98130' }
                : {}
            }
          >
            {saved ? (
              <>
                <BookmarkCheck className="h-3.5 w-3.5" />
                Salva
              </>
            ) : (
              <>
                <Bookmark className="h-3.5 w-3.5" />
                Salvar vaga
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
