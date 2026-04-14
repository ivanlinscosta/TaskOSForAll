import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { toast } from 'sonner';
import { cn } from '../../lib/cn';
import { Badge } from './ui/badge';
import { Bell, Zap, LogOut } from 'lucide-react';
import { NotificationsHub } from './notifications-hub';
import { QuickActions } from './quick-actions';
import logoItau from '../../assets/itau.png';
import logoFiap from '../../assets/fiap.png';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { user: firebaseUser, userProfile, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Dados vêm do Firestore (userProfile) com fallback para Firebase Auth
  const displayName = userProfile?.nome || firebaseUser?.displayName || 'Usuário';
  const photoURL = userProfile?.avatar || firebaseUser?.photoURL || '';

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="h-14 border-b border-[var(--theme-border)] bg-[var(--theme-card)] sticky top-0 z-40">
        <div className="h-full px-4 flex items-center justify-between gap-4">
          {/* Logo/Title */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                theme === 'fiap' && "bg-[var(--theme-accent)] text-[var(--theme-accent-foreground)] glow-effect"
              )}
              style={{
                backgroundColor: theme === 'itau' ? '#EC7000' : undefined,
                color: theme === 'itau' ? '#FFFFFF' : undefined
              }}
            >
              T
            </div>
            <span className="font-bold text-[var(--theme-foreground)] hidden sm:block">TaskOS</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Switcher com Logos */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
              <button
                onClick={() => toggleTheme('fiap')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all",
                  theme === 'fiap'
                    ? "bg-[#6A0DAD] shadow-md"
                    : "hover:bg-[var(--theme-hover)]"
                )}
              >
                <img
                  src={logoFiap}
                  alt="FIAP"
                  className="h-4 w-auto"
                  style={{ filter: theme === 'fiap' ? 'brightness(0) invert(1)' : 'none' }}
                />
              </button>
              <button
                onClick={() => toggleTheme('itau')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all",
                  theme === 'itau'
                    ? "bg-[#EC7000] shadow-md"
                    : "hover:bg-[var(--theme-hover)]"
                )}
              >
                <img
                  src={logoItau}
                  alt="Itaú"
                  className="h-4 w-auto"
                  style={{ filter: theme === 'itau' ? 'brightness(0) invert(1)' : 'none' }}
                />
              </button>
            </div>

            {/* Quick Actions */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 relative"
              onClick={() => setShowQuickActions(!showQuickActions)}
            >
              <Zap className="w-4 h-4" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-4 h-4" />
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
              >
                3
              </Badge>
            </Button>

            {/* User Avatar - dados do Firestore */}
            <button
              onClick={() => navigate('/perfil')}
              className="flex items-center gap-2 pl-2 ml-2 border-l border-[var(--theme-border)] hover:opacity-80 transition-opacity"
            >
              <div className="text-right hidden sm:block">
                <div className="text-xs font-medium text-[var(--theme-foreground)]">
                  {displayName}
                </div>
                <div className="text-[10px] text-[var(--theme-muted-foreground)]">
                  {userProfile?.cargo || (theme === 'fiap' ? 'Professor' : 'Gerente')}
                </div>
              </div>
              <Avatar className="h-8 w-8 border-2 border-[var(--theme-accent)]">
                <AvatarImage src={photoURL} alt={displayName} />
                <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
              </Avatar>
            </button>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
              title="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Notifications Hub */}
      {showNotifications && (
        <NotificationsHub onClose={() => setShowNotifications(false)} />
      )}

      {/* Quick Actions */}
      {showQuickActions && (
        <QuickActions onClose={() => setShowQuickActions(false)} />
      )}
    </>
  );
}
