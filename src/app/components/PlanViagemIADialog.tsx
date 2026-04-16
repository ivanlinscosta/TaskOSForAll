/**
 * Dialog para planejar viagem com IA.
 *
 * 3 modos:
 *  1. Sei o destino, preciso de datas e roteiro
 *  2. Não sei o destino, sei quanto quero gastar
 *  3. Sei o destino e budget, preciso de roteiro
 */
import { useState } from 'react';
import {
  MapPin, DollarSign, Route, Sparkles,
  ArrowRight, ArrowLeft, Check, Users, Calendar,
  Plane, Car, Bus, Globe,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { AIProcessingIndicator } from './AIProcessingIndicator';
import {
  planejarViagem,
  type ModoViagem,
  type TipoViagem,
  type MeioTransporte,
  type ViagemPlanResult,
} from '../../services/viagem-ai-service';

type Step = 'choose_mode' | 'form' | 'loading' | 'result';

const INTERESSES = [
  'Cultura', 'Praia', 'Aventura', 'Gastronomia', 'Relax',
  'Natureza', 'Compras', 'Vida noturna', 'Museus', 'Esportes',
];

const MODOS: { key: ModoViagem; icon: typeof MapPin; label: string; desc: string }[] = [
  {
    key: 'destino_sem_data',
    icon: MapPin,
    label: 'Sei o destino',
    desc: 'Já sei para onde vou, mas preciso de ajuda com datas e roteiro',
  },
  {
    key: 'sem_destino',
    icon: DollarSign,
    label: 'Sei o orçamento',
    desc: 'Não sei para onde ir, mas sei quanto quero gastar',
  },
  {
    key: 'destino_com_budget',
    icon: Route,
    label: 'Destino + orçamento',
    desc: 'Sei o destino e tenho um budget, preciso de um roteiro',
  },
];

const fmt = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Chamado quando o usuário aceita o plano. Passa dados formatados para criarViagem. */
  onAccept: (plan: ViagemPlanResult) => void;
}

