import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Upload, FileText, Loader, Check, Landmark, Pencil,
  ArrowDownCircle, ArrowUpCircle,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import {
  parseExtrato,
  type ExtratoResult,
  type ExtratoTransacao,
  type TipoTransacaoExtrato,
} from '../../services/extrato-service';
import { extractTextFromPDF } from '../../services/fatura-cartao-service';
import { AIProcessingIndicator } from './AIProcessingIndicator';
import * as custosService from '../../services/custos-service';
import {
  CATEGORIAS_LABELS as CATEGORIAS_DESPESA_LABELS,
  CATEGORIAS_CORES as CATEGORIAS_DESPESA_CORES,
  type CategoriaCusto,
  type TipoCusto,
} from '../../services/custos-service';
import {
  criarReceita,
  CATEGORIAS_RECEITA_LABELS,
  CATEGORIAS_RECEITA_CORES,
  type CategoriaReceita,
} from '../../services/receitas-service';
import { formatCurrency } from '../../lib/utils';

type Step = 'upload' | 'loading' | 'review';

interface TransacaoUI extends ExtratoTransacao {
  selected: boolean;
  tipoGasto: TipoCusto;
  categoriaCustom?: string;
  _sourceFile: string;
}

const fmt = formatCurrency;

/** Parse 'DD/MM/AAAA' ou 'DD/MM/AA' → Date. */
function parseBrDate(br: string): Date {
  const parts = br.split('/').map((s) => s.trim());
  if (parts.length < 3) return new Date();
  const dia = Number(parts[0]);
  const mes = Number(parts[1]) - 1;
  let ano = Number(parts[2]);
  if (ano < 100) ano += 2000;
  return new Date(ano, mes, dia);
}

function mkMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function mkMonthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

