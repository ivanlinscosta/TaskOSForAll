import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  CreditCard,
  Filter,
  Landmark,
  Loader,
  Pencil,
  Plane,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
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
import { listarCustos, deletarCusto } from '../../../services/custos-service';
import { toast } from 'sonner';
import { CartaoTab } from './CartaoTab';
import { InvestmentTab } from '../../components/finance/investments/InvestmentTab';
import { ImportarFaturaDialog } from '../../components/ImportarFaturaDialog';
import { ImportarExtratoDialog } from '../../components/ImportarExtratoDialog';
import { listarReceitas, deletarReceita } from '../../../services/receitas-service';
import { formatCurrency } from '../../../lib/utils';

const COLORS = ['#16A34A', '#EF4444', '#F59E0B', '#8B5CF6', '#3B82F6', '#EC4899'];

function monthLabel(value: any) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem mês';
  return date.toLocaleDateString('pt-BR', { month: 'short' });
}

/** Retorna 'YYYY-MM' para o filtro de mês. */
function monthKey(value: any): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** 'YYYY-MM' → rótulo legível em pt-BR (ex: 'mar/25'). */
function monthLabelFromKey(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

const toCurrency = formatCurrency;

type ExpenseType = 'fixo' | 'variavel' | 'assinatura';

export function ForAllFinancePage() {
  const navigate = useNavigate();
  const { workspace = 'life' } = useParams();
  const { user, userProfile, updateUserProfileData } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'visao' | 'despesas' | 'receitas' | 'cartao' | 'investimentos'>('visao');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [revenues, setRevenues] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [custos, setCustos] = useState<any[]>([]);
  const [importarFaturaOpen, setImportarFaturaOpen] = useState(false);
  const [importarExtratoOpen, setImportarExtratoOpen] = useState(false);

  const [expenseDialog, setExpenseDialog] = useState(false);
  const [revenueDialog, setRevenueDialog] = useState(false);

  // Mês selecionado no filtro ('all' = todos, caso contrário 'YYYY-MM')
  const [monthFilter, setMonthFilter] = useState<string>('all');

  // Busca nas abas despesas/receitas
  const [searchQuery, setSearchQuery] = useState('');

  // Edição do perfil financeiro
  const [perfilDialog, setPerfilDialog] = useState(false);
  const [perfilForm, setPerfilForm] = useState({
    rendaMensal: '',
    reservaEmergencia: '',
    totalInvestido: '',
    perfilInvestidor: 'indefinido' as 'conservador' | 'moderado' | 'arrojado' | 'indefinido',
  });
  const [savingPerfil, setSavingPerfil] = useState(false);

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
    recorrente: false,
  });

  // Filtro de categoria na aba de despesas
  const [despesaFilter, setDespesaFilter] = useState<string>('todas');

  useEffect(() => {
    void loadData();
  }, [user?.uid, workspace]);

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      setIsLoading(true);
      const [financeData, tripData, custosData] = await Promise.all([
        listWorkspaceEntity(user.uid, 'finance', workspace === 'work' ? 'work' : 'life'),
        listarViagens(),
        listarCustos(),
      ]);

      const expenseItems = financeData.filter((item) => item.collectionName === COLLECTIONS.CUSTOS);
      const revenueItems = financeData.filter((item) => item.collectionName === COLLECTIONS.RECEITAS);

      setExpenses(expenseItems);
      setRevenues(revenueItems);
      setTrips(tripData);
      setCustos(custosData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFatura = async (ids: string[], _key: string) => {
    try {
      await Promise.all(ids.map(id => deletarCusto(id)));
      setCustos(prev => prev.filter(c => !ids.includes(c.id)));
      toast.success('Fatura excluída');
    } catch {
      toast.error('Erro ao excluir fatura');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Excluir esta despesa?')) return;
    try {
      await deletarCusto(id);
      setCustos(prev => prev.filter(c => c.id !== id));
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success('Despesa excluída');
    } catch {
      toast.error('Erro ao excluir despesa');
    }
  };

  const handleDeleteRevenue = async (id: string) => {
    if (!confirm('Excluir esta receita?')) return;
    try {
      await deletarReceita(id);
      setRevenues(prev => prev.filter(r => r.id !== id));
      toast.success('Receita excluída');
    } catch {
      toast.error('Erro ao excluir receita');
    }
  };

  // Sincroniza o form de edição do perfil com o userProfile atual
  useEffect(() => {
    const fn = userProfile?.financas;
    setPerfilForm({
      rendaMensal:         fn?.rendaMensal != null ? String(fn.rendaMensal) : '',
      reservaEmergencia:   fn?.reservaEmergencia != null ? String(fn.reservaEmergencia) : '',
      totalInvestido:      fn?.totalInvestido != null ? String(fn.totalInvestido) : '',
      perfilInvestidor:    fn?.perfilInvestidor ?? 'indefinido',
    });
  }, [userProfile?.financas?.rendaMensal, userProfile?.financas?.reservaEmergencia, userProfile?.financas?.totalInvestido, userProfile?.financas?.perfilInvestidor]);

  const handleSavePerfil = async () => {
    try {
      setSavingPerfil(true);
      const renda = Number(perfilForm.rendaMensal.replace(',', '.')) || 0;
      const reserva = perfilForm.reservaEmergencia === '' ? undefined : Number(perfilForm.reservaEmergencia.replace(',', '.')) || 0;
      const invest = perfilForm.totalInvestido === '' ? undefined : Number(perfilForm.totalInvestido.replace(',', '.')) || 0;

      const prevFn = userProfile?.financas;
      await updateUserProfileData({
        financas: {
          rendaMensal: renda,
          reservaEmergencia: reserva,
          totalInvestido: invest,
          perfilInvestidor: perfilForm.perfilInvestidor,
          objetivosFinanceiros: prevFn?.objetivosFinanceiros ?? [],
          jaInveste: prevFn?.jaInveste,
          tiposInvestimento: prevFn?.tiposInvestimento,
          horizonte: prevFn?.horizonte,
        },
      });
      toast.success('Perfil financeiro atualizado');
      setPerfilDialog(false);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar perfil financeiro');
    } finally {
      setSavingPerfil(false);
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
      const baseRecord = {
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
        source: 'manual_form',
      };

      const isRecorrente = expenseForm.tipoGasto === 'fixo' || expenseForm.tipoGasto === 'assinatura';

      if (isRecorrente) {
        // Replicar custos fixos/assinaturas para todos os meses restantes do ano
        const baseDate = new Date(expenseForm.data);
        const startMonth = baseDate.getMonth();
        const year = baseDate.getFullYear();
        const day = baseDate.getDate();
        const newItems: any[] = [];

        for (let m = startMonth; m < 12; m++) {
          const d = new Date(year, m, Math.min(day, new Date(year, m + 1, 0).getDate()));
          const dateStr = d.toISOString().split('T')[0];
          const id = await createOwnedRecord(COLLECTIONS.CUSTOS, { ...baseRecord, data: dateStr });
          newItems.push({ id, collectionName: COLLECTIONS.CUSTOS, ...expenseForm, valor, data: dateStr });
        }
        setExpenses((prev) => [...newItems, ...prev]);
        toast.success(`Despesa ${expenseForm.tipoGasto === 'fixo' ? 'fixa' : 'assinatura'} replicada para ${newItems.length} meses!`);
      } else {
        const id = await createOwnedRecord(COLLECTIONS.CUSTOS, { ...baseRecord, data: expenseForm.data });
        setExpenses((prev) => [
          { id, collectionName: COLLECTIONS.CUSTOS, ...expenseForm, valor },
          ...prev,
        ]);
        toast.success('Despesa registrada');
      }

      setExpenseDialog(false);
      setExpenseForm({
        descricao: '',
        valor: '',
        categoria: 'outros',
        tipoGasto: 'variavel',
        natureza: 'despesa',
        data: new Date().toISOString().split('T')[0],
      });
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
      const baseRecord = {
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
        recorrente: revenueForm.recorrente,
        source: 'manual_form',
      };

      if (revenueForm.recorrente) {
        // Replicar para todos os meses restantes do ano
        const baseDate = new Date(revenueForm.data);
        const startMonth = baseDate.getMonth();
        const year = baseDate.getFullYear();
        const day = baseDate.getDate();
        const newItems: any[] = [];

        for (let m = startMonth; m < 12; m++) {
          const d = new Date(year, m, Math.min(day, new Date(year, m + 1, 0).getDate()));
          const dateStr = d.toISOString().split('T')[0];
          const id = await createOwnedRecord(COLLECTIONS.RECEITAS, { ...baseRecord, data: dateStr });
          newItems.push({ id, collectionName: COLLECTIONS.RECEITAS, ...revenueForm, valor, data: dateStr });
        }
        setRevenues((prev) => [...newItems, ...prev]);
        toast.success(`Receita recorrente criada para ${newItems.length} meses!`);
      } else {
        const id = await createOwnedRecord(COLLECTIONS.RECEITAS, { ...baseRecord, data: revenueForm.data });
        setRevenues((prev) => [
          { id, collectionName: COLLECTIONS.RECEITAS, ...revenueForm, valor },
          ...prev,
        ]);
        toast.success('Receita registrada');
      }

      setRevenueDialog(false);
      setRevenueForm({
        descricao: '',
        valor: '',
        categoria: 'salario',
        data: new Date().toISOString().split('T')[0],
        recorrente: false,
      });
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

  // Normaliza custos (collection CUSTOS, inclui faturas de cartão importadas)
  // para o mesmo shape das despesas manuais, mapeando tipo 'fixa' → 'fixo'.
  const normalizedCustos = useMemo(() => {
    return custos.map((c) => ({
      id: c.id,
      collectionName: COLLECTIONS.CUSTOS,
      descricao: c.descricao,
      valor: Number(c.valor || 0),
      categoria: c.categoria,
      tipoGasto: c.tipo === 'fixa' ? 'fixo' : c.tipo, // 'fixa' → 'fixo' | 'variavel' | 'assinatura'
      data: c.data,
      origem: c.origem,
      nomeCartao: c.nomeCartao,
      faturaId: c.faturaId,
      _isCartao: c.origem === 'cartao',
    }));
  }, [custos]);

  // Dedupe: listWorkspaceEntity pode retornar docs da collection CUSTOS
  // que também vêm por listarCustos(). Preferimos custos (fonte mais rica).
  const mergedManualExpenses = useMemo(() => {
    const custoIds = new Set(custos.map((c) => c.id).filter(Boolean));
    const extras = expenses.filter((e) => !custoIds.has(e.id));
    return [...normalizedCustos, ...extras];
  }, [normalizedCustos, expenses, custos]);

  const allExpensesUnfiltered = useMemo(
    () => [...mergedManualExpenses, ...travelExpenses],
    [mergedManualExpenses, travelExpenses]
  );

  // Lista de meses disponíveis (union receitas + despesas), ordenada desc
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    [...allExpensesUnfiltered, ...revenues].forEach((i) => {
      const k = monthKey(i.data);
      if (k) set.add(k);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [allExpensesUnfiltered, revenues]);

  // Aplica filtro de mês
  const inSelectedMonth = (item: any) =>
    monthFilter === 'all' || monthKey(item.data) === monthFilter;

  const allExpenses = useMemo(
    () => allExpensesUnfiltered.filter(inSelectedMonth),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allExpensesUnfiltered, monthFilter]
  );
  const revenuesFiltered = useMemo(
    () => revenues.filter(inSelectedMonth),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revenues, monthFilter]
  );
  const mergedManualFiltered = useMemo(
    () => mergedManualExpenses.filter(inSelectedMonth),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mergedManualExpenses, monthFilter]
  );
  const travelFiltered = useMemo(
    () => travelExpenses.filter(inSelectedMonth),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [travelExpenses, monthFilter]
  );

  const travelTotal = travelFiltered.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const revenueTotal = revenuesFiltered.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const expenseTotal = allExpenses.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const balance = revenueTotal - expenseTotal;
  const fixedTotal = mergedManualFiltered.filter((item) => item.tipoGasto === 'fixo').reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const subscriptionTotal = mergedManualFiltered.filter((item) => item.tipoGasto === 'assinatura').reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const variableTotal = mergedManualFiltered.filter((item) => item.tipoGasto === 'variavel').reduce((sum, item) => sum + Number(item.valor || 0), 0);

  // Gasto médio mensal — calculado dinamicamente a partir do histórico completo
  const gastoMedioMensal = useMemo(() => {
    const byMonth = new Map<string, number>();
    allExpensesUnfiltered.forEach((i) => {
      const k = monthKey(i.data);
      if (!k) return;
      byMonth.set(k, (byMonth.get(k) || 0) + Number(i.valor || 0));
    });
    if (byMonth.size === 0) return 0;
    const total = [...byMonth.values()].reduce((a, b) => a + b, 0);
    return total / byMonth.size;
  }, [allExpensesUnfiltered]);

  // Busca nas listas (tabs despesas/receitas)
  const matchesSearch = (item: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(item.descricao || '').toLowerCase().includes(q) ||
      String(item.categoria || '').toLowerCase().includes(q) ||
      String(item.nomeCartao || '').toLowerCase().includes(q)
    );
  };

  const chartData = useMemo(() => {
    const monthMap: Record<string, { mes: string; receitas: number; despesas: number }> = {};
    [...revenuesFiltered, ...allExpenses].forEach((item) => {
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
  }, [revenuesFiltered, allExpenses]);

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

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" className="gap-2" onClick={() => navigate(`/chat?action=gasto&workspace=${workspace}`)}>
            <Sparkles className="h-4 w-4" />
            Chat guiado
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setImportarFaturaOpen(true)}>
            <CreditCard className="h-4 w-4" />
            Importar Fatura
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setImportarExtratoOpen(true)}>
            <Landmark className="h-4 w-4" />
            Importar Extrato
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

      {/* ── Perfil financeiro (editável) ── */}
      <Card className="border-l-4" style={{ borderLeftColor: '#10B981' }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-[#10B981]" /> Seu perfil financeiro
            </CardTitle>
            <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setPerfilDialog(true)}>
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-[var(--theme-muted-foreground)]">Renda mensal</p>
            <p className="text-lg font-bold text-[var(--theme-foreground)]">
              {toCurrency(userProfile?.financas?.rendaMensal || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--theme-muted-foreground)]">Gasto médio mensal</p>
            <p className="text-lg font-bold text-[var(--theme-foreground)]">{toCurrency(gastoMedioMensal)}</p>
            <p className="text-[10px] text-[var(--theme-muted-foreground)]">calculado</p>
          </div>
          <div>
            <p className="text-xs text-[var(--theme-muted-foreground)]">Reserva emergencial</p>
            <p className="text-lg font-bold text-[var(--theme-foreground)]">
              {toCurrency(userProfile?.financas?.reservaEmergencia || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--theme-muted-foreground)]">Investimentos</p>
            <p className="text-lg font-bold text-[var(--theme-foreground)]">
              {toCurrency(userProfile?.financas?.totalInvestido || 0)}
            </p>
            {userProfile?.financas?.perfilInvestidor && (
              <p className="text-[10px] text-[var(--theme-muted-foreground)] capitalize">
                perfil {userProfile.financas.perfilInvestidor}
              </p>
            )}
          </div>
          {userProfile?.financas?.objetivosFinanceiros?.length ? (
            <div className="col-span-2 md:col-span-4">
              <p className="text-xs text-[var(--theme-muted-foreground)] mb-1.5">Objetivos financeiros</p>
              <div className="flex flex-wrap gap-1.5">
                {userProfile.financas.objetivosFinanceiros.map((o) => (
                  <Badge key={o} className="border-none text-xs" style={{ background: '#10B98115', color: '#10B981' }}>
                    🎯 {o}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Filtro de mês ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Label className="text-sm">Filtrar por mês:</Label>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="h-9 w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os meses</SelectItem>
            {availableMonths.map((k) => (
              <SelectItem key={k} value={k}>
                {monthLabelFromKey(k)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {monthFilter !== 'all' && (
          <Button variant="ghost" size="sm" className="h-9" onClick={() => setMonthFilter('all')}>
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-[var(--theme-muted-foreground)]">Receitas</p><p className="mt-1 text-xl font-bold text-green-600">{toCurrency(revenueTotal)}</p></div><div className="rounded-xl bg-green-100 p-2.5 text-green-600"><TrendingUp className="h-5 w-5" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-[var(--theme-muted-foreground)]">Despesas</p><p className="mt-1 text-xl font-bold text-red-500">{toCurrency(expenseTotal)}</p><p className="mt-0.5 text-[10px] text-[var(--theme-muted-foreground)]">incl. viagens</p></div><div className="rounded-xl bg-red-100 p-2.5 text-red-500"><TrendingDown className="h-5 w-5" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-[var(--theme-muted-foreground)]">Saldo</p><p className={`mt-1 text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>{toCurrency(balance)}</p></div><div className="rounded-xl bg-slate-100 p-2.5 text-slate-600"><Wallet className="h-5 w-5" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-[var(--theme-muted-foreground)]">Viagens</p><p className="mt-1 text-xl font-bold text-violet-600">{toCurrency(travelTotal)}</p><p className="mt-0.5 text-[10px] text-[var(--theme-muted-foreground)]">nas despesas</p></div><div className="rounded-xl bg-violet-100 p-2.5 text-violet-600"><Plane className="h-5 w-5" /></div></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-amber-600">Fixos / mês</p><p className="mt-1 text-xl font-bold">{toCurrency(fixedTotal)}</p><p className="text-xs text-[var(--theme-muted-foreground)]">Contas recorrentes e mensais</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-violet-600">Assinaturas / mês</p><p className="mt-1 text-xl font-bold">{toCurrency(subscriptionTotal)}</p><p className="text-xs text-[var(--theme-muted-foreground)]">Serviços com cobrança recorrente</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-red-500">Variáveis</p><p className="mt-1 text-xl font-bold">{toCurrency(variableTotal)}</p><p className="text-xs text-[var(--theme-muted-foreground)]">Gastos pontuais e do mês atual</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-5 rounded-2xl bg-[var(--theme-background-secondary)] p-1">
        {[
          { key: 'visao', label: 'Visão Geral' },
          { key: 'despesas', label: 'Despesas' },
          { key: 'receitas', label: 'Receitas' },
          { key: 'cartao', label: 'Cartão' },
          { key: 'investimentos', label: 'Investimentos' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key as any)}
            className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
              tab === item.key ? 'bg-white shadow-sm text-[var(--theme-accent)]' : 'text-[var(--theme-muted-foreground)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'cartao' && (
        <CartaoTab
          custos={custos}
          onImportar={() => setImportarFaturaOpen(true)}
          onDeleteFatura={handleDeleteFatura}
        />
      )}

      {tab === 'investimentos' && <InvestmentTab />}

      {tab !== 'cartao' && tab !== 'investimentos' && (tab === 'visao' ? (
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
        <div className="space-y-4">
          {/* Busca + filtros */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-muted-foreground)]" />
              <Input
                placeholder={tab === 'despesas' ? 'Buscar despesa por descrição, categoria ou cartão…' : 'Buscar receita por descrição ou categoria…'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {tab === 'despesas' && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-[var(--theme-muted-foreground)]" />
                <div className="flex gap-1 flex-wrap">
                  {[
                    { key: 'todas', label: 'Todas', cor: 'var(--theme-accent)' },
                    { key: 'cartao', label: 'Cartão', cor: '#3B82F6' },
                    { key: 'viagem', label: 'Viagens', cor: '#8B5CF6' },
                    { key: 'fixo', label: 'Fixas', cor: '#F59E0B' },
                    { key: 'assinatura', label: 'Assinaturas', cor: '#A855F7' },
                    { key: 'variavel', label: 'Variáveis', cor: '#EF4444' },
                    { key: 'alimentacao', label: 'Alimentação', cor: '#F59E0B' },
                    { key: 'transporte', label: 'Transporte', cor: '#3B82F6' },
                    { key: 'moradia', label: 'Moradia', cor: '#10B981' },
                    { key: 'saude', label: 'Saúde', cor: '#EF4444' },
                    { key: 'lazer', label: 'Lazer', cor: '#8B5CF6' },
                    { key: 'educacao', label: 'Educação', cor: '#06B6D4' },
                  ].map((f) => {
                    const active = despesaFilter === f.key;
                    return (
                      <button
                        key={f.key}
                        onClick={() => setDespesaFilter(f.key)}
                        className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                        style={active
                          ? { background: f.cor, color: '#fff' }
                          : { background: 'var(--theme-muted)', color: 'var(--theme-foreground)' }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4">
          {(tab === 'despesas'
            ? allExpenses.filter((item) => {
                if (despesaFilter === 'todas') return true;
                if (despesaFilter === 'cartao') return item._isCartao;
                if (despesaFilter === 'viagem') return item._isTravel;
                if (despesaFilter === 'fixo') return item.tipoGasto === 'fixo';
                if (despesaFilter === 'assinatura') return item.tipoGasto === 'assinatura';
                if (despesaFilter === 'variavel') return item.tipoGasto === 'variavel' && !item._isTravel && !item._isCartao;
                return item.categoria === despesaFilter;
              })
            : revenuesFiltered
          ).filter(matchesSearch).map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  {item._isTravel && (
                    <div className="rounded-xl bg-violet-100 p-2 text-violet-600 flex-shrink-0">
                      <Plane className="h-4 w-4" />
                    </div>
                  )}
                  {item._isCartao && !item._isTravel && (
                    <div className="rounded-xl bg-blue-100 p-2 text-blue-600 flex-shrink-0">
                      <CreditCard className="h-4 w-4" />
                    </div>
                  )}
                  {tab === 'receitas' && item.recorrente && (
                    <div className="rounded-xl bg-green-100 p-2 text-green-600 flex-shrink-0">
                      <RefreshCw className="h-4 w-4" />
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
                    : tab === 'despesas' && item._isCartao
                    ? <Badge variant="outline" className="border-blue-300 text-blue-600">
                        Cartão{item.nomeCartao ? ` • ${item.nomeCartao}` : ''}
                      </Badge>
                    : tab === 'despesas' && item.tipoGasto
                    ? <Badge variant="outline">{item.tipoGasto}</Badge>
                    : null}
                  {tab === 'receitas' && item.recorrente && (
                    <Badge variant="outline" className="border-green-300 text-green-600">Recorrente</Badge>
                  )}
                  <span className={`text-lg font-bold ${tab === 'despesas' ? 'text-red-500' : 'text-green-600'}`}>
                    {toCurrency(Number(item.valor || 0))}
                  </span>
                  {/* Botão excluir — só para itens que não são viagem (viagens são excluídas na aba de viagens) */}
                  {!item._isTravel && item.id && !String(item.id).startsWith('trip-') && (
                    <button
                      onClick={() => tab === 'despesas' ? handleDeleteExpense(item.id) : handleDeleteRevenue(item.id)}
                      className="ml-1 rounded-lg p-1.5 text-[var(--theme-muted-foreground)] hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      ))}

      {/* ── Dialog editar perfil financeiro ── */}
      <Dialog open={perfilDialog} onOpenChange={setPerfilDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Editar perfil financeiro</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Renda mensal (R$)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={perfilForm.rendaMensal}
                onChange={(e) => setPerfilForm((p) => ({ ...p, rendaMensal: e.target.value }))}
                placeholder="Ex: 5000"
              />
            </div>
            <div className="space-y-2">
              <Label>Reserva emergencial (R$)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={perfilForm.reservaEmergencia}
                onChange={(e) => setPerfilForm((p) => ({ ...p, reservaEmergencia: e.target.value }))}
                placeholder="Ex: 15000"
              />
            </div>
            <div className="space-y-2">
              <Label>Total em investimentos (R$)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={perfilForm.totalInvestido}
                onChange={(e) => setPerfilForm((p) => ({ ...p, totalInvestido: e.target.value }))}
                placeholder="Ex: 25000"
              />
            </div>
            <div className="space-y-2">
              <Label>Perfil investidor</Label>
              <Select
                value={perfilForm.perfilInvestidor}
                onValueChange={(v) => setPerfilForm((p) => ({ ...p, perfilInvestidor: v as typeof p.perfilInvestidor }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="indefinido">Indefinido</SelectItem>
                  <SelectItem value="conservador">Conservador</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="arrojado">Arrojado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-[var(--theme-muted-foreground)]">
              💡 O <strong>gasto médio mensal</strong> é calculado automaticamente a partir das suas despesas.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPerfilDialog(false)}>Cancelar</Button>
            <Button
              className="bg-[#10B981] text-white hover:bg-[#059669]"
              onClick={handleSavePerfil}
              disabled={savingPerfil}
            >
              {savingPerfil ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportarFaturaDialog
        open={importarFaturaOpen}
        onOpenChange={setImportarFaturaOpen}
        onImported={async () => {
          const updated = await listarCustos();
          setCustos(updated);
        }}
      />

      <ImportarExtratoDialog
        open={importarExtratoOpen}
        onOpenChange={setImportarExtratoOpen}
        onImported={async () => {
          // Extrato pode gerar despesas (CUSTOS) e receitas (RECEITAS).
          // Recarregamos ambas — as receitas vêm via listWorkspaceEntity no loadData,
          // mas para UX imediata adicionamos uma recarga dirigida.
          const [updatedCustos, updatedReceitas] = await Promise.all([
            listarCustos(),
            listarReceitas(),
          ]);
          setCustos(updatedCustos);
          // Receitas no estado usam o shape do listWorkspaceEntity. Normalizamos.
          setRevenues((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const extras = updatedReceitas
              .filter((r) => r.id && !existingIds.has(r.id))
              .map((r) => ({
                id: r.id,
                collectionName: COLLECTIONS.RECEITAS,
                descricao: r.descricao,
                valor: r.valor,
                categoria: r.categoria,
                data: r.data,
                natureza: 'receita',
              }));
            return [...extras, ...prev];
          });
        }}
      />

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
                    <SelectItem value="fixo">Fixo (aluguel, financiamento...)</SelectItem>
                    <SelectItem value="variavel">Variável (pontual)</SelectItem>
                    <SelectItem value="assinatura">Assinatura (Netflix, Spotify...)</SelectItem>
                  </SelectContent>
                </Select>
                {(expenseForm.tipoGasto === 'fixo' || expenseForm.tipoGasto === 'assinatura') && (
                  <p className="text-xs text-[var(--theme-muted-foreground)] flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Será replicado automaticamente para todos os meses restantes do ano
                  </p>
                )}
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
            <div className="space-y-2"><Label>Descrição</Label><Input placeholder="Ex: Salário, Freelance..." value={revenueForm.descricao} onChange={(e) => setRevenueForm((prev) => ({ ...prev, descricao: e.target.value }))} /></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Valor</Label><Input value={revenueForm.valor} onChange={(e) => setRevenueForm((prev) => ({ ...prev, valor: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={revenueForm.data} onChange={(e) => setRevenueForm((prev) => ({ ...prev, data: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={revenueForm.categoria} onValueChange={(value) => setRevenueForm((prev) => ({ ...prev, categoria: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salario">Salário</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="vendas">Vendas</SelectItem>
                    <SelectItem value="investimentos">Investimentos</SelectItem>
                    <SelectItem value="aluguel">Aluguel</SelectItem>
                    <SelectItem value="bonus">Bônus</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={revenueForm.recorrente}
                    onChange={(e) => setRevenueForm((prev) => ({ ...prev, recorrente: e.target.checked }))}
                    className="h-4 w-4 rounded"
                  />
                  <div>
                    <span className="text-sm text-[var(--theme-foreground)] flex items-center gap-1">
                      <RefreshCw className="h-3.5 w-3.5" /> Receita recorrente
                    </span>
                    <span className="text-xs text-[var(--theme-muted-foreground)]">Replica para todos os meses restantes</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevenueDialog(false)}>Cancelar</Button>
            <Button className="bg-green-600 text-white hover:bg-green-700" onClick={handleSaveRevenue}>
              {revenueForm.recorrente ? 'Salvar para todos os meses' : 'Salvar receita'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
