import { getLevelInfo, type GamificationProfile } from '../../../services/gamification-service';
import { Zap } from 'lucide-react';

interface LevelProgressProps {
  profile: GamificationProfile;
  compact?: boolean;
}

export function LevelProgress({ profile, compact = false }: LevelProgressProps) {
  const levelInfo = getLevelInfo(profile.xp);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg">{levelInfo.emoji}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold" style={{ color: levelInfo.color }}>
              Nv. {levelInfo.level}
            </span>
            <span className="text-xs text-[var(--theme-muted-foreground)]">{levelInfo.title}</span>
          </div>
          <div className="mt-0.5 h-1.5 w-24 overflow-hidden rounded-full bg-[var(--theme-border)]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${levelInfo.progress}%`, background: levelInfo.color }}
            />
          </div>
        </div>
        <div className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: levelInfo.color }}>
          <Zap className="h-3 w-3" />
          {profile.xp.toLocaleString('pt-BR')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Level header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{levelInfo.emoji}</span>
          <div>
            <p className="text-xs text-[var(--theme-muted-foreground)]">Nível {levelInfo.level}</p>
            <p className="text-sm font-bold" style={{ color: levelInfo.color }}>
              {levelInfo.title}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-lg font-bold" style={{ color: levelInfo.color }}>
            <Zap className="h-4 w-4" />
            {profile.xp.toLocaleString('pt-BR')} XP
          </div>
          {levelInfo.level < 10 && (
            <p className="text-xs text-[var(--theme-muted-foreground)]">
              faltam {levelInfo.xpToNextLevel} XP para Nv. {levelInfo.level + 1}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--theme-border)]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${levelInfo.progress}%`,
            background: `linear-gradient(90deg, ${levelInfo.color}aa, ${levelInfo.color})`,
          }}
        />
      </div>

      <div className="flex justify-between text-xs text-[var(--theme-muted-foreground)]">
        <span>{levelInfo.minXP} XP</span>
        <span>{levelInfo.progress}%</span>
        <span>{levelInfo.level < 10 ? `${levelInfo.maxXP} XP` : '∞'}</span>
      </div>
    </div>
  );
}
