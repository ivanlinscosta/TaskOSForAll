import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ElementType,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router';
import {
  Sparkles, CheckCircle2, ChevronRight, ChevronLeft, BookOpen, GraduationCap, Play,
  Upload, FileText, X, Loader2, Plus, Check, ArrowRight, Zap, Flame, Briefcase,
  Wallet, Users, Target, TrendingUp, Heart,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useAuth, type SoftSkillsProfile, type FinanceProfile } from '../../lib/auth-context';
import { OBJETIVOS_PLATAFORMA } from '../../lib/taskos-forall';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import {
  analisarCarreira,
  salvarAnaliseCarreira,
  gerarLinkRecomendacao,
  objetivoImplicaTransicao,
  type CarreiraInput,
  type CarreiraOutput,
  type RecomendacaoCarreira,
} from '../../services/carreira-service';
import { extractTextFromPDF } from '../../services/fatura-cartao-service';
import { parseCurriculo } from '../../services/curriculo-service';
import { AIProcessingIndicator } from '../components/AIProcessingIndicator';
import { batchAddDevelopmentItems } from '../../services/development-service';
import { ensureDefaultChallenges } from '../../services/gamification-service';
import dashboardBg from '../../assets/trabalho_dashboard.svg';
import onboardingArt from '../../assets/onboarding.svg';

// ──────────────────────────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5 | 6; // 6 = tela de sucesso

const STEP_LABELS: Record<Exclude<Step, 6>, string> = {
  1: 'Personalização',
  2: 'Perfil Profissional',
  3: 'Perfil Comportamental',
  4: 'Perfil Financeiro',
  5: 'Minha Trilha',
};

interface Step1Data {
  nome: string;
  profissao: string;
  localTrabalho: string;
  objetivos: string[];
}

interface Step2Data {
  cargo: string;
  empresa_atual: string;
  area: string;
  atividades_profissionais: string;
  anos_experiencia: string;
  habilidades_atuais: string;
  objetivos: string; // objetivo de carreira (texto livre)
  curriculo_texto: string;
}

type Step3Data = SoftSkillsProfile;

interface Step4Data extends FinanceProfile {
  rendaMensal: number;
}

const REC_CONFIG: Record<RecomendacaoCarreira['tipo'], { Icon: ElementType; color: string; bg: string; label: string; ctaLabel: string }> = {
  livro: { Icon: BookOpen,      color: '#8B5CF6', bg: '#8B5CF610', label: 'Livro',          ctaLabel: 'Adicionar livro' },
  curso: { Icon: GraduationCap, color: '#0EA5E9', bg: '#0EA5E910', label: 'Curso',          ctaLabel: 'Adicionar curso' },
  video: { Icon: Play,          color: '#EF4444', bg: '#EF444410', label: 'Vídeo',          ctaLabel: 'Adicionar vídeo' },
};

