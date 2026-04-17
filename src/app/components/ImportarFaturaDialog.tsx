import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Upload, FileText, Loader, Check, CreditCard, Pencil } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { AIProcessingIndicator } from './AIProcessingIndicator';
import * as faturaService from '../../services/fatura-cartao-service';
import * as custosService from '../../services/custos-service';
import { CATEGORIAS_LABELS, CATEGORIAS_CORES } from '../../services/custos-service';
import { formatCurrency } from '../../lib/utils';

type Step = 'upload' | 'loading' | 'review';

interface TransacaoUI extends faturaService.FaturaTransacao {
  selected: boolean;
  tipo: custosService.TipoCusto;
  /** Vencimento da fatura de origem — usado para parsear datas corretamente. */
  _vencimento: string;
  /** Nome do arquivo PDF de origem. */
  _sourceFile: string;
}

const fmt = formatCurrency;

const MONTH_NAMES: Record<string, number> = {
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
  jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
  // English abbreviations sometimes appear in international cards
  feb: 2, apr: 4, may: 5, aug: 8, sep: 9, oct: 10, dec: 12,
};

/** Normaliza "10/NOV", "10/novembro", "10-nov" → "10/11" */
function normalizeDateStr(s: string): string {
  const sep = s.includes('/') ? '/' : '-';
  const parts = s.split(sep);
  if (parts.length === 2) {
    const monthPart = parts[1].toLowerCase().slice(0, 3);
    const num = MONTH_NAMES[monthPart];
    if (num) return `${parts[0]}/${String(num).padStart(2, '0')}`;
  }
  return s.replace(/-/g, '/');
}

function parseDateFromInvoice(dataStr: string, vencimento: string): Date {
  const partesVenc = vencimento.split('/');
  const anoVenc = partesVenc.length >= 3 ? parseInt(partesVenc[2], 10) : new Date().getFullYear();
  const mesVenc = partesVenc.length >= 2 ? parseInt(partesVenc[1], 10) : 1;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
    return new Date(dataStr + 'T12:00:00');
  }

  const normalized = normalizeDateStr(dataStr);
  const partes = normalized.split('/');

  if (partes.length >= 3) {
    const [d, m, a] = partes.map(Number);
    return new Date(a, m - 1, d);
  }

  if (partes.length === 2) {
    const [dia, mes] = partes.map(Number);
    if (!isNaN(dia) && !isNaN(mes)) {
      const ano = mes > mesVenc ? anoVenc - 1 : anoVenc;
      return new Date(ano, mes - 1, dia);
    }
  }

  return new Date(anoVenc, mesVenc - 1, parseInt(partesVenc[0], 10) || 1);
}

const SUBSCRIPTION_KEYWORDS = [
  'netflix', 'spotify', 'disney', 'hbo', 'amazon prime', 'prime video',
  'apple', 'microsoft', 'xbox', 'playstation', 'youtube', 'google one',
  'dropbox', 'adobe', 'canva', 'figma', 'notion', 'slack', 'zoom',
  'duolingo', 'deezer', 'globoplay', 'paramount', 'crunchyroll',
  'nintendo', 'twitch', 'linkedin', 'chatgpt', 'openai', 'midjourney',
  'github', 'office 365', 'office365', 'onedrive', 'icloud',
  'kaspersky', 'mcafee', 'norton', 'avg', 'avast', 'bitdefender',
  'expressvpn', 'nordvpn', 'surfshark',
];

function detectTipo(descricao: string): custosService.TipoCusto {
  const d = descricao.toLowerCase();
  if (SUBSCRIPTION_KEYWORDS.some(k => d.includes(k))) return 'assinatura';
  return 'variavel';
}

function mkMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function mkMonthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

