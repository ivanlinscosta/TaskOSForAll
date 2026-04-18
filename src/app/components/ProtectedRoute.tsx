import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../lib/auth-context';
import loadingImg from '../../assets/taskall_new_brand/loading_light.svg';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Se true, a rota é o próprio /onboarding — não redireciona de volta. */
  allowOnboarding?: boolean;
}

export function ProtectedRoute({ children, allowOnboarding }: ProtectedRouteProps) {
  const { user, loading, needsOnboarding } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <img
          src={loadingImg}
          alt="Carregando TaskAll..."
          className="w-full max-w-[300px] select-none pointer-events-none"
        />
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
