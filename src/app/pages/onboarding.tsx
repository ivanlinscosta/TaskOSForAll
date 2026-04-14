import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Briefcase, CheckCircle2, Heart, Sparkles } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { WORK_GOALS, LIFE_GOALS } from '../../lib/taskos-forall';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { userProfile, completeOnboarding } = useAuth();

  const isRedo = !!userProfile?.onboardingCompleted;
  const [isSaving, setIsSaving] = useState(false);
  const [nome, setNome] = useState(userProfile?.nome || '');
  const [profissao, setProfissao] = useState(userProfile?.profissao || '');
  const [localTrabalho, setLocalTrabalho] = useState(userProfile?.localTrabalho || '');
  const [rendaMensal, setRendaMensal] = useState(
    userProfile?.rendaMensal ? String(userProfile.rendaMensal) : '',
  );
  const [workGoals, setWorkGoals] = useState<string[]>(userProfile?.preferencias?.workGoals || []);
  const [lifeGoals, setLifeGoals] = useState<string[]>(userProfile?.preferencias?.lifeGoals || []);

  const canSubmit = useMemo(() => {
    return (
      nome.trim().length >= 2 &&
      profissao.trim().length >= 2 &&
      localTrabalho.trim().length >= 2 &&
      workGoals.length > 0 &&
      lifeGoals.length > 0
    );
  }, [nome, profissao, localTrabalho, workGoals, lifeGoals]);

  const toggleGoal = (current: string[], setter: (next: string[]) => void, goalId: string) => {
    setter(current.includes(goalId) ? current.filter((item) => item !== goalId) : [...current, goalId]);
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error('Preencha os dados e selecione pelo menos um objetivo em cada workspace.');
      return;
    }

    try {
      setIsSaving(true);
      await completeOnboarding({
        nome,
        profissao,
        localTrabalho,
        rendaMensal: Number(rendaMensal || 0),
        preferencias: {
          workGoals,
          lifeGoals,
        },
      });
      toast.success('Personalização salva com sucesso!');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível concluir o onboarding.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-[var(--theme-background)] px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--theme-accent)] text-[var(--theme-accent-foreground)]">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">
            {isRedo ? 'Atualizar personalização' : 'Bem-vindo ao TaskOS For All'}
          </h1>
          <p className="mt-2 text-sm text-[var(--theme-muted-foreground)]">
            {isRedo
              ? 'Atualize seus dados e objetivos para repersonalizar o sistema.'
              : 'Vamos personalizar o sistema com base no seu contexto profissional e pessoal.'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Seu perfil inicial</CardTitle>
            <CardDescription>
              Essas informações serão usadas para personalizar dashboard, menus, reader, perfil e chat.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label>Profissão</Label>
              <Input value={profissao} onChange={(e) => setProfissao(e.target.value)} placeholder="Ex.: professor, gerente, analista..." />
            </div>
            <div className="space-y-2">
              <Label>Local onde trabalha</Label>
              <Input value={localTrabalho} onChange={(e) => setLocalTrabalho(e.target.value)} placeholder="Ex.: escola, empresa, consultório..." />
            </div>
            <div className="space-y-2">
              <Label>Renda mensal</Label>
              <Input
                value={rendaMensal}
                onChange={(e) => setRendaMensal(e.target.value)}
                placeholder="Ex.: 5000"
                inputMode="decimal"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-orange-500" />
                Workspace de trabalho
              </CardTitle>
              <CardDescription>Escolha os objetivos que você deseja acompanhar no contexto profissional.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              {WORK_GOALS.map((goal) => {
                const active = workGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(workGoals, setWorkGoals, goal.id)}
                    className={cn(
                      'rounded-2xl border px-4 py-4 text-left transition-all',
                      active && 'border-[var(--theme-accent)] bg-[var(--theme-background-secondary)] shadow-sm',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--theme-foreground)]">{goal.label}</p>
                        <p className="mt-1 text-xs text-[var(--theme-muted-foreground)]">{goal.description}</p>
                      </div>
                      {active && <CheckCircle2 className="h-5 w-5 text-[var(--theme-accent)]" />}
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-emerald-500" />
                Workspace de vida pessoal
              </CardTitle>
              <CardDescription>Escolha o que você quer organizar no seu dia a dia pessoal.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              {LIFE_GOALS.map((goal) => {
                const active = lifeGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(lifeGoals, setLifeGoals, goal.id)}
                    className={cn(
                      'rounded-2xl border px-4 py-4 text-left transition-all',
                      active && 'border-[var(--theme-accent)] bg-[var(--theme-background-secondary)] shadow-sm',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--theme-foreground)]">{goal.label}</p>
                        <p className="mt-1 text-xs text-[var(--theme-muted-foreground)]">{goal.description}</p>
                      </div>
                      {active && <CheckCircle2 className="h-5 w-5 text-[var(--theme-accent)]" />}
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          {isRedo && (
            <Button type="button" variant="outline" className="rounded-xl px-6" onClick={() => navigate('/perfil')}>
              Cancelar
            </Button>
          )}
          <Button type="button" variant="theme" className="rounded-xl px-6" disabled={!canSubmit || isSaving} onClick={handleSubmit}>
            {isSaving ? 'Salvando...' : isRedo ? 'Salvar alterações' : 'Concluir personalização'}
          </Button>
        </div>
      </div>
    </div>
  );
}
