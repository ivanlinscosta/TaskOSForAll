import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, Wallet, TrendingDown, TrendingUp, Trash2, Loader,
  ArrowUpCircle, ArrowDownCircle, BarChart3, Plane, X, Pencil,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { format, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import * as custosService from '../../../services/custos-service';
import * as receitasService from '../../../services/receitas-service';
import * as viagensService from '../../../services/viagens-service';
import { formatCurrency } from '../../../lib/utils';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const ANO_ATUAL = new Date().getFullYear();

// ── Tooltip customizado ────────────────────────────────────────────────────────
const TooltipBRL = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 shadow-lg text-sm" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
      <p className="font-semibold mb-2 text-[var(--theme-foreground)]">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill || p.stroke }}>
          {p.name}: {formatCurrency(p.value ?? 0)}
        </p>
      ))}
    </div>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function valorPorMes(
  items: { data: Date; valor: number }[],
  ano = ANO_ATUAL
): number[] {
  const arr = Array(12).fill(0);
  items.forEach(({ data, valor }) => {
    const d = new Date(data);
    if (getYear(d) === ano) arr[getMonth(d)] += valor;
  });
  return arr;
}

// Custos fixos e assinaturas se repetem a partir do mês de início; variáveis só no mês exato
function distribuirCustosPorMes(
  custos: custosService.Custo[],
  ano = ANO_ATUAL
): { fixos: number[]; assinaturas: number[]; variaveis: number[] } {
  const fixos = Array(12).fill(0);
  const assinaturas = Array(12).fill(0);
  const variaveis = Array(12).fill(0);

  custos.forEach(({ data, valor, tipo }) => {
    const d = new Date(data);
    const anoC = getYear(d);
    const mesC = getMonth(d);

    if (tipo === 'fixa' || tipo === 'assinatura') {
      if (anoC > ano) return;
      const startMes = anoC < ano ? 0 : mesC;
      const arr = tipo === 'fixa' ? fixos : assinaturas;
      for (let m = startMes; m < 12; m++) arr[m] += valor;
    } else {
      if (anoC === ano) variaveis[mesC] += valor;
    }
  });

  return { fixos, assinaturas, variaveis };
}

function viagemCustosPorMes(viagens: viagensService.Viagem[], ano = ANO_ATUAL): number[] {
  const arr = Array(12).fill(0);
  viagens.forEach((v) => {
    const itens = v.orcamentoDetalhado || [];
    if (itens.length === 0 && v.orcamento > 0) {
      // viagens sem detalhamento → soma no mês da ida
      const d = new Date(v.dataIda);
      if (getYear(d) === ano) arr[getMonth(d)] += v.orcamento;
      return;
    }
    itens.forEach((item) => {
      if (item.formaPagamento === 'a_prazo' && item.dataPrimeiraParcela && item.parcelas) {
        const valorParcela = item.valor / item.parcelas;
        for (let p = 0; p < item.parcelas; p++) {
          const d = new Date(item.dataPrimeiraParcela);
          d.setMonth(d.getMonth() + p);
          if (getYear(d) === ano) arr[getMonth(d)] += valorParcela;
        }
      } else {
        const d = new Date(v.dataIda);
        if (getYear(d) === ano) arr[getMonth(d)] += item.valor;
      }
    });
  });
  return arr;
}

