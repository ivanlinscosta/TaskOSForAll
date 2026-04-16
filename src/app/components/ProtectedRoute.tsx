import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../lib/auth-context';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Se true, a rota é o próprio /onboarding — não redireciona de volta. */
  allowOnboarding?: boolean;
}

export function ProtectedRoute({ children, allowOnboarding }: ProtectedRouteProps) {
  const { user, loading, needsOnboarding } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--theme-background)]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[var(--theme-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[var(--theme-muted-foreground)]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se o usuário ainda não concluiu o setup inicial e está tentando entrar
  // no Layout (dashboard, páginas internas), força para /onboarding.
  if (needsOnboarding && !allowOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // Se o setup já foi concluído e o usuário tenta acessar /onboarding
  // diretamente, manda para o dashboard.
  if (!needsOnboarding && allowOnboarding) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
