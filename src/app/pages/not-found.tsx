import { Link } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--theme-background)]">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-9xl font-bold text-[var(--theme-accent)]">
          404
        </div>
        <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">
          Página não encontrada
        </h1>
        <p className="text-[var(--theme-muted-foreground)]">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button variant="theme" className="gap-2">
              <Home className="w-4 h-4" />
              Ir para Dashboard
            </Button>
          </Link>
          <Button variant="outline" className="gap-2" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