export function ImportarExtratoDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
}) {
  const [step, setStep] = useState<Step>('upload');
  const [result, setResult] = useState<ExtratoResult | null>(null);
  const [transacoes, setTransacoes] = useState<TransacaoUI[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<'todas' | TipoTransacaoExtrato>('todas');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [activeMonthTab, setActiveMonthTab] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const txMonthKey = (t: TransacaoUI) => mkMonthKey(parseBrDate(t.data));

  const reset = () => {
    setStep('upload');
    setResult(null);
    setTransacoes([]);
    setFiltroTipo('todas');
    setEditingIdx(null);
    setLoadingMsg('');
    setActiveMonthTab('all');
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const processQueue = async (files: File[]) => {
    const valid = files.filter(f => {
      const n = f.name.toLowerCase();
      return n.endsWith('.pdf') || n.endsWith('.txt') || n.endsWith('.csv');
    });
    if (valid.length === 0) {
      toast.error('Selecione arquivos PDF, TXT ou CSV');
      return;
    }
    setStep('loading');
    const allTransacoes: TransacaoUI[] = [];
    let lastResult: ExtratoResult | null = null;

    for (let i = 0; i < valid.length; i++) {
      const file = valid[i];
      setLoadingMsg(`Processando ${file.name}${valid.length > 1 ? ` (${i + 1}/${valid.length})` : ''}…`);
      try {
        const isPDF = file.name.toLowerCase().endsWith('.pdf');
        const texto = isPDF ? await extractTextFromPDF(file) : await file.text();
        const parsed = await parseExtrato(texto);
        lastResult = parsed;
        const newTxs = parsed.transacoes
          .filter((t) => t.valor > 0)
          .map((t) => ({
            ...t,
            selected: true,
            tipoGasto: 'variavel' as TipoCusto,
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

    if (lastResult) setResult(lastResult);
    setTransacoes(allTransacoes);
    setStep('review');
    setLoadingMsg('');
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processQueue(Array.from(e.target.files));
    e.target.value = '';
  };

  const filtradas = transacoes.filter((t) => {
    if (filtroTipo !== 'todas' && t.tipo !== filtroTipo) return false;
    if (activeMonthTab !== 'all' && txMonthKey(t) !== activeMonthTab) return false;
    return true;
  });

  const toggleAll = (selected: boolean) =>
    setTransacoes((ts) =>
      ts.map((t) => {
        const matchTipo = filtroTipo === 'todas' || t.tipo === filtroTipo;
        const matchMonth = activeMonthTab === 'all' || txMonthKey(t) === activeMonthTab;
        return matchTipo && matchMonth ? { ...t, selected } : t;
      }),
    );

  const selecionadas = transacoes.filter((t) => t.selected);
  const totalEntradas = selecionadas.filter((t) => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0);
  const totalSaidas = selecionadas.filter((t) => t.tipo === 'saida').reduce((s, t) => s + t.valor, 0);

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

  const handleImport = async () => {
    if (!result) return;
    if (selecionadas.length === 0) {
      toast.error('Selecione ao menos uma transação para importar');
      return;
    }
    setIsSaving(true);
    try {
      await Promise.all(
        selecionadas.map(async (t) => {
          const data = parseBrDate(t.data);
          const baseNota = result.banco ? `Extrato — ${result.banco}` : 'Extrato bancário';
          const notaComCat = t.categoriaCustom?.trim()
            ? `${baseNota} · Categoria: ${t.categoriaCustom.trim()}`
            : baseNota;
          if (t.tipo === 'saida') {
            await custosService.criarCusto({
              descricao: t.descricao,
              valor: t.valor,
              categoria: (t.categoriaDespesa === 'personalizado' ? 'outros' : (t.categoriaDespesa ?? 'outros')) as CategoriaCusto,
              tipo: t.tipoGasto,
              origem: 'manual',
              data,
              notas: notaComCat,
            });
          } else {
            await criarReceita({
              descricao: t.descricao,
              valor: t.valor,
              categoria: (t.categoriaReceita === 'personalizado' ? 'outros' : (t.categoriaReceita ?? 'outros')) as CategoriaReceita,
              data,
              recorrente: false,
              notas: notaComCat,
            });
          }
        }),
      );
      const nE = selecionadas.filter((t) => t.tipo === 'entrada').length;
      const nS = selecionadas.filter((t) => t.tipo === 'saida').length;
      toast.success(`${nE} entrada(s) e ${nS} saída(s) importadas!`);
      onImported();
      handleClose(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao importar transações do extrato');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
            Importar Extrato Bancário
          </DialogTitle>
        </DialogHeader>

        {/* ── Step 1: Upload ── */}
        {step === 'upload' && (
          <div className="py-4 space-y-4">
            {/* Input fora do Dialog via portal — evita interceptação do Radix */}
            {createPortal(
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.csv"
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
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
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
                  Arraste os extratos aqui
                </p>
                <p className="text-sm text-[var(--theme-muted-foreground)] mt-1">
                  ou clique para selecionar — você pode escolher vários arquivos de uma vez
                </p>
              </div>
              <div className="flex gap-1.5">
                <Badge variant="outline" className="text-xs">PDF</Badge>
                <Badge variant="outline" className="text-xs">TXT</Badge>
                <Badge variant="outline" className="text-xs">CSV</Badge>
              </div>
            </div>
            <p className="text-xs text-center text-[var(--theme-muted-foreground)]">
              O Gemini identifica entradas e saídas automaticamente. Você pode ajustar antes de salvar.
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
              title="Analisando os extratos"
              subtitle="Separando entradas e saídas automaticamente"
              steps={[
                'Lendo o documento…',
                'Identificando transações…',
                'Separando entradas e saídas…',
                'Classificando por categoria…',
                'Organizando os resultados…',
              ]}
            />
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 'review' && result && (
          <>
            <div
              className="rounded-xl p-4 grid grid-cols-3 gap-4"
              style={{ background: 'var(--theme-background-secondary)' }}
            >
              <div>
                <p className="text-xs text-[var(--theme-muted-foreground)]">Banco</p>
                <p className="text-sm font-semibold text-[var(--theme-foreground)]">
                  {result.banco ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--theme-muted-foreground)]">Período</p>
                <p className="text-sm font-semibold text-[var(--theme-foreground)]">
                  {result.periodo ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--theme-muted-foreground)]">Transações</p>
                <p className="text-sm font-semibold text-[var(--theme-foreground)]">{transacoes.length}</p>
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

            {/* Filtro tipo */}
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'todas', label: `Todas (${filtradas.length})`, color: '#6B7280' },
                { key: 'entrada', label: `Entradas (${filtradas.filter(t => t.tipo === 'entrada').length})`, color: '#16A34A' },
                { key: 'saida', label: `Saídas (${filtradas.filter(t => t.tipo === 'saida').length})`, color: '#EF4444' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFiltroTipo(f.key as typeof filtroTipo)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={filtroTipo === f.key
                    ? { background: f.color, color: '#fff' }
                    : { background: `${f.color}20`, color: f.color }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0" style={{ maxHeight: '340px' }}>
              <div className="flex items-center justify-between px-1 mb-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--theme-muted-foreground)]">
                  <input
                    type="checkbox"
                    checked={filtradas.length > 0 && filtradas.every((t) => t.selected)}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  Selecionar todos ({filtradas.length})
                </label>
                <span className="text-xs text-[var(--theme-muted-foreground)]">
                  <span className="text-green-600 font-semibold">+{fmt(filtradas.filter(t => t.tipo === 'entrada' && t.selected).reduce((s,t)=>s+t.valor,0))}</span>
                  {' · '}
                  <span className="text-red-500 font-semibold">-{fmt(filtradas.filter(t => t.tipo === 'saida' && t.selected).reduce((s,t)=>s+t.valor,0))}</span>
                </span>
              </div>

              {filtradas.map((t, i) => {
                const globalIdx = transacoes.indexOf(t);
                const isEditing = editingIdx === globalIdx;
                const isEntrada = t.tipo === 'entrada';
                const catKey = isEntrada ? (t.categoriaReceita ?? 'outros') : (t.categoriaDespesa ?? 'outros');
                const cor = isEntrada
                  ? (CATEGORIAS_RECEITA_CORES[catKey as CategoriaReceita] || '#16A34A')
                  : (catKey === 'personalizado' ? '#6B7280' : (CATEGORIAS_DESPESA_CORES[catKey as CategoriaCusto] || '#EF4444'));
                const rawCatLabel = isEntrada
                  ? (CATEGORIAS_RECEITA_LABELS[(t.categoriaReceita ?? 'outros') as CategoriaReceita])
                  : (CATEGORIAS_DESPESA_LABELS[(t.categoriaDespesa ?? 'outros') as CategoriaCusto]);
                const catLabel = (
                  (isEntrada ? t.categoriaReceita : t.categoriaDespesa) === 'personalizado' && t.categoriaCustom?.trim()
                ) ? t.categoriaCustom.trim() : rawCatLabel;

                const updateField = (patch: Partial<TransacaoUI>) =>
                  setTransacoes((ts) => ts.map((tx, idx) => (idx === globalIdx ? { ...tx, ...patch } : tx)));

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
                        <span className="text-xs text-[var(--theme-muted-foreground)] ml-auto">Ajustar classificação</span>
                      </div>
                      <Input
                        value={t.descricao}
                        onChange={(e) => updateField({ descricao: e.target.value })}
                        placeholder="Descrição"
                        className="text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={t.tipo}
                          onValueChange={(v) => {
                            const novoTipo = v as TipoTransacaoExtrato;
                            updateField({
                              tipo: novoTipo,
                              categoriaDespesa: novoTipo === 'saida' ? 'outros' : undefined,
                              categoriaReceita: novoTipo === 'entrada' ? 'outros' : undefined,
                            });
                          }}
                        >
                          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entrada">Entrada (receita)</SelectItem>
                            <SelectItem value="saida">Saída (despesa)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={t.valor}
                          onChange={(e) => updateField({ valor: Number(e.target.value) || 0 })}
                          className="text-sm"
                        />
                      </div>

                      {t.tipo === 'saida' ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Select
                              value={(t.categoriaDespesa ?? 'outros') as string}
                              onValueChange={(v) => updateField({ categoriaDespesa: v as CategoriaCusto, categoriaCustom: v === 'personalizado' ? (t.categoriaCustom ?? '') : undefined })}
                            >
                              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(CATEGORIAS_DESPESA_LABELS).map(([k, label]) => (
                                  <SelectItem key={k} value={k}>{label}</SelectItem>
                                ))}
                                <SelectItem value="personalizado">✏️ Personalizado…</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={t.tipoGasto}
                              onValueChange={(v) => updateField({ tipoGasto: v as TipoCusto })}
                            >
                              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="variavel">Variável</SelectItem>
                                <SelectItem value="fixa">Fixo</SelectItem>
                                <SelectItem value="assinatura">Assinatura</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {t.categoriaDespesa === 'personalizado' && (
                            <Input
                              value={t.categoriaCustom ?? ''}
                              onChange={(e) => updateField({ categoriaCustom: e.target.value })}
                              placeholder="Nome da categoria (ex: Academia, Farmácia…)"
                              className="text-sm"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Select
                            value={(t.categoriaReceita ?? 'outros') as string}
                            onValueChange={(v) => updateField({ categoriaReceita: v as CategoriaReceita, categoriaCustom: v === 'personalizado' ? (t.categoriaCustom ?? '') : undefined })}
                          >
                            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(CATEGORIAS_RECEITA_LABELS).map(([k, label]) => (
                                <SelectItem key={k} value={k}>{label}</SelectItem>
                              ))}
                              <SelectItem value="personalizado">✏️ Personalizado…</SelectItem>
                            </SelectContent>
                          </Select>
                          {t.categoriaReceita === 'personalizado' && (
                            <Input
                              value={t.categoriaCustom ?? ''}
                              onChange={(e) => updateField({ categoriaCustom: e.target.value })}
                              placeholder="Nome da categoria (ex: Bônus, Reembolso…)"
                              className="text-sm"
                            />
                          )}
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

                const Arrow = isEntrada ? ArrowUpCircle : ArrowDownCircle;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl p-3"
                    style={{
                      background: t.selected ? `${cor}10` : 'var(--theme-background-secondary)',
                      border: `1px solid ${t.selected ? cor + '30' : 'transparent'}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={t.selected}
                      onChange={(e) => updateField({ selected: e.target.checked })}
                      className="h-4 w-4 rounded flex-shrink-0 cursor-pointer"
                    />
                    <Arrow className="h-4 w-4 flex-shrink-0" style={{ color: cor }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[var(--theme-foreground)] truncate">
                          {t.descricao}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: `${cor}20`, color: cor }}
                        >
                          {catLabel}
                        </span>
                        <span className="text-xs text-[var(--theme-muted-foreground)]">· {t.data}</span>
                        {t.tipo === 'saida' && (
                          <span className="text-xs text-[var(--theme-muted-foreground)]">
                            · {t.tipoGasto === 'fixa' ? 'Fixo' : t.tipoGasto === 'assinatura' ? 'Assinatura' : 'Variável'}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0" style={{ color: cor }}>
                      {isEntrada ? '+' : '-'}{fmt(t.valor)}
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

            <DialogFooter
              className="flex-col gap-2 sm:flex-row items-center border-t pt-4"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              <div className="flex-1 text-sm text-[var(--theme-muted-foreground)]">
                <span className="font-semibold text-[var(--theme-foreground)]">{selecionadas.length}</span> selecionadas ·{' '}
                <span className="text-green-600 font-semibold">+{fmt(totalEntradas)}</span>{' · '}
                <span className="text-red-500 font-semibold">-{fmt(totalSaidas)}</span>
              </div>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={isSaving || selecionadas.length === 0}
                style={{ background: 'var(--theme-accent)', color: '#fff' }}
              >
                {isSaving ? (
                  <><Loader className="h-4 w-4 mr-2 animate-spin" /> Importando…</>
                ) : (
                  <><Check className="h-4 w-4 mr-2" /> Importar {selecionadas.length} lançamentos</>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {!['upload', 'loading', 'review'].includes(step) && <FileText />}
      </DialogContent>
    </Dialog>
  );
}
