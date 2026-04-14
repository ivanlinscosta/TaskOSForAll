import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Briefcase,
  Calendar,
  CheckSquare,
  Heart,
  Loader,
  MessageSquare,
  Plane,
  Receipt,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useAuth } from '../../lib/auth-context';
import { useAppStore } from '../../stores/useAppStore';
import { getWorkspaceMenuItems, getWorkspaceTitle } from '../../lib/taskos-forall';
import { countDocsByOwner } from '../../services/forall-data-service';
import { COLLECTIONS } from '../../lib/firebase-config';

type DashboardStats = {
  tasks: number;
  feedbacks: number;
  meetings: number;
  students: number;
  classes: number;
  expenses: number;
  trips: number;
  personalTasks: number;
};

const initialStats: DashboardStats = {
  tasks: 0,
  feedbacks: 0,
  meetings: 0,
  students: 0,
  classes: 0,
  expenses: 0,
  trips: 0,
  personalTasks: 0,
};

export function Dashboard() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { contextMode } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>(initialStats);

  useEffect(() => {
    void loadStats();
  }, [user?.uid]);

  const loadStats = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      const [
        tasks,
        feedbacks,
        meetings,
        students,
        classesCount,
        expenses,
        trips,
        personalTasks,
      ] = await Promise.all([
        countDocsByOwner(COLLECTIONS.TAREFAS, user.uid),
        countDocsByOwner(COLLECTIONS.FEEDBACKS, user.uid),
        countDocsByOwner(COLLECTIONS.REUNIOES, user.uid),
        countDocsByOwner(COLLECTIONS.ALUNOS, user.uid),
        countDocsByOwner(COLLECTIONS.AULAS, user.uid),
        countDocsByOwner(COLLECTIONS.CUSTOS, user.uid),
        countDocsByOwner(COLLECTIONS.VIAGENS, user.uid),
        countDocsByOwner(COLLECTIONS.TAREFAS_PESSOAIS, user.uid),
      ]);

      setStats({
        tasks,
        feedbacks,
        meetings,
        students,
        classes: classesCount,
        expenses,
        trips,
        personalTasks,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const workspaceMenu = useMemo(
    () => getWorkspaceMenuItems(userProfile?.preferencias, contextMode),
    [userProfile?.preferencias, contextMode],
  );

  const personalizedCards = useMemo(() => {
    const workCards = [
      {
        key: 'tasks',
        title: 'Tarefas do trabalho',
        value: stats.tasks,
        description: 'Itens no seu workspace profissional',
        icon: CheckSquare,
        route: '/workspace/work/tasks',
      },
      {
        key: 'feedbacks',
        title: 'Feedbacks registrados',
        value: stats.feedbacks,
        description: 'Feedbacks armazenados no seu sistema',
        icon: MessageSquare,
        route: '/workspace/work/feedbacks',
      },
      {
        key: 'meetings',
        title: 'Reuniões',
        value: stats.meetings,
        description: 'Reuniões do seu workspace de trabalho',
        icon: Calendar,
        route: '/workspace/work/commitments',
      },
      {
        key: 'students',
        title: 'Pessoas acompanhadas',
        value: stats.students,
        description: 'Alunos, clientes ou pessoas monitoradas',
        icon: Users,
        route: '/workspace/work/students',
      },
      {
        key: 'classes',
        title: 'Planejamentos',
        value: stats.classes,
        description: 'Aulas, sessões ou planejamentos salvos',
        icon: BookOpen,
        route: '/workspace/work/classes',
      },
      {
        key: 'work-finance',
        title: 'Gestão financeira',
        value: stats.expenses,
        description: 'Lançamentos e custos do trabalho',
        icon: Receipt,
        route: '/workspace/work/finance',
      },
    ];

    const lifeCards = [
      {
        key: 'life-tasks',
        title: 'Tarefas pessoais',
        value: stats.personalTasks,
        description: 'Pendências e objetivos pessoais',
        icon: CheckSquare,
        route: '/workspace/life/tasks',
      },
      {
        key: 'life-finance',
        title: 'Gestão financeira',
        value: stats.expenses,
        description: 'Receitas, despesas e visão financeira',
        icon: Wallet,
        route: '/workspace/life/finance',
      },
      {
        key: 'life-trips',
        title: 'Viagens',
        value: stats.trips,
        description: 'Viagens registradas na sua conta',
        icon: Plane,
        route: '/workspace/life/trips',
      },
    ];

    const allowedRoutes = new Set(workspaceMenu.map((item) => item.path));
    const source = contextMode === 'work' ? workCards : lifeCards;

    return source.filter((card) => allowedRoutes.has(card.route));
  }, [contextMode, stats, workspaceMenu]);

  const topActions = useMemo(() => {
    return workspaceMenu.filter((item) => item.path !== '/').slice(0, 4);
  }, [workspaceMenu]);

  const welcomeName = userProfile?.nome || user?.displayName || 'Usuário';
  const objectiveCount =
    (userProfile?.preferencias?.workGoals?.length || 0) +
    (userProfile?.preferencias?.lifeGoals?.length || 0);

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="rounded-[32px] border border-[var(--theme-border)] bg-[var(--theme-card)] p-7 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-background-secondary)] px-3 py-1 text-xs font-medium text-[var(--theme-accent)]">
            <Sparkles className="h-3.5 w-3.5" />
            TaskOS For All
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--theme-foreground)]">
            Olá, {welcomeName.split(' ')[0]}
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--theme-muted-foreground)]">
            Este dashboard foi personalizado com base no seu onboarding, objetivos e dados salvos no Firebase.
            Atualmente você está no <strong>{getWorkspaceTitle(contextMode).toLowerCase()}</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <Card className="rounded-[28px] border-[var(--theme-border)] shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--theme-muted-foreground)]">
                Objetivos ativos
              </p>
              <p className="mt-3 text-4xl font-bold text-[var(--theme-foreground)]">{objectiveCount}</p>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-[var(--theme-border)] shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--theme-muted-foreground)]">
                Profissão
              </p>
              <p className="mt-3 text-lg font-semibold text-[var(--theme-foreground)]">
                {userProfile?.profissao || 'Não informada'}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-[var(--theme-border)] shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--theme-muted-foreground)]">
                Local de trabalho
              </p>
              <p className="mt-3 text-lg font-semibold text-[var(--theme-foreground)]">
                {userProfile?.localTrabalho || 'Não informado'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-[var(--theme-accent)]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {personalizedCards.map((card) => (
              <Card
                key={card.key}
                className="cursor-pointer rounded-[28px] border-[var(--theme-border)] transition-all hover:-translate-y-0.5 hover:shadow-lg"
                onClick={() => navigate(card.route)}
              >
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-2xl bg-[var(--theme-background-secondary)] p-3 text-[var(--theme-accent)]">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline">
                      {contextMode === 'work' ? 'Trabalho' : 'Vida pessoal'}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-[var(--theme-muted-foreground)]">{card.title}</p>
                  <p className="mt-2 text-3xl font-bold text-[var(--theme-foreground)]">{card.value}</p>
                  <p className="mt-2 text-xs text-[var(--theme-muted-foreground)]">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Card className="rounded-[28px] border-l-4 border-l-[var(--theme-accent)]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-5 w-5 text-[var(--theme-accent)]" />
                  Reader personalizado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-[var(--theme-foreground)]">
                <p>
                  Seu sistema está organizado em dois workspaces: <strong>trabalho</strong> e <strong>vida pessoal</strong>.
                  O menu lateral e os cards abaixo mudam automaticamente de acordo com os objetivos que você definiu.
                </p>
                <div className="rounded-2xl bg-[var(--theme-background-secondary)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--theme-muted-foreground)]">
                    Como usar melhor
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li>• Use o chat guiado para cadastrar dados rapidamente pelo celular.</li>
                    <li>• Troque de workspace no header para ver menus e cards diferentes.</li>
                    <li>• Refaça o onboarding a qualquer momento pelo perfil para mudar preferências.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  {contextMode === 'work' ? <Briefcase className="h-5 w-5" /> : <Heart className="h-5 w-5" />}
                  Ações rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topActions.map((action) => (
                  <button
                    key={action.key}
                    onClick={() => navigate(action.path)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] px-4 py-3 text-left transition hover:border-[var(--theme-accent)] hover:shadow-sm"
                  >
                    <div className="rounded-xl bg-[var(--theme-background-secondary)] p-2 text-[var(--theme-accent)]">
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--theme-foreground)]">{action.label}</p>
                      <p className="text-xs text-[var(--theme-muted-foreground)]">{action.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--theme-muted-foreground)]" />
                  </button>
                ))}

                <Button type="button" variant="outline" className="w-full rounded-xl" onClick={() => navigate('/chat')}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Abrir chat guiado
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}