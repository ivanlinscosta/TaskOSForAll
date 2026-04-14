import { cn } from '../../../lib/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-[var(--theme-muted)] border-t-[var(--theme-accent)]",
        {
          'h-4 w-4': size === 'sm',
          'h-8 w-8': size === 'md',
          'h-12 w-12': size === 'lg',
        },
        className
      )}
    />
  );
}

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-background)]">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-[var(--theme-muted-foreground)]">Carregando...</p>
      </div>
    </div>
  );
}
