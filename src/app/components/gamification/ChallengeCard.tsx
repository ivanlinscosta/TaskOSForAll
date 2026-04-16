import { CheckCircle2, Clock, Zap } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { UserChallenge } from '../../../services/gamification-service';

interface ChallengeCardProps {
  challenge: UserChallenge;
  onComplete?: (challenge: UserChallenge) => void;
}

const TYPE_LABEL: Record<UserChallenge['type'], string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
};

const TYPE_COLOR: Record<UserChallenge['type'], string> = {
  daily: '#10B981',
  weekly: '#3B82F6',
  monthly: '#8B5CF6',
};

export function ChallengeCard({ challenge, onComplete }: ChallengeCardProps) {
  const progress = Math.min(100, Math.round((challenge.progress / challenge.target) * 100));
  const isCompleted = challenge.status === 'completed';
  const color = TYPE_COLOR[challenge.type];

  const expiresIn = challenge.expiresAt
    ? Math.max(0, Math.round((challenge.expiresAt.toDate().getTime() - Date.now()) / 86400000))
    : null;

  return (
    <Card
      className="transition-all"
      style={{
        opacity: isCompleted ? 0.7 : 1,
        borderColor: isCompleted ? 'var(--theme-border)' : `${color}30`,
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: isCompleted ? '#10B98120' : `${color}15` }}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <span className="text-lg">🎯</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <p className="text-sm font-semibold text-[var(--theme-foreground)]">{challenge.title}</p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Badge
                  className="text-xs"
                  style={{ background: `${color}15`, color, border: 'none' }}
                >
                  {TYPE_LABEL[challenge.type]}
                </Badge>
                <span
                  className="flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5"
                  style={{ background: '#F59E0B15', color: '#F59E0B' }}
                >
                  <Zap className="h-3 w-3" />
                  +{challenge.xpReward} XP
                </span>
              </div>
            </div>

            <p className="mt-0.5 text-xs text-[var(--theme-muted-foreground)]">{challenge.description}</p>

            {/* Progress */}
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-[var(--theme-muted-foreground)]">
                <span>
                  {challenge.progress}/{challenge.target} concluídos
                </span>
                {expiresIn !== null && !isCompleted && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {expiresIn === 0 ? 'Expira hoje' : `${expiresIn}d restantes`}
                  </span>
                )}
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--theme-border)]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${isCompleted ? 100 : progress}%`,
                    background: isCompleted ? '#10B981' : color,
                  }}
                />
              </div>
            </div>

            {isCompleted && (
              <p className="mt-1 text-xs font-medium text-green-500">✓ Desafio concluído!</p>
            )}

            {!isCompleted && challenge.progress >= challenge.target && onComplete && (
              <Button
                size="sm"
                className="mt-2 h-7 text-xs"
                style={{ background: color, color: '#fff' }}
                onClick={() => onComplete(challenge)}
              >
                Resgatar recompensa
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
