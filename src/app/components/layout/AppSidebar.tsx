import { Link, useLocation } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';
import { useAuth } from '../../../lib/auth-context';
import { cn } from '../../../lib/utils';
import { MAIN_MENU } from '../../../lib/taskos-forall';
import { IconMetas } from '../brand/BrandIcons';
import symbol from '../../../assets/taskall_new_brand/symbol_32.svg';

export default function AppSidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, vagasAtivas } = useAppStore();
  const { user, userProfile } = useAuth();

  const initials = (() => {
    const name = userProfile?.nome || user?.displayName || user?.email || '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  })();

  const role = userProfile?.cargo || userProfile?.profissao || '';

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen flex-col transition-all duration-300',
        sidebarCollapsed ? 'w-[68px]' : 'w-[240px]',
      )}
      style={{ background: '#0D5C7A' }}
    >
      {/* ── Logo ── */}
      <div
        className={cn(
          'flex h-[72px] items-center',
          sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-5',
        )}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        {sidebarCollapsed ? (
          <>
            <img src={symbol} alt="TaskAll" className="h-8 w-8 brightness-0 invert" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <img src={symbol} alt="TaskAll" className="h-9 w-9 brightness-0 invert flex-shrink-0" />
              <div className="leading-tight">
                <span className="block text-[17px] font-bold text-white tracking-tight">TaskAll</span>
                <span className="block text-[11px] text-white/50">Seu assistente de vida</span>
              </div>
            </div>
          </>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'rounded-lg p-1.5 transition-colors hover:bg-white/10',
            sidebarCollapsed && 'hidden',
          )}
          style={{ color: 'rgba(255,255,255,0.5)' }}
          aria-label="Recolher"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-0.5">
          {MAIN_MENU.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                to={item.path}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                  sidebarCollapsed && 'justify-center',
                  isActive
                    ? 'bg-white shadow-sm'
                    : 'text-white/75 hover:bg-white/10 hover:text-white',
                )}
                style={isActive ? { color: '#0D5C7A' } : undefined}
              >
                <Icon
                  color={isActive ? '#0D5C7A' : 'rgba(255,255,255,0.6)'}
                  size={22}
                  className="flex-shrink-0"
                />
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <span className={cn('block font-medium text-[13px]', isActive ? 'text-[#0D5C7A]' : 'text-white/90')}>
                      {item.label}
                    </span>
                    <span className={cn('block truncate text-[11px]', isActive ? 'text-[#0D5C7A]/60' : 'text-white/40')}>
                      {item.description}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}

          {vagasAtivas && (() => {
            const isActive = location.pathname === '/vagas-para-mim';
            return (
              <Link
                to="/vagas-para-mim"
                title={sidebarCollapsed ? 'Vagas Para Mim' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                  sidebarCollapsed && 'justify-center',
                  isActive ? 'bg-white shadow-sm' : 'text-white/75 hover:bg-white/10 hover:text-white',
                )}
                style={isActive ? { color: '#0D5C7A' } : undefined}
              >
                <IconMetas color={isActive ? '#0D5C7A' : 'rgba(255,255,255,0.6)'} size={22} className="flex-shrink-0" />
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <span className={cn('block font-medium text-[13px]', isActive ? 'text-[#0D5C7A]' : 'text-white/90')}>Vagas Para Mim</span>
                    <span className={cn('block truncate text-[11px]', isActive ? 'text-[#0D5C7A]/60' : 'text-white/40')}>Vagas recomendadas com IA</span>
                  </div>
                )}
              </Link>
            );
          })()}
        </div>
      </nav>

      {/* ── Expand button (collapsed) ── */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          aria-label="Expandir"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* ── User footer ── */}
      {!sidebarCollapsed && (
        <div
          className="flex items-center gap-3 px-4 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
          >
            {initials || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white">
              {userProfile?.nome || user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
            </p>
            <p className="truncate text-[11px] text-white/50">{role || 'Premium'}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