// ──────────────────────────────────────────────────────────────────────────────
// Layout premium (SEM sidebar e SEM header)
// ──────────────────────────────────────────────────────────────────────────────
function WizardLayout({ step, children }: { step: Exclude<Step, 6>; children: ReactNode }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: 'var(--theme-background)', color: 'var(--theme-foreground)' }}
    >
      {/* background art */}
      <img
        src={dashboardBg}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-[0.06] select-none"
      />
      <div
        className="absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: 'var(--theme-accent)' }}
      />
      <div
        className="absolute -bottom-40 -left-40 h-[32rem] w-[32rem] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: '#EC7000' }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Top bar minimalista do wizard (logo + progresso) — NÃO é o header do app */}
        <div
          className="flex items-center justify-between border-b px-6 py-4 backdrop-blur-sm"
          style={{
            borderColor: 'var(--theme-border)',
            background: 'color-mix(in srgb, var(--theme-card) 82%, transparent)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: 'var(--theme-accent)' }}
            >
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="leading-tight">
              <span className="block text-sm font-bold">TaskAll</span>
              <span className="block text-[11px] text-[var(--theme-muted-foreground)]">
                Configuração inicial
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {([1, 2, 3, 4, 5] as const).map((s) => (
              <div
                key={s}
                className={cn('h-2 rounded-full transition-all duration-500', s === step ? 'w-8' : 'w-2')}
                style={{ background: s <= step ? 'var(--theme-accent)' : 'var(--theme-border)' }}
              />
            ))}
            <span className="ml-2 text-xs text-[var(--theme-muted-foreground)]">{step}/5</span>
          </div>

          <span className="hidden text-xs font-medium text-[var(--theme-muted-foreground)] sm:block">
            {STEP_LABELS[step]}
          </span>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-10">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 1 — Nome + objetivos de uso
// ──────────────────────────────────────────────────────────────────────────────
function Step1({
  data,
  onChange,
  onNext,
  isSaving,
}: {
  data: Step1Data;
  onChange: (d: Partial<Step1Data>) => void;
  onNext: () => void;
  isSaving: boolean;
}) {
  const canNext =
    data.nome.trim().length >= 2 &&
    data.profissao.trim().length >= 2 &&
    data.objetivos.length > 0;

  const toggle = (id: string) => {
    onChange({
      objetivos: data.objetivos.includes(id)
        ? data.objetivos.filter((x) => x !== id)
        : [...data.objetivos, id],
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3 text-center">
        <img src={onboardingArt} alt="" className="mx-auto h-28 opacity-90" />
        <h1 className="text-3xl font-bold">Bem-vindo ao TaskAll</h1>
        <p className="text-sm text-[var(--theme-muted-foreground)]">
          Vamos personalizar sua experiência em 5 etapas rápidas.
        </p>
      </div>

      <div
        className="rounded-3xl border p-6 shadow-sm"
        style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
      >
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--theme-muted-foreground)]">
          Sobre você
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              value={data.nome}
              onChange={(e) => onChange({ nome: e.target.value })}
              placeholder="Como prefere ser chamado?"
            />
          </div>
          <div className="space-y-2">
            <Label>Profissão *</Label>
            <Input
              value={data.profissao}
              onChange={(e) => onChange({ profissao: e.target.value })}
              placeholder="Ex: Desenvolvedor, Professor, Analista"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Onde trabalha</Label>
            <Input
              value={data.localTrabalho}
              onChange={(e) => onChange({ localTrabalho: e.target.value })}
              placeholder="Ex: FIAP, hospital, consultório, estúdio"
            />
          </div>
        </div>
      </div>

      <div
        className="rounded-3xl border p-6 shadow-sm"
        style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-[var(--theme-accent)]" />
          <h2 className="text-sm font-bold">O que você quer fazer no sistema?</h2>
          <span className="text-xs text-[var(--theme-muted-foreground)]">Selecione ao menos 1</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {OBJETIVOS_PLATAFORMA.map((goal) => {
            const active = data.objetivos.includes(goal.id);
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => toggle(goal.id)}
                className="rounded-2xl border p-4 text-left transition-all"
                style={{
                  borderColor: active ? 'var(--theme-accent)' : 'var(--theme-border)',
                  background: active
                    ? 'color-mix(in srgb, var(--theme-accent) 10%, transparent)'
                    : 'var(--theme-background)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{goal.label}</p>
                    <p className="mt-1 text-xs text-[var(--theme-muted-foreground)]">
                      {goal.description}
                    </p>
                  </div>
                  {active && <CheckCircle2 className="h-5 w-5 text-[var(--theme-accent)]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!canNext || isSaving}
        className="h-12 w-full gap-2 text-base font-semibold"
        style={{ background: 'var(--theme-accent)', color: '#fff' }}
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
          </>
        ) : (
          <>
            Próximo <ChevronRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 2 — Perfil profissional + currículo
// ──────────────────────────────────────────────────────────────────────────────
function Step2({
  data,
  onChange,
  onNext,
  onBack,
  isSaving,
}: {
  data: Step2Data;
  onChange: (d: Partial<Step2Data>) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving: boolean;
}) {
  const [curriculoArquivo, setCurriculoArquivo] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canNext = data.cargo.trim().length > 0 && data.objetivos.trim().length > 0;

  const processarCurriculo = async (file: File) => {
    const isPDF = file.name.toLowerCase().endsWith('.pdf');
    const isText = /\.(docx?|txt|rtf)$/i.test(file.name);
    if (!isPDF && !isText) {
      toast.error('Use PDF, DOC, DOCX ou TXT.');
      return;
    }
    setIsExtracting(true);
    try {
      const texto = isPDF ? await extractTextFromPDF(file) : await file.text();
      if (!texto.trim()) {
        toast.error('Não foi possível extrair texto do currículo.');
        setIsExtracting(false);
        return;
      }
      const textoTruncado = texto.substring(0, 12000);
      onChange({ curriculo_texto: textoTruncado });
      setCurriculoArquivo(file.name);
      setIsExtracting(false);

      // Chamar IA para extrair dados do currículo e preencher automaticamente
      setIsParsing(true);
      try {
        const parsed = await parseCurriculo(textoTruncado);
        const autoFill: Partial<Step2Data> = {};
        if (parsed.cargo) autoFill.cargo = parsed.cargo;
        if (parsed.empresa_atual) autoFill.empresa_atual = parsed.empresa_atual;
        if (parsed.area) autoFill.area = parsed.area;
        if (parsed.atividades_profissionais) autoFill.atividades_profissionais = parsed.atividades_profissionais;
        if (parsed.anos_experiencia) autoFill.anos_experiencia = parsed.anos_experiencia;
        if (parsed.habilidades_atuais) autoFill.habilidades_atuais = parsed.habilidades_atuais;
        if (parsed.objetivo_carreira) autoFill.objetivos = parsed.objetivo_carreira;
        if (Object.keys(autoFill).length > 0) {
          onChange(autoFill);
          toast.success('Dados profissionais extraídos do currículo! Revise e ajuste se necessário.');
        } else {
          toast.success('Currículo carregado. Preencha os campos abaixo.');
        }
      } catch {
        // Falha no parsing não impede continuar — o texto foi carregado
        toast.info('Currículo carregado. Preencha os campos manualmente.');
      } finally {
        setIsParsing(false);
      }
    } catch {
      toast.error('Erro ao ler o arquivo.');
      setIsExtracting(false);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processarCurriculo(f);
    e.target.value = '';
  };

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processarCurriculo(f);
  }, []);

  const hasCVData = !!data.curriculo_texto;
  const hasAnyField = data.cargo.trim() || data.empresa_atual.trim() || data.area.trim();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-[var(--theme-accent)]" />
          <h2 className="text-2xl font-bold">Seu perfil profissional</h2>
        </div>
        <p className="text-sm text-[var(--theme-muted-foreground)]">
          Envie seu currículo e a IA preenche tudo para você. Ou preencha manualmente.
        </p>
      </div>

      {/* ── Upload do currículo (PRIMEIRO) ── */}
      <div
        className="rounded-3xl border p-6 shadow-sm space-y-4"
        style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
      >
        <Label className="text-base font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-[var(--theme-accent)]" />
          Currículo
          <span className="text-xs font-normal text-[var(--theme-muted-foreground)]">
            — a IA extrai seus dados automaticamente
          </span>
        </Label>

        {isParsing ? (
          <AIProcessingIndicator
            title="Analisando seu currículo"
            subtitle="Extraindo informações profissionais automaticamente"
            steps={[
              'Lendo o documento…',
              'Identificando cargo e empresa…',
              'Extraindo habilidades…',
              'Mapeando experiência…',
              'Definindo objetivo de carreira…',
              'Finalizando…',
            ]}
          />
        ) : curriculoArquivo ? (
          <div
            className="flex items-center gap-3 rounded-2xl border px-4 py-3"
            style={{
              background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)',
              borderColor: 'color-mix(in srgb, var(--theme-accent) 30%, transparent)',
            }}
          >
            <FileText className="h-5 w-5 flex-shrink-0 text-[var(--theme-accent)]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{curriculoArquivo}</p>
              <p className="text-xs text-[var(--theme-muted-foreground)]">
                {data.curriculo_texto.length.toLocaleString('pt-BR')} caracteres extraídos
                {hasAnyField && ' · campos preenchidos abaixo'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onChange({ curriculo_texto: '' });
                setCurriculoArquivo(null);
              }}
              className="text-[var(--theme-muted-foreground)] transition-colors hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => !isExtracting && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed py-8 transition-all"
            style={{
              borderColor: isDragging ? 'var(--theme-accent)' : 'var(--theme-border)',
              background: isDragging
                ? 'color-mix(in srgb, var(--theme-accent) 8%, transparent)'
                : 'var(--theme-background)',
            }}
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-[var(--theme-accent)]" />
                <p className="text-xs text-[var(--theme-muted-foreground)]">Extraindo texto…</p>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-[var(--theme-accent)]" />
                <div className="text-center">
                  <p className="text-sm font-semibold">Arraste seu currículo ou clique para enviar</p>
                  <p className="mt-1 text-xs text-[var(--theme-muted-foreground)]">
                    PDF, DOC, DOCX ou TXT · a IA extrai cargo, empresa, habilidades e mais
                  </p>
                </div>
              </>
            )}
          </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.rtf"
            className="hidden"
            onChange={onFileChange}
          />

        {!hasCVData && !isParsing && (
          <p className="text-xs text-center text-[var(--theme-muted-foreground)]">
            Ou preencha os campos abaixo manualmente.
          </p>
        )}
      </div>

      {/* ── Campos profissionais (editáveis, preenchidos pela IA ou manual) ── */}
      {!isParsing && (
        <div
          className="rounded-3xl border p-6 shadow-sm"
          style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
        >
          {hasCVData && (
            <div className="flex items-center gap-2 mb-4 rounded-xl px-3 py-2 text-xs"
              style={{ background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)' }}>
              <Sparkles className="h-3.5 w-3.5 text-[var(--theme-accent)]" />
              <span className="text-[var(--theme-muted-foreground)]">Campos preenchidos pelo currículo. Edite se necessário.</span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cargo atual *</Label>
              <Input
                value={data.cargo}
                onChange={(e) => onChange({ cargo: e.target.value })}
                placeholder="Ex: Desenvolvedor Full Stack"
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa atual</Label>
              <Input
                value={data.empresa_atual}
                onChange={(e) => onChange({ empresa_atual: e.target.value })}
                placeholder="Ex: FIAP, Itaú, startup"
              />
            </div>
            <div className="space-y-2">
              <Label>Área de atuação</Label>
              <Input
                value={data.area}
                onChange={(e) => onChange({ area: e.target.value })}
                placeholder="Ex: Tecnologia, Educação"
              />
            </div>
            <div className="space-y-2">
              <Label>Tempo de experiência</Label>
              <Input
                value={data.anos_experiencia}
                onChange={(e) => onChange({ anos_experiencia: e.target.value })}
                placeholder="Ex: 4 anos"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Habilidades atuais</Label>
              <Input
                value={data.habilidades_atuais}
                onChange={(e) => onChange({ habilidades_atuais: e.target.value })}
                placeholder="Ex: React, liderança, SQL, Excel"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Atividades profissionais</Label>
              <Textarea
                value={data.atividades_profissionais}
                onChange={(e) => onChange({ atividades_profissionais: e.target.value })}
                placeholder="Descreva suas principais atividades e entregas atuais…"
                rows={3}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Objetivo de carreira *</Label>
              <Textarea
                value={data.objetivos}
                onChange={(e) => onChange({ objetivos: e.target.value })}
                placeholder="Liderança técnica, promoção, mudança de área, transição…"
                rows={3}
              />
              {data.objetivos && objetivoImplicaTransicao(data.objetivos) && (
                <p className="flex items-center gap-1.5 text-xs text-[var(--theme-accent)]">
                  <Briefcase className="h-3.5 w-3.5" />
                  Detectamos um objetivo de transição. Também vamos sugerir vagas.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" className="h-12 flex-1 gap-2" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button
          disabled={!canNext || isSaving || isParsing}
          className="h-12 flex-[1.35] gap-2"
          style={{ background: 'var(--theme-accent)', color: '#fff' }}
          onClick={onNext}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
            </>
          ) : (
            <>
              Próximo <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 3 — Soft skills / perfil comportamental
// ──────────────────────────────────────────────────────────────────────────────
const SOFT_SKILLS: { key: keyof SoftSkillsProfile; label: string; hint: string }[] = [
  { key: 'comunicacao',         label: 'Comunicação',          hint: 'Clareza ao explicar ideias e escutar.' },
  { key: 'lideranca',           label: 'Liderança',            hint: 'Influência, direção, mobilização.' },
  { key: 'colaboracao',         label: 'Colaboração',          hint: 'Trabalho em equipe e cooperação.' },
  { key: 'resolucaoProblemas',  label: 'Resolução de problemas', hint: 'Análise crítica e tomada de decisão.' },
  { key: 'adaptabilidade',      label: 'Adaptabilidade',       hint: 'Flexibilidade frente a mudanças.' },
  { key: 'organizacao',         label: 'Organização',          hint: 'Prioridades, prazos, método.' },
];

function Step3({
  data,
  onChange,
  onNext,
  onBack,
  isSaving,
}: {
  data: Step3Data;
  onChange: (d: Partial<Step3Data>) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-500" />
          <h2 className="text-2xl font-bold">Seu perfil comportamental</h2>
        </div>
        <p className="text-sm text-[var(--theme-muted-foreground)]">
          Avalie-se de 1 (iniciante) a 5 (excelente). Isso ajusta recomendações e desafios.
        </p>
      </div>

      <div
        className="rounded-3xl border p-6 shadow-sm space-y-5"
        style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
      >
        {SOFT_SKILLS.map((s) => {
          const value = (data[s.key] as number) || 3;
          return (
            <div key={s.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{s.label}</p>
                  <p className="text-xs text-[var(--theme-muted-foreground)]">{s.hint}</p>
                </div>
                <Badge
                  className="border-none text-xs"
                  style={{
                    background: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)',
                    color: 'var(--theme-accent)',
                  }}
                >
                  {value}/5
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onChange({ [s.key]: n } as any)}
                    className="h-10 flex-1 rounded-xl border text-sm font-semibold transition-all"
                    style={{
                      background:
                        n <= value
                          ? 'var(--theme-accent)'
                          : 'var(--theme-background)',
                      color: n <= value ? '#fff' : 'var(--theme-muted-foreground)',
                      borderColor:
                        n <= value ? 'var(--theme-accent)' : 'var(--theme-border)',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Estilo de trabalho preferido</Label>
            <Input
              value={data.estiloTrabalho ?? ''}
              onChange={(e) => onChange({ estiloTrabalho: e.target.value })}
              placeholder="Ex: autonomia, squad pequeno, ritmo acelerado…"
            />
          </div>
          <div className="space-y-2">
            <Label>Um ponto que quer melhorar</Label>
            <Input
              value={data.pontosMelhorar ?? ''}
              onChange={(e) => onChange({ pontosMelhorar: e.target.value })}
              placeholder="Ex: falar em público, delegar, foco…"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Um ponto forte que te define</Label>
            <Input
              value={data.pontosFortes ?? ''}
              onChange={(e) => onChange({ pontosFortes: e.target.value })}
              placeholder="Ex: resiliência, análise, empatia…"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="h-12 flex-1 gap-2" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button
          disabled={isSaving}
          className="h-12 flex-[1.35] gap-2"
          style={{ background: 'var(--theme-accent)', color: '#fff' }}
          onClick={onNext}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
            </>
          ) : (
            <>
              Próximo <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 4 — Perfil financeiro
// ──────────────────────────────────────────────────────────────────────────────
const OBJETIVOS_FINANCEIROS = [
  'Quitar dívidas',
  'Reserva de emergência',
  'Comprar imóvel',
  'Comprar veículo',
  'Aposentadoria',
  'Viagens',
  'Investir em educação',
  'Começar a investir',
];

const TIPOS_INVEST = [
  'Tesouro Direto', 'CDB/LCI/LCA', 'Renda fixa', 'Poupança',
  'Ações', 'Fundos imobiliários', 'Fundos multimercado', 'ETFs',
  'Previdência privada', 'Cripto', 'Internacional', 'COE',
];

function Step4({
  data,
  onChange,
  onNext,
  onBack,
  isSaving,
}: {
  data: Step4Data;
  onChange: (d: Partial<Step4Data>) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving: boolean;
}) {
  const toggleObjetivo = (o: string) => {
    const set = new Set(data.objetivosFinanceiros ?? []);
    set.has(o) ? set.delete(o) : set.add(o);
    onChange({ objetivosFinanceiros: Array.from(set) });
  };
  const toggleInvest = (o: string) => {
    const set = new Set(data.tiposInvestimento ?? []);
    set.has(o) ? set.delete(o) : set.add(o);
    onChange({ tiposInvestimento: Array.from(set) });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2">
          <Wallet className="h-5 w-5 text-amber-500" />
          <h2 className="text-2xl font-bold">Seu perfil financeiro</h2>
        </div>
        <p className="text-sm text-[var(--theme-muted-foreground)]">
          Usamos para montar seu painel de finanças e recomendações coerentes com sua realidade.
        </p>
      </div>

      <div
        className="rounded-3xl border p-6 shadow-sm space-y-5"
        style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Renda mensal média (R$)</Label>
            <Input
              inputMode="decimal"
              value={data.rendaMensal ? String(data.rendaMensal) : ''}
              onChange={(e) => onChange({ rendaMensal: Number(e.target.value.replace(/[^0-9.]/g, '')) || 0 })}
              placeholder="Ex: 8000"
            />
          </div>
          <div className="space-y-2">
            <Label>Gasto médio mensal (R$)</Label>
            <Input
              inputMode="decimal"
              value={data.gastoMedioMensal ? String(data.gastoMedioMensal) : ''}
              onChange={(e) => onChange({ gastoMedioMensal: Number(e.target.value.replace(/[^0-9.]/g, '')) || 0 })}
              placeholder="Ex: 5000"
            />
          </div>
          <div className="space-y-2">
            <Label>Reserva atual (R$)</Label>
            <Input
              inputMode="decimal"
              value={data.reservaEmergencia ? String(data.reservaEmergencia) : ''}
              onChange={(e) => onChange({ reservaEmergencia: Number(e.target.value.replace(/[^0-9.]/g, '')) || 0 })}
              placeholder="Ex: 20000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Objetivos financeiros</Label>
          <div className="flex flex-wrap gap-2">
            {OBJETIVOS_FINANCEIROS.map((o) => {
              const active = data.objetivosFinanceiros?.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => toggleObjetivo(o)}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
                  style={{
                    background: active
                      ? 'var(--theme-accent)'
                      : 'var(--theme-background)',
                    color: active ? '#fff' : 'var(--theme-foreground)',
                    borderColor: active ? 'var(--theme-accent)' : 'var(--theme-border)',
                  }}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Perfil de investidor</Label>
            <div className="flex gap-2">
              {(['conservador', 'moderado', 'arrojado', 'indefinido'] as const).map((p) => {
                const active = (data.perfilInvestidor ?? 'indefinido') === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onChange({ perfilInvestidor: p })}
                    className="flex-1 rounded-xl border py-2 text-xs font-medium capitalize transition-all"
                    style={{
                      background: active
                        ? 'var(--theme-accent)'
                        : 'var(--theme-background)',
                      color: active ? '#fff' : 'var(--theme-foreground)',
                      borderColor: active ? 'var(--theme-accent)' : 'var(--theme-border)',
                    }}
                  >
                    {p === 'indefinido' ? 'Não sei' : p}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Expectativa de retorno</Label>
            <div className="flex gap-2">
              {([
                { k: 'curto', l: 'Curto prazo (até 1 ano)' },
                { k: 'medio', l: 'Médio prazo (1-5 anos)' },
                { k: 'longo', l: 'Longo prazo (5+ anos)' },
              ] as const).map(({ k, l }) => {
                const active = data.horizonte === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onChange({ horizonte: k })}
                    className="flex-1 rounded-xl border py-2 text-xs font-medium transition-all"
                    style={{
                      background: active
                        ? 'var(--theme-accent)'
                        : 'var(--theme-background)',
                      color: active ? '#fff' : 'var(--theme-foreground)',
                      borderColor: active ? 'var(--theme-accent)' : 'var(--theme-border)',
                    }}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Você já investe?</Label>
          <div className="flex gap-2">
            {[{ v: true, l: 'Sim' }, { v: false, l: 'Ainda não' }].map((opt) => {
              const active = (data.jaInveste ?? false) === opt.v;
              return (
                <button
                  key={String(opt.v)}
                  type="button"
                  onClick={() => onChange({ jaInveste: opt.v })}
                  className="flex-1 rounded-xl border py-2 text-sm font-medium transition-all"
                  style={{
                    background: active
                      ? 'var(--theme-accent)'
                      : 'var(--theme-background)',
                    color: active ? '#fff' : 'var(--theme-foreground)',
                    borderColor: active ? 'var(--theme-accent)' : 'var(--theme-border)',
                  }}
                >
                  {opt.l}
                </button>
              );
            })}
          </div>
        </div>

        {data.jaInveste && (
          <div className="space-y-2">
            <Label>Em quais classes você investe?</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIPOS_INVEST.map((t) => {
                const active = data.tiposInvestimento?.includes(t);
                return (
                  <label
                    key={t}
                    className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5 cursor-pointer transition-all"
                    style={{
                      background: active
                        ? 'color-mix(in srgb, var(--theme-accent) 10%, transparent)'
                        : 'var(--theme-background)',
                      borderColor: active ? 'var(--theme-accent)' : 'var(--theme-border)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!active}
                      onChange={() => toggleInvest(t)}
                      className="h-4 w-4 rounded accent-[var(--theme-accent)]"
                    />
                    <span className="text-xs font-medium" style={{
                      color: active ? 'var(--theme-accent)' : 'var(--theme-foreground)',
                    }}>{t}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="h-12 flex-1 gap-2" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button
          disabled={isSaving}
          className="h-12 flex-[1.35] gap-2"
          style={{ background: 'var(--theme-accent)', color: '#fff' }}
          onClick={onNext}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Analisando seu perfil…
            </>
          ) : (
            <>
              Gerar minha trilha <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 5 — Seleção de recomendações
// ──────────────────────────────────────────────────────────────────────────────
function RecommendationPicker({
  rec,
  selected,
  onToggle,
}: {
  rec: RecomendacaoCarreira;
  selected: boolean;
  onToggle: (rec: RecomendacaoCarreira) => void;
}) {
  const cfg = REC_CONFIG[rec.tipo];
  const { Icon } = cfg;
  const link = gerarLinkRecomendacao(rec);

  return (
    <button
      type="button"
      className="w-full rounded-2xl p-4 text-left transition-all"
      style={{
        background: selected ? `${cfg.color}12` : 'var(--theme-card)',
        border: `2px solid ${selected ? `${cfg.color}70` : 'var(--theme-border)'}`,
        boxShadow: selected ? `0 12px 30px ${cfg.color}18` : 'none',
      }}
      onClick={() => onToggle(rec)}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2"
          style={{
            borderColor: selected ? cfg.color : 'var(--theme-border)',
            background: selected ? cfg.color : 'transparent',
          }}
        >
          {selected && <Check className="h-3.5 w-3.5 text-white" />}
        </div>
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: cfg.bg }}
        >
          <Icon className="h-6 w-6" style={{ color: cfg.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge
                  className="h-5 border-none px-2 text-[10px]"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {cfg.label}
                </Badge>
                {selected && (
                  <Badge className="h-5 border-none bg-emerald-100 px-2 text-[10px] text-emerald-700">
                    Na sua trilha
                  </Badge>
                )}
              </div>
              <p className="text-sm font-semibold leading-tight">{rec.titulo}</p>
              <p className="mt-0.5 text-xs text-[var(--theme-muted-foreground)]">{rec.autor_ou_canal}</p>
            </div>
            <span className="text-xs font-medium" style={{ color: cfg.color }}>
              {selected ? 'Selecionado' : cfg.ctaLabel}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed">{rec.descricao}</p>
          {rec.motivo && (
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--theme-muted-foreground)]">
              <span className="font-medium">Por que apareceu:</span> {rec.motivo}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between gap-3">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs font-medium hover:opacity-80"
              style={{ color: cfg.color }}
            >
              Abrir conteúdo →
            </a>
            <span className="text-xs text-[var(--theme-muted-foreground)]">
              Clique para {selected ? 'remover' : 'adicionar'}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function Step5({
  resultado,
  selected,
  onToggle,
  onFinish,
  onBack,
  isLoading,
  isSaving,
}: {
  resultado: CarreiraOutput | null;
  selected: Set<string>;
  onToggle: (rec: RecomendacaoCarreira) => void;
  onFinish: () => void;
  onBack: () => void;
  isLoading: boolean;
  isSaving: boolean;
}) {
  const grouped = useMemo(
    () => ({
      profissional: resultado?.recomendacoes.filter((r) => (r.categoria ?? 'profissional') === 'profissional') ?? [],
      financas:     resultado?.recomendacoes.filter((r) => r.categoria === 'financas') ?? [],
      pessoal:      resultado?.recomendacoes.filter((r) => r.categoria === 'pessoal') ?? [],
    }),
    [resultado],
  );

  const total = grouped.profissional.length + grouped.financas.length + grouped.pessoal.length;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[var(--theme-accent)]" />
          <h2 className="text-2xl font-bold">Monte sua trilha inicial</h2>
        </div>
        <p className="text-sm text-[var(--theme-muted-foreground)]">
          A IA gerou recomendações com base no seu perfil. Selecione o que quer levar para sua trilha.
        </p>
      </div>

      {isLoading ? (
        <div
          className="rounded-3xl border py-4"
          style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
        >
          <AIProcessingIndicator
            title="Montando sua trilha personalizada"
            subtitle="A IA está analisando todo o seu perfil"
            steps={[
              'Analisando seu perfil profissional…',
              'Mapeando suas habilidades e lacunas…',
              'Identificando oportunidades de crescimento…',
              'Buscando cursos e livros recomendados…',
              'Montando o plano de desenvolvimento…',
              'Gerando recomendações personalizadas…',
            ]}
          />
        </div>
      ) : total === 0 ? (
        <div
          className="rounded-3xl border p-6 text-center"
          style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
        >
          <p className="text-sm text-[var(--theme-muted-foreground)]">
            Nenhuma recomendação foi gerada agora. Você pode concluir e montar sua trilha depois em Gestão de Carreira.
          </p>
        </div>
      ) : (
        <>
          <div
            className="flex items-center gap-3 rounded-2xl border px-4 py-3"
            style={{
              background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)',
              borderColor: 'color-mix(in srgb, var(--theme-accent) 25%, transparent)',
            }}
          >
            <Zap className="h-5 w-5 flex-shrink-0 text-[var(--theme-accent)]" />
            <p className="text-sm">
              Cada item adicionado vale <strong>+20 XP</strong>.
            </p>
            <Badge
              className="ml-auto border-none"
              style={{
                background: 'color-mix(in srgb, var(--theme-accent) 20%, transparent)',
                color: 'var(--theme-accent)',
              }}
            >
              {selected.size} selecionados
            </Badge>
          </div>

          {[
            { key: 'profissional', title: 'Desenvolvimento profissional',  subtitle: 'Carreira, hard skills e objetivo profissional', items: grouped.profissional, color: '#EC7000' },
            { key: 'financas',     title: 'Desenvolvimento financeiro',    subtitle: 'Educação financeira, orçamento e investimentos', items: grouped.financas,     color: '#10B981' },
            { key: 'pessoal',      title: 'Desenvolvimento pessoal',       subtitle: 'Soft skills, hábitos e bem-estar',               items: grouped.pessoal,      color: '#8B5CF6' },
          ].map((group) =>
            group.items.length > 0 ? (
              <div key={group.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: group.color }}>{group.title}</h3>
                    <p className="text-xs text-[var(--theme-muted-foreground)]">{group.subtitle}</p>
                  </div>
                  <Badge variant="outline">{group.items.length}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {group.items.map((rec, idx) => (
                    <RecommendationPicker
                      key={`${group.key}-${idx}`}
                      rec={rec}
                      selected={selected.has(rec.titulo)}
                      onToggle={onToggle}
                    />
                  ))}
                </div>
              </div>
            ) : null,
          )}
        </>
      )}

      <div className="flex gap-3">
        <Button variant="outline" className="h-12 flex-1 gap-2" onClick={onBack} disabled={isSaving}>
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button
          onClick={onFinish}
          disabled={isSaving || isLoading}
          className="h-12 flex-[1.35] gap-2 text-base font-semibold"
          style={{ background: 'var(--theme-accent)', color: '#fff' }}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando sua trilha…
            </>
          ) : selected.size > 0 ? (
            <>
              <Plus className="h-4 w-4" /> Adicionar {selected.size} e concluir
            </>
          ) : (
            <>
              Concluir agora <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 6 — Tudo pronto!
// ──────────────────────────────────────────────────────────────────────────────
function StepSuccess({ nome, itemsAdded }: { nome: string; itemsAdded: number }) {
  return (
    <div className="flex flex-col items-center gap-8 py-12 text-center">
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full"
        style={{ background: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)' }}
      >
        <span className="text-5xl">🚀</span>
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-bold">Tudo pronto, {nome.split(' ')[0]}!</h2>
        <p className="text-base text-[var(--theme-muted-foreground)]">
          Seu dashboard foi personalizado. Sua jornada começa agora.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        <div
          className="flex flex-col items-center gap-1 rounded-2xl border px-6 py-4"
          style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
        >
          <span className="text-3xl font-bold text-[var(--theme-accent)]">{itemsAdded}</span>
          <span className="text-xs text-[var(--theme-muted-foreground)]">itens na trilha</span>
        </div>
        <div
          className="flex flex-col items-center gap-1 rounded-2xl border px-6 py-4"
          style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
        >
          <div className="flex items-center gap-1">
            <Zap className="h-6 w-6 text-amber-500" />
            <span className="text-3xl font-bold text-amber-500">{itemsAdded * 20 + 30}</span>
          </div>
          <span className="text-xs text-[var(--theme-muted-foreground)]">XP iniciais</span>
        </div>
        <div
          className="flex flex-col items-center gap-1 rounded-2xl border px-6 py-4"
          style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
        >
          <Flame className="h-6 w-6 text-orange-500" />
          <span className="text-xs text-[var(--theme-muted-foreground)]">Streak ativado</span>
        </div>
        <div
          className="flex flex-col items-center gap-1 rounded-2xl border px-6 py-4"
          style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
        >
          <Heart className="h-6 w-6 text-pink-500" />
          <span className="text-xs text-[var(--theme-muted-foreground)]">Bem-vindo</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-[var(--theme-muted-foreground)]">
        <Loader2 className="h-4 w-4 animate-spin" /> Abrindo seu dashboard…
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Wizard container
// ──────────────────────────────────────────────────────────────────────────────
export function OnboardingWizard() {
  const navigate = useNavigate();
  const { user, userProfile, updateUserProfileData } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [step1, setStep1] = useState<Step1Data>({
    nome: '', profissao: '', localTrabalho: '', objetivos: [],
  });
  const [step2, setStep2] = useState<Step2Data>({
    cargo: '', empresa_atual: '', area: '', atividades_profissionais: '',
    anos_experiencia: '', habilidades_atuais: '', objetivos: '', curriculo_texto: '',
  });
  const [step3, setStep3] = useState<Step3Data>({
    comunicacao: 3, lideranca: 3, colaboracao: 3,
    resolucaoProblemas: 3, adaptabilidade: 3, organizacao: 3,
    estiloTrabalho: '', pontosFortes: '', pontosMelhorar: '',
  });
  const [step4, setStep4] = useState<Step4Data>({
    rendaMensal: 0, gastoMedioMensal: 0, reservaEmergencia: 0,
    objetivosFinanceiros: [], perfilInvestidor: 'indefinido',
    jaInveste: false, tiposInvestimento: [], horizonte: 'medio',
  });

  const [careerResult, setCareerResult] = useState<CarreiraOutput | null>(null);
  const [selectedRecs, setSelectedRecs] = useState<Set<string>>(new Set());

  const [isSavingStep, setIsSavingStep] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingItems, setIsSavingItems] = useState(false);
  const [itemsAddedCount, setItemsAddedCount] = useState(0);

  // ── Hidrata os steps a partir do perfil salvo ───────────────────────
  useEffect(() => {
    if (!userProfile) return;
    setStep1((p) => ({
      nome: userProfile.nome || p.nome,
      profissao: userProfile.profissao || p.profissao,
      localTrabalho: userProfile.localTrabalho || p.localTrabalho,
      objetivos: userProfile.preferencias?.objetivos?.length
        ? userProfile.preferencias.objetivos
        : p.objetivos,
    }));
    setStep2((p) => ({
      ...p,
      cargo: userProfile.cargo || p.cargo,
      empresa_atual: userProfile.empresaAtual || p.empresa_atual,
      area: userProfile.areaAtuacao || p.area,
      atividades_profissionais: userProfile.atividadesProfissionais || p.atividades_profissionais,
      anos_experiencia: userProfile.anosExperiencia || p.anos_experiencia,
      habilidades_atuais: userProfile.habilidadesAtuais || p.habilidades_atuais,
      objetivos: userProfile.objetivoCarreira || p.objetivos,
      curriculo_texto: userProfile.curriculoTexto || p.curriculo_texto,
    }));
    if (userProfile.softSkills) {
      setStep3((p) => ({ ...p, ...userProfile.softSkills }));
    }
    if (userProfile.financas) {
      setStep4((p) => ({ ...p, ...userProfile.financas, rendaMensal: userProfile.financas!.rendaMensal ?? userProfile.rendaMensal ?? 0 }));
    } else if (userProfile.rendaMensal) {
      setStep4((p) => ({ ...p, rendaMensal: userProfile.rendaMensal! }));
    }
    const resume = userProfile.currentSetupStep ?? 1;
    setStep((prev) => (prev === 1 ? (Math.max(1, Math.min(5, resume)) as Step) : prev));
  }, [userProfile]);

  // ── Handlers de navegação ───────────────────────────────────────────
  const handleStep1Next = async () => {
    setIsSavingStep(true);
    try {
      await updateUserProfileData({
        nome: step1.nome,
        profissao: step1.profissao,
        localTrabalho: step1.localTrabalho,
        preferencias: {
          objetivos: step1.objetivos,
          workGoals: step1.objetivos,
          lifeGoals: step1.objetivos,
        },
        currentSetupStep: 2,
      });
      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSavingStep(false);
    }
  };

  const handleStep2Next = async () => {
    setIsSavingStep(true);
    try {
      await updateUserProfileData({
        cargo: step2.cargo,
        empresaAtual: step2.empresa_atual,
        areaAtuacao: step2.area,
        atividadesProfissionais: step2.atividades_profissionais,
        anosExperiencia: step2.anos_experiencia,
        habilidadesAtuais: step2.habilidades_atuais,
        objetivoCarreira: step2.objetivos,
        curriculoTexto: step2.curriculo_texto || undefined,
        careerProfileCompleted: true,
        currentSetupStep: 3,
      });
      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar seu perfil profissional.');
    } finally {
      setIsSavingStep(false);
    }
  };

  const handleStep3Next = async () => {
    setIsSavingStep(true);
    try {
      await updateUserProfileData({
        softSkills: step3,
        softSkillsCompleted: true,
        currentSetupStep: 4,
      });
      setStep(4);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar seu perfil comportamental.');
    } finally {
      setIsSavingStep(false);
    }
  };

  const handleStep4NextAndAnalyze = async () => {
    if (!user?.uid) return;
    setIsAnalyzing(true);
    try {
      // Salva perfil financeiro
      await updateUserProfileData({
        financas: step4,
        rendaMensal: step4.rendaMensal,
        financeProfileCompleted: true,
        currentSetupStep: 5,
      });

      // Dispara análise de carreira (com contexto enriquecido)
      const skillsTexto = [
        `Comunicação: ${step3.comunicacao}/5`,
        `Liderança: ${step3.lideranca}/5`,
        `Colaboração: ${step3.colaboracao}/5`,
        `Resolução de problemas: ${step3.resolucaoProblemas}/5`,
        `Adaptabilidade: ${step3.adaptabilidade}/5`,
        `Organização: ${step3.organizacao}/5`,
      ].join(' · ');

      // Monta contexto financeiro legível
      const financasContexto = [
        step4.rendaMensal      ? `Renda mensal R$ ${step4.rendaMensal}` : '',
        step4.gastoMedioMensal ? `Gasto médio R$ ${step4.gastoMedioMensal}` : '',
        step4.reservaEmergencia !== undefined ? `Reserva R$ ${step4.reservaEmergencia}` : '',
        step4.perfilInvestidor ? `Perfil ${step4.perfilInvestidor}` : '',
        step4.jaInveste !== undefined ? (step4.jaInveste ? 'Já investe' : 'Ainda não investe') : '',
        step4.tiposInvestimento?.length ? `Investe em ${step4.tiposInvestimento.join(', ')}` : '',
        step4.horizonte ? `Horizonte ${step4.horizonte} prazo` : '',
      ].filter(Boolean).join(' · ');

      const input: CarreiraInput = {
        cargo: step2.cargo || undefined,
        area: step2.area || undefined,
        anos_experiencia: step2.anos_experiencia || undefined,
        objetivos: step2.objetivos || undefined,
        habilidades_atuais:
          [step2.habilidades_atuais].filter(Boolean).join(' | ') || undefined,
        curriculo_texto: step2.curriculo_texto || undefined,
        soft_skills_contexto: [
          skillsTexto,
          step3.estiloTrabalho   ? `Estilo: ${step3.estiloTrabalho}` : '',
          step3.pontosFortes     ? `Fortes: ${step3.pontosFortes}` : '',
          step3.pontosMelhorar   ? `Desenvolver: ${step3.pontosMelhorar}` : '',
        ].filter(Boolean).join(' · '),
        financas_contexto: financasContexto || undefined,
        objetivos_financeiros: step4.objetivosFinanceiros?.length ? step4.objetivosFinanceiros : undefined,
        objetivos_pessoais: step1.objetivos?.length ? step1.objetivos : undefined,
      };

      setStep(5); // entra na tela já com loading
      const result = await analisarCarreira(input);
      setCareerResult(result);
      await salvarAnaliseCarreira(user.uid, input, result);
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível gerar recomendações agora — você pode concluir e refazer depois.');
      setStep(5);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleRec = (rec: RecomendacaoCarreira) => {
    setSelectedRecs((prev) => {
      const next = new Set(prev);
      next.has(rec.titulo) ? next.delete(rec.titulo) : next.add(rec.titulo);
      return next;
    });
  };

  const handleFinish = async () => {
    if (!user?.uid) return;
    setIsSavingItems(true);
    try {
      const recs = careerResult?.recomendacoes ?? [];
      const toAdd = recs.filter((r) => selectedRecs.has(r.titulo));

      if (toAdd.length > 0) {
        try {
          await batchAddDevelopmentItems(
            user.uid,
            toAdd.map((r) => ({
              type: r.tipo,
              categoria: r.categoria ?? 'profissional',
              titulo: r.titulo,
              subtitulo: r.descricao,
              autor: r.autor_ou_canal,
              plataforma: r.autor_ou_canal,
              descricao: r.descricao,
              motivo: r.motivo,
              status: 'nao_iniciado' as const,
              progress: 0,
              workspaceType: 'work' as const,
              source: 'onboarding' as const,
            })),
          );
        } catch (err) {
          console.warn('batchAddDevelopmentItems falhou:', err);
          toast.error('Não consegui salvar todos os itens agora — você pode adicioná-los depois.');
        }
      }
      setItemsAddedCount(toAdd.length);

      ensureDefaultChallenges(user.uid).catch((e) =>
        console.warn('ensureDefaultChallenges falhou (não crítico):', e),
      );

      // Finaliza em UM ÚNICO write
      await updateUserProfileData({
        developmentSetupCompleted: true,
        initialSetupCompleted: true,
        onboardingCompleted: true,
        currentSetupStep: 6,
      });

      setStep(6);
      setTimeout(() => navigate('/', { replace: true }), 2000);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao concluir o setup. Tente novamente.');
    } finally {
      setIsSavingItems(false);
    }
  };

  if (step === 6) {
    return (
      <WizardLayout step={5}>
        <StepSuccess nome={step1.nome || userProfile?.nome || 'Usuário'} itemsAdded={itemsAddedCount} />
      </WizardLayout>
    );
  }

  return (
    <WizardLayout step={step}>
      {step === 1 && (
        <Step1
          data={step1}
          onChange={(d) => setStep1((p) => ({ ...p, ...d }))}
          onNext={handleStep1Next}
          isSaving={isSavingStep}
        />
      )}
      {step === 2 && (
        <Step2
          data={step2}
          onChange={(d) => setStep2((p) => ({ ...p, ...d }))}
          onNext={handleStep2Next}
          onBack={() => setStep(1)}
          isSaving={isSavingStep}
        />
      )}
      {step === 3 && (
        <Step3
          data={step3}
          onChange={(d) => setStep3((p) => ({ ...p, ...d }))}
          onNext={handleStep3Next}
          onBack={() => setStep(2)}
          isSaving={isSavingStep}
        />
      )}
      {step === 4 && (
        <Step4
          data={step4}
          onChange={(d) => setStep4((p) => ({ ...p, ...d }))}
          onNext={handleStep4NextAndAnalyze}
          onBack={() => setStep(3)}
          isSaving={isAnalyzing}
        />
      )}
      {step === 5 && (
        <Step5
          resultado={careerResult}
          selected={selectedRecs}
          onToggle={toggleRec}
          onFinish={handleFinish}
          onBack={() => setStep(4)}
          isLoading={isAnalyzing}
          isSaving={isSavingItems}
        />
      )}
    </WizardLayout>
  );
}
