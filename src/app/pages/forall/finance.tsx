import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Loader,
  Plane,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuth } from '../../../lib/auth-context';
import { createOwnedRecord, listWorkspaceEntity } from '../../../services/forall-data-service';
import { COLLECTIONS } from '../../../lib/firebase-config';
import { CATEGORIAS_ORCAMENTO_LABELS, listarViagens } from '../../../services/viagens-service';
import { toast } from 'sonner';

const COLORS = ['#16A34A', '#EF4444', '#F59E0B', '#8B5CF6', '#3B82F6', '#EC4899'];

function monthLabel(value: any) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem mês';
  return date.toLocaleDateString('pt-BR', { month: 'short' });
}

function toCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type ExpenseType = 'fixo' | 'variavel' | 'assinatura';

export function ForAllFinancePage() {
  const navigate = useNavigate();
  const { workspace = 'life' } = useParams();
  const { user, userProfile } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'visao' | 'despesas' | 'receitas'>('visao');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [revenues, setRevenues] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);

  const [expenseDialog, setExpenseDialog] = useState(false);
  const [revenueDialog, setRevenueDialog] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    descricao: '',
    valor: '',
    categoria: 'outros',
    tipoGasto: 'variavel' as ExpenseType,
    natureza: 'despesa',
    data: new Date().toISOString().split('T')[0],
  });

  const [revenueForm, setRevenueForm] = useState({
    descricao: '',
    valor: '',
    categoria: 'salario',
    data: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    void loadData();
  }, [user?.uid, workspace]);

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      setIsLoading(true);
      const [financeData, tripData] = await Promise.all([
        listWorkspaceEntity(user.uid, 'finance', workspace === 'work' ? 'work' : 'life'),
        listarViagens(),
      ]);

      const expenseItems = financeData.filter((item) => item.collectionName === COLLECTIONS.CUSTOS);
      const revenueItems = financeData.filter((item) => item.collectionName === COLLECTIONS.RECEITAS);

      setExpenses(expenseItems);
      setRevenues(revenueItems);
      setTrips(tripData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!user?.uid || !expenseForm.descricao || !expenseForm.valor) {
      toast.error('Preencha descrição e valor');
      return;
    }
    const valor = Number(String(expenseForm.valor).replace(',', '.'));
    if (Number.isNaN(valor)) {
      toast.error('Informe um valor válido');
      return;
    }

    try {
      const id = await createOwnedRecord(COLLECTIONS.CUSTOS, {
        ownerId: user.uid,
        ownerName: userProfile?.nome || user.displayName || '',
        ownerGoals:
          workspace === 'work'
            ? userProfile?.preferencias?.workGoals || []
            : userProfile?.preferencias?.lifeGoals || [],
        workspaceType: workspace === 'work' ? 'work' : 'life',
        descricao: expenseForm.descricao,
        valor,
        categoria: expenseForm.categoria,
        tipoGasto: expenseForm.tipoGasto,
        tipo: workspace === 'work' ? 'trabalho' : 'pessoal',
        natureza: 'despesa',
        data: expenseForm.data,
        source: 'manual_form',
      });

      setExpenses((prev) => [
        { id, collectionName: COLLECTIONS.CUSTOS, ...expenseForm, valor },
        ...prev,
      ]);
      setExpenseDialog(false);
      setExpenseForm({
        descricao: '',
        valor: '',
        categoria: 'outros',
        tipoGasto: 'variavel',
        natureza: 'despesa',
        data: new Date().toISOString().split('T')[0],
      });
      toast.success('Despesa registrada');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar despesa');
    }
  };

  const handleSaveRevenue = async () => {
    if (!user?.uid || !revenueForm.descricao || !revenueForm.valor) {
      toast.error('Preencha descrição e valor');
      return;
    }
    const valor = Number(String(revenueForm.valor).replace(',', '.'));
    if (Number.isNaN(valor)) {
      toast.error('Informe um valor válido');
      return;
    }

    try {
      const id = await createOwnedRecord(COLLECTIONS.RECEITAS, {
        ownerId: user.uid,
        ownerName: userProfile?.nome || user.displayName || '',
        ownerGoals:
          workspace === 'work'
            ? userProfile?.preferencias?.workGoals || []
            : userProfile?.preferencias?.lifeGoals || [],
        workspaceType: workspace === 'work' ? 'work' : 'life',
        descricao: revenueForm.descricao,
        valor,
        categoria: revenueForm.categoria,
        natureza: 'receita',
        data: revenueForm.data,
        source: 'manual_form',
      });

      setRevenues((prev) => [
        { id, collectionName: COLLECTIONS.RECEITAS, ...revenueForm, valor },
        ...prev,
      ]);
      setRevenueDialog(false);
      setRevenueForm({
        descricao: '',
        valor: '',
        categoria: 'salario',
        data: new Date().toISOString().split('T')[0],
      });
      toast.success('Receita registrada');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar receita');
    }
  };

  // Converte orcamentoDetalhado de cada viagem em itens de despesa
  const travelExpenses = useMemo(() => {
    return trips.flatMap((trip) => {
      const itens: any[] = trip.orcamentoDetalhado || [];
      if (itens.length === 0 && Number(trip.orcamento || 0) > 0) {
        return [{
          id: `trip-${trip.id}`,
          descricao: `Viagem: ${trip.destino}`,
          valor: Number(trip.orcamento || 0),
          categoria: 'viagem',
          tipoGasto: 'variavel',
          data: trip.dataIda,
          _isTravel: true,
          _destino: trip.destino,
        }];
      }
      return itens
        .filter((item: any) => Number(item.valor || 0) > 0)
        .map((item: any, i: number) => ({
          id: `trip-${trip.id}-${item.categoria}-${i}`,
          descricao: `${trip.destino} — ${CATEGORIAS_ORCAMENTO_LABELS[item.categoria as keyof typeof CATEGORIAS_ORCAMENTO_LABELS] || item.categoria}`,
          valor: Number(item.valor || 0),
          categoria: 'viagem',
          tipoGasto: 'variavel',
          data: trip.dataIda,
          _isTravel: true,
          _destino: trip.destino,
        }));
    });
  }, [trips]);

  const allExpenses = useMemo(() => [...expenses, ...travelExpenses], [expenses, travelExpenses]);

  const travelTotal = travelExpenses.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const revenueTotal = revenues.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const expenseTotal = allExpenses.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const balance = revenueTotal - expenseTotal;
  const fixedTotal = expenses.filter((item) => item.tipoGasto === 'fixo').reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const subscriptionTotal = expenses.filter((item) => item.tipoGasto === 'assinatura').reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const variableTotal = expenses.filter((item) => item.tipoGasto === 'variavel').reduce((sum, item) => sum + Number(item.valor || 0), 0);

  const chartData = useMemo(() => {
    const monthMap: Record<string, { mes: string; receitas: number; despesas: number }> = {};
    [...revenues, ...allExpenses].forEach((item) => {
      const month = monthLabel(item.data);
      if (!monthMap[month]) {
        monthMap[month] = { mes: month, receitas: 0, despesas: 0 };
      }
      if (item.collectionName === COLLECTIONS.RECEITAS) {
        monthMap[month].receitas += Number(item.valor || 0);
      } else {
        monthMap[month].despesas += Number(item.valor || 0);
      }
    });
    return Object.values(monthMap);
  }, [revenues, allExpenses]);

  const expensePie = useMemo(() => {
    const group: Record<string, number> = {};
    allExpenses.forEach((item) => {
      const key = item.categoria || item.tipoGasto || 'outros';
      group[key] = (group[key] || 0) + Number(item.valor || 0);
    });
    return Object.entries(group).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length],
    }));
  }, [allExpenses]);

  const workspaceLabel = workspace === 'work' ? 'Trabalho' : 'Vida pessoal';

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-[var(--theme-accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Gestão Financeira</h1>
          <p className="mt-1 text-[var(--theme-muted-foreground)]">
            Receitas, despesas e indicadores do workspace <strong>{workspaceLabel}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate(`/chat?action=gasto&workspace=${workspace}`)}>
            <Sparkles className="h-4 w-4" />
            Chat guiado
          </Button>
          <Button className="gap-2 bg-green-600 text-white hover:bg-green-700" onClick={() => setRevenueDialog(true)}>
            <ArrowUpCircle className="h-4 w-4" />
            Receita
          </Button>
          <Button className="gap-2 bg-red-500 text-white hover:bg-red-600" onClick={() => setExpenseDialog(true)}>
            <ArrowDownCircle className="h-4 w-4" />
            Despesa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-[var(--theme-muted-foreground)]">Receitas</p><p className="mt-2 text-3xl font-bold text-green-600">{toCurrency(revenueTotal)}</p></div><div className="rounded-2xl bg-green-100 p-3 text-green-600"><TrendingUp className="h-6 w-6" /></div></div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-[var(--theme-muted-foreground)]">Despesas</p><p className="mt-2 text-3xl font-bold text-red-500">{toCurrency(expenseTotal)}</p><p className="mt-1 text-xs text-[var(--theme-muted-foreground)]">incl. viagens</p></div><div className="rounded-2xl bg-red-100 p-3 text-red-500"><TrendingDown className="h-6 w-6" /></div></div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-[var(--theme-muted-foreground)]">Saldo</p><p className={`mt-2 text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>{toCurrency(balance)}</p></div><div className="rounded-2xl bg-slate-100 p-3 text-slate-600"><Wallet className="h-6 w-6" /></div></div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-[var(--theme-muted-foreground)]">Viagens</p><p className="mt-2 text-3xl font-bold text-violet-600">{toCurrency(travelTotal)}</p><p className="mt-1 text-xs text-[var(--theme-muted-foreground)]">nas despesas</p></div><div className="rounded-2xl bg-violet-100 p-3 text-violet-600"><Plane className="h-6 w-6" /></div></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-amber-600">Fixos / mês</p><p className="mt-2 text-3xl font-bold">{toCurrency(fixedTotal)}</p><p className="text-sm text-[var(--theme-muted-foreground)]">Contas recorrentes e mensais</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-violet-600">Assinaturas / mês</p><p className="mt-2 text-3xl font-bold">{toCurrency(subscriptionTotal)}</p><p className="text-sm text-[var(--theme-muted-foreground)]">Serviços com cobrança recorrente</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-red-500">Variáveis</p><p className="mt-2 text-3xl font-bold">{toCurrency(variableTotal)}</p><p className="text-sm text-[var(--theme-muted-foreground)]">Gastos pontuais e do mês atual</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-3 rounded-2xl bg-[var(--theme-background-secondary)] p-1">
        {[
          { key: 'visao', label: 'Visão Geral' },
          { key: 'despesas', label: 'Despesas' },
          { key: 'receitas', label: 'Receitas' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key as any)}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              tab === item.key ? 'bg-white shadow-sm text-[var(--theme-accent)]' : 'text-[var(--theme-muted-foreground)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'visao' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-[var(--theme-accent)]" />Receitas vs despesas</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => toCurrency(Number(value || 0))} />
                    <Bar dataKey="receitas" name="Receitas" fill="#16A34A" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="despesas" name="Despesas" fill="#EF4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Despesas por categoria</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expensePie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95}>
                      {expensePie.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value: any) => toCurrency(Number(value || 0))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {expensePie.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: entry.color }} />
                      <span>{entry.name}</span>
                    </div>
                    <span className="font-medium">{toCurrency(entry.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {(tab === 'despesas' ? allExpenses : revenues).map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  {item._isTravel && (
                    <div className="rounded-xl bg-violet-100 p-2 text-violet-600 flex-shrink-0">
                      <Plane className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <p className="text-base font-semibold text-[var(--theme-foreground)]">{item.descricao}</p>
                    <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">
                      {item.categoria} • {typeof item.data === 'string' ? item.data : item.data instanceof Date ? item.data.toLocaleDateString('pt-BR') : ''}
                      {item.tipoGasto && !item._isTravel ? ` • ${item.tipoGasto}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {tab === 'despesas' && item._isTravel
                    ? <Badge variant="outline" className="border-violet-300 text-violet-600">Viagem</Badge>
                    : tab === 'despesas' && item.tipoGasto
                    ? <Badge variant="outline">{item.tipoGasto}</Badge>
                    : null}
                  <Badge variant="outline">{tab === 'despesas' ? 'Despesa' : 'Receita'}</Badge>
                  <span className={`text-lg font-bold ${tab === 'despesas' ? 'text-red-500' : 'text-green-600'}`}>
                    {toCurrency(Number(item.valor || 0))}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Nova despesa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Descrição</Label><Input value={expenseForm.descricao} onChange={(e) => setExpenseForm((prev) => ({ ...prev, descricao: e.target.value }))} /></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Valor</Label><Input value={expenseForm.valor} onChange={(e) => setExpenseForm((prev) => ({ ...prev, valor: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={expenseForm.data} onChange={(e) => setExpenseForm((prev) => ({ ...prev, data: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={expenseForm.categoria} onValueChange={(value) => setExpenseForm((prev) => ({ ...prev, categoria: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moradia">Moradia</SelectItem>
                    <SelectItem value="alimentacao">Alimentação</SelectItem>
                    <SelectItem value="transporte">Transporte</SelectItem>
                    <SelectItem value="saude">Saúde</SelectItem>
                    <SelectItem value="educacao">Educação</SelectItem>
                    <SelectItem value="assinaturas">Assinaturas</SelectItem>
                    <SelectItem value="viagem">Viagem</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo do gasto</Label>
                <Select value={expenseForm.tipoGasto} onValueChange={(value) => setExpenseForm((prev) => ({ ...prev, tipoGasto: value as ExpenseType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixo">Fixo</SelectItem>
                    <SelectItem value="variavel">Variável</SelectItem>
                    <SelectItem value="assinatura">Assinatura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialog(false)}>Cancelar</Button>
            <Button className="bg-red-500 text-white hover:bg-red-600" onClick={handleSaveExpense}>Salvar despesa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={revenueDialog} onOpenChange={setRevenueDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Nova receita</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Descrição</Label><Input value={revenueForm.descricao} onChange={(e) => setRevenueForm((prev) => ({ ...prev, descricao: e.target.value }))} /></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Valor</Label><Input value={revenueForm.valor} onChange={(e) => setRevenueForm((prev) => ({ ...prev, valor: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={revenueForm.data} onChange={(e) => setRevenueForm((prev) => ({ ...prev, data: e.target.value }))} /></div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={revenueForm.categoria} onValueChange={(value) => setRevenueForm((prev) => ({ ...prev, categoria: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="salario">Salário</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="investimentos">Investimentos</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevenueDialog(false)}>Cancelar</Button>
            <Button className="bg-green-600 text-white hover:bg-green-700" onClick={handleSaveRevenue}>Salvar receita</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
