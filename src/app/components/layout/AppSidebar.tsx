import { Link, useLocation } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';
import { useAuth } from '../../../lib/auth-context';
import { cn } from '../../../lib/utils';
import { MAIN_MENU } from '../../../lib/taskos-forall';
import { IconMetas } from '../brand/BrandIcons';
import logoPrincipal from '../../../assets/taskall_new_brand/logo_principal.svg';
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
        sidebarCollapsed ? 'w-[72px]' : 'w-[240px]',
      )}
      style={{ background: '#FFFFFF', borderRight: '1px solid #EDEAE4' }}
    >
      {/* Logo */}
      <div
        className="flex h-[72px] items-center justify-between"
        style={{ borderBottom: '1px solid #EDEAE4', padding: sidebarCollapsed ? '0 16px' : '0 16px' }}
      >
        {sidebarCollapsed ? (
          <>
            <img src={symbol} alt="TaskAll" className="h-8 w-8 flex-shrink-0" />
            <button
              onClick={toggleSidebar}
              className="ml-1 rounded-lg p-1 transition-colors hover:bg-[#EBF2F5]"
              style={{ color: '#7A7068' }}
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
              className="h-10 w-auto object-contain object-left"
              style={{ maxWidth: '160px' }}
            />
            <button
              onClick={toggleSidebar}
              className="flex-shrink-0 rounded-lg p-1.5 transition-colors hover:bg-[#EBF2F5]"
              style={{ color: '#7A7068' }}
              aria-label="Recolher"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
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
                  !isActive && 'hover:bg-[#EBF2F5] hover:text-[#0D5C7A]',
                )}
                style={
                  isActive
                    ? { background: '#0D5C7A', color: '#FFFFFF', borderRadius: '12px', boxShadow: '0 2px 8px rgba(13,92,122,0.2)' }
                    : { color: '#3D3530', borderRadius: '12px' }
                }
              >
                <Icon
                  color={isActive ? '#FFFFFF' : '#7A7068'}
                  size={20}
                  className="flex-shrink-0"
                />
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <span className="block text-[13px] font-medium">
                      {item.label}
                    </span>
                    <span
                      className="block truncate text-[11px]"
                      style={{ color: isActive ? 'rgba(255,255,255,0.65)' : '#B0A8A0' }}
                    >
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
                  !isActive && 'hover:bg-[#EBF2F5] hover:text-[#0D5C7A]',
                )}
                style={
                  isActive
                    ? { background: '#0D5C7A', color: '#FFFFFF', borderRadius: '12px', boxShadow: '0 2px 8px rgba(13,92,122,0.2)' }
                    : { color: '#3D3530', borderRadius: '12px' }
                }
              >
                <IconMetas color={isActive ? '#FFFFFF' : '#7A7068'} size={20} className="flex-shrink-0" />
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <span className="block text-[13px] font-medium">Vagas Para Mim</span>
                    <span className="block truncate text-[11px]" style={{ color: isActive ? 'rgba(255,255,255,0.65)' : '#B0A8A0' }}>
                      Vagas recomendadas com IA
                    </span>
                  </div>
                )}
              </Link>
            );
          })()}
        </div>
      </nav>

      {/* User footer */}
      {!sidebarCollapsed && (
        <div
          className="flex items-center gap-3 px-4 py-4"
          style={{ borderTop: '1px solid #EDEAE4' }}
        >
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: '#0D5C7A' }}
          >
            {initials || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[#061F2A]">
              {userProfile?.nome || user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
            </p>
            <p className="truncate text-[11px]" style={{ color: '#0D5C7A' }}>{role || 'Premium'}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