export function Custos() {
  const navigate = useNavigate();

  const [custos,    setCustos]    = useState<custosService.Custo[]>([]);
  const [receitas,  setReceitas]  = useState<receitasService.Receita[]>([]);
  const [viagens,   setViagens]   = useState<viagensService.Viagem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI — criação
  const [aba,           setAba]           = useState<'visao'|'despesas'|'receitas'>('visao');
  const [dialogDespesa, setDialogDespesa] = useState(false);
  const [dialogReceita, setDialogReceita] = useState(false);
  const [formDespesa, setFormDespesa] = useState({
    descricao: '', valor: '', categoria: 'outros' as custosService.CategoriaCusto,
    tipo: 'variavel' as custosService.TipoCusto, data: new Date().toISOString().split('T')[0], notas: '',
  });
  const [formReceita, setFormReceita] = useState({
    descricao: '', valor: '', categoria: 'salario' as receitasService.CategoriaReceita,
    data: new Date().toISOString().split('T')[0], recorrente: false, notas: '',
  });

  // UI — edição
  const [editandoCusto,    setEditandoCusto]    = useState<custosService.Custo | null>(null);
  const [editandoReceita,  setEditandoReceita]  = useState<receitasService.Receita | null>(null);
  const [formEditDespesa,  setFormEditDespesa]  = useState({
    descricao: '', valor: '', categoria: 'outros' as custosService.CategoriaCusto,
    tipo: 'variavel' as custosService.TipoCusto, data: '', notas: '',
  });
  const [formEditReceita,  setFormEditReceita]  = useState({
    descricao: '', valor: '', categoria: 'salario' as receitasService.CategoriaReceita,
    data: '', recorrente: false, notas: '',
  });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [c, r, v] = await Promise.all([
          custosService.listarCustos(),
          receitasService.listarReceitas(),
          viagensService.listarViagens(),
        ]);
        setCustos(c); setReceitas(r); setViagens(v);
      } catch { toast.error('Erro ao carregar dados financeiros'); }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  // ── Cálculos ─────────────────────────────────────────────────────────────────
  const { fixos: fixosMes, assinaturas: assinaturasMes, variaveis: variaveisMes } = useMemo(
    () => distribuirCustosPorMes(custos),
    [custos]
  );
  const custosMes        = useMemo(() => fixosMes.map((v, i) => v + assinaturasMes[i] + variaveisMes[i]), [fixosMes, assinaturasMes, variaveisMes]);
  const receitasMes      = useMemo(() => valorPorMes(receitas.map(r => ({ data: r.data, valor: r.valor }))), [receitas]);
  const viagensMes       = useMemo(() => viagemCustosPorMes(viagens), [viagens]);
  const despesasTotalMes = useMemo(() => custosMes.map((v, i) => v + viagensMes[i]), [custosMes, viagensMes]);

  const totalReceitasAno  = receitasMes.reduce((s, v) => s + v, 0);
  const totalDespesasAno  = despesasTotalMes.reduce((s, v) => s + v, 0);
  const saldoAno          = totalReceitasAno - totalDespesasAno;

  // Totais anuais por tipo (para métricas)
  const mesAtual         = new Date().getMonth();
  const totalFixosMensal = fixosMes[mesAtual];
  const totalAssinaturasMensal = assinaturasMes[mesAtual];

  const dadosMensais = MESES.map((mes, i) => ({
    mes,
    Receitas: receitasMes[i],
    Despesas: despesasTotalMes[i],
    Saldo: receitasMes[i] - despesasTotalMes[i],
  }));

  // Pie: despesas por categoria (custos + viagens)
  const pieData = useMemo(() => {
    const mapa: Record<string, number> = {};
    custos.forEach(c => { mapa[c.categoria] = (mapa[c.categoria] || 0) + c.valor; });
    const totalViagens = viagens.reduce((s, v) => s + v.orcamento, 0);
    if (totalViagens > 0) mapa['viagem'] = (mapa['viagem'] || 0) + totalViagens;
    return Object.entries(mapa)
      .filter(([, v]) => v > 0)
      .map(([cat, valor]) => ({
        name: cat === 'viagem'
          ? 'Viagens'
          : custosService.CATEGORIAS_LABELS[cat as custosService.CategoriaCusto] || cat,
        value: valor,
        fill: cat === 'viagem'
          ? '#059669'
          : custosService.CATEGORIAS_CORES[cat as custosService.CategoriaCusto] || '#6B7280',
      }));
  }, [custos, viagens]);

  // Pie: receitas por categoria
  const pieReceitas = useMemo(() =>
    Object.entries(
      receitas.reduce((acc, r) => { acc[r.categoria] = (acc[r.categoria] || 0) + r.valor; return acc; }, {} as Record<string, number>)
    ).map(([cat, valor]) => ({
      name: receitasService.CATEGORIAS_RECEITA_LABELS[cat as receitasService.CategoriaReceita] || cat,
      value: valor,
      fill: receitasService.CATEGORIAS_RECEITA_CORES[cat as receitasService.CategoriaReceita] || '#6B7280',
    })),
  [receitas]);

  // ── Ações ─────────────────────────────────────────────────────────────────
  const handleSaveDespesa = async () => {
    if (!formDespesa.descricao || !formDespesa.valor) { toast.error('Preencha descrição e valor'); return; }
    try {
      const id = await custosService.criarCusto({
        descricao: formDespesa.descricao, valor: parseFloat(formDespesa.valor),
        categoria: formDespesa.categoria, tipo: formDespesa.tipo,
        data: new Date(formDespesa.data), notas: formDespesa.notas,
      });
      setCustos(p => [{ id, ...formDespesa, valor: parseFloat(formDespesa.valor), data: new Date(formDespesa.data) } as any, ...p]);
      setDialogDespesa(false);
      setFormDespesa({ descricao: '', valor: '', categoria: 'outros', tipo: 'variavel', data: new Date().toISOString().split('T')[0], notas: '' });
      toast.success('Gasto registrado!');
    } catch { toast.error('Erro ao salvar'); }
  };

  const handleSaveReceita = async () => {
    if (!formReceita.descricao || !formReceita.valor) { toast.error('Preencha descrição e valor'); return; }
    try {
      const id = await receitasService.criarReceita({
        descricao: formReceita.descricao, valor: parseFloat(formReceita.valor),
        categoria: formReceita.categoria, data: new Date(formReceita.data),
        recorrente: formReceita.recorrente, notas: formReceita.notas,
      });
      setReceitas(p => [{ id, ...formReceita, valor: parseFloat(formReceita.valor), data: new Date(formReceita.data) } as any, ...p]);
      setDialogReceita(false);
      setFormReceita({ descricao: '', valor: '', categoria: 'salario', data: new Date().toISOString().split('T')[0], recorrente: false, notas: '' });
      toast.success('Receita registrada!');
    } catch { toast.error('Erro ao salvar'); }
  };

  const handleDeleteCusto = async (id: string) => {
    if (!confirm('Excluir este gasto?')) return;
    await custosService.deletarCusto(id);
    setCustos(p => p.filter(c => c.id !== id));
    toast.success('Excluído!');
  };

  const handleDeleteReceita = async (id: string) => {
    if (!confirm('Excluir esta receita?')) return;
    await receitasService.deletarReceita(id);
    setReceitas(p => p.filter(r => r.id !== id));
    toast.success('Excluído!');
  };

  const abrirEditCusto = (custo: custosService.Custo) => {
    setEditandoCusto(custo);
    setFormEditDespesa({
      descricao: custo.descricao,
      valor: custo.valor.toString(),
      categoria: custo.categoria,
      tipo: custo.tipo,
      data: new Date(custo.data).toISOString().split('T')[0],
      notas: custo.notas || '',
    });
  };

  const handleUpdateCusto = async () => {
    if (!editandoCusto?.id) return;
    if (!formEditDespesa.descricao || !formEditDespesa.valor) {
      toast.error('Preencha descrição e valor');
      return;
    }
    try {
      const updated: Partial<custosService.Custo> = {
        descricao: formEditDespesa.descricao,
        valor: parseFloat(formEditDespesa.valor),
        categoria: formEditDespesa.categoria,
        tipo: formEditDespesa.tipo,
        data: new Date(formEditDespesa.data),
        notas: formEditDespesa.notas,
      };
      await custosService.atualizarCusto(editandoCusto.id, updated);
      setCustos(p =>
        p.map(c => c.id === editandoCusto.id ? { ...c, ...updated } as custosService.Custo : c)
      );
      setEditandoCusto(null);
      toast.success('Gasto atualizado!');
    } catch { toast.error('Erro ao atualizar'); }
  };

  const abrirEditReceita = (r: receitasService.Receita) => {
    setEditandoReceita(r);
    setFormEditReceita({
      descricao: r.descricao,
      valor: r.valor.toString(),
      categoria: r.categoria,
      data: new Date(r.data).toISOString().split('T')[0],
      recorrente: r.recorrente,
      notas: r.notas || '',
    });
  };

  const handleUpdateReceita = async () => {
    if (!editandoReceita?.id) return;
    if (!formEditReceita.descricao || !formEditReceita.valor) {
      toast.error('Preencha descrição e valor');
      return;
    }
    try {
      const updated: Partial<receitasService.Receita> = {
        descricao: formEditReceita.descricao,
        valor: parseFloat(formEditReceita.valor),
        categoria: formEditReceita.categoria,
        data: new Date(formEditReceita.data),
        recorrente: formEditReceita.recorrente,
        notas: formEditReceita.notas,
      };
      await receitasService.atualizarReceita(editandoReceita.id, updated);
      setReceitas(p =>
        p.map(r => r.id === editandoReceita.id ? { ...r, ...updated } as receitasService.Receita : r)
      );
      setEditandoReceita(null);
      toast.success('Receita atualizada!');
    } catch { toast.error('Erro ao atualizar'); }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader className="h-8 w-8 animate-spin text-[var(--theme-accent)]" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Finanças Pessoais</h1>
          <p className="text-[var(--theme-muted-foreground)] mt-1">{ANO_ATUAL} · Visão completa de receitas e despesas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setDialogReceita(true)} className="gap-2" style={{ background: '#059669', color: '#fff' }}>
            <ArrowUpCircle className="h-4 w-4" /> Receita
          </Button>
          <Button onClick={() => setDialogDespesa(true)} className="gap-2" style={{ background: '#EF4444', color: '#fff' }}>
            <ArrowDownCircle className="h-4 w-4" /> Despesa
          </Button>
        </div>
      </div>

      {/* ── Métricas do Ano ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Receitas no Ano', valor: totalReceitasAno, cor: '#059669', icon: TrendingUp },
          { label: 'Despesas no Ano', valor: totalDespesasAno, cor: '#EF4444', icon: TrendingDown },
          { label: 'Saldo do Ano', valor: saldoAno, cor: saldoAno >= 0 ? '#059669' : '#EF4444', icon: Wallet },
          { label: 'Gastos com Viagens', valor: viagensMes.reduce((s, v) => s + v, 0), cor: '#6366F1', icon: Plane },
        ].map(({ label, valor, cor, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${cor}15` }}>
                <Icon className="h-5 w-5" style={{ color: cor }} />
              </div>
              <div>
                <p className="text-xs text-[var(--theme-muted-foreground)]">{label}</p>
                <p className="text-lg font-bold" style={{ color: cor }}>
                  {valor < 0 ? '- ' : ''}{formatCurrency(Math.abs(valor))}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Sub-métricas de despesas recorrentes ─────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Fixos / mês', valor: totalFixosMensal, cor: '#F59E0B', desc: 'Água, luz, internet...' },
          { label: 'Assinaturas / mês', valor: totalAssinaturasMensal, cor: '#8B5CF6', desc: 'Netflix, Amazon...' },
          { label: 'Variáveis (mês atual)', valor: variaveisMes[mesAtual], cor: '#EF4444', desc: 'Gastos pontuais' },
        ].map(({ label, valor, cor, desc }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium" style={{ color: cor }}>{label}</p>
              <p className="text-xl font-bold mt-1 text-[var(--theme-foreground)]">
                {formatCurrency(valor)}
              </p>
              <p className="text-xs mt-0.5 text-[var(--theme-muted-foreground)]">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Abas ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--theme-background-secondary)' }}>
        {(['visao', 'despesas', 'receitas'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className="flex-1 rounded-lg py-2 text-sm font-medium transition-all"
            style={aba === a
              ? { background: 'var(--theme-card)', color: 'var(--theme-accent)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
              : { color: 'var(--theme-muted-foreground)' }}
          >
            {a === 'visao' ? 'Visão Geral' : a === 'despesas' ? 'Despesas' : 'Receitas'}
          </button>
        ))}
      </div>

      {/* ── Visão Geral ─────────────────────────────────────────────────────── */}
      {aba === 'visao' && (
        <div className="space-y-6">
          {/* Gráfico receitas vs despesas por mês */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                Receitas vs Despesas — {ANO_ATUAL}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dadosMensais} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--theme-muted-foreground)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--theme-muted-foreground)' }}
                    tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip content={<TooltipBRL />} />
                  <Legend />
                  <Bar dataKey="Receitas" fill="#059669" radius={[4,4,0,0]} />
                  <Bar dataKey="Despesas" fill="#EF4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Saldo mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Saldo Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dadosMensais} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--theme-muted-foreground)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--theme-muted-foreground)' }}
                    tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip content={<TooltipBRL />} />
                  <Line
                    type="monotone" dataKey="Saldo" stroke="var(--theme-accent)"
                    strokeWidth={2} dot={{ r: 4, fill: 'var(--theme-accent)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pies lado a lado */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Despesas por Categoria</CardTitle></CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                        {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center py-8 text-sm text-[var(--theme-muted-foreground)]">Nenhuma despesa registrada</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Receitas por Categoria</CardTitle></CardHeader>
              <CardContent>
                {pieReceitas.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieReceitas} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                        {pieReceitas.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center py-8 text-sm text-[var(--theme-muted-foreground)]">Nenhuma receita registrada</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Custo mensal das viagens */}
          {viagens.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-[#6366F1]" />
                  Custo Mensal com Viagens — {ANO_ATUAL}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={MESES.map((mes, i) => ({ mes, Viagens: viagensMes[i] }))} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--theme-muted-foreground)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--theme-muted-foreground)' }}
                      tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip content={<TooltipBRL />} />
                    <Bar dataKey="Viagens" fill="#6366F1" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Despesas ─────────────────────────────────────────────────────────── */}
      {aba === 'despesas' && (() => {
        const fixos       = custos.filter(c => c.tipo === 'fixa');
        const assinaturas = custos.filter(c => c.tipo === 'assinatura');
        const variaveis   = custos.filter(c => c.tipo === 'variavel');
        const viaagens    = viagens.filter(v => v.orcamento > 0);

        const CustoRow = ({ custo }: { custo: custosService.Custo }) => {
          const cor = custosService.CATEGORIAS_CORES[custo.categoria] || '#6B7280';
          return (
            <Card className="hover:shadow-md transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${cor}20` }}>
                    <TrendingDown className="h-5 w-5" style={{ color: cor }} />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--theme-foreground)]">{custo.descricao}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs py-0" style={{ borderColor: cor, color: cor }}>
                        {custosService.CATEGORIAS_LABELS[custo.categoria]}
                      </Badge>
                      <span className="text-xs text-[var(--theme-muted-foreground)]">
                        desde {format(new Date(custo.data), "MMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-red-500">
                    {formatCurrency(custo.valor)}
                  </span>
                  <button onClick={() => abrirEditCusto(custo)} className="text-[var(--theme-muted-foreground)] hover:text-[var(--theme-accent)]" title="Editar">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDeleteCusto(custo.id!)} className="text-[var(--theme-muted-foreground)] hover:text-red-500" title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        };

        if (custos.length === 0 && viaagens.length === 0) return (
          <div className="text-center py-12">
            <Wallet className="h-12 w-12 mx-auto text-[var(--theme-muted-foreground)] mb-3" />
            <p className="text-[var(--theme-muted-foreground)]">Nenhum gasto registrado</p>
            <Button className="mt-4 gap-2" style={{ background: 'var(--theme-accent)', color: '#fff' }} onClick={() => setDialogDespesa(true)}>
              <Plus className="h-4 w-4" /> Registrar Gasto
            </Button>
          </div>
        );

        return (
          <div className="space-y-6">

            {/* Custos Fixos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#F59E0B' }}>
                  <span className="inline-block h-2 w-2 rounded-full bg-[#F59E0B]" />
                  Custos Fixos
                  <span className="text-xs font-normal text-[var(--theme-muted-foreground)]">· repete todo mês</span>
                </h3>
                {fixos.length > 0 && (
                  <span className="text-sm font-medium text-[var(--theme-muted-foreground)]">
                    {formatCurrency(fixos.reduce((s, c) => s + c.valor, 0))}/mês
                  </span>
                )}
              </div>
              {fixos.length === 0 ? (
                <p className="text-sm text-[var(--theme-muted-foreground)] pl-4">Nenhum custo fixo cadastrado</p>
              ) : (
                <div className="space-y-2">{fixos.map(c => <CustoRow key={c.id} custo={c} />)}</div>
              )}
            </div>

            {/* Assinaturas */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#8B5CF6' }}>
                  <span className="inline-block h-2 w-2 rounded-full bg-[#8B5CF6]" />
                  Assinaturas
                  <span className="text-xs font-normal text-[var(--theme-muted-foreground)]">· repete todo mês</span>
                </h3>
                {assinaturas.length > 0 && (
                  <span className="text-sm font-medium text-[var(--theme-muted-foreground)]">
                    {formatCurrency(assinaturas.reduce((s, c) => s + c.valor, 0))}/mês
                  </span>
                )}
              </div>
              {assinaturas.length === 0 ? (
                <p className="text-sm text-[var(--theme-muted-foreground)] pl-4">Nenhuma assinatura cadastrada</p>
              ) : (
                <div className="space-y-2">{assinaturas.map(c => <CustoRow key={c.id} custo={c} />)}</div>
              )}
            </div>

            {/* Variáveis */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#EF4444' }}>
                  <span className="inline-block h-2 w-2 rounded-full bg-[#EF4444]" />
                  Variáveis
                  <span className="text-xs font-normal text-[var(--theme-muted-foreground)]">· por lançamento</span>
                </h3>
              </div>
              {/* Viagens importadas */}
              {viaagens.map(v => (
                <Card key={v.id} className="opacity-90 mb-2">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: '#6366F115' }}>
                        <Plane className="h-5 w-5 text-[#6366F1]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--theme-foreground)]">Viagem: {v.destino}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs py-0" style={{ borderColor: '#6366F1', color: '#6366F1' }}>Viagem</Badge>
                          <span className="text-xs text-[var(--theme-muted-foreground)]">
                            {format(new Date(v.dataIda), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-[#6366F1]">
                      {formatCurrency(v.orcamento)}
                    </span>
                  </CardContent>
                </Card>
              ))}
              {variaveis.length === 0 && viaagens.length === 0 ? (
                <p className="text-sm text-[var(--theme-muted-foreground)] pl-4">Nenhum gasto variável registrado</p>
              ) : (
                <div className="space-y-2">{variaveis.map(c => <CustoRow key={c.id} custo={c} />)}</div>
              )}
            </div>

          </div>
        );
      })()}

      {/* ── Receitas ─────────────────────────────────────────────────────────── */}
      {aba === 'receitas' && (
        <div className="space-y-3">
          {receitas.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 mx-auto text-[var(--theme-muted-foreground)] mb-3" />
              <p className="text-[var(--theme-muted-foreground)]">Nenhuma receita registrada</p>
              <Button className="mt-4 gap-2" style={{ background: '#059669', color: '#fff' }} onClick={() => setDialogReceita(true)}>
                <Plus className="h-4 w-4" /> Registrar Receita
              </Button>
            </div>
          )}
          {receitas.map(r => {
            const cor = receitasService.CATEGORIAS_RECEITA_CORES[r.categoria] || '#6B7280';
            return (
              <Card key={r.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${cor}20` }}>
                      <TrendingUp className="h-5 w-5" style={{ color: cor }} />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--theme-foreground)]">{r.descricao}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs py-0" style={{ borderColor: cor, color: cor }}>
                          {receitasService.CATEGORIAS_RECEITA_LABELS[r.categoria]}
                        </Badge>
                        {r.recorrente && <Badge variant="outline" className="text-xs py-0">Recorrente</Badge>}
                        <span className="text-xs text-[var(--theme-muted-foreground)]">
                          {format(new Date(r.data), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-green-600">
                      + {formatCurrency(r.valor)}
                    </span>
                    <button onClick={() => abrirEditReceita(r)} className="text-[var(--theme-muted-foreground)] hover:text-[var(--theme-accent)]" title="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteReceita(r.id!)} className="text-[var(--theme-muted-foreground)] hover:text-red-500" title="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Dialog: Nova Despesa ──────────────────────────────────────────────── */}
      <Dialog open={dialogDespesa} onOpenChange={setDialogDespesa}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Despesa</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Descrição *</Label>
              <Input placeholder="Ex: Conta de luz" value={formDespesa.descricao}
                onChange={e => setFormDespesa(f => ({ ...f, descricao: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" min="0" placeholder="0,00" value={formDespesa.valor}
                  onChange={e => setFormDespesa(f => ({ ...f, valor: e.target.value }))} className="mt-1" />
              </div>
              <div><Label>Data *</Label>
                <Input type="date" value={formDespesa.data}
                  onChange={e => setFormDespesa(f => ({ ...f, data: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Categoria</Label>
                <Select value={formDespesa.categoria} onValueChange={v => setFormDespesa(f => ({ ...f, categoria: v as any }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(custosService.CATEGORIAS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Tipo</Label>
                <Select value={formDespesa.tipo} onValueChange={v => setFormDespesa(f => ({ ...f, tipo: v as any }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixa">Fixo</SelectItem>
                    <SelectItem value="assinatura">Assinatura</SelectItem>
                    <SelectItem value="variavel">Variável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDespesa(false)}>Cancelar</Button>
            <Button onClick={handleSaveDespesa} style={{ background: '#EF4444', color: '#fff' }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Nova Receita ──────────────────────────────────────────────── */}
      <Dialog open={dialogReceita} onOpenChange={setDialogReceita}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Receita</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Descrição *</Label>
              <Input placeholder="Ex: Salário março" value={formReceita.descricao}
                onChange={e => setFormReceita(f => ({ ...f, descricao: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" min="0" placeholder="0,00" value={formReceita.valor}
                  onChange={e => setFormReceita(f => ({ ...f, valor: e.target.value }))} className="mt-1" />
              </div>
              <div><Label>Data *</Label>
                <Input type="date" value={formReceita.data}
                  onChange={e => setFormReceita(f => ({ ...f, data: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Categoria</Label>
                <Select value={formReceita.categoria} onValueChange={v => setFormReceita(f => ({ ...f, categoria: v as any }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(receitasService.CATEGORIAS_RECEITA_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formReceita.recorrente}
                    onChange={e => setFormReceita(f => ({ ...f, recorrente: e.target.checked }))}
                    className="h-4 w-4 rounded" />
                  <span className="text-sm text-[var(--theme-foreground)]">Recorrente</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogReceita(false)}>Cancelar</Button>
            <Button onClick={handleSaveReceita} style={{ background: '#059669', color: '#fff' }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Editar Despesa ────────────────────────────────────────────── */}
      <Dialog open={!!editandoCusto} onOpenChange={(o) => !o && setEditandoCusto(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Despesa</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Descrição *</Label>
              <Input placeholder="Ex: Conta de luz" value={formEditDespesa.descricao}
                onChange={e => setFormEditDespesa(f => ({ ...f, descricao: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" min="0" placeholder="0,00" value={formEditDespesa.valor}
                  onChange={e => setFormEditDespesa(f => ({ ...f, valor: e.target.value }))} className="mt-1" />
              </div>
              <div><Label>Data *</Label>
                <Input type="date" value={formEditDespesa.data}
                  onChange={e => setFormEditDespesa(f => ({ ...f, data: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Categoria</Label>
                <Select value={formEditDespesa.categoria} onValueChange={v => setFormEditDespesa(f => ({ ...f, categoria: v as any }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(custosService.CATEGORIAS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Tipo</Label>
                <Select value={formEditDespesa.tipo} onValueChange={v => setFormEditDespesa(f => ({ ...f, tipo: v as any }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixa">Fixo</SelectItem>
                    <SelectItem value="assinatura">Assinatura</SelectItem>
                    <SelectItem value="variavel">Variável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditandoCusto(null)}>Cancelar</Button>
            <Button onClick={handleUpdateCusto} style={{ background: '#EF4444', color: '#fff' }}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Editar Receita ────────────────────────────────────────────── */}
      <Dialog open={!!editandoReceita} onOpenChange={(o) => !o && setEditandoReceita(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Receita</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Descrição *</Label>
              <Input placeholder="Ex: Salário março" value={formEditReceita.descricao}
                onChange={e => setFormEditReceita(f => ({ ...f, descricao: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" min="0" placeholder="0,00" value={formEditReceita.valor}
                  onChange={e => setFormEditReceita(f => ({ ...f, valor: e.target.value }))} className="mt-1" />
              </div>
              <div><Label>Data *</Label>
                <Input type="date" value={formEditReceita.data}
                  onChange={e => setFormEditReceita(f => ({ ...f, data: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Categoria</Label>
                <Select value={formEditReceita.categoria} onValueChange={v => setFormEditReceita(f => ({ ...f, categoria: v as any }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(receitasService.CATEGORIAS_RECEITA_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formEditReceita.recorrente}
                    onChange={e => setFormEditReceita(f => ({ ...f, recorrente: e.target.checked }))}
                    className="h-4 w-4 rounded" />
                  <span className="text-sm text-[var(--theme-foreground)]">Recorrente</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditandoReceita(null)}>Cancelar</Button>
            <Button onClick={handleUpdateReceita} style={{ background: '#059669', color: '#fff' }}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
