import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Briefcase, BookOpen, Play, GraduationCap, Star, TrendingUp, AlertCircle,
  ChevronDown, ChevronUp, Loader2, Sparkles, Target, CheckCircle2, XCircle,
  Upload, FileText, X, RefreshCw, Clock, Zap, Flame, ArrowRight, MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../lib/auth-context';
import {
  analisarCarreira,
  salvarAnaliseCarreira,
  carregarAnaliseCarreira,
  objetivoImplicaTransicao,
  gerarLinkVaga,
  type CarreiraOutput,
  type CarreiraInput,
  type RecomendacaoCarreira,
  type VagaCarreira,
} from '../../../services/carreira-service';
import { extractTextFromPDF } from '../../../services/fatura-cartao-service';
import { RecommendationCard } from '../../components/career/RecommendationCard';
import { JobCard } from '../../components/career/JobCard';
import { LevelProgress } from '../../components/gamification/LevelProgress';
import { StreakCard } from '../../components/gamification/StreakCard';
import { BadgeGrid } from '../../components/gamification/BadgeGrid';
import { HeroBackground } from '../../components/backgrounds/PageBackground';
import {
  getOrCreateProfile,
  awardXP,
  ensureDefaultChallenges,
  type GamificationProfile,
} from '../../../services/gamification-service';
import {
  addDevelopmentItem,
  getDevelopmentItems,
  type DevelopmentItem,
} from '../../../services/development-service';

// ── Constants ─────────────────────────────────────────────────────────────────
const NIVEL_LABEL: Record<string, string> = {
  basico: 'Básico',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};
const NIVEL_COR: Record<string, string> = {
  basico: '#F59E0B',
  intermediario: '#3B82F6',
  avancado: '#10B981',
};
const FORM_VAZIO: CarreiraInput & { curriculo_texto: string } = {
  cargo: '',
  area: '',
  anos_experiencia: '',
  objetivos: '',
  habilidades_atuais: '',
  curriculo_texto: '',
};

