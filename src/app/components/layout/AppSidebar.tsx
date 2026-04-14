import { Link, useLocation } from 'react-router';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';
import { useAuth } from '../../../lib/auth-context';
import { cn } from '../../../lib/utils';
import { getWorkspaceMenuItems, getWorkspaceTitle } from '../../../lib/taskos-forall';
import { TaskOSRadarIcon } from '../../layouts/WorkspaceLogo';

export default function AppSidebar() {
  const location = useLocation();
  const { contextMode, sidebarCollapsed, toggleSidebar } = useAppStore();
  const { userProfile } = useAuth();

  const visibleItems = getWorkspaceMenuItems(userProfile?.preferencias, contextMode);

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen flex-col border-r transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-72',
      )}
      style={{
        background: 'var(--theme-card)',
        borderColor: 'var(--theme-border)',
      }}
    >
      <div
        className="flex h-16 items-center justify-between px-4"
        style={{ borderBottom: '1px solid var(--theme-border)' }}
      >
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
              style={{
                background: 'var(--theme-background-secondary)',
              }}
            >
              <TaskOSRadarIcon size={28} />
            </div>

            <div className="leading-tight">
              <span
                className="block text-lg font-bold"
                style={{ color: 'var(--theme-foreground)' }}
              >
                TaskOS For All
              </span>
              <span
                className="text-xs"
                style={{ color: 'var(--theme-muted-foreground)' }}
              >
                {getWorkspaceTitle(contextMode)}
              </span>
            </div>
          </div>
        )}

        {sidebarCollapsed && (
          <div className="flex flex-1 justify-center">
            <TaskOSRadarIcon size={24} collapsed />
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 transition-colors"
          style={{ color: 'var(--theme-foreground)' }}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="mb-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-3">
          {!sidebarCollapsed ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--theme-muted-foreground)]">
                Objetivos ativos
              </p>
              <p className="mt-1 text-sm text-[var(--theme-foreground)]">
                {contextMode === 'work'
                  ? 'Menus e cards adaptados aos seus objetivos profissionais.'
                  : 'Menus e cards adaptados às suas metas de vida pessoal.'}
              </p>
            </>
          ) : (
            <div className="flex justify-center">
              <Sparkles className="h-4 w-4 text-[var(--theme-accent)]" />
            </div>
          )}
        </div>

        <div className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                to={item.path}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                  sidebarCollapsed && 'justify-center',
                )}
                style={
                  isActive
                    ? {
                        background: 'var(--theme-accent)',
                        color: 'var(--theme-accent-foreground)',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                      }
                    : {
                        color: 'var(--theme-foreground)',
                      }
                }
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'scale-105')} />
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <span className="block font-medium">{item.label}</span>
                    <span className="block truncate text-[11px] opacity-70">
                      {item.description}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {!sidebarCollapsed && (
        <div
          className="p-4 text-center text-xs"
          style={{
            borderTop: '1px solid var(--theme-border)',
            color: 'var(--theme-muted-foreground)',
          }}
        >
          Personalizado com suas preferências
        </div>
      )}
    </aside>
  );
}