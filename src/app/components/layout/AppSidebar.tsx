import { Link, useLocation } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';
import { useAuth } from '../../../lib/auth-context';
import { cn } from '../../../lib/utils';
import { MAIN_MENU } from '../../../lib/taskos-forall';
import { IconMetas } from '../brand/BrandIcons';
import logoPrincipal from '../../../assets/taskall_new_brand/logo_principal.svg';
import symbol from '../../../assets/taskall_new_brand/symbol_32.svg';

const INACTIVE_COLOR = '#B0A8A0';
const ACTIVE_COLOR = '#FFFFFF';
const ACTIVE_BG = '#0D5C7A';
const RADIUS = '9px';
const HOVER_BG = '#E8F5F8';
const HOVER_TEXT = '#0D5C7A';

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

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen flex-col border-r transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-72',
      )}
      style={{ background: '#FFFFFF', borderColor: '#EDEAE4' }}
    >
      {/* ── Header/Logo ── */}
      <div
        className="flex h-[72px] items-center justify-between"
        style={{ borderBottom: '1px solid #EDEAE4', padding: sidebarCollapsed ? '0 8px' : '0 16px' }}
      >
        {sidebarCollapsed ? (
          <>
            <img src={symbol} alt="TaskAll" className="h-9 w-9 flex-shrink-0" />
            <button
              onClick={toggleSidebar}
              className="rounded-lg p-1 transition-colors hover:bg-[#E8F5F8]"
              style={{ color: '#B0A8A0' }}
              aria-label="Expandir"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <img
              src={logoPrincipal}
              alt="TaskAll"
              className="h-12 w-auto object-contain object-left"
              style={{ maxWidth: '180px' }}
            />
            <button
              onClick={toggleSidebar}
              className="ml-2 flex-shrink-0 rounded-lg p-1.5 transition-colors hover:bg-[#E8F5F8]"
              style={{ color: '#B0A8A0' }}
              aria-label="Recolher"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* ── Menu principal ── */}
      <nav className="flex-1 overflow-y-auto p-3">
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
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 text-sm transition-all',
                  sidebarCollapsed && 'justify-center',
                  !isActive && 'hover:bg-[#E8F5F8] hover:text-[#0D5C7A]',
                )}
                style={
                  isActive
                    ? { background: ACTIVE_BG, color: ACTIVE_COLOR, borderRadius: RADIUS, boxShadow: '0 2px 8px rgba(13,92,122,0.18)' }
                    : { color: '#1A1410', borderRadius: RADIUS }
                }
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon
                  color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
                  size={24}
                  className="flex-shrink-0 transition-colors group-hover:!text-[#0D5C7A]"
                />
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <span className="block font-medium">{item.label}</span>
                    <span
                      className="block truncate text-[11px]"
                      style={{ color: isActive ? 'rgba(255,255,255,0.7)' : '#B0A8A0' }}
                    >
                      {item.description}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}

          {/* Vagas Para Mim */}
          {vagasAtivas && (() => {
            const isActive = location.pathname === '/vagas-para-mim';
            return (
              <Link
                to="/vagas-para-mim"
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 text-sm transition-all',
                  sidebarCollapsed && 'justify-center',
                  !isActive && 'hover:bg-[#E8F5F8] hover:text-[#0D5C7A]',
                )}
                style={
                  isActive
                    ? { background: ACTIVE_BG, color: ACTIVE_COLOR, borderRadius: RADIUS, boxShadow: '0 2px 8px rgba(13,92,122,0.18)' }
                    : { color: '#1A1410', borderRadius: RADIUS }
                }
                title={sidebarCollapsed ? 'Vagas Para Mim' : undefined}
              >
                <IconMetas
                  color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
                  size={24}
                  className="flex-shrink-0"
                />
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <span className="block font-medium">Vagas Para Mim</span>
                    <span className="block truncate text-[11px]" style={{ color: isActive ? 'rgba(255,255,255,0.7)' : '#B0A8A0' }}>
                      Vagas recomendadas com IA
                    </span>
                  </div>
                )}
              </Link>
            );
          })()}
        </div>
      </nav>

      {/* ── User footer ── */}
      {!sidebarCollapsed && (
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderTop: '1px solid #EDEAE4' }}>
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: '#0D5C7A' }}
          >
            {initials || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" style={{ color: '#061F2A' }}>
              {userProfile?.nome || user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
            </p>
            <p className="text-[11px]" style={{ color: '#0D5C7A' }}>
              Premium
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
