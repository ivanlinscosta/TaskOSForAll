import { Flame, Calendar } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import type { GamificationProfile } from '../../../services/gamification-service';

interface StreakCardProps {
  profile: GamificationProfile;
  label?: string;
}

export function StreakCard({ profile, label = 'Streak de aprendizado' }: StreakCardProps) {
  const streak = profile.currentStreak;
  const longest = profile.longestStreak;

  const flameColor = streak === 0 ? '#94A3B8' : streak >= 30 ? '#EF4444' : streak >= 7 ? '#F97316' : '#F59E0B';
  const flameSize = streak === 0 ? 'h-6 w-6' : streak >= 30 ? 'h-8 w-8' : 'h-7 w-7';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${flameColor}15` }}
            >
              <Flame className={`${flameSize} transition-all`} style={{ color: flameColor }} />
            </div>
            <div>
              <p className="text-xs text-[var(--theme-muted-foreground)]">{label}</p>
              <p className="text-2xl font-bold" style={{ color: flameColor }}>
                {streak} {streak === 1 ? 'dia' : 'dias'}
              </p>
              {streak === 0 && (
                <p className="text-xs text-[var(--theme-muted-foreground)]">Registre atividade para começar</p>
              )}
              {streak > 0 && streak < 7 && (
                <p className="text-xs text-[var(--theme-muted-foreground)]">
                  Faltam {7 - streak} para o badge 🔥 Dedicado
                </p>
              )}
              {streak >= 7 && streak < 30 && (
                <p className="text-xs" style={{ color: flameColor }}>
                  🔥 Incrível! Continue por {30 - streak} dias para Consistente
                </p>
              )}
              {streak >= 30 && (
                <p className="text-xs font-medium" style={{ color: flameColor }}>
                  💪 Você é Consistente! Lenda em andamento.
                </p>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 text-xs text-[var(--theme-muted-foreground)]">
              <Calendar className="h-3 w-3" />
              Recorde
            </div>
            <p className="text-lg font-bold text-[var(--theme-foreground)]">{longest}d</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
