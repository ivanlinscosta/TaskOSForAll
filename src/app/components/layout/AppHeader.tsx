import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Bell, LogOut } from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';
import { useAuth } from '../../../lib/auth-context';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getInitials } from '../../../lib/utils';
import { toast } from 'sonner';

export default function Header() {
  const navigate = useNavigate();
  const { setUser } = useAppStore();
  const { user, userProfile, logout } = useAuth();

  useEffect(() => {
    if (user && userProfile) {
      setUser({
        name: userProfile.nome || user.displayName || 'Usuário',
        email: user.email || userProfile.email || '',
        role: userProfile.profissao || 'TaskAll',
        avatar: userProfile.avatar,
        photoURL: userProfile.avatar,
      });
    }
  }, [user, userProfile, setUser]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    } catch {
      toast.error('Erro ao fazer logout');
    }
  };

  const displayName = userProfile?.nome || user?.displayName || 'Usuário';
  const role = userProfile?.profissao || userProfile?.cargo || 'TaskAll';

  return (
    <header
      className="flex h-16 items-center justify-between px-6"
      style={{
        background: 'var(--theme-card)',
        borderBottom: '1px solid var(--theme-border)',
      }}
    >
      <div>
        <h1 className="text-lg font-bold text-[var(--theme-foreground)]">
          Olá, {displayName.split(' ')[0]}
        </h1>
        <p className="text-xs text-[var(--theme-muted-foreground)]">
          Sua central de evolução pessoal e profissional.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" size="icon" variant="ghost" className="rounded-xl">
          <Bell className="h-4 w-4" />
        </Button>

        <button
          onClick={() => navigate('/perfil')}
          className="flex items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-background)] px-3 py-1.5 transition hover:shadow-sm"
        >
          <Avatar className="h-9 w-9 border border-[var(--theme-border)]">
            <AvatarImage src={userProfile?.avatar} alt={displayName} />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-[var(--theme-foreground)]">{displayName}</p>
            <p className="text-[11px] text-[var(--theme-muted-foreground)]">{role}</p>
          </div>
        </button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="rounded-xl text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
