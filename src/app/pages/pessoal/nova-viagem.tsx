import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plane, ArrowLeft, Plus, X, Wallet, Calendar, Clock,
  CreditCard, Banknote, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import * as viagensService from '../../../services/viagens-service';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ORCAMENTO_CATEGORIAS = Object.entries(viagensService.CATEGORIAS_ORCAMENTO_LABELS) as [
  viagensService.CategoriaOrcamento,
  string
][];

function calcUltimaParcela(dataPrimeira: string, parcelas: number): string {
  if (!dataPrimeira || parcelas <= 1) return '';
  const d = addMonths(new Date(dataPrimeira), parcelas - 1);
  return format(d, "MMMM 'de' yyyy", { locale: ptBR });
}

interface AtividadeForm {
  id: string;
  nome: string;
  data: string;
  horario: string;
}

interface ItemOrcamentoForm {
  id: string;
  categoria: viagensService.CategoriaOrcamento;
  valor: string;
  formaPagamento: 'a_vista' | 'a_prazo';
  parcelas: string;
  dataPrimeiraParcela: string;
  aberto: boolean;
}

export function NovaViagem() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    destino: '',
    descricao: '',
    dataIda: '',
    dataVolta: '',
    status: 'planejada' as viagensService.Viagem['status'],
    notas: '',
  });

  const [atividades, setAtividades] = useState<AtividadeForm[]>([]);
  const [novaAtividade, setNovaAtividade] = useState({ nome: '', data: '', horario: '' });

  const [itensOrcamento, setItensOrcamento] = useState<ItemOrcamentoForm[]>(
    ORCAMENTO_CATEGORIAS.map(([cat]) => ({
      id: cat,
      categoria: cat,
      valor: '',
      formaPagamento: 'a_vista',
      parcelas: '1',
      dataPrimeiraParcela: '',
      aberto: false,
    }))
  );

  const setField = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const addAtividade = () => {
    if (!novaAtividade.nome.trim()) return;
    setAtividades((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ...novaAtividade },
    ]);
    setNovaAtividade({ nome: '', data: '', horario: '' });
  };

  const removeAtividade = (id: string) =>
    setAtividades((prev) => prev.filter((a) => a.id !== id));

  const updateItem = (cat: string, field: string, value: any) =>
    setItensOrcamento((prev) =>
      prev.map((i) => (i.id === cat ? { ...i, [field]: value } : i))
    );

  const toggleItem = (cat: string) =>
    setItensOrcamento((prev) =>
      prev.map((i) => (i.id === cat ? { ...i, aberto: !i.aberto } : i))
    );

  const totalOrcamento = itensOrcamento.reduce(
    (s, i) => s + (parseFloat(i.valor) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.destino || !form.dataIda) {
      toast.error('Preencha o destino e a data de ida');
      return;
    }

    setIsLoading(true);
    try {
      // Firestore não aceita `undefined` em arrays/objetos aninhados — omitir campos ausentes
      const orcamentoDetalhado: viagensService.ItemOrcamento[] = itensOrcamento
        .filter((i) => parseFloat(i.valor) > 0)
        .map((i) => {
          const item: viagensService.ItemOrcamento = {
            categoria: i.categoria,
            valor: parseFloat(i.valor),
            formaPagamento: i.formaPagamento,
          };
          if (i.formaPagamento === 'a_prazo') {
            item.parcelas = parseInt(i.parcelas) || 1;
            if (i.dataPrimeiraParcela) item.dataPrimeiraParcela = i.dataPrimeiraParcela;
          }
          return item;
        });

      const atividadesFinal: viagensService.Atividade[] = atividades.map((a) => {
        const ativ: viagensService.Atividade = { id: a.id, nome: a.nome };
        if (a.data) ativ.data = a.data;
        if (a.horario) ativ.horario = a.horario;
        return ativ;
      });

      await viagensService.criarViagem({
        destino: form.destino,
        descricao: form.descricao,
        dataIda: new Date(form.dataIda),
        dataVolta: form.dataVolta ? new Date(form.dataVolta) : undefined,
        orcamento: totalOrcamento,
        gastoReal: 0,
        status: form.status,
        atividades: atividadesFinal,
        orcamentoDetalhado,
        notas: form.notas,
      });
      toast.success('Viagem cadastrada com sucesso!');
      navigate('/pessoal/viagens');
    } catch {
      toast.error('Erro ao cadastrar viagem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pessoal/viagens')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Nova Viagem</h1>
          <p className="text-[var(--theme-muted-foreground)] mt-1">Planeje cada detalhe da sua aventura</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">

            {/* ── Informações Gerais ─────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                  Informações da Viagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Destino *</Label>
                  <Input
                    placeholder="Ex: Lisboa, Portugal"
                    value={form.destino}
                    onChange={(e) => setField('destino', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Objetivo ou motivação da viagem..."
                    value={form.descricao}
                    onChange={(e) => setField('descricao', e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data de Ida *</Label>
                    <Input type="date" value={form.dataIda} onChange={(e) => setField('dataIda', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Data de Volta</Label>
                    <Input type="date" value={form.dataVolta} onChange={(e) => setField('dataVolta', e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setField('status', v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planejada">Planejada</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Notas</Label>
                  <Textarea
                    placeholder="Dicas, lembretes, documentos necessários..."
                    value={form.notas}
                    onChange={(e) => setField('notas', e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── Orçamento Detalhado ────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                    Orçamento por Categoria
                  </span>
                  {totalOrcamento > 0 && (
                    <span className="text-base font-bold" style={{ color: 'var(--theme-accent)' }}>
                      Total: R$ {totalOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {itensOrcamento.map((item) => {
                  const cor = viagensService.CATEGORIAS_ORCAMENTO_CORES[item.categoria];
                  const valorNum = parseFloat(item.valor) || 0;
                  const ultimaParcela = item.formaPagamento === 'a_prazo' && item.dataPrimeiraParcela && parseInt(item.parcelas) > 1
                    ? calcUltimaParcela(item.dataPrimeiraParcela, parseInt(item.parcelas))
                    : null;
                  const valorParcela = item.formaPagamento === 'a_prazo' && parseInt(item.parcelas) > 0
                    ? valorNum / parseInt(item.parcelas)
                    : null;

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl overflow-hidden"
                      style={{ border: `1px solid ${cor}40` }}
                    >
                      {/* Header da categoria */}
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className="w-full flex items-center justify-between px-4 py-3"
                        style={{ background: `${cor}10` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full" style={{ background: cor }} />
                          <span className="font-medium text-sm text-[var(--theme-foreground)]">
                            {viagensService.CATEGORIAS_ORCAMENTO_LABELS[item.categoria]}
                          </span>
                          {valorNum > 0 && (
                            <Badge
                              className="text-xs"
                              style={{ background: `${cor}20`, color: cor }}
                            >
                              R$ {valorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              {item.formaPagamento === 'a_prazo' && ` • ${item.parcelas}x`}
                            </Badge>
                          )}
                        </div>
                        {item.aberto
                          ? <ChevronUp className="h-4 w-4 text-[var(--theme-muted-foreground)]" />
                          : <ChevronDown className="h-4 w-4 text-[var(--theme-muted-foreground)]" />
                        }
                      </button>

                      {/* Corpo expandido */}
                      {item.aberto && (
                        <div className="px-4 pb-4 pt-3 space-y-4" style={{ background: 'var(--theme-card)' }}>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Valor (R$)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0,00"
                                value={item.valor}
                                onChange={(e) => updateItem(item.id, 'valor', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Forma de Pagamento</Label>
                              <Select
                                value={item.formaPagamento}
                                onValueChange={(v) => updateItem(item.id, 'formaPagamento', v)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="a_vista">
                                    <span className="flex items-center gap-2">
                                      <Banknote className="h-4 w-4" /> À Vista
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="a_prazo">
                                    <span className="flex items-center gap-2">
                                      <CreditCard className="h-4 w-4" /> A Prazo
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {item.formaPagamento === 'a_prazo' && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Nº de Parcelas</Label>
                                  <Input
                                    type="number"
                                    min="2"
                                    max="60"
                                    placeholder="Ex: 12"
                                    value={item.parcelas}
                                    onChange={(e) => updateItem(item.id, 'parcelas', e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label>Data da 1ª Parcela</Label>
                                  <Input
                                    type="date"
                                    value={item.dataPrimeiraParcela}
                                    onChange={(e) => updateItem(item.id, 'dataPrimeiraParcela', e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                              </div>

                              {/* Resumo parcelamento */}
                              {valorNum > 0 && parseInt(item.parcelas) > 0 && (
                                <div
                                  className="rounded-lg p-3 space-y-1"
                                  style={{ background: `${cor}10`, border: `1px solid ${cor}30` }}
                                >
                                  <div className="flex justify-between text-sm">
                                    <span className="text-[var(--theme-muted-foreground)]">Valor por parcela</span>
                                    <span className="font-bold" style={{ color: cor }}>
                                      R$ {(valorParcela ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  {item.dataPrimeiraParcela && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-[var(--theme-muted-foreground)]">1ª parcela</span>
                                      <span className="font-medium text-[var(--theme-foreground)]">
                                        {format(new Date(item.dataPrimeiraParcela), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                      </span>
                                    </div>
                                  )}
                                  {ultimaParcela && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-[var(--theme-muted-foreground)]">Última parcela</span>
                                      <span className="font-semibold" style={{ color: cor }}>
                                        {ultimaParcela}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* ── Atividades ─────────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                  Atividades Planejadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Form nova atividade */}
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{ background: 'var(--theme-background-secondary)' }}
                >
                  <div>
                    <Label>Nome da Atividade</Label>
                    <Input
                      placeholder="Ex: Visitar Torre de Belém"
                      value={novaAtividade.nome}
                      onChange={(e) => setNovaAtividade((a) => ({ ...a, nome: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAtividade())}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Data
                      </Label>
                      <Input
                        type="date"
                        value={novaAtividade.data}
                        onChange={(e) => setNovaAtividade((a) => ({ ...a, data: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Horário
                      </Label>
                      <Input
                        type="time"
                        value={novaAtividade.horario}
                        onChange={(e) => setNovaAtividade((a) => ({ ...a, horario: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={addAtividade}
                    size="sm"
                    className="gap-2"
                    style={{ background: 'var(--theme-accent)', color: '#fff' }}
                  >
                    <Plus className="h-4 w-4" /> Adicionar Atividade
                  </Button>
                </div>

                {/* Lista de atividades */}
                {atividades.length > 0 && (
                  <div className="space-y-2">
                    {atividades.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-lg px-4 py-3"
                        style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-card)' }}
                      >
                        <div>
                          <p className="text-sm font-medium text-[var(--theme-foreground)]">{a.nome}</p>
                          {(a.data || a.horario) && (
                            <p className="text-xs text-[var(--theme-muted-foreground)] mt-0.5 flex items-center gap-2">
                              {a.data && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(a.data), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                                </span>
                              )}
                              {a.horario && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {a.horario}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAtividade(a.id)}
                          className="text-[var(--theme-muted-foreground)] hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Painel Lateral ─────────────────────────────────────── */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  style={{ background: 'var(--theme-accent)', color: '#fff' }}
                >
                  {isLoading ? 'Salvando...' : 'Salvar Viagem'}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/pessoal/viagens')}>
                  Cancelar
                </Button>
              </CardContent>
            </Card>

            {/* Resumo do orçamento */}
            {totalOrcamento > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Resumo do Orçamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {itensOrcamento
                    .filter((i) => parseFloat(i.valor) > 0)
                    .map((i) => {
                      const cor = viagensService.CATEGORIAS_ORCAMENTO_CORES[i.categoria];
                      const pct = (parseFloat(i.valor) / totalOrcamento) * 100;
                      return (
                        <div key={i.id}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[var(--theme-muted-foreground)]">
                              {viagensService.CATEGORIAS_ORCAMENTO_LABELS[i.categoria]}
                            </span>
                            <span style={{ color: cor }} className="font-medium">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--theme-muted)]">
                            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: cor }} />
                          </div>
                        </div>
                      );
                    })}
                  <div
                    className="flex justify-between pt-2 text-sm font-bold border-t"
                    style={{ borderColor: 'var(--theme-border)' }}
                  >
                    <span>Total</span>
                    <span style={{ color: 'var(--theme-accent)' }}>
                      R$ {totalOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="text-sm">Dica</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-[var(--theme-muted-foreground)]">
                  Expanda cada categoria do orçamento para configurar se o pagamento é à vista ou parcelado.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
