import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowRight, BookOpen, Brain, Briefcase, Calendar, CheckSquare, Flame,
  Heart, Loader, Plane, Sparkles, Target, Trophy, Wallet, Wand2, Zap,
  Lightbulb, TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useAuth } from '../../lib/auth-context';
import { listarTarefas } from '../../services/tarefas-service';
import { listarTarefasPessoais } from '../../services/tarefas-pessoais-service';
import { listarReunioes } from '../../services/reunioes-service';
import { listarCustos } from '../../services/custos-service';
import { listarViagens } from '../../services/viagens-service';
import { verificarTarefasVencimentoProximo } from '../../services/notifications-service';
import {
  getDevelopmentItems,
  computeStats,
  filterByCategory,
  getNextBestAction,
  type DevelopmentItem,
} from '../../services/development-service';
import {
  getOrCreateProfile,
  type GamificationProfile,
} from '../../services/gamification-service';
import { carregarAnaliseCarreira, type CarreiraAnalise } from '../../services/carreira-service';
import { LevelProgress } from '../components/gamification/LevelProgress';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

type Stats = {
  tasks: number; commitments: number; expenses: number; trips: number;
};

export function Dashboard() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ tasks: 0, commitments: 0, expenses: 0, trips: 0 });
  const [devItems, setDevItems] = useState<DevelopmentItem[]>([]);
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [analise, setAnalise] = useState<CarreiraAnalise | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      setLoading(true);
      try {
        const [tarefas, tarefasP, reunioes, custos, viagens, items, prof, saved] = await Promise.all([
          listarTarefas().catch(() => []),
          listarTarefasPessoais().catch(() => []),
          listarReunioes().catch(() => []),
          listarCustos().catch(() => []),
          listarViagens().catch(() => []),
          getDevelopmentItems(user.uid).catch(() => []),
          getOrCreateProfile(user.uid),
          carregarAnaliseCarreira(user.uid).catch(() => null),
        ]);
        setStats({
          tasks: tarefas.length + tarefasP.length,
          commitments: reunioes.length,
          expenses: custos.length,
          trips: viagens.length,
        });
        setDevItems(items);
        setProfile(prof);
        setAnalise(saved);

        // Verificar tarefas vencidas/próximas e gerar notificações
        verificarTarefasVencimentoProximo(user.uid, tarefasP).catch(() => {});
      } catch (e) {
        console.error(e);
        toast.error('Erro ao carregar dashboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.uid]);

  // ── Derived ─────────────────────────────────────────────────────────────
  const nome = userProfile?.nome || user?.displayName || 'Usuário';
  const firstName = nome.split(' ')[0];

  const devStats = useMemo(() => computeStats(devItems), [devItems]);
  const nextAction = useMemo(() => getNextBestAction(devItems), [devItems]);

  const profItems  = useMemo(() => filterByCategory(devItems, 'profissional'), [devItems]);
  const finItems   = useMemo(() => filterByCategory(devItems, 'financas'), [devItems]);
  const pessoalItems = useMemo(() => filterByCategory(devItems, 'pessoal'), [devItems]);

  // Soft skills: encontra a skill mais fraca
  const ss = userProfile?.softSkills;
  const softWeakest = useMemo(() => {
    if (!ss) return null;
    const entries: Array<[string, number]> = [
      ['Comunicação', ss.comunicacao],
      ['Liderança', ss.lideranca],
      ['Colaboração', ss.colaboracao],
      ['Resolução de problemas', ss.resolucaoProblemas],
      ['Adaptabilidade', ss.adaptabilidade],
      ['Organização', ss.organizacao],
    ];
    entries.sort((a, b) => a[1] - b[1]);
    return entries[0];
  }, [ss]);

  const fn = userProfile?.financas;
  const highlights = analise?.output?.highlights ?? [];

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-[var(--theme-accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* ── Hero ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="rounded-[32px] border border-[var(--theme-border)] bg-[var(--theme-card)] p-7 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-background-secondary)] px-3 py-1 text-xs font-medium text-[var(--theme-accent)]">
            <Sparkles className="h-3.5 w-3.5" /> TaskAll
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--theme-foreground)]">
            Olá, {firstName} 👋
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--theme-muted-foreground)]">
            {userProfile?.profissao
              ? <>Você é <strong>{userProfile.profissao}</strong>{userProfile.localTrabalho ? <> em <strong>{userProfile.localTrabalho}</strong></> : null}. Seu dashboard foi montado com base no seu perfil, objetivos e dados do Firebase.</>
              : <>Seu dashboard está pronto. Complete seu perfil para desbloquear recomendações mais precisas.</>}
          </p>

          {/* Chips de objetivos do usuário */}
          {userProfile?.preferencias?.objetivos?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {userProfile.preferencias.objetivos.slice(0, 6).map((obj) => (
                <Badge key={obj} className="border-none text-xs" style={{ background: 'var(--theme-accent)15', color: 'var(--theme-accent)' }}>
                  <Target className="mr-1 h-3 w-3" />
                  {obj.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        {/* Nível + Streak */}
        {profile && (
          <div className="grid grid-cols-1 gap-4">
            <Card className="rounded-[28px] border-[var(--theme-border)]">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--theme-muted-foreground)] mb-3">
                  Seu nível
                </p>
                <LevelProgress profile={profile} />
              </CardContent>
            </Card>
            <Card className="rounded-[28px] border-[var(--theme-border)]">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: '#F59E0B15' }}>
                  <Flame className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--theme-muted-foreground)]">Streak</p>
                  <p className="text-2xl font-bold text-[var(--theme-foreground)]">
                    {profile.currentStreak} {profile.currentStreak === 1 ? 'dia' : 'dias'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ── Highlights IA (das 3 categorias) ── */}
      {highlights.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--theme-foreground)] flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" /> Highlights personalizados para você
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {highlights.slice(0, 3).map((h, idx) => {
              const meta = {
                profissional: { color: '#EC7000', Icon: Briefcase, label: 'Profissional' },
                financas:     { color: '#10B981', Icon: Wallet,    label: 'Financeiro' },
                pessoal:      { color: '#8B5CF6', Icon: Heart,     label: 'Pessoal' },
              }[h.categoria];
              const Icon = meta.Icon;
              return (
                <div key={idx} className="rounded-2xl p-4" style={{
                  background: `linear-gradient(135deg, ${meta.color}18 0%, ${meta.color}08 100%)`,
                  border: `1px solid ${meta.color}30`,
                }}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: meta.color, color: '#fff' }}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: meta.color }}>{meta.label}</p>
                      <p className="text-sm font-semibold text-[var(--theme-foreground)] mt-0.5">{h.titulo}</p>
                      <p className="text-xs text-[var(--theme-muted-foreground)] mt-1 leading-relaxed">{h.mensagem}</p>
                      {h.acao_sugerida && (
                        <p className="text-xs font-medium mt-1.5" style={{ color: meta.color }}>→ {h.acao_sugerida}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Próxima melhor ação ── */}
      {nextAction && (
        <div className="flex items-start gap-4 rounded-2xl p-4"
          style={{ background: 'var(--theme-accent)10', border: '1px solid var(--theme-accent)25' }}>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--theme-accent)20' }}>
            <Sparkles className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-accent)' }}>
              Próxima melhor ação
            </p>
            <p className="mt-0.5 text-sm text-[var(--theme-foreground)]">{nextAction}</p>
          </div>
          <Button size="sm" variant="outline" className="h-8" onClick={() => navigate('/meu-desenvolvimento')}>
            Ir para trilha <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* ── Grid de 3 categorias de desenvolvimento ── */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-[var(--theme-foreground)] flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Suas trilhas de desenvolvimento
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { key: 'profissional', title: 'Profissional', subtitle: userProfile?.objetivoCarreira || 'Carreira e hard skills', items: profItems,    Icon: Briefcase, color: '#EC7000' },
            { key: 'financas',     title: 'Financeiro',   subtitle: fn?.objetivosFinanceiros?.[0] || 'Finanças e investimentos', items: finItems,     Icon: Wallet,    color: '#10B981' },
            { key: 'pessoal',      title: 'Pessoal',      subtitle: softWeakest ? `Desenvolver: ${softWeakest[0]}` : 'Soft skills e hábitos',       items: pessoalItems, Icon: Heart,     color: '#8B5CF6' },
          ].map((cat) => {
            const Icon = cat.Icon;
            const done = cat.items.filter((i) => i.status === 'concluido').length;
            return (
              <button key={cat.key}
                onClick={() => navigate('/meu-desenvolvimento')}
                className="rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${cat.color}15`, color: cat.color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--theme-foreground)]">Desenvolvimento {cat.title}</p>
                    <p className="text-xs text-[var(--theme-muted-foreground)] mt-0.5 truncate">{cat.subtitle}</p>
                    <div className="mt-2.5 flex items-center gap-3 text-xs">
                      <span className="text-[var(--theme-foreground)] font-semibold">{cat.items.length} itens</span>
                      {done > 0 && <span className="text-green-600">{done} concluídos</span>}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--theme-muted-foreground)]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Resumo do perfil do onboarding ── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Profissional */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-[#EC7000]" /> Carreira
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {userProfile?.cargo && <p><strong>Cargo:</strong> {userProfile.cargo}</p>}
            {userProfile?.areaAtuacao && <p><strong>Área:</strong> {userProfile.areaAtuacao}</p>}
            {userProfile?.anosExperiencia && <p><strong>Experiência:</strong> {userProfile.anosExperiencia} anos</p>}
            {userProfile?.objetivoCarreira && (
              <p className="text-xs italic text-[var(--theme-muted-foreground)]">
                🎯 {userProfile.objetivoCarreira}
              </p>
            )}
            {!userProfile?.cargo && (
              <p className="text-xs text-[var(--theme-muted-foreground)]">Complete seu perfil de carreira.</p>
            )}
          </CardContent>
        </Card>

        {/* Financeiro */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-[#10B981]" /> Finanças
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {fn?.rendaMensal ? <p><strong>Renda:</strong> {formatCurrency(fn.rendaMensal)}</p> : null}
            {fn?.reservaEmergencia !== undefined ? <p><strong>Reserva:</strong> {formatCurrency(fn.reservaEmergencia)}</p> : null}
            {fn?.perfilInvestidor ? <p><strong>Perfil:</strong> {fn.perfilInvestidor}</p> : null}
            {fn?.objetivosFinanceiros?.length ? (
              <p className="text-xs italic text-[var(--theme-muted-foreground)]">
                🎯 {fn.objetivosFinanceiros.slice(0, 2).join(' · ')}
              </p>
            ) : null}
            {!fn && <p className="text-xs text-[var(--theme-muted-foreground)]">Adicione seu perfil financeiro.</p>}
          </CardContent>
        </Card>

        {/* Comportamental */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Heart className="h-4 w-4 text-[#8B5CF6]" /> Comportamental
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {ss ? (
              <>
                {softWeakest && (
                  <p>
                    <strong>Desenvolver:</strong>{' '}
                    <span style={{ color: '#8B5CF6' }}>{softWeakest[0]} ({softWeakest[1]}/5)</span>
                  </p>
                )}
                {ss.pontosFortes && <p className="text-xs italic text-[var(--theme-muted-foreground)]">💪 {ss.pontosFortes}</p>}
              </>
            ) : (
              <p className="text-xs text-[var(--theme-muted-foreground)]">Complete seu perfil comportamental.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Stats rápidas do sistema ── */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-[var(--theme-foreground)] flex items-center gap-2">
          <Zap className="h-4 w-4" /> Seus dados no TaskOS
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { k: 'tasks',     label: 'Tarefas',      value: stats.tasks,       icon: CheckSquare, color: '#3B82F6', path: '/tarefas' },
            { k: 'commits',   label: 'Compromissos', value: stats.commitments, icon: Calendar,    color: '#8B5CF6', path: '/planejamento' },
            { k: 'expenses',  label: 'Lançamentos',  value: stats.expenses,    icon: Wallet,      color: '#10B981', path: '/financas' },
            { k: 'trips',     label: 'Viagens',      value: stats.trips,       icon: Plane,       color: '#F59E0B', path: '/pessoal/viagens' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <button key={s.k} onClick={() => navigate(s.path)}
                className="rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${s.color}15` }}>
                    <Icon className="h-5 w-5" style={{ color: s.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-[var(--theme-foreground)]">{s.value}</p>
                    <p className="text-xs text-[var(--theme-muted-foreground)] truncate">{s.label}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CTA para nova análise ── */}
      <Card className="rounded-[24px] border-l-4 border-l-[var(--theme-accent)]">
        <CardContent className="p-5 flex flex-wrap items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'var(--theme-accent)15' }}>
            <Wand2 className="h-6 w-6 text-[var(--theme-accent)]" />
          </div>
          <div className="flex-1 min-w-[220px]">
            <p className="text-sm font-semibold text-[var(--theme-foreground)]">Quer novas recomendações?</p>
            <p className="text-xs text-[var(--theme-muted-foreground)] mt-0.5">
              A IA gera novos insights com base no seu perfil completo (carreira, finanças e soft skills).
            </p>
          </div>
          <Button onClick={() => navigate('/meu-desenvolvimento')}
            style={{ background: 'var(--theme-accent)', color: '#fff' }}>
            <Sparkles className="mr-2 h-4 w-4" /> Gerar com IA
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
