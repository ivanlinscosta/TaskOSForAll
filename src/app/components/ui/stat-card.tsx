import { cn } from '../../../lib/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      "p-6 rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)]",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[var(--theme-muted-foreground)] mb-2">
            {label}
          </p>
          <p className="text-3xl font-bold text-[var(--theme-foreground)]">
            {value}
          </p>
          {trend && (
            <p className={cn(
              "text-sm mt-2 flex items-center gap-1",
              trend.isPositive ? "text-green-500" : "text-red-500"
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-[var(--theme-muted-foreground)]">vs. semana anterior</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-lg bg-[var(--theme-accent)]/10">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
