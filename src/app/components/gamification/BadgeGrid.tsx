import { BADGES, type GamificationProfile } from '../../../services/gamification-service';

interface BadgeGridProps {
  profile: GamificationProfile;
  compact?: boolean;
}

export function BadgeGrid({ profile, compact = false }: BadgeGridProps) {
  const earnedSet = new Set(profile.earnedBadges);

  if (compact) {
    const earned = BADGES.filter((b) => earnedSet.has(b.id));
    if (earned.length === 0) {
      return (
        <p className="text-xs text-[var(--theme-muted-foreground)]">
          Nenhum badge conquistado ainda. Continue evoluindo!
        </p>
      );
    }
    return (
      <div className="flex flex-wrap gap-2">
        {earned.map((badge) => (
          <div
            key={badge.id}
            title={`${badge.title} — ${badge.description}`}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium cursor-default"
            style={{ background: `${badge.color}18`, color: badge.color, border: `1px solid ${badge.color}30` }}
          >
            <span>{badge.emoji}</span>
            <span>{badge.title}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {BADGES.map((badge) => {
        const earned = earnedSet.has(badge.id);
        return (
          <div
            key={badge.id}
            className="flex flex-col items-center gap-2 rounded-xl p-3 text-center transition-all"
            style={{
              background: earned ? `${badge.color}12` : 'var(--theme-background-secondary)',
              border: `1px solid ${earned ? badge.color + '30' : 'var(--theme-border)'}`,
              opacity: earned ? 1 : 0.45,
              filter: earned ? 'none' : 'grayscale(1)',
            }}
          >
            <span className="text-2xl">{badge.emoji}</span>
            <div>
              <p
                className="text-xs font-semibold"
                style={{ color: earned ? badge.color : 'var(--theme-muted-foreground)' }}
              >
                {badge.title}
              </p>
              <p className="mt-0.5 text-[10px] text-[var(--theme-muted-foreground)] leading-tight">
                {badge.description}
              </p>
            </div>
            {earned && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{ background: badge.color, color: '#fff' }}
              >
                Conquistado
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
