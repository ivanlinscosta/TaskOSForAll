import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Bell, Briefcase, Heart, LogOut, User2 } from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';
import { useAuth } from '../../../lib/auth-context';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { getInitials } from '../../../lib/utils';
import { toast } from 'sonner';

export default function Header() {
  const navigate = useNavigate();
  const { contextMode, setContextMode, setUser } = useAppStore();
  const { user, userProfile, logout } = useAuth();

  useEffect(() => {
    if (user && userProfile) {
      setUser({
        name: userProfile.nome || user.displayName || 'Usuário',
        email: user.email || userProfile.email || '',
        role: userProfile.profissao || 'TaskOS For All',
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
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const displayName = userProfile?.nome || user?.displayName || 'Usuário';
  const role = userProfile?.profissao || 'TaskOS For All';
  const workLabel = userProfile?.localTrabalho || 'Trabalho';

  return (
    <header
      className="flex h-16 items-center justify-between px-6"
      style={{
        background: 'var(--theme-card)',
        borderBottom: '1px solid var(--theme-border)',
      }}
    >
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-[var(--theme-foreground)]">TaskOS For All</h1>
          <p className="text-xs text-[var(--theme-muted-foreground)]">
            Sistema personalizado para cada usuário
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-1">
          <Button
            type="button"
            size="sm"
            variant={contextMode === 'work' ? 'theme' : 'ghost'}
            className="h-9 gap-2 rounded-lg px-3"
            onClick={() => setContextMode('work')}
          >
            <Briefcase className="h-4 w-4" />
            {workLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={contextMode === 'life' ? 'theme' : 'ghost'}
            className="h-9 gap-2 rounded-lg px-3"
            onClick={() => setContextMode('life')}
          >
            <Heart className="h-4 w-4" />
            Vida pessoal
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="outline" className="hidden md:inline-flex">
          {contextMode === 'work' ? 'Workspace de trabalho' : 'Workspace de vida pessoal'}
        </Badge>

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