export function PlanViagemIADialog({ open, onOpenChange, onAccept }: Props) {
  const [step, setStep] = useState<Step>('choose_mode');
  const [modo, setModo] = useState<ModoViagem | null>(null);
  const [result, setResult] = useState<ViagemPlanResult | null>(null);

  // form fields
  const [destino, setDestino] = useState('');
  const [budget, setBudget] = useState('');
  const [datasPreferidas, setDatasPreferidas] = useState('');
  const [duracaoDias, setDuracaoDias] = useState('');
  const [interesses, setInteresses] = useState<string[]>([]);
  const [numViajantes, setNumViajantes] = useState('1');
  const [observacoes, setObservacoes] = useState('');
  const [origem, setOrigem] = useState('');
  const [tipoViagem, setTipoViagem] = useState<TipoViagem>('nacional');
  const [meioTransporte, setMeioTransporte] = useState<MeioTransporte>('aviao');

  const reset = () => {
    setStep('choose_mode');
    setModo(null);
    setResult(null);
    setDestino('');
    setBudget('');
    setDatasPreferidas('');
    setDuracaoDias('');
    setInteresses([]);
    setNumViajantes('1');
    setObservacoes('');
    setOrigem('');
    setTipoViagem('nacional');
    setMeioTransporte('aviao');
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const toggleInteresse = (i: string) =>
    setInteresses((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  const handleGenerate = async () => {
    if (!modo) return;

    // Validações mínimas
    if (modo !== 'sem_destino' && !destino.trim()) {
      toast.error('Informe o destino');
      return;
    }
    if (modo !== 'destino_sem_data' && !budget.trim()) {
      toast.error('Informe o orçamento');
      return;
    }

    setStep('loading');
    try {
      const plan = await planejarViagem({
        modo,
        destino: destino.trim() || undefined,
        budget: parseFloat(budget) || undefined,
        datasPreferidas: datasPreferidas.trim() || undefined,
        duracaoDias: parseInt(duracaoDias) || undefined,
        interesses: interesses.length ? interesses : undefined,
        numViajantes: parseInt(numViajantes) || 1,
        observacoes: observacoes.trim() || undefined,
        origem: origem.trim() || undefined,
        tipoViagem,
        meioTransporte: tipoViagem === 'nacional' ? meioTransporte : undefined,
      });
      setResult(plan);
      setStep('result');
    } catch (err: any) {
      console.error(err);
      const msg = err?.code === 'functions/not-found' || err?.message?.includes('CORS')
        ? 'Função ainda não publicada. Execute "firebase deploy --only functions" e tente novamente.'
        : 'Erro ao gerar plano de viagem. Tente novamente.';
      toast.error(msg);
      setStep('form');
    }
  };

  const handleAccept = () => {
    if (!result) return;
    onAccept(result);
    handleClose(false);
    toast.success('Plano de viagem aplicado! Revise e salve.');
  };

  const needsDestino = modo === 'destino_sem_data' || modo === 'destino_com_budget';
  const needsBudget = modo === 'sem_destino' || modo === 'destino_com_budget';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
            Planejar Viagem com IA
          </DialogTitle>
        </DialogHeader>

        {/* ── Step 1: Choose Mode ── */}
        {step === 'choose_mode' && (
          <div className="py-4 space-y-4">
            <p className="text-sm text-[var(--theme-muted-foreground)]">
              O que você já sabe sobre a viagem? A IA vai ajudar com o resto.
            </p>
            <div className="grid gap-3">
              {MODOS.map((m) => {
                const Icon = m.icon;
                const selected = modo === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setModo(m.key)}
                    className="flex items-start gap-4 rounded-xl p-4 text-left transition-all"
                    style={{
                      border: `2px solid ${selected ? 'var(--theme-accent)' : 'var(--theme-border)'}`,
                      background: selected ? 'var(--theme-accent)08' : 'var(--theme-background-secondary)',
                    }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `var(--theme-accent)20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--theme-foreground)]">{m.label}</p>
                      <p className="text-sm text-[var(--theme-muted-foreground)] mt-0.5">{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
              <Button
                disabled={!modo}
                onClick={() => setStep('form')}
                style={{ background: 'var(--theme-accent)', color: '#fff' }}
              >
                Continuar <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── Step 2: Form ── */}
        {step === 'form' && (
          <div className="py-2 space-y-4 flex-1 overflow-y-auto">
            {/* Local de Partida */}
            <div>
              <Label className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Local de Partida
              </Label>
              <Input
                placeholder="Ex: São Paulo, SP"
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Nacional / Internacional */}
            <div>
              <Label className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" /> Tipo de Viagem
              </Label>
              <div className="flex gap-3 mt-2">
                {([
                  { key: 'nacional' as TipoViagem, label: 'Nacional', icon: MapPin },
                  { key: 'internacional' as TipoViagem, label: 'Internacional', icon: Globe },
                ]).map((t) => {
                  const Icon = t.icon;
                  const selected = tipoViagem === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTipoViagem(t.key)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all"
                      style={{
                        border: `2px solid ${selected ? 'var(--theme-accent)' : 'var(--theme-border)'}`,
                        background: selected ? 'var(--theme-accent)12' : 'var(--theme-background-secondary)',
                        color: selected ? 'var(--theme-accent)' : 'var(--theme-foreground)',
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meio de Transporte (só para nacional) */}
            {tipoViagem === 'nacional' && (
              <div>
                <Label>Meio de Transporte Preferido</Label>
                <div className="flex gap-3 mt-2">
                  {([
                    { key: 'aviao' as MeioTransporte, label: 'Avião', icon: Plane },
                    { key: 'onibus' as MeioTransporte, label: 'Ônibus', icon: Bus },
                    { key: 'carro' as MeioTransporte, label: 'Carro', icon: Car },
                  ]).map((t) => {
                    const Icon = t.icon;
                    const selected = meioTransporte === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setMeioTransporte(t.key)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all"
                        style={{
                          border: `2px solid ${selected ? 'var(--theme-accent)' : 'var(--theme-border)'}`,
                          background: selected ? 'var(--theme-accent)12' : 'var(--theme-background-secondary)',
                          color: selected ? 'var(--theme-accent)' : 'var(--theme-foreground)',
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {needsDestino && (
              <div>
                <Label>Destino *</Label>
                <Input
                  placeholder={tipoViagem === 'internacional' ? 'Ex: Lisboa, Portugal' : 'Ex: Salvador, BA'}
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
            {needsBudget && (
              <div>
                <Label>Orçamento (R$) *</Label>
                <Input
                  type="number"
                  step="100"
                  min="0"
                  placeholder="Ex: 5000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Datas preferidas
                </Label>
                <Input
                  placeholder="Ex: julho 2026, flexível"
                  value={datasPreferidas}
                  onChange={(e) => setDatasPreferidas(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Duração (dias)</Label>
                <Input
                  type="number"
                  min="1"
                  max="90"
                  placeholder="Ex: 7"
                  value={duracaoDias}
                  onChange={(e) => setDuracaoDias(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> Viajantes
              </Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={numViajantes}
                onChange={(e) => setNumViajantes(e.target.value)}
                className="mt-1 w-24"
              />
            </div>

            {/* Interesses */}
            <div>
              <Label>Interesses</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {INTERESSES.map((i) => {
                  const active = interesses.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleInteresse(i)}
                      className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                      style={active
                        ? { background: 'var(--theme-accent)', color: '#fff' }
                        : { background: 'var(--theme-muted)', color: 'var(--theme-foreground)' }}
                    >
                      {i}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Algo mais que a IA deva considerar? Ex: viajo com criança, preciso de hotel pet-friendly…"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setStep('choose_mode')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
              <Button
                onClick={handleGenerate}
                style={{ background: 'var(--theme-accent)', color: '#fff' }}
              >
                <Sparkles className="h-4 w-4 mr-2" /> Gerar Plano
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── Step 3: Loading ── */}
        {step === 'loading' && (
          <AIProcessingIndicator
            title="Planejando sua viagem"
            subtitle="O Gemini está montando o roteiro perfeito"
            steps={[
              'Pesquisando o destino…',
              'Calculando o orçamento…',
              'Montando o roteiro dia a dia…',
              'Selecionando atividades…',
              'Otimizando custos…',
              'Preparando dicas de viagem…',
            ]}
          />
        )}

        {/* ── Step 4: Result ── */}
        {step === 'result' && result && (
          <div className="py-2 space-y-4 flex-1 overflow-y-auto pr-1" style={{ maxHeight: '60vh' }}>
            {/* Explicação da IA */}
            <div
              className="rounded-xl p-4 text-sm"
              style={{ background: 'var(--theme-accent)08', border: '1px solid var(--theme-accent)30' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4" style={{ color: 'var(--theme-accent)' }} />
                <span className="font-semibold" style={{ color: 'var(--theme-accent)' }}>Sugestão da IA</span>
              </div>
              <p className="text-[var(--theme-foreground)] leading-relaxed">{result.explicacao}</p>
            </div>

            {/* Resumo */}
            <div
              className="rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
              style={{ background: 'var(--theme-background-secondary)' }}
            >
              <div>
                <p className="text-xs text-[var(--theme-muted-foreground)]">Destino</p>
                <p className="font-bold text-[var(--theme-foreground)]">{result.destino}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--theme-muted-foreground)]">Ida</p>
                <p className="font-bold text-[var(--theme-foreground)]">{result.dataIda}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--theme-muted-foreground)]">Volta</p>
                <p className="font-bold text-[var(--theme-foreground)]">{result.dataVolta}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--theme-muted-foreground)]">Orçamento Total</p>
                <p className="font-bold" style={{ color: 'var(--theme-accent)' }}>
                  {fmt(result.orcamentoTotal)}
                </p>
              </div>
            </div>

            {/* Orçamento Detalhado */}
            <div>
              <p className="text-sm font-semibold text-[var(--theme-foreground)] mb-2">Orçamento por Categoria</p>
              <div className="space-y-1.5">
                {result.orcamentoDetalhado.map((item, i) => {
                  const pct = result.orcamentoTotal > 0
                    ? (item.valor / result.orcamentoTotal) * 100
                    : 0;
                  const catLabels: Record<string, string> = {
                    passagem: 'Passagem', hospedagem: 'Hospedagem', passeios: 'Passeios',
                    alimentacao: 'Alimentação', transporte: 'Transporte',
                  };
                  return (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="w-24 text-[var(--theme-muted-foreground)]">
                        {catLabels[item.categoria] || item.categoria}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-[var(--theme-muted)]">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${pct}%`, background: 'var(--theme-accent)' }}
                        />
                      </div>
                      <span className="w-24 text-right font-medium text-[var(--theme-foreground)]">
                        {fmt(item.valor)}
                      </span>
                      {item.formaPagamento === 'a_prazo' && item.parcelas && (
                        <Badge variant="outline" className="text-xs">{item.parcelas}x</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Roteiro */}
            <div>
              <p className="text-sm font-semibold text-[var(--theme-foreground)] mb-2">
                Roteiro ({result.atividades.length} atividades)
              </p>
              <div className="space-y-1.5">
                {result.atividades.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
                    style={{ background: 'var(--theme-background-secondary)' }}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: 'var(--theme-accent)20', color: 'var(--theme-accent)' }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--theme-foreground)] truncate">{a.nome}</p>
                    </div>
                    <span className="text-xs text-[var(--theme-muted-foreground)] shrink-0">
                      {a.data} · {a.horario}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notas / Dicas */}
            {result.notas && (
              <div
                className="rounded-xl p-4 text-sm"
                style={{ background: 'var(--theme-background-secondary)' }}
              >
                <p className="font-semibold text-[var(--theme-foreground)] mb-1">Dicas Importantes</p>
                <p className="text-[var(--theme-muted-foreground)] leading-relaxed whitespace-pre-line">
                  {result.notas}
                </p>
              </div>
            )}

            <DialogFooter className="pt-2 gap-2">
              <Button variant="outline" onClick={() => { setStep('form'); setResult(null); }}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Ajustar e gerar novamente
              </Button>
              <Button
                onClick={handleAccept}
                style={{ background: 'var(--theme-accent)', color: '#fff' }}
              >
                <Check className="h-4 w-4 mr-2" /> Usar este plano
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
