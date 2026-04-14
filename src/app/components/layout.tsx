import { Outlet } from 'react-router';
import { useAppStore } from '../../stores/useAppStore';
import { cn } from '../../lib/utils';
import AppSidebar from '../../app/components/layout/AppSidebar';
import Header from '../../app/components/layout/AppHeader';

export function Layout() {
  const { contextMode } = useAppStore();

  return (
    <div
      className={cn(
        'flex h-screen bg-[var(--theme-background)] text-[var(--theme-foreground)]',
        contextMode === 'work' ? 'theme-itau' : 'theme-pessoal',
      )}
    >
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden bg-[var(--theme-background)]">
        <Header />
        <main className="flex-1 overflow-y-auto bg-[var(--theme-background)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