export function ImportarFaturaDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
}) {
  const [step, setStep] = useState<Step>('upload');
  const [faturaResult, setFaturaResult] = useState<faturaService.FaturaResult | null>(null);
  const [transacoes, setTransacoes] = useState<TransacaoUI[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [nomeCartao, setNomeCartao] = useState('');
  const [nomeCartaoError, setNomeCartaoError] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [novaCategoriasExtras, setNovaCategoriasExtras] = useState<Record<string, string>>({});
  const [criandoCategoria, setCriandoCategoria] = useState<number | null>(null);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [activeMonthTab, setActiveMonthTab] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const slugCategoria = (label: string) =>
    'custom_' +
    label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);

  const labelDaCategoria = (cat: string) =>
    CATEGORIAS_LABELS[cat as custosService.CategoriaCusto] ||
    novaCategoriasExtras[cat] ||
    cat;

  const corDaCategoria = (cat: string) =>
    CATEGORIAS_CORES[cat as custosService.CategoriaCusto] || '#64748B';

  const txMonthKey = (t: TransacaoUI) =>
    mkMonthKey(parseDateFromInvoice(t.data, t._vencimento || faturaResult?.vencimento || ''));

  const reset = () => {
    setStep('upload');
    setFaturaResult(null);
    setTransacoes([]);
    setFiltroCategoria('todas');
    setNomeCartao('');
    setNomeCartaoError(false);
    setLoadingMsg('');
    setActiveMonthTab('all');
    setEditingIdx(null);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const processQueue = async (files: File[]) => {
    const pdfs = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (pdfs.length === 0) {
      toast.error('Selecione arquivos PDF');
      return;
    }
    setStep('loading');
    const allTransacoes: TransacaoUI[] = [];
    let lastResult: faturaService.FaturaResult | null = null;

    for (let i = 0; i < pdfs.length; i++) {
      const file = pdfs[i];
      setLoadingMsg(`Processando ${file.name}${pdfs.length > 1 ? ` (${i + 1}/${pdfs.length})` : ''}…`);
      try {
        const text = await faturaService.extractTextFromPDF(file);
        const result = await faturaService.parseFatura(text);
        lastResult = result;
        const newTxs = result.transacoes
          .filter(t => t.valor > 0 || t.valor < 0)
          .map(t => ({
            ...t,
            valor: Math.abs(t.valor),
            selected: true,
            // AI tipo takes priority; keyword detection as fallback
            tipo: (t.tipo as custosService.TipoCusto) || detectTipo(t.descricao),
            _vencimento: result.vencimento,
            _sourceFile: file.name,
          }));
        allTransacoes.push(...newTxs);
      } catch (err) {
        console.error(err);
        toast.error(`Erro ao processar ${file.name}`);
      }
    }

    if (allTransacoes.length === 0) {
      toast.error('Nenhuma transação encontrada nos arquivos');
      setStep('upload');
      return;
    }

    if (lastResult) setFaturaResult(lastResult);
    setTransacoes(allTransacoes);
    setStep('review');
    setLoadingMsg('');
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processQueue(Array.from(e.target.files));
    e.target.value = '';
  };

  const toggleAll = (selected: boolean) =>
    setTransacoes(ts =>
      ts.map(t => {
        const matchCat = filtroCategoria === 'todas' || t.categoria === filtroCategoria;
        const matchMonth = activeMonthTab === 'all' || txMonthKey(t) === activeMonthTab;
        return matchCat && matchMonth ? { ...t, selected } : t;
      })
    );

  const handleImport = async () => {
    if (!faturaResult) return;
    if (!nomeCartao.trim()) {
      setNomeCartaoError(true);
      toast.error('Informe o nome do cartão para continuar');
      return;
    }
    const selecionadas = transacoes.filter(t => t.selected);
    if (selecionadas.length === 0) {
      toast.error('Selecione ao menos uma transação para importar');
      return;
    }

    setIsSaving(true);
    const faturaId = crypto.randomUUID();
    try {
      await Promise.all(
        selecionadas.map(t =>
          custosService.criarCusto({
            descricao: t.parcelaTotal
              ? `${t.descricao} (${t.parcelaAtual}/${t.parcelaTotal})`
              : t.descricao,
            valor: t.valor,
            categoria: t.categoria as custosService.CategoriaCusto,
            tipo: t.tipo,
            origem: 'cartao',
            faturaId,
            nomeCartao: nomeCartao.trim() || undefined,
            data: parseDateFromInvoice(t.data, t._vencimento || faturaResult.vencimento),
            notas: t.isInternacional ? 'Compra internacional' : '',
          })
        )
      );
      toast.success(`${selecionadas.length} lançamentos importados com sucesso!`);
      onImported();
      handleClose(false);
    } catch {
      toast.error('Erro ao importar lançamentos');
    } finally {
      setIsSaving(false);
    }
  };

  // Month tabs derived from all transactions
  const monthTabs: Array<{ key: string; label: string; count: number }> = (() => {
    const map = new Map<string, number>();
    transacoes.forEach(t => {
      const k = txMonthKey(t);
      map.set(k, (map.get(k) || 0) + 1);
    });
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, count]) => ({ key, label: mkMonthLabel(key), count }));
  })();

  const filtradas = transacoes.filter(t => {
    if (filtroCategoria !== 'todas' && t.categoria !== filtroCategoria) return false;
    if (activeMonthTab !== 'all' && txMonthKey(t) !== activeMonthTab) return false;
    return true;
  });

  const selecionadasCount = transacoes.filter(t => t.selected).length;
  const totalSelecionado = transacoes.filter(t => t.selected).reduce((s, t) => s + t.valor, 0);

  const categoriasTotais = transacoes.reduce<Record<string, { count: number; total: number }>>(
    (acc, t) => {
      if (!acc[t.categoria]) acc[t.categoria] = { count: 0, total: 0 };
      acc[t.categoria].count++;
      acc[t.categoria].total += t.valor;
      return acc;
    },
    {}
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
            Importar Fatura do Cartão
          </DialogTitle>
        </DialogHeader>

        {/* ── Step 1: Upload ── */}
        {step === 'upload' && (
          <div className="py-4 space-y-4">
            <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--theme-background-secondary)' }}>
              <Label className="flex items-center gap-1.5 text-sm font-medium text-[var(--theme-foreground)]">
                <CreditCard className="h-3.5 w-3.5" style={{ color: nomeCartaoError ? '#EF4444' : 'var(--theme-accent)' }} />
                Nome do cartão
                <span className="text-red-500 font-bold">*</span>
              </Label>
              <Input
                placeholder="Ex: Itaú Platinum, Nubank, Inter Gold…"
                value={nomeCartao}
                onChange={e => { setNomeCartao(e.target.value); if (e.target.value.trim()) setNomeCartaoError(false); }}
                className={`text-sm ${nomeCartaoError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {nomeCartaoError ? (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                  ⚠ Nome do cartão é obrigatório para importar a fatura.
                </p>
              ) : (
                <p className="text-xs text-[var(--theme-muted-foreground)]">
                  Permite identificar e filtrar faturas por cartão na aba Cartão.
                </p>
              )}
            </div>

            {/* Input fora do Dialog via portal — evita interceptação do Radix */}
            {createPortal(
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={onFileChange}
                style={{ display: 'none' }}
              />,
              document.body
            )}

            <div
              className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed py-14 cursor-pointer transition-all"
              style={{
                borderColor: isDragging ? 'var(--theme-accent)' : 'var(--theme-border)',
                background: isDragging ? 'var(--theme-hover)' : 'var(--theme-background-secondary)',
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files.length) processQueue(Array.from(e.dataTransfer.files));
              }}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: 'var(--theme-accent)20' }}
              >
                <Upload className="h-7 w-7" style={{ color: 'var(--theme-accent)' }} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-[var(--theme-foreground)]">
                  Arraste os PDFs das faturas aqui
                </p>
                <p className="text-sm text-[var(--theme-muted-foreground)] mt-1">
                  ou clique para selecionar — você pode escolher vários arquivos de uma vez
                </p>
              </div>
              <Badge variant="outline" className="text-xs">Múltiplos arquivos .PDF</Badge>
            </div>
            <p className="text-xs text-center text-[var(--theme-muted-foreground)]">
              As faturas são processadas pelo Gemini AI e não são armazenadas permanentemente.
            </p>
          </div>
        )}

        {/* ── Step 2: Loading ── */}
        {step === 'loading' && (
          <div className="space-y-3">
            {loadingMsg && (
              <div className="rounded-lg px-4 py-2.5 text-sm font-medium text-center"
                style={{ background: 'var(--theme-background-secondary)', color: 'var(--theme-accent)' }}>
                {loadingMsg}
              </div>
            )}
            <AIProcessingIndicator
              title="Analisando suas faturas"
              subtitle="O Gemini está classificando cada gasto"
              steps={[
                'Lendo o PDF…',
                'Identificando transações…',
                'Classificando categorias…',
                'Detectando parcelamentos…',
                'Organizando por tipo (fixo/variável)…',
              ]}
            />
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 'review' && faturaResult && (
          <>
            <div
              className="rounded-xl p-4 grid grid-cols-3 gap-4"
              style={{ background: 'var(--theme-background-secondary)' }}
            >
              <div>
                <p className="text-xs text-[var(--theme-muted-foreground)]">Total selecionado</p>
                <p className="text-lg font-bold text-red-500">{fmt(totalSelecionado)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--theme-muted-foreground)]">Vencimento</p>
                <p className="text-lg font-bold text-[var(--theme-foreground)]">{faturaResult.vencimento}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--theme-muted-foreground)]">Compras encontradas</p>
                <p className="text-lg font-bold text-[var(--theme-foreground)]">{transacoes.length}</p>
              </div>
            </div>

            {/* ── Abas de mês ── */}
            {monthTabs.length > 1 && (
              <div className="space-y-1">
                <p className="text-xs text-[var(--theme-muted-foreground)] font-medium px-0.5">Filtrar por mês</p>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setActiveMonthTab('all')}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={activeMonthTab === 'all'
                      ? { background: 'var(--theme-accent)', color: '#fff' }
                      : { background: 'var(--theme-muted)', color: 'var(--theme-foreground)' }}
                  >
                    Todos ({transacoes.length})
                  </button>
                  {monthTabs.map(({ key, label, count }) => (
                    <button
                      key={key}
                      onClick={() => setActiveMonthTab(key)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={activeMonthTab === key
                        ? { background: 'var(--theme-accent)', color: '#fff' }
                        : { background: 'var(--theme-muted)', color: 'var(--theme-foreground)' }}
                    >
                      {label} ({count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filtro por categoria */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFiltroCategoria('todas')}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={filtroCategoria === 'todas'
                  ? { background: 'var(--theme-accent)', color: '#fff' }
                  : { background: 'var(--theme-muted)', color: 'var(--theme-foreground)' }}
              >
                Todas ({filtradas.length})
              </button>
              {Object.entries(categoriasTotais)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([cat, { count }]) => {
                  const cor = corDaCategoria(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => setFiltroCategoria(cat)}
                      className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                      style={filtroCategoria === cat
                        ? { background: cor, color: '#fff' }
                        : { background: `${cor}20`, color: cor }}
                    >
                      {labelDaCategoria(cat)} ({count})
                    </button>
                  );
                })}
            </div>

            {/* Lista de transações */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0" style={{ maxHeight: '340px' }}>
              <div className="flex items-center justify-between px-1 mb-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--theme-muted-foreground)]">
                  <input
                    type="checkbox"
                    checked={filtradas.length > 0 && filtradas.every(t => t.selected)}
                    onChange={e => toggleAll(e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  Selecionar todos ({filtradas.length})
                </label>
                <span className="text-xs text-[var(--theme-muted-foreground)]">
                  {fmt(filtradas.filter(t => t.selected).reduce((s, t) => s + t.valor, 0))} selecionado
                </span>
              </div>

              {filtradas.map((t, i) => {
                const cor = corDaCategoria(t.categoria);
                const globalIdx = transacoes.indexOf(t);
                const isEditing = editingIdx === globalIdx;
                const updateField = (patch: Partial<TransacaoUI>) =>
                  setTransacoes(ts => ts.map((tx, idx) => (idx === globalIdx ? { ...tx, ...patch } : tx)));

                if (isEditing) {
                  return (
                    <div
                      key={i}
                      className="rounded-xl p-3 space-y-2"
                      style={{
                        background: 'var(--theme-background-secondary)',
                        border: `1px solid ${cor}40`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--theme-muted-foreground)]">{t.data}</span>
                        {t._sourceFile && (
                          <span className="text-xs text-[var(--theme-muted-foreground)] ml-1 truncate max-w-[160px]">
                            · {t._sourceFile}
                          </span>
                        )}
                        <span className="text-xs text-[var(--theme-muted-foreground)] ml-auto">Ajustar classificação</span>
                      </div>
                      <div className="space-y-2">
                        <Input
                          value={t.descricao}
                          onChange={e => updateField({ descricao: e.target.value })}
                          placeholder="Descrição"
                          className="text-sm"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Select
                            value={t.categoria}
                            onValueChange={(v) => {
                              if (v === '__nova__') {
                                setCriandoCategoria(globalIdx);
                                setNovaCategoriaNome('');
                              } else {
                                updateField({ categoria: v as custosService.CategoriaCusto });
                              }
                            }}
                          >
                            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(CATEGORIAS_LABELS).map(([k, label]) => (
                                <SelectItem key={k} value={k}>{label}</SelectItem>
                              ))}
                              {Object.entries(novaCategoriasExtras).map(([k, label]) => (
                                <SelectItem key={k} value={k}>{label}</SelectItem>
                              ))}
                              <SelectItem value="__nova__">+ Nova categoria…</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={t.tipo}
                            onValueChange={(v) => updateField({ tipo: v as custosService.TipoCusto })}
                          >
                            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="variavel">Variável</SelectItem>
                              <SelectItem value="fixa">Fixo</SelectItem>
                              <SelectItem value="assinatura">Assinatura</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={t.valor}
                            onChange={e => updateField({ valor: Number(e.target.value) || 0 })}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      {criandoCategoria === globalIdx && (
                        <div className="flex gap-2 items-center pt-1">
                          <Input
                            autoFocus
                            value={novaCategoriaNome}
                            onChange={e => setNovaCategoriaNome(e.target.value)}
                            placeholder="Nome da nova categoria"
                            className="text-sm"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const nome = novaCategoriaNome.trim();
                                if (!nome) return;
                                const key = slugCategoria(nome);
                                setNovaCategoriasExtras(prev => ({ ...prev, [key]: nome }));
                                updateField({ categoria: key as custosService.CategoriaCusto });
                                setCriandoCategoria(null);
                                setNovaCategoriaNome('');
                              } else if (e.key === 'Escape') {
                                setCriandoCategoria(null);
                                setNovaCategoriaNome('');
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const nome = novaCategoriaNome.trim();
                              if (!nome) return;
                              const key = slugCategoria(nome);
                              setNovaCategoriasExtras(prev => ({ ...prev, [key]: nome }));
                              updateField({ categoria: key as custosService.CategoriaCusto });
                              setCriandoCategoria(null);
                              setNovaCategoriaNome('');
                            }}
                            style={{ background: 'var(--theme-accent)', color: '#fff' }}
                          >
                            Criar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setCriandoCategoria(null); setNovaCategoriaNome(''); }}>
                            Cancelar
                          </Button>
                        </div>
                      )}
                      <div className="flex justify-end gap-2 pt-1">
                        <Button size="sm" variant="outline" onClick={() => setEditingIdx(null)}>
                          Concluído
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl p-3 transition-all hover:opacity-95"
                    style={{
                      background: t.selected ? `${cor}10` : 'var(--theme-background-secondary)',
                      border: `1px solid ${t.selected ? cor + '30' : 'transparent'}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={t.selected}
                      onChange={e => updateField({ selected: e.target.checked })}
                      className="h-4 w-4 rounded flex-shrink-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[var(--theme-foreground)] truncate">
                          {t.descricao}
                        </span>
                        {t.parcelaTotal && (
                          <span className="text-xs text-[var(--theme-muted-foreground)]">
                            {t.parcelaAtual}/{t.parcelaTotal}x
                          </span>
                        )}
                        {t.isInternacional && (
                          <Badge variant="outline" className="text-xs py-0">Internacional</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: `${cor}20`, color: cor }}
                        >
                          {labelDaCategoria(t.categoria)}
                        </span>
                        <span className="text-xs text-[var(--theme-muted-foreground)]">
                          {t.tipo === 'fixa' ? 'Fixo' : t.tipo === 'assinatura' ? 'Assinatura' : 'Variável'}
                        </span>
                        <span className="text-xs text-[var(--theme-muted-foreground)]">· {t.data}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0" style={{ color: cor }}>
                      {fmt(t.valor)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingIdx(globalIdx)}
                      className="flex-shrink-0 rounded-md p-1.5 text-[var(--theme-muted-foreground)] hover:bg-[var(--theme-background)] hover:text-[var(--theme-foreground)]"
                      title="Editar classificação"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="flex-col gap-2 border-t pt-4" style={{ borderColor: 'var(--theme-border)' }}>
              {!nomeCartao.trim() && (
                <div className="w-full flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                  <CreditCard className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600">
                    Volte à etapa anterior e informe o <strong>nome do cartão</strong> antes de importar.
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 sm:gap-3 w-full">
                <div className="flex-1 text-sm text-[var(--theme-muted-foreground)]">
                  <span className="font-semibold text-[var(--theme-foreground)]">{selecionadasCount}</span> itens ·{' '}
                  <span className="font-semibold text-red-500">{fmt(totalSelecionado)}</span>
                </div>
                <Button variant="outline" onClick={() => handleClose(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isSaving || selecionadasCount === 0 || !nomeCartao.trim()}
                  style={{ background: 'var(--theme-accent)', color: '#fff' }}
                >
                  {isSaving ? (
                    <><Loader className="h-4 w-4 mr-2 animate-spin" /> Importando…</>
                  ) : (
                    <><Check className="h-4 w-4 mr-2" /> Importar {selecionadasCount} lançamentos</>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
