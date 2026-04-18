import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Briefcase, Camera, Heart, Loader2, RefreshCw, User2, Wallet } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase-config';
import { useAuth } from '../../lib/auth-context';
import { getGoalLabel } from '../../lib/taskos-forall';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { getInitials, formatCurrency } from '../../lib/utils';
import { AvatarUploadDialog } from '../components/AvatarUploadDialog';

export function Perfil() {
  const navigate = useNavigate();
  const { user, userProfile, updateUserProfileData } = useAuth();
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const displayName = userProfile?.nome || user?.displayName || 'Usuário';

  const handleAvatarChange = async (avatarUrl: string) => {
    if (!user) return;

    setUploadingAvatar(true);
    try {
      let finalUrl = avatarUrl;

      if (avatarUrl.startsWith('data:')) {
        const blob = await (await fetch(avatarUrl)).blob();
        const storageRef = ref(storage, `usuarios/${user.uid}/avatar.jpg`);
        await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
        finalUrl = await getDownloadURL(storageRef);
      }

      await updateUserProfileData({ avatar: finalUrl });
    } catch (error) {
      console.error('Erro ao atualizar foto de perfil:', error);
      alert('Erro ao salvar foto. Tente novamente.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-9 w-9 rounded-xl">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--theme-foreground)]">Meu perfil</h1>
          <p className="text-sm text-[var(--theme-muted-foreground)]">
            Veja os dados usados para personalizar seu TaskAll.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center">
          <div className="relative w-24 h-24 flex-shrink-0">
            <Avatar className="h-24 w-24 border border-[var(--theme-border)]">
              <AvatarImage src={userProfile?.avatar} alt={displayName} />
              <AvatarFallback className="text-xl">{getInitials(displayName)}</AvatarFallback>
            </Avatar>

            <button
              onClick={() => setAvatarDialogOpen(true)}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              title="Alterar foto"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>
          </div>

          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-semibold text-[var(--theme-foreground)]">{displayName}</h2>
            <p className="text-sm text-[var(--theme-muted-foreground)]">{userProfile?.email || user?.email}</p>
            <div className="flex flex-wrap gap-2">
              {userProfile?.profissao ? <Badge variant="outline">{userProfile.profissao}</Badge> : null}
              {userProfile?.localTrabalho ? <Badge variant="outline">{userProfile.localTrabalho}</Badge> : null}
            </div>
          </div>

          <Button variant="outline" className="rounded-xl" onClick={() => navigate('/onboarding')}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refazer onboarding
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border-l-4 border-l-[#0D5C7A]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-5 w-5 text-[#0D5C7A]" />
              Workspace de trabalho
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(userProfile?.preferencias?.workGoals ?? []).length > 0 ? (
              (userProfile?.preferencias?.workGoals ?? []).map((goal) => (
                <div key={goal} className="rounded-xl bg-[var(--theme-background-secondary)] px-4 py-3 text-sm">
                  {getGoalLabel(goal)}
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--theme-muted-foreground)]">Nenhum objetivo configurado.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-5 w-5 text-emerald-500" />
              Workspace de vida pessoal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(userProfile?.preferencias?.lifeGoals ?? []).length > 0 ? (
              (userProfile?.preferencias?.lifeGoals ?? []).map((goal) => (
                <div key={goal} className="rounded-xl bg-[var(--theme-background-secondary)] px-4 py-3 text-sm">
                  {getGoalLabel(goal)}
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--theme-muted-foreground)]">Nenhum objetivo configurado.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User2 className="h-5 w-5" />
            Dados do onboarding
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-[var(--theme-background-secondary)] p-4">
            <p className="text-xs text-[var(--theme-muted-foreground)]">Nome</p>
            <p className="mt-1 text-sm font-semibold text-[var(--theme-foreground)]">{displayName}</p>
          </div>
          <div className="rounded-2xl bg-[var(--theme-background-secondary)] p-4">
            <p className="text-xs text-[var(--theme-muted-foreground)]">Profissão</p>
            <p className="mt-1 text-sm font-semibold text-[var(--theme-foreground)]">
              {userProfile?.profissao || 'Não informada'}
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--theme-background-secondary)] p-4">
            <p className="text-xs text-[var(--theme-muted-foreground)]">Renda mensal</p>
            <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-[var(--theme-foreground)]">
              <Wallet className="h-4 w-4 text-[var(--theme-accent)]" />
              {typeof userProfile?.rendaMensal === 'number'
                ? formatCurrency(userProfile.rendaMensal)
                : 'Não informada'}
            </p>
          </div>
        </CardContent>
      </Card>

      <AvatarUploadDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        currentAvatar={userProfile?.avatar}
        onAvatarChange={handleAvatarChange}
        fallback={getInitials(displayName)}
      />
    </div>
  );
}
