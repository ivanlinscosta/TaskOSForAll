import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, GraduationCap, Play, Briefcase, Target, Trophy,
  Plus, Loader2, CheckCircle2, Clock, BarChart3, Sparkles,
  TrendingUp, ChevronDown, ExternalLink, Edit3, X, Check,
  Wallet, Heart, Zap, Wand2, Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../lib/auth-context';
import {
  getOrCreateProfile,
  getUserChallenges,
  ensureDefaultChallenges,
  type GamificationProfile,
  type UserChallenge,
} from '../../../services/gamification-service';
import {
  getDevelopmentItems,
  updateItemProgress,
  addDevelopmentItem,
  computeStats,
  filterByCategory,
  type DevelopmentItem,
  type DevelopmentItemStatus,
  type DevelopmentCategory,
} from '../../../services/development-service';
import {
  analisarCarreira,
  salvarAnaliseCarreira,
  type CarreiraInput,
  type RecomendacaoCarreira,
  type Highlight,
} from '../../../services/carreira-service';
import { LevelProgress } from '../../components/gamification/LevelProgress';
import { StreakCard } from '../../components/gamification/StreakCard';
import { ChallengeCard } from '../../components/gamification/ChallengeCard';
import { BadgeGrid } from '../../components/gamification/BadgeGrid';
import { HeroBackground } from '../../components/backgrounds/PageBackground';

// ── Type icons & colors ───────────────────────────────────────────────────────
const TYPE_CONFIG: Record<DevelopmentItem['type'], {
  Icon: React.ElementType; color: string; label: string; bg: string;
}> = {
  livro: { Icon: BookOpen,      color: '#8B5CF6', label: 'Livro',  bg: '#8B5CF610' },
  curso: { Icon: GraduationCap, color: '#0EA5E9', label: 'Curso',  bg: '#0EA5E910' },
  video: { Icon: Play,          color: '#EF4444', label: 'Vídeo',  bg: '#EF444410' },
  vaga:  { Icon: Briefcase,     color: '#10B981', label: 'Vaga',   bg: '#10B98110' },
};

const STATUS_CONFIG: Record<DevelopmentItemStatus, { label: string; color: string; bg: string }> = {
  nao_iniciado: { label: 'Não iniciado', color: '#6B7280',  bg: '#6B728015' },
  em_andamento: { label: 'Em andamento', color: '#3B82F6',  bg: '#3B82F615' },
  concluido:    { label: 'Concluído',    color: '#10B981',  bg: '#10B98115' },
  pausado:      { label: 'Pausado',      color: '#F59E0B',  bg: '#F59E0B15' },
};

type SectionKey = DevelopmentCategory;

