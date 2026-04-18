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
      className="flex h-[72px] items-center justify-between px-6"
      style={{ background: '#FFFFFF', borderBottom: '1px solid #EDEAE4' }}
    >
      <div>
        <h1 className="text-base font-bold text-[#061F2A]">
          Olá, {displayName.split(' ')[0]} 👋
        </h1>
        <p className="text-xs text-[#7A7068]">
          Seu assistente de vida
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="rounded-xl text-[#7A7068] hover:bg-[#EBF2F5] hover:text-[#0D5C7A]"
        >
          <Bell className="h-4 w-4" />
        </Button>

        <button
          onClick={() => navigate('/perfil')}
          className="flex items-center gap-2.5 rounded-xl border px-3 py-1.5 transition hover:bg-[#EBF2F5]"
          style={{ borderColor: '#EDEAE4' }}
        >
          <Avatar className="h-8 w-8" style={{ border: '2px solid #EDEAE4' }}>
            <AvatarImage src={userProfile?.avatar} alt={displayName} />
            <AvatarFallback style={{ background: '#0D5C7A', color: '#fff', fontSize: '12px' }}>
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-[#061F2A]">{displayName}</p>
            <p className="text-[11px] text-[#7A7068]">{role}</p>
          </div>
        </button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="rounded-xl text-[#7A7068] hover:bg-red-50 hover:text-red-500"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
