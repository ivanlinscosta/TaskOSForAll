import { useState, useRef, useCallback } from 'react';
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
  /** Tipo de gasto (apenas relevante para tipo='saida'). */
  tipoGasto: TipoCusto;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setResult(null);
    setTransacoes([]);
    setFiltroTipo('todas');
    setEditingIdx(null);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const processFile = async (file: File) => {
    const isPDF = file.name.toLowerCase().endsWith('.pdf');
    const isText = /\.(txt|csv)$/i.test(file.name);
    if (!isPDF && !isText) {
      toast.error('Selecione um arquivo PDF, TXT ou CSV');
      return;
    }
    setStep('loading');
    try {
      const texto = isPDF ? await extractTextFromPDF(file) : await file.text();
      const parsed = await parseExtrato(texto);
      setResult(parsed);
      setTransacoes(
        parsed.transacoes
          .filter((t) => t.valor > 0)
          .map((t) => ({
            ...t,
            selected: true,
            tipoGasto: 'variavel' as TipoCusto,
          })),
      );
      setStep('review');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao processar o extrato. Verifique o arquivo e tente novamente.');
      setStep('upload');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const filtradas = filtroTipo === 'todas' ? transacoes : transacoes.filter((t) => t.tipo === filtroTipo);

  const toggleAll = (selected: boolean) =>
    setTransacoes((ts) =>
      ts.map((t) => (filtroTipo === 'todas' || t.tipo === filtroTipo ? { ...t, selected } : t)),
    );

  const selecionadas = transacoes.filter((t) => t.selected);
  const totalEntradas = selecionadas.filter((t) => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0);
  const totalSaidas = selecionadas.filter((t) => t.tipo === 'saida').reduce((s, t) => s + t.valor, 0);

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
          if (t.tipo === 'saida') {
            await custosService.criarCusto({
              descricao: t.descricao,
              valor: t.valor,
              categoria: (t.categoriaDespesa ?? 'outros') as CategoriaCusto,
              tipo: t.tipoGasto,
              origem: 'manual',
              data,
              notas: result.banco ? `Extrato — ${result.banco}` : 'Extrato bancário',
            });
          } else {
            await criarReceita({
              descricao: t.descricao,
              valor: t.valor,
              categoria: (t.categoriaReceita ?? 'outros') as CategoriaReceita,
              data,
              recorrente: false,
              notas: result.banco ? `Extrato — ${result.banco}` : 'Extrato bancário',
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
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed py-14 cursor-pointer transition-all"
              style={{
                borderColor: isDragging ? 'var(--theme-accent)' : 'var(--theme-border)',
                background: isDragging ? 'var(--theme-hover)' : 'var(--theme-background-secondary)',
              }}
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: 'var(--theme-accent)20' }}
              >
                <Upload className="h-7 w-7" style={{ color: 'var(--theme-accent)' }} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-[var(--theme-foreground)]">
                  Arraste o extrato aqui
                </p>
                <p className="text-sm text-[var(--theme-muted-foreground)] mt-1">
                  ou clique para selecionar o arquivo
                </p>
              </div>
              <div className="flex gap-1.5">
                <Badge variant="outline" className="text-xs">PDF</Badge>
                <Badge variant="outline" className="text-xs">TXT</Badge>
                <Badge variant="outline" className="text-xs">CSV</Badge>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.csv"
              className="hidden"
              onChange={onFileChange}
            />
            <p className="text-xs text-center text-[var(--theme-muted-foreground)]">
              O Gemini identifica entradas e saídas automaticamente. Você pode ajustar antes de salvar.
            </p>
          </div>
        )}

        {/* ── Step 2: Loading ── */}
        {step === 'loading' && (
          <AIProcessingIndicator
            title="Analisando o extrato"
            subtitle="Separando entradas e saídas automaticamente"
            steps={[
              'Lendo o documento…',
              'Identificando transações…',
              'Separando entradas e saídas…',
              'Classificando por categoria…',
              'Organizando os resultados…',
            ]}
          />
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

            {/* Filtro tipo */}
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'todas', label: `Todas (${transacoes.length})`, color: '#6B7280' },
                { key: 'entrada', label: `Entradas (${transacoes.filter(t => t.tipo === 'entrada').length})`, color: '#16A34A' },
                { key: 'saida', label: `Saídas (${transacoes.filter(t => t.tipo === 'saida').length})`, color: '#EF4444' },
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
                    checked={filtradas.every((t) => t.selected)}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  Selecionar todos ({filtradas.length})
                </label>
                <span className="text-xs text-[var(--theme-muted-foreground)]">
                  <span className="text-green-600 font-semibold">+{fmt(totalEntradas)}</span>
                  {' · '}
                  <span className="text-red-500 font-semibold">-{fmt(totalSaidas)}</span>
                </span>
              </div>

              {filtradas.map((t, i) => {
                const globalIdx = transacoes.indexOf(t);
                const isEditing = editingIdx === globalIdx;
                const isEntrada = t.tipo === 'entrada';
                const cor = isEntrada
                  ? (CATEGORIAS_RECEITA_CORES[(t.categoriaReceita ?? 'outros') as CategoriaReceita] || '#16A34A')
                  : (CATEGORIAS_DESPESA_CORES[(t.categoriaDespesa ?? 'outros') as CategoriaCusto] || '#EF4444');
                const catLabel = isEntrada
                  ? (CATEGORIAS_RECEITA_LABELS[(t.categoriaReceita ?? 'outros') as CategoriaReceita])
                  : (CATEGORIAS_DESPESA_LABELS[(t.categoriaDespesa ?? 'outros') as CategoriaCusto]);

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
                            // Reset categories when flipping entry/exit type to avoid stale values
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
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={(t.categoriaDespesa ?? 'outros') as string}
                            onValueChange={(v) => updateField({ categoriaDespesa: v as CategoriaCusto })}
                          >
                            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(CATEGORIAS_DESPESA_LABELS).map(([k, label]) => (
                                <SelectItem key={k} value={k}>{label}</SelectItem>
                              ))}
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
                      ) : (
                        <Select
                          value={(t.categoriaReceita ?? 'outros') as string}
                          onValueChange={(v) => updateField({ categoriaReceita: v as CategoriaReceita })}
                        >
                          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(CATEGORIAS_RECEITA_LABELS).map(([k, label]) => (
                              <SelectItem key={k} value={k}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