const SECTION_META: Record<SectionKey, {
  title: string; subtitle: string; Icon: React.ElementType; accent: string; bg: string;
}> = {
  profissional: {
    title: 'Desenvolvimento Profissional',
    subtitle: 'Carreira, hard skills e objetivo profissional',
    Icon: Briefcase, accent: '#0D5C7A', bg: '#0D5C7A12',
  },
  financas: {
    title: 'Desenvolvimento Financeiro',
    subtitle: 'Educação financeira, orçamento e investimentos',
    Icon: Wallet, accent: '#10B981', bg: '#10B98112',
  },
  pessoal: {
    title: 'Desenvolvimento Pessoal',
    subtitle: 'Soft skills, hábitos e bem-estar',
    Icon: Heart, accent: '#8B5CF6', bg: '#8B5CF612',
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Progress Editor
// ──────────────────────────────────────────────────────────────────────────────
function ProgressEditor({ item, onSave, onCancel }: {
  item: DevelopmentItem;
  onSave: (progress: number, status: DevelopmentItemStatus, note: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [progress, setProgress] = useState(item.progress);
  const [status, setStatus] = useState<DevelopmentItemStatus>(item.status);
  const [note, setNote] = useState(item.progressNote ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(progress, status, note); } finally { setSaving(false); }
  };

  return (
    <div className="mt-3 rounded-xl p-3 space-y-3" style={{ background: 'var(--theme-background)', border: '1px solid var(--theme-border)' }}>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-[var(--theme-muted-foreground)]">
          <span>Progresso</span>
          <span className="font-bold text-[var(--theme-foreground)]">{progress}%</span>
        </div>
        <input
          type="range" min={0} max={100} value={progress}
          onChange={(e) => {
            const v = Number(e.target.value); setProgress(v);
            if (v === 100) setStatus('concluido');
            else if (v > 0 && status === 'nao_iniciado') setStatus('em_andamento');
          }}
          className="w-full accent-[var(--theme-accent)] cursor-pointer"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-[var(--theme-muted-foreground)]">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as DevelopmentItemStatus)}
          className="w-full rounded-lg border px-2 py-1.5 text-sm"
          style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-foreground)' }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
        </select>
      </div>
      <textarea className="w-full rounded-lg border px-2 py-1.5 text-xs resize-none"
        placeholder="Anotação (opcional)…" value={note} onChange={(e) => setNote(e.target.value)} rows={2}
        style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-foreground)' }} />
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 h-8 text-xs gap-1" style={{ background: 'var(--theme-accent)', color: '#fff' }} onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Salvar
        </Button>
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onCancel}><X className="h-3 w-3" /></Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Item card
// ──────────────────────────────────────────────────────────────────────────────
function DevItemCard({ item, onUpdateProgress }: {
  item: DevelopmentItem;
  onUpdateProgress: (item: DevelopmentItem, progress: number, status: DevelopmentItemStatus, note: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const config = TYPE_CONFIG[item.type];
  const statusCfg = STATUS_CONFIG[item.status];
  const { Icon } = config;

  return (
    <div className="rounded-2xl p-4 transition-all" style={{
      background: 'var(--theme-card)',
      border: `1px solid ${item.status === 'concluido' ? '#10B98130' : 'var(--theme-border)'}`,
    }}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: config.bg }}>
          {item.status === 'concluido'
            ? <CheckCircle2 className="h-5 w-5 text-green-500" />
            : <Icon className="h-5 w-5" style={{ color: config.color }} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-1.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--theme-foreground)] leading-tight">{item.titulo}</p>
              {item.autor && <p className="text-xs text-[var(--theme-muted-foreground)] mt-0.5">{item.autor}</p>}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Badge className="text-[10px] h-4 px-1.5" style={{ background: config.bg, color: config.color, border: 'none' }}>{config.label}</Badge>
              <Badge className="text-[10px] h-4 px-1.5" style={{ background: statusCfg.bg, color: statusCfg.color, border: 'none' }}>{statusCfg.label}</Badge>
            </div>
          </div>
          {item.type !== 'vaga' && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-[var(--theme-muted-foreground)]">
                <span>Progresso</span>
                <span className="font-medium text-[var(--theme-foreground)]">{item.progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--theme-border)]">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.progress}%`, background: item.status === 'concluido' ? '#10B981' : config.color }} />
              </div>
            </div>
          )}
          {item.motivo && (
            <p className="mt-2 text-xs text-[var(--theme-muted-foreground)] italic">💡 {item.motivo}</p>
          )}
          {item.progressNote && (
            <p className="mt-1.5 text-xs text-[var(--theme-muted-foreground)] italic">"{item.progressNote}"</p>
          )}
          <div className="mt-2.5 flex items-center gap-2">
            {item.link && (
              <a href={item.link} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: config.color }}>
                <ExternalLink className="h-3 w-3" /> {item.type === 'vaga' ? 'Ver vaga' : 'Acessar'}
              </a>
            )}
            {item.type !== 'vaga' && (
              <button onClick={() => setEditing((e) => !e)}
                className="ml-auto flex items-center gap-1 text-xs font-medium text-[var(--theme-muted-foreground)] hover:text-[var(--theme-foreground)]">
                <Edit3 className="h-3 w-3" /> {editing ? 'Cancelar' : 'Atualizar progresso'}
              </button>
            )}
          </div>
          {editing && (
            <ProgressEditor item={item}
              onSave={async (p, s, n) => { await onUpdateProgress(item, p, s, n); setEditing(false); }}
              onCancel={() => setEditing(false)} />
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Suggestion card (AI generated, not yet added)
// ──────────────────────────────────────────────────────────────────────────────
function SuggestionCard({ rec, adding, onAdd }: {
  rec: RecomendacaoCarreira;
  adding: boolean;
  onAdd: (rec: RecomendacaoCarreira) => void;
}) {
  const config = TYPE_CONFIG[rec.tipo];
  const { Icon } = config;

  return (
    <div className="rounded-2xl p-4" style={{
      background: 'var(--theme-card)',
      border: `1px dashed ${config.color}50`,
    }}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: config.bg }}>
          <Icon className="h-5 w-5" style={{ color: config.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <Badge className="text-[10px] h-4 px-1.5 mb-1" style={{ background: config.bg, color: config.color, border: 'none' }}>{config.label}</Badge>
          <p className="text-sm font-semibold text-[var(--theme-foreground)] leading-tight">{rec.titulo}</p>
          <p className="text-xs text-[var(--theme-muted-foreground)] mt-0.5">{rec.autor_ou_canal}</p>
          <p className="mt-2 text-xs leading-relaxed">{rec.descricao}</p>
          {rec.motivo && (
            <p className="mt-1 text-xs text-[var(--theme-muted-foreground)] italic">
              <span className="font-medium">Por que:</span> {rec.motivo}
            </p>
          )}
          <Button size="sm" className="mt-3 h-7 gap-1 text-xs"
            style={{ background: config.color, color: '#fff' }}
            disabled={adding}
            onClick={() => onAdd(rec)}>
            {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Adicionar à trilha
          </Button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Highlights banner
// ──────────────────────────────────────────────────────────────────────────────
function HighlightBanner({ highlights }: { highlights: Highlight[] }) {
  if (!highlights.length) return null;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {highlights.slice(0, 3).map((h, idx) => {
        const meta = SECTION_META[h.categoria];
        const Icon = meta.Icon;
        return (
          <div key={idx} className="rounded-2xl p-4" style={{
            background: `linear-gradient(135deg, ${meta.accent}18 0%, ${meta.accent}08 100%)`,
            border: `1px solid ${meta.accent}30`,
          }}>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: meta.accent, color: '#fff' }}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: meta.accent }}>{meta.title.split(' ')[1]}</p>
                <p className="text-sm font-semibold text-[var(--theme-foreground)] mt-0.5 leading-tight">{h.titulo}</p>
                <p className="text-xs text-[var(--theme-muted-foreground)] mt-1 leading-relaxed">{h.mensagem}</p>
                {h.acao_sugerida && (
                  <p className="text-xs font-medium mt-1.5" style={{ color: meta.accent }}>→ {h.acao_sugerida}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────────
export function MeuDesenvolvimentoPage() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [items, setItems] = useState<DevelopmentItem[]>([]);
  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [activeSection, setActiveSection] = useState<SectionKey>('profissional');
  const [showBadges, setShowBadges] = useState(false);

  // AI suggestions (not yet added)
  const [suggestions, setSuggestions] = useState<RecomendacaoCarreira[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      setIsLoading(true);
      try {
        await ensureDefaultChallenges(user.uid);
        const [prof, devItems, chals] = await Promise.all([
          getOrCreateProfile(user.uid),
          getDevelopmentItems(user.uid),
          getUserChallenges(user.uid),
        ]);
        setProfile(prof);
        setItems(devItems);
        setChallenges(chals);
      } catch (e) {
        console.error(e);
        toast.error('Erro ao carregar sua trilha.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [user?.uid]);

  // ── Update Progress ──────────────────────────────────────────────────────
  const handleUpdateProgress = async (
    item: DevelopmentItem, progress: number, status: DevelopmentItemStatus, note: string,
  ) => {
    if (!user?.uid) return;
    try {
      const award = await updateItemProgress(user.uid, item, progress, status, note);
      const [prof, devItems] = await Promise.all([
        getOrCreateProfile(user.uid),
        getDevelopmentItems(user.uid),
      ]);
      setProfile(prof); setItems(devItems);
      toast.success(status === 'concluido'
        ? `🎉 "${item.titulo}" concluído! +${award?.xpGained ?? 0} XP`
        : `Progresso atualizado! +${award?.xpGained ?? 0} XP`);
      award?.newBadges?.forEach((b) => toast.success(`🏅 Badge: ${b.title}!`));
      if (award?.levelUp && award.newLevelInfo) {
        toast.success(`🚀 Subiu de nível! ${award.newLevelInfo.emoji} ${award.newLevelInfo.title}`);
      }
    } catch { toast.error('Erro ao atualizar progresso.'); }
  };

  // ── Generate AI suggestions (cross-category) ─────────────────────────────
  const handleGenerateSuggestions = async () => {
    if (!user?.uid || !userProfile) {
      toast.error('Complete seu onboarding para receber sugestões personalizadas.');
      return;
    }
    setIsGenerating(true);
    try {
      const ss = userProfile.softSkills;
      const fn = userProfile.financas;

      const input: CarreiraInput = {
        cargo: userProfile.cargo || undefined,
        area: userProfile.areaAtuacao || undefined,
        anos_experiencia: userProfile.anosExperiencia || undefined,
        objetivos: userProfile.objetivoCarreira || undefined,
        habilidades_atuais: userProfile.habilidadesAtuais || undefined,
        curriculo_texto: userProfile.curriculoTexto || undefined,
        soft_skills_contexto: ss ? [
          `Comunicação ${ss.comunicacao}/5`, `Liderança ${ss.lideranca}/5`,
          `Colaboração ${ss.colaboracao}/5`, `Resolução ${ss.resolucaoProblemas}/5`,
          `Adaptabilidade ${ss.adaptabilidade}/5`, `Organização ${ss.organizacao}/5`,
          ss.estiloTrabalho && `Estilo: ${ss.estiloTrabalho}`,
          ss.pontosFortes && `Fortes: ${ss.pontosFortes}`,
          ss.pontosMelhorar && `Desenvolver: ${ss.pontosMelhorar}`,
        ].filter(Boolean).join(' · ') : undefined,
        financas_contexto: fn ? [
          fn.rendaMensal && `Renda R$ ${fn.rendaMensal}`,
          fn.gastoMedioMensal && `Gasto R$ ${fn.gastoMedioMensal}`,
          fn.reservaEmergencia !== undefined && `Reserva R$ ${fn.reservaEmergencia}`,
          fn.perfilInvestidor && `Perfil ${fn.perfilInvestidor}`,
          fn.jaInveste !== undefined && (fn.jaInveste ? 'Já investe' : 'Não investe'),
          fn.horizonte && `Horizonte ${fn.horizonte}`,
        ].filter(Boolean).join(' · ') : undefined,
        objetivos_financeiros: fn?.objetivosFinanceiros,
        objetivos_pessoais: userProfile.preferencias?.objetivos,
      };

      const result = await analisarCarreira(input);
      // Filter out suggestions the user already has
      const existingTitles = new Set(items.map((i) => i.titulo));
      const filtered = (result.recomendacoes ?? []).filter((r) => !existingTitles.has(r.titulo));
      setSuggestions(filtered);
      setHighlights(result.highlights ?? []);
      await salvarAnaliseCarreira(user.uid, input, result);
      toast.success(`${filtered.length} novas sugestões geradas pela IA!`);
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível gerar sugestões agora.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSuggestion = async (rec: RecomendacaoCarreira) => {
    if (!user?.uid) return;
    setAdding(rec.titulo);
    try {
      await addDevelopmentItem(user.uid, {
        type: rec.tipo,
        categoria: rec.categoria ?? 'profissional',
        titulo: rec.titulo,
        subtitulo: rec.descricao,
        autor: rec.autor_ou_canal,
        plataforma: rec.autor_ou_canal,
        descricao: rec.descricao,
        motivo: rec.motivo,
        status: 'nao_iniciado',
        progress: 0,
        workspaceType: 'work',
        source: 'ai_recommendation',
      });
      setSuggestions((prev) => prev.filter((r) => r.titulo !== rec.titulo));
      const [prof, devItems] = await Promise.all([
        getOrCreateProfile(user.uid),
        getDevelopmentItems(user.uid),
      ]);
      setProfile(prof); setItems(devItems);
      toast.success(`"${rec.titulo}" adicionado!`);
    } catch { toast.error('Erro ao adicionar.'); } finally { setAdding(null); }
  };

  // ── Derived ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => computeStats(items), [items]);
  const activeChallenges = useMemo(() => challenges.filter((c) => c.status === 'active'), [challenges]);
  const currentItems = useMemo(() => filterByCategory(items, activeSection), [items, activeSection]);
  const currentSuggestions = useMemo(
    () => suggestions.filter((s) => (s.categoria ?? 'profissional') === activeSection),
    [suggestions, activeSection],
  );

  // ── Loading ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--theme-accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* ── Hero ── */}
      <HeroBackground variant="development" className="rounded-2xl"
        style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', padding: '1.25rem 1.5rem' }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--theme-foreground)] sm:text-3xl">Meu Desenvolvimento</h1>
            <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">
              Sua trilha gamificada · profissional, financeira e pessoal — tudo baseado no seu perfil
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate('/carreira')}>
              <Plus className="h-3.5 w-3.5" /> Análise detalhada
            </Button>
            <Button size="sm" className="gap-1.5" disabled={isGenerating}
              style={{ background: 'var(--theme-accent)', color: '#fff' }}
              onClick={handleGenerateSuggestions}>
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
              {isGenerating ? 'Gerando…' : 'Novas sugestões IA'}
            </Button>
          </div>
        </div>
      </HeroBackground>

      {/* ── Highlights IA ── */}
      {highlights.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--theme-foreground)] flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[#0D5C7A]" /> Insights personalizados
          </h2>
          <HighlightBanner highlights={highlights} />
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Itens na trilha',   value: stats.total,     icon: BarChart3,    color: '#6366F1' },
          { label: 'Em andamento',      value: stats.active,    icon: Clock,        color: '#3B82F6' },
          { label: 'Concluídos',        value: stats.completed, icon: CheckCircle2, color: '#10B981' },
          { label: 'Desafios ativos',   value: activeChallenges.length, icon: Target, color: '#F59E0B' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ background: `${s.color}15` }}>
                    <Icon className="h-4 w-4" style={{ color: s.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-[var(--theme-foreground)]">{s.value}</p>
                    <p className="text-xs text-[var(--theme-muted-foreground)] truncate">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Level + Streak ── */}
      {profile && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--theme-muted-foreground)] mb-3">Nível de Evolução</p>
              <LevelProgress profile={profile} />
            </CardContent>
          </Card>
          <StreakCard profile={profile} label="Streak de aprendizado" />
        </div>
      )}

      {/* ── Active Challenges ── */}
      {activeChallenges.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--theme-foreground)] flex items-center gap-2">
            <Target className="h-4 w-4 text-[#0D5C7A]" /> Desafios Ativos
            <Badge className="text-xs" style={{ background: '#F59E0B15', color: '#F59E0B', border: 'none' }}>
              {activeChallenges.length}
            </Badge>
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {activeChallenges.map((ch) => <ChallengeCard key={ch.id} challenge={ch} />)}
          </div>
        </div>
      )}

      {/* ── Category Tabs ── */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {(['profissional', 'financas', 'pessoal'] as SectionKey[]).map((key) => {
          const meta = SECTION_META[key];
          const Icon = meta.Icon;
          const count = stats.byCategory[key];
          const done = stats.completedByCategory[key];
          const active = activeSection === key;
          return (
            <button key={key} onClick={() => setActiveSection(key)}
              className="rounded-2xl p-4 text-left transition-all"
              style={{
                background: active ? meta.bg : 'var(--theme-card)',
                border: `2px solid ${active ? meta.accent : 'var(--theme-border)'}`,
                boxShadow: active ? `0 6px 20px ${meta.accent}20` : 'none',
              }}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: active ? meta.accent : meta.bg, color: active ? '#fff' : meta.accent }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: active ? meta.accent : 'var(--theme-foreground)' }}>{meta.title}</p>
                  <p className="text-xs text-[var(--theme-muted-foreground)] mt-0.5">{meta.subtitle}</p>
                  <div className="mt-2 flex gap-3 text-xs">
                    <span className="text-[var(--theme-muted-foreground)]">{count} itens</span>
                    {done > 0 && <span className="text-green-600">{done} concluídos</span>}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Items of active section ── */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-[var(--theme-foreground)] flex items-center gap-2">
          <TrendingUp className="h-4 w-4" style={{ color: SECTION_META[activeSection].accent }} />
          Sua trilha em {SECTION_META[activeSection].title.toLowerCase()}
        </h2>

        {currentItems.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl py-10 text-center"
            style={{ background: 'var(--theme-background-secondary)', border: '1px dashed var(--theme-border)' }}>
            <span className="text-3xl">✨</span>
            <div>
              <p className="text-sm font-medium text-[var(--theme-foreground)]">Nada por aqui ainda</p>
              <p className="text-xs text-[var(--theme-muted-foreground)] mt-0.5">
                Clique em <strong>Novas sugestões IA</strong> acima para montar essa trilha.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {currentItems.map((item) => (
              <DevItemCard key={item.id} item={item} onUpdateProgress={handleUpdateProgress} />
            ))}
          </div>
        )}
      </div>

      {/* ── AI Suggestions (active section) ── */}
      {currentSuggestions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--theme-foreground)] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--theme-accent)]" /> Sugestões da IA
            <Badge className="text-xs" style={{ background: 'var(--theme-accent)20', color: 'var(--theme-accent)', border: 'none' }}>
              {currentSuggestions.length}
            </Badge>
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {currentSuggestions.map((rec, idx) => (
              <SuggestionCard key={`${rec.titulo}-${idx}`} rec={rec}
                adding={adding === rec.titulo}
                onAdd={handleAddSuggestion} />
            ))}
          </div>
        </div>
      )}

      {/* ── Badges ── */}
      {profile && (
        <Card>
          <CardHeader>
            <button className="flex w-full items-center justify-between text-left" onClick={() => setShowBadges((s) => !s)}>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-[#0D5C7A]" /> Conquistas
                <Badge className="text-xs" style={{ background: '#F59E0B15', color: '#F59E0B', border: 'none' }}>
                  {profile.earnedBadges.length} / 11
                </Badge>
              </CardTitle>
              <ChevronDown className="h-4 w-4 text-[var(--theme-muted-foreground)] transition-transform"
                style={{ transform: showBadges ? 'rotate(180deg)' : 'none' }} />
            </button>
          </CardHeader>
          {showBadges
            ? <CardContent className="pt-0"><BadgeGrid profile={profile} /></CardContent>
            : profile.earnedBadges.length > 0 && <CardContent className="pt-0"><BadgeGrid profile={profile} compact /></CardContent>}
        </Card>
      )}
    </div>
  );
}
