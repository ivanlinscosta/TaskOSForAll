import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Plane,
  Wallet,
  CheckSquare,
  TrendingDown,
  TrendingUp,
  Plus,
  ArrowRight,
  Calendar,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as viagensService from '../../../services/viagens-service';
import * as custosService from '../../../services/custos-service';
import * as tarefasService from '../../../services/tarefas-pessoais-service';

export function PessoalIndex() {
  const navigate = useNavigate();
  const [viagens, setViagens] = useState<viagensService.Viagem[]>([]);
  const [custos, setCustos] = useState<custosService.Custo[]>([]);
  const [tarefas, setTarefas] = useState<tarefasService.TarefaPessoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [v, c, t] = await Promise.all([
          viagensService.listarViagens(),
          custosService.listarCustos(),
          tarefasService.listarTarefasPessoais(),
        ]);
        setViagens(v);
        setCustos(c);
        setTarefas(t);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const totalGasto = custos.reduce((sum, c) => sum + c.valor, 0);
  const viagensPlanejadas = viagens.filter((v) => v.status === 'planejada').length;
  const tarefasPendentes = tarefas.filter((t) => t.status !== 'done').length;
  const tarefasConcluidas = tarefas.filter((t) => t.status === 'done').length;

  // Gasto dos últimos 30 dias
  const agora = new Date();
  const ha30dias = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
  const gastoMes = custos
    .filter((c) => new Date(c.data) >= ha30dias)
    .reduce((sum, c) => sum + c.valor, 0);

  const proximaViagem = viagens
    .filter((v) => v.status === 'planejada' && new Date(v.dataIda) >= agora)
    .sort((a, b) => new Date(a.dataIda).getTime() - new Date(b.dataIda).getTime())[0];

  const tarefasRecentes = tarefas
    .filter((t) => t.status !== 'done')
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--theme-accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Vida Pessoal</h1>
          <p className="text-[var(--theme-muted-foreground)] mt-1">
            Organize suas viagens, finanças e tarefas do dia a dia
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-all"
          onClick={() => navigate('/pessoal/viagens')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--theme-muted-foreground)]">Viagens Planejadas</p>
                <p className="text-3xl font-bold text-[var(--theme-foreground)] mt-1">{viagensPlanejadas}</p>
                <p className="text-xs text-[var(--theme-muted-foreground)] mt-1">{viagens.length} no total</p>
              </div>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: 'rgba(5, 150, 105, 0.1)' }}
              >
                <Plane className="h-6 w-6" style={{ color: 'var(--theme-accent)' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-all"
          onClick={() => navigate('/pessoal/custos')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--theme-muted-foreground)]">Gasto (30 dias)</p>
                <p className="text-3xl font-bold text-[var(--theme-foreground)] mt-1">
                  R$ {gastoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-[var(--theme-muted-foreground)] mt-1">
                  Total: R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: 'rgba(239, 68, 68, 0.1)' }}
              >
                <Wallet className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-all"
          onClick={() => navigate('/pessoal/tarefas')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--theme-muted-foreground)]">Tarefas Pendentes</p>
                <p className="text-3xl font-bold text-[var(--theme-foreground)] mt-1">{tarefasPendentes}</p>
                <p className="text-xs text-[var(--theme-muted-foreground)] mt-1">
                  {tarefasConcluidas} concluídas
                </p>
              </div>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: 'rgba(5, 150, 105, 0.1)' }}
              >
                <CheckSquare className="h-6 w-6" style={{ color: 'var(--theme-accent)' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--theme-muted-foreground)]">Progresso Tarefas</p>
                <p className="text-3xl font-bold text-[var(--theme-foreground)] mt-1">
                  {tarefas.length > 0
                    ? Math.round((tarefasConcluidas / tarefas.length) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-[var(--theme-muted-foreground)] mt-1">
                  {tarefasConcluidas}/{tarefas.length} concluídas
                </p>
              </div>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: 'rgba(5, 150, 105, 0.1)' }}
              >
                <Target className="h-6 w-6" style={{ color: 'var(--theme-accent)' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Próxima Viagem */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
              Próxima Viagem
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/pessoal/viagens')}>
              Ver todas <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {proximaViagem ? (
              <div
                className="rounded-xl p-4"
                style={{ background: 'var(--theme-background-secondary)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-[var(--theme-foreground)]">
                    {proximaViagem.destino}
                  </h3>
                  <Badge
                    style={{ background: 'rgba(5,150,105,0.15)', color: '#059669' }}
                  >
                    Planejada
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--theme-muted-foreground)] mb-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(proximaViagem.dataIda), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    {proximaViagem.dataVolta &&
                      ` → ${format(new Date(proximaViagem.dataVolta), "d 'de' MMMM", { locale: ptBR })}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4 text-[var(--theme-muted-foreground)]" />
                  <span className="text-[var(--theme-foreground)] font-medium">
                    Orçamento: R$ {proximaViagem.orcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {proximaViagem.descricao && (
                  <p className="mt-2 text-sm text-[var(--theme-muted-foreground)]">
                    {proximaViagem.descricao}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Plane className="h-10 w-10 mx-auto text-[var(--theme-muted-foreground)] mb-3" />
                <p className="text-[var(--theme-muted-foreground)] text-sm">Nenhuma viagem planejada</p>
                <Button
                  className="mt-3"
                  style={{ background: 'var(--theme-accent)', color: '#fff' }}
                  size="sm"
                  onClick={() => navigate('/pessoal/viagens/nova')}
                >
                  <Plus className="h-4 w-4 mr-1" /> Planejar Viagem
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tarefas Recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
              Tarefas Pendentes
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/pessoal/tarefas')}>
              Ver todas <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {tarefasRecentes.length > 0 ? (
              <div className="space-y-2">
                {tarefasRecentes.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg p-3"
                    style={{ background: 'var(--theme-background-secondary)' }}
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--theme-foreground)]">{t.titulo}</p>
                      <p className="text-xs text-[var(--theme-muted-foreground)]">
                        {tarefasService.CATEGORIAS_TAREFAS_LABELS[t.categoria]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          color: t.prioridade === 'alta' ? '#EF4444' : t.prioridade === 'media' ? '#F59E0B' : '#6B7280',
                          borderColor: t.prioridade === 'alta' ? '#EF4444' : t.prioridade === 'media' ? '#F59E0B' : '#6B7280',
                        }}
                      >
                        {t.prioridade}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckSquare className="h-10 w-10 mx-auto text-[var(--theme-muted-foreground)] mb-3" />
                <p className="text-[var(--theme-muted-foreground)] text-sm">Nenhuma tarefa pendente</p>
                <Button
                  className="mt-3"
                  style={{ background: 'var(--theme-accent)', color: '#fff' }}
                  size="sm"
                  onClick={() => navigate('/pessoal/tarefas')}
                >
                  <Plus className="h-4 w-4 mr-1" /> Nova Tarefa
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimos Custos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Últimos Gastos
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/pessoal/custos')}>
              Ver todos <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {custos.length > 0 ? (
              <div className="space-y-2">
                {custos.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg p-3"
                    style={{ background: 'var(--theme-background-secondary)' }}
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--theme-foreground)]">{c.descricao}</p>
                      <p className="text-xs text-[var(--theme-muted-foreground)]">
                        {custosService.CATEGORIAS_LABELS[c.categoria]} •{' '}
                        {format(new Date(c.data), "d 'de' MMM", { locale: ptBR })}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-red-500">
                      - R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Wallet className="h-10 w-10 mx-auto text-[var(--theme-muted-foreground)] mb-3" />
                <p className="text-[var(--theme-muted-foreground)] text-sm">Nenhum gasto registrado</p>
                <Button
                  className="mt-3"
                  style={{ background: 'var(--theme-accent)', color: '#fff' }}
                  size="sm"
                  onClick={() => navigate('/pessoal/custos/novo')}
                >
                  <Plus className="h-4 w-4 mr-1" /> Registrar Gasto
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
              Gastos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {custos.length > 0 ? (
              <div className="space-y-3">
                {Object.entries(
                  custos.reduce((acc, c) => {
                    acc[c.categoria] = (acc[c.categoria] || 0) + c.valor;
                    return acc;
                  }, {} as Record<string, number>)
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([cat, valor]) => {
                    const pct = totalGasto > 0 ? (valor / totalGasto) * 100 : 0;
                    const cor = custosService.CATEGORIAS_CORES[cat as custosService.CategoriaCusto] || '#6B7280';
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[var(--theme-foreground)]">
                            {custosService.CATEGORIAS_LABELS[cat as custosService.CategoriaCusto] || cat}
                          </span>
                          <span className="font-medium text-[var(--theme-foreground)]">
                            R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[var(--theme-muted)]">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: cor }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-[var(--theme-muted-foreground)] text-sm">
                  Registre gastos para ver o resumo por categoria
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
