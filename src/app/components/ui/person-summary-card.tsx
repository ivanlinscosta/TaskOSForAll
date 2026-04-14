import { useMemo, useState } from 'react';
import {
  Mail,
  Briefcase,
  GraduationCap,
  MapPin,
  Pencil,
  Star,
  MessageSquare,
  User,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Card, CardContent } from './card';

interface MetricItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

interface Props {
  name: string;
  email: string;
  subtitle: string;
  image?: string;
  badgeText?: string;
  highlightText?: string;
  locationText?: string;
  actionLabel: string;
  onAction: () => void;
  onEdit: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onOpen: () => void;
  metrics: MetricItem[];
  variant: 'analyst' | 'student';
}

export function PersonSummaryCard({
  name,
  email,
  subtitle,
  image,
  badgeText,
  highlightText,
  locationText,
  actionLabel,
  onAction,
  onEdit,
  onOpen,
  metrics,
  variant,
}: Props) {
  const [imgError, setImgError] = useState(false);

  const initials = useMemo(() => {
    return (name || 'Usuário')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('');
  }, [name]);

  const hasValidImage = !!image && !imgError;
  const SubtitleIcon = variant === 'student' ? GraduationCap : Briefcase;

  return (
    <Card className="group h-[440px] overflow-hidden rounded-2xl border bg-[var(--theme-card)] shadow-sm transition-all hover:shadow-lg">
      <CardContent className="flex h-full flex-col p-3">
        <div className="relative mb-4 cursor-pointer" onClick={onOpen}>
          <div className="flex justify-center rounded-xl bg-[var(--theme-background-secondary)] p-3">
            <Avatar className="h-20 w-20 border-2 border-white shadow">
              <AvatarImage
                src={hasValidImage ? image : undefined}
                onError={() => setImgError(true)}
              />
              <AvatarFallback className="bg-[var(--theme-background-secondary)]">
                {hasValidImage ? (
                  initials
                ) : (
                  <User className="h-8 w-8 text-[var(--theme-muted-foreground)]" />
                )}
              </AvatarFallback>
            </Avatar>
          </div>

          <button
            onClick={onEdit}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow"
            type="button"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>

        <div className="flex-1 space-y-2 cursor-pointer" onClick={onOpen}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{name}</h3>

          <p className="text-xs text-[var(--theme-muted-foreground)]">{subtitle}</p>

          {locationText && (
            <div className="flex items-center gap-1 text-xs text-[var(--theme-muted-foreground)]">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{locationText}</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-xs text-[var(--theme-muted-foreground)]">
            <Mail className="h-3 w-3" />
            <span className="truncate">{email}</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-[var(--theme-muted-foreground)]">
            <SubtitleIcon className="h-3 w-3" />
            <span className="truncate">{subtitle}</span>
          </div>

          <div className="flex flex-wrap gap-1 pt-2">
            {metrics.slice(0, 3).map((metric) => (
              <div
                key={metric.label}
                className="flex items-center gap-1 rounded-full border bg-[var(--theme-background-secondary)] px-2 py-1 text-[11px]"
              >
                {metric.icon}
                <span className="font-medium">{metric.value}</span>
              </div>
            ))}
          </div>

          {badgeText && (
            <div className="pt-2">
              <span className="rounded-full bg-[var(--theme-accent)]/10 px-2 py-1 text-[10px] font-medium text-[var(--theme-accent)]">
                {badgeText}
              </span>
            </div>
          )}

          {highlightText && (
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-yellow-600">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                {highlightText}
              </span>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className="w-full rounded-full border bg-[var(--theme-accent)]/10 px-3 py-2 text-xs font-medium transition hover:bg-[var(--theme-accent)] hover:text-white"
          >
            <div className="flex items-center justify-center gap-2">
              <MessageSquare className="h-3 w-3" />
              {actionLabel}
            </div>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}