// ── Component ─────────────────────────────────────────────────────────────────
export function CarreiraPage() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<typeof FORM_VAZIO>(FORM_VAZIO);
  const [resultado, setResultado] = useState<CarreiraOutput | null>(null);
  const [analisadoEm, setAnalisadoEm] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [modoRefazer, setModoRefazer] = useState(false);
  const [expandido, setExpandido] = useState<'hard' | 'soft' | null>('hard');
  const [activeTab, setActiveTab] = useState<'analise' | 'recomendacoes' | 'vagas'>('analise');

  // Curriculum
  const [curriculoArquivo, setCurriculoArquivo] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gamification
  const [profile, setProfile] = useState<GamificationProfile | null>(null);

  // Development items already added (to mark as "added")
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [savingJob, setSavingJob] = useState<string | null>(null);

  // ── Load on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([
      carregarAnaliseCarreira(user.uid),
      getOrCreateProfile(user.uid),
      getDevelopmentItems(user.uid),
      ensureDefaultChallenges(user.uid),
    ])
      .then(([saved, prof, devItems]) => {
        // Prefill form PRIMEIRO com os dados do onboarding (userProfile),
        // depois sobrescreve com a última análise salva (que pode ter refinamentos).
        setForm((prev) => ({
          ...prev,
          cargo:              userProfile?.cargo                    || prev.cargo,
          area:               userProfile?.areaAtuacao              || prev.area,
          anos_experiencia:   userProfile?.anosExperiencia          || prev.anos_experiencia,
          objetivos:          userProfile?.objetivoCarreira         || prev.objetivos,
          habilidades_atuais: userProfile?.habilidadesAtuais        || prev.habilidades_atuais,
          curriculo_texto:    userProfile?.curriculoTexto           || prev.curriculo_texto,
          ...(saved?.input ?? {}),
        }));
        if (userProfile?.curriculoTexto && !curriculoArquivo) {
          setCurriculoArquivo('Currículo do onboarding');
        }
        if (saved) {
          setResultado(saved.output);
          setAnalisadoEm(saved.analisadoEm);
        }
        setProfile(prof);
        // Build set of already-added items by titulo
        const added = new Set(devItems.map((i) => i.titulo));
        setAddedItems(added);
        const savedJobTitles = new Set(
          devItems.filter((i) => i.type === 'vaga').map((i) => i.titulo),
        );
        setSavedJobs(savedJobTitles);
      })
      .catch(console.error)
      .finally(() => setIsLoadingSaved(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, userProfile?.uid]);

  // ── Curriculum ────────────────────────────────────────────────────────────
  const processarCurriculo = async (file: File) => {
    const isPDF = file.name.toLowerCase().endsWith('.pdf');
    const isText = file.name.toLowerCase().match(/\.(docx?|txt|rtf)$/);
    if (!isPDF && !isText) {
      toast.error('Formato não suportado. Use PDF, DOC, DOCX ou TXT.');
      return;
    }
    setIsExtracting(true);
    try {
      const texto = isPDF ? await extractTextFromPDF(file) : await file.text();
      if (!texto.trim()) {
        toast.error('Não foi possível extrair texto. Tente colar manualmente.');
        return;
      }
      setForm((f) => ({ ...f, curriculo_texto: texto.substring(0, 12000) }));
      setCurriculoArquivo(file.name);
      toast.success('Currículo carregado!');
    } catch {
      toast.error('Erro ao ler o arquivo. Tente colar o texto manualmente.');
    } finally {
      setIsExtracting(false);
    }
  };
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processarCurriculo(file);
    e.target.value = '';
  };
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processarCurriculo(file);
  }, []);
  const limparCurriculo = () => {
    setForm((f) => ({ ...f, curriculo_texto: '' }));
    setCurriculoArquivo(null);
  };

  // ── Analysis ──────────────────────────────────────────────────────────────
  const handleAnalise = async () => {
    if (!form.cargo && !form.area && !form.objetivos && !form.curriculo_texto) {
      toast.error('Preencha ao menos o cargo, área ou objetivo de carreira');
      return;
    }
    setIsLoading(true);
    try {
      // Constrói contexto enriquecido a partir do onboarding (soft skills + financas + objetivos)
      const ss = userProfile?.softSkills;
      const soft_skills_contexto = ss
        ? [
            `Comunicação ${ss.comunicacao}/5`,
            `Liderança ${ss.lideranca}/5`,
            `Colaboração ${ss.colaboracao}/5`,
            `Resolução de problemas ${ss.resolucaoProblemas}/5`,
            `Adaptabilidade ${ss.adaptabilidade}/5`,
            `Organização ${ss.organizacao}/5`,
            ss.estiloTrabalho ? `Estilo: ${ss.estiloTrabalho}` : '',
            ss.pontosFortes ? `Fortes: ${ss.pontosFortes}` : '',
            ss.pontosMelhorar ? `Desenvolver: ${ss.pontosMelhorar}` : '',
          ].filter(Boolean).join(' · ')
        : undefined;

      const fn = userProfile?.financas;
      const financas_contexto = fn
        ? [
            fn.rendaMensal ? `Renda R$ ${fn.rendaMensal}` : '',
            fn.gastoMedioMensal ? `Gasto R$ ${fn.gastoMedioMensal}` : '',
            fn.reservaEmergencia !== undefined ? `Reserva R$ ${fn.reservaEmergencia}` : '',
            fn.perfilInvestidor ? `Perfil ${fn.perfilInvestidor}` : '',
            fn.jaInveste !== undefined ? (fn.jaInveste ? 'Já investe' : 'Ainda não investe') : '',
            fn.tiposInvestimento?.length ? `Investe em ${fn.tiposInvestimento.join(', ')}` : '',
            fn.horizonte ? `Horizonte ${fn.horizonte}` : '',
          ].filter(Boolean).join(' · ')
        : undefined;

      const input: CarreiraInput = {
        cargo: form.cargo || undefined,
        area: form.area || undefined,
        anos_experiencia: form.anos_experiencia || undefined,
        objetivos: form.objetivos || undefined,
        habilidades_atuais: form.habilidades_atuais || undefined,
        curriculo_texto: form.curriculo_texto || undefined,
        soft_skills_contexto,
        financas_contexto,
        objetivos_financeiros: userProfile?.financas?.objetivosFinanceiros,
        objetivos_pessoais:    userProfile?.preferencias?.objetivos,
      };
      const res = await analisarCarreira(input);
      setResultado(res);
      setModoRefazer(false);
      const agora = new Date();
      setAnalisadoEm(agora);
      if (user?.uid) {
        await salvarAnaliseCarreira(user.uid, input, res);
        // Award XP for career analysis
        const award = await awardXP(user.uid, 'ANALYZE_CAREER');
        const updatedProfile = await getOrCreateProfile(user.uid);
        setProfile(updatedProfile);
        toast.success(`Análise salva! +${award.xpGained} XP`);
        if (award.newBadges.length > 0) {
          award.newBadges.forEach((b) => toast.success(`🏅 Badge desbloqueado: ${b.title}!`));
        }
      } else {
        toast.success('Análise concluída!');
      }
      // Switch to analysis tab
      setActiveTab('analise');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao analisar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Add to Development ────────────────────────────────────────────────────
  const handleAddRec = async (rec: RecomendacaoCarreira) => {
    if (!user?.uid) return;
    if (addedItems.has(rec.titulo)) return;
    setAddingItem(rec.titulo);
    try {
      const { award } = await addDevelopmentItem(user.uid, {
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
      setAddedItems((prev) => new Set(prev).add(rec.titulo));
      const updatedProfile = await getOrCreateProfile(user.uid);
      setProfile(updatedProfile);
      toast.success(`"${rec.titulo}" adicionado ao seu desenvolvimento! +${award.xpGained} XP`);
      if (award.newBadges.length > 0) {
        award.newBadges.forEach((b) => toast.success(`🏅 Badge desbloqueado: ${b.title}!`));
      }
    } catch {
      toast.error('Erro ao adicionar item. Tente novamente.');
    } finally {
      setAddingItem(null);
    }
  };

  // ── Save Job ──────────────────────────────────────────────────────────────
  const handleSaveJob = async (vaga: VagaCarreira) => {
    if (!user?.uid) return;
    if (savedJobs.has(vaga.titulo)) return;
    setSavingJob(vaga.titulo);
    try {
      const link = gerarLinkVaga(vaga);
      const { award } = await addDevelopmentItem(user.uid, {
        type: 'vaga',
        categoria: 'profissional',
        titulo: vaga.titulo,
        subtitulo: vaga.resumo,
        empresa: vaga.empresa,
        localidade: vaga.localidade,
        regime: vaga.regime,
        link,
        descricao: vaga.resumo,
        status: 'nao_iniciado',
        progress: 0,
        candidaturaStatus: 'salva',
        workspaceType: 'work',
        source: 'ai_recommendation',
      });
      setSavedJobs((prev) => new Set(prev).add(vaga.titulo));
      const updatedProfile = await getOrCreateProfile(user.uid);
      setProfile(updatedProfile);
      toast.success(`Vaga "${vaga.titulo}" salva! +${award.xpGained} XP`);
    } catch {
      toast.error('Erro ao salvar vaga.');
    } finally {
      setSavingJob(null);
    }
  };

  const livros = resultado?.recomendacoes.filter((r) => r.tipo === 'livro') ?? [];
  const cursos = resultado?.recomendacoes.filter((r) => r.tipo === 'curso') ?? [];
  const videos = resultado?.recomendacoes.filter((r) => r.tipo === 'video') ?? [];
  const vagas = resultado?.vagas ?? [];
  const mostrarVagas =
    resultado?.mostrar_vagas ??
    (form.objetivos ? objetivoImplicaTransicao(form.objetivos) : false);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoadingSaved) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--theme-accent)]" />
      </div>
    );
  }

  const mostrarFormulario = !resultado || modoRefazer;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative space-y-6 p-6">

      {/* ── Header Hero ── */}
      <HeroBackground
        variant="career"
        className="rounded-2xl"
        style={{
          background: 'var(--theme-card)',
          border: '1px solid var(--theme-border)',
          padding: '1.25rem 1.5rem',
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--theme-foreground)] sm:text-3xl">
              Gestão de Carreira
            </h1>
            <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">
              Análise profissional personalizada com IA · Recomendações de conteúdo · Vagas
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {analisadoEm && !modoRefazer && (
              <div
                className="flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5"
                style={{ background: 'var(--theme-background-secondary)', color: 'var(--theme-muted-foreground)' }}
              >
                <Clock className="h-3.5 w-3.5" />
                {format(analisadoEm, "d 'de' MMM", { locale: ptBR })}
              </div>
            )}
            {resultado && !modoRefazer && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setModoRefazer(true)}>
                <RefreshCw className="h-3.5 w-3.5" />
                Refazer análise
              </Button>
            )}
            {resultado && (
              <Button
                size="sm"
                className="gap-1.5"
                style={{ background: 'var(--theme-accent)', color: '#fff' }}
                onClick={() => navigate('/meu-desenvolvimento')}
              >
                Meu Desenvolvimento
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </HeroBackground>

      {/* ── Gamification Bar ── */}
      {profile && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <LevelProgress profile={profile} />
            </CardContent>
          </Card>
          <StreakCard profile={profile} label="Streak de carreira" />
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-[var(--theme-muted-foreground)] mb-2">Badges conquistados</p>
              <BadgeGrid profile={profile} compact />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Onboarding banner ── */}
      {!resultado && !modoRefazer && (
        <div
          className="rounded-2xl p-5 flex items-start gap-4"
          style={{ background: 'var(--theme-accent)10', border: '1px solid var(--theme-accent)30' }}
        >
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'var(--theme-accent)20' }}
          >
            <Sparkles className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
          </div>
          <div>
            <p className="font-semibold text-[var(--theme-foreground)]">Configure seu perfil de carreira</p>
            <p className="text-sm text-[var(--theme-muted-foreground)] mt-0.5">
              Preencha os dados abaixo para receber análise, hard skills, soft skills, recomendações de livros,
              cursos, vídeos e — se quiser mudar de empresa — sugestões de vagas.
            </p>
          </div>
        </div>
      )}

      {/* ── Form ── */}
      {mostrarFormulario && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" style={{ color: 'var(--theme-accent)' }} />
                Perfil Profissional
              </CardTitle>
              {modoRefazer && (
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setModoRefazer(false)}>
                  <X className="h-3.5 w-3.5" /> Cancelar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Cargo atual</Label>
                <Input
                  placeholder="Ex: Desenvolvedor Full Stack, Analista…"
                  value={form.cargo}
                  onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Área de atuação</Label>
                <Input
                  placeholder="Ex: Tecnologia, Saúde, Educação…"
                  value={form.area}
                  onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Anos de experiência</Label>
                <Input
                  placeholder="Ex: 3 anos, menos de 1 ano…"
                  value={form.anos_experiencia}
                  onChange={(e) => setForm((f) => ({ ...f, anos_experiencia: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Habilidades que já domina</Label>
                <Input
                  placeholder="Ex: React, Excel, liderança…"
                  value={form.habilidades_atuais}
                  onChange={(e) => setForm((f) => ({ ...f, habilidades_atuais: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Objetivos de carreira</Label>
              <Textarea
                placeholder="Descreva onde quer chegar: promoção, troca de área, mudar de empresa, empreender…"
                value={form.objetivos}
                onChange={(e) => setForm((f) => ({ ...f, objetivos: e.target.value }))}
                rows={3}
              />
              {form.objetivos && objetivoImplicaTransicao(form.objetivos) && (
                <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--theme-accent)' }}>
                  <Briefcase className="h-3.5 w-3.5" />
                  Seu objetivo indica transição — vamos incluir sugestões de vagas na análise.
                </p>
              )}
            </div>

            {/* Currículo upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Currículo
                <span className="text-xs font-normal text-[var(--theme-muted-foreground)]">(opcional)</span>
              </Label>
              {curriculoArquivo ? (
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'var(--theme-accent)10', border: '1px solid var(--theme-accent)30' }}
                >
                  <FileText className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--theme-accent)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--theme-foreground)] truncate">{curriculoArquivo}</p>
                    <p className="text-xs text-[var(--theme-muted-foreground)]">
                      {form.curriculo_texto.length.toLocaleString('pt-BR')} caracteres extraídos
                    </p>
                  </div>
                  <button onClick={limparCurriculo} className="flex-shrink-0 text-[var(--theme-muted-foreground)] hover:text-red-500 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 cursor-pointer transition-all"
                  style={{
                    borderColor: isDragging ? 'var(--theme-accent)' : 'var(--theme-border)',
                    background: isDragging ? 'var(--theme-accent)08' : 'var(--theme-background-secondary)',
                  }}
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--theme-accent)' }} />
                      <p className="text-sm text-[var(--theme-muted-foreground)]">Extraindo texto…</p>
                    </>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'var(--theme-accent)15' }}>
                        <Upload className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-[var(--theme-foreground)]">Arraste seu currículo aqui</p>
                        <p className="text-xs text-[var(--theme-muted-foreground)] mt-0.5">ou clique para selecionar · PDF, DOC, DOCX ou TXT</p>
                      </div>
                    </>
                  )}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.rtf" className="hidden" onChange={onFileChange} />
              <details className="group">
                <summary className="text-xs text-[var(--theme-muted-foreground)] cursor-pointer hover:text-[var(--theme-foreground)] transition-colors select-none">
                  Ou cole o texto do currículo manualmente
                </summary>
                <Textarea
                  className="mt-2"
                  placeholder="Cole aqui o texto do seu currículo…"
                  value={curriculoArquivo ? '' : form.curriculo_texto}
                  onChange={(e) => { setCurriculoArquivo(null); setForm((f) => ({ ...f, curriculo_texto: e.target.value })); }}
                  rows={6}
                />
              </details>
            </div>

            <Button
              onClick={handleAnalise}
              disabled={isLoading}
              className="w-full gap-2"
              style={{ background: 'var(--theme-accent)', color: '#fff' }}
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analisando com Gemini AI…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> {modoRefazer ? 'Refazer análise' : 'Analisar Perfil'}</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Results ── */}
      {resultado && !modoRefazer && (
        <>
          {/* Tabs */}
          <div
            className="flex gap-1 rounded-xl p-1"
            style={{ background: 'var(--theme-background-secondary)' }}
          >
            {[
              { key: 'analise', label: 'Análise' },
              { key: 'recomendacoes', label: `Conteúdos (${(livros.length + cursos.length + videos.length)})` },
              ...(mostrarVagas && vagas.length > 0 ? [{ key: 'vagas', label: `Vagas (${vagas.length})` }] : []),
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-all"
                style={
                  activeTab === tab.key
                    ? { background: 'var(--theme-card)', color: 'var(--theme-foreground)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                    : { color: 'var(--theme-muted-foreground)' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Análise ── */}
          {activeTab === 'analise' && (
            <div className="space-y-4">
              {/* Análise geral */}
              <Card style={{ borderColor: 'var(--theme-accent)30' }}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl mt-0.5" style={{ background: 'var(--theme-accent)15' }}>
                      <Sparkles className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--theme-foreground)] mb-1">Análise do Perfil</p>
                      <p className="text-sm text-[var(--theme-muted-foreground)] leading-relaxed">{resultado.analise_perfil}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pontos */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" /> Pontos Fortes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {resultado.pontos_fortes.map((p, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Star className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-[var(--theme-foreground)]">{p}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-[#0D5C7A]" /> Pontos a Desenvolver
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {resultado.pontos_melhorar.map((p, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <TrendingUp className="h-3.5 w-3.5 text-[#0D5C7A] flex-shrink-0 mt-0.5" />
                        <span className="text-[var(--theme-foreground)]">{p}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Hard Skills */}
              <Card>
                <CardHeader>
                  <button className="flex w-full items-center justify-between text-left" onClick={() => setExpandido((e) => (e === 'hard' ? null : 'hard'))}>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" style={{ color: 'var(--theme-accent)' }} />
                      Hard Skills
                      <Badge className="text-xs ml-1" style={{ background: 'var(--theme-accent)15', color: 'var(--theme-accent)', border: 'none' }}>
                        {resultado.hard_skills.length}
                      </Badge>
                    </CardTitle>
                    {expandido === 'hard' ? <ChevronUp className="h-4 w-4 text-[var(--theme-muted-foreground)]" /> : <ChevronDown className="h-4 w-4 text-[var(--theme-muted-foreground)]" />}
                  </button>
                </CardHeader>
                {expandido === 'hard' && (
                  <CardContent className="space-y-3 pt-0">
                    {resultado.hard_skills.map((hs, i) => {
                      const cor = NIVEL_COR[hs.nivel] || '#6B7280';
                      return (
                        <div key={i} className="rounded-xl p-3 space-y-1.5" style={{ background: 'var(--theme-background-secondary)' }}>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-sm font-medium text-[var(--theme-foreground)]">{hs.skill}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${cor}20`, color: cor }}>
                              {NIVEL_LABEL[hs.nivel] || hs.nivel}
                            </span>
                          </div>
                          {hs.gap && (
                            <p className="text-xs text-[var(--theme-muted-foreground)]">
                              <span className="font-medium">Gap:</span> {hs.gap}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>

              {/* Soft Skills */}
              <Card>
                <CardHeader>
                  <button className="flex w-full items-center justify-between text-left" onClick={() => setExpandido((e) => (e === 'soft' ? null : 'soft'))}>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Star className="h-4 w-4 text-[#0D5C7A]" />
                      Soft Skills
                      <Badge className="text-xs ml-1" style={{ background: '#F59E0B15', color: '#F59E0B', border: 'none' }}>
                        {resultado.soft_skills.length}
                      </Badge>
                    </CardTitle>
                    {expandido === 'soft' ? <ChevronUp className="h-4 w-4 text-[var(--theme-muted-foreground)]" /> : <ChevronDown className="h-4 w-4 text-[var(--theme-muted-foreground)]" />}
                  </button>
                </CardHeader>
                {expandido === 'soft' && (
                  <CardContent className="space-y-2 pt-0">
                    {resultado.soft_skills.map((ss, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: '#F59E0B08' }}>
                        <Star className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-[var(--theme-foreground)]">{ss.skill}</p>
                          <p className="text-xs text-[var(--theme-muted-foreground)] mt-0.5">{ss.avaliacao}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            </div>
          )}

          {/* ── Tab: Recomendações ── */}
          {activeTab === 'recomendacoes' && (
            <div className="space-y-6">
              {/* CTA to development */}
              <div
                className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3"
                style={{ background: 'var(--theme-accent)10', border: '1px solid var(--theme-accent)25' }}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--theme-accent)' }} />
                  <p className="text-sm text-[var(--theme-foreground)]">
                    Adicione conteúdos ao seu desenvolvimento e ganhe <strong>XP</strong> a cada progresso.
                  </p>
                </div>
                <Button size="sm" className="flex-shrink-0 gap-1.5" style={{ background: 'var(--theme-accent)', color: '#fff' }} onClick={() => navigate('/meu-desenvolvimento')}>
                  Ver trilha <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              {livros.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--theme-foreground)]">
                    <BookOpen className="h-4 w-4 text-violet-500" /> Livros Recomendados
                    <Badge className="text-xs" style={{ background: '#8B5CF615', color: '#8B5CF6', border: 'none' }}>{livros.length}</Badge>
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {livros.map((r, i) => (
                      <RecommendationCard
                        key={i} rec={r}
                        onAdd={handleAddRec}
                        added={addedItems.has(r.titulo)}
                        isAdding={addingItem === r.titulo}
                      />
                    ))}
                  </div>
                </div>
              )}

              {cursos.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--theme-foreground)]">
                    <GraduationCap className="h-4 w-4 text-sky-500" /> Cursos Recomendados
                    <Badge className="text-xs" style={{ background: '#0EA5E915', color: '#0EA5E9', border: 'none' }}>{cursos.length}</Badge>
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {cursos.map((r, i) => (
                      <RecommendationCard
                        key={i} rec={r}
                        onAdd={handleAddRec}
                        added={addedItems.has(r.titulo)}
                        isAdding={addingItem === r.titulo}
                      />
                    ))}
                  </div>
                </div>
              )}

              {videos.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--theme-foreground)]">
                    <Play className="h-4 w-4 text-red-500" /> Vídeos / Canais
                    <Badge className="text-xs" style={{ background: '#EF444415', color: '#EF4444', border: 'none' }}>{videos.length}</Badge>
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {videos.map((r, i) => (
                      <RecommendationCard
                        key={i} rec={r}
                        onAdd={handleAddRec}
                        added={addedItems.has(r.titulo)}
                        isAdding={addingItem === r.titulo}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Vagas ── */}
          {activeTab === 'vagas' && (
            <div className="space-y-4">
              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: '#6366F110', border: '1px solid #6366F125' }}
              >
                <p className="text-sm text-[var(--theme-foreground)]">
                  <span className="font-semibold">💼 Vagas sugeridas com base no seu objetivo.</span>{' '}
                  Salve as vagas de interesse para acompanhar no seu painel de desenvolvimento.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {vagas.map((vaga, i) => (
                  <JobCard
                    key={i}
                    vaga={vaga}
                    onSave={handleSaveJob}
                    saved={savedJobs.has(vaga.titulo)}
                    isSaving={savingJob === vaga.titulo}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
