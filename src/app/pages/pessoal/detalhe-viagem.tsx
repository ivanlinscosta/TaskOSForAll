import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Plane,
  Calendar,
  Clock,
  Wallet,
  MapPin,
  FileText,
  Pencil,
  Trash2,
  Plus,
  Loader,
  Circle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import * as viagensService from '../../../services/viagens-service';
import * as custosService from '../../../services/custos-service';
import { formatCurrency } from '../../../lib/utils';

const STATUS_LABELS: Record<string, string> = {
  planejada: 'Planejada',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

const STATUS_CORES: Record<string, string> = {
  planejada: 'rgba(5,150,105,0.15)',
  em_andamento: 'rgba(59,130,246,0.15)',
  concluida: 'rgba(107,114,128,0.15)',
  cancelada: 'rgba(239,68,68,0.15)',
};

const STATUS_TEXT_CORES: Record<string, string> = {
  planejada: '#0D5C7A',
  em_andamento: '#3B82F6',
  concluida: '#6B7280',
  cancelada: '#EF4444',
};

export function DetalheViagem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viagem, setViagem] = useState<viagensService.Viagem | null>(null);
  const [custos, setCustos] = useState<custosService.Custo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [v, c] = await Promise.all([
          viagensService.buscarViagemPorId(id),
          custosService.listarCustosPorViagem(id),
        ]);
        setViagem(v);
        setCustos(c);
      } catch {
        toast.error('Erro ao carregar viagem');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!viagem?.id || !confirm('Excluir esta viagem?')) return;
    try {
      await viagensService.deletarViagem(viagem.id);
      toast.success('Viagem excluída!');
      navigate('/pessoal/viagens');
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin text-[var(--theme-accent)]" />
      </div>
    );
  }

  if (!viagem) {
    return (
      <div className="p-6 text-center">
        <p className="text-[var(--theme-muted-foreground)]">Viagem não encontrada.</p>
        <Button className="mt-4" onClick={() => navigate('/pessoal/viagens')}>
          Voltar
        </Button>
      </div>
    );
  }

  const totalCustos = custos.reduce((sum, c) => sum + c.valor, 0);
  const saldoRestante = viagem.orcamento - totalCustos;
  const percentualGasto = viagem.orcamento > 0 ? Math.min((totalCustos / viagem.orcamento) * 100, 100) : 0;

  const duracao = viagem.dataVolta
    ? Math.ceil(
        (new Date(viagem.dataVolta).getTime() - new Date(viagem.dataIda).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/pessoal/viagens')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">{viagem.destino}</h1>
              <Badge style={{ background: STATUS_CORES[viagem.status], color: STATUS_TEXT_CORES[viagem.status] }}>
                {STATUS_LABELS[viagem.status]}
              </Badge>
            </div>
            <p className="text-[var(--theme-muted-foreground)] mt-1">
              {duracao ? `${duracao} dias` : 'Duração não definida'}
              {viagem.atividades && viagem.atividades.length > 0 &&
                ` • ${viagem.atividades.length} atividades planejadas`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/pessoal/viagens/editar/${viagem.id}`)}
          >
            <Pencil className="h-4 w-4 mr-2" /> Editar
          </Button>
          <Button
            variant="outline"
            className="text-red-500 border-red-200 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Info Geral */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--theme-muted-foreground)]" />
                  <div>
                    <p className="text-xs text-[var(--theme-muted-foreground)]">Ida</p>
                    <p className="text-sm font-medium">
                      {format(new Date(viagem.dataIda), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                {viagem.dataVolta && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[var(--theme-muted-foreground)]" />
                    <div>
                      <p className="text-xs text-[var(--theme-muted-foreground)]">Volta</p>
                      <p className="text-sm font-medium">
                        {format(new Date(viagem.dataVolta), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {viagem.descricao && (
                <div>
                  <p className="text-xs text-[var(--theme-muted-foreground)] mb-1">Descrição</p>
                  <p className="text-sm text-[var(--theme-foreground)]">{viagem.descricao}</p>
                </div>
              )}

              {viagem.notas && (
                <div
                  className="rounded-lg p-3"
                  style={{ background: 'var(--theme-background-secondary)' }}
                >
                  <p className="text-xs text-[var(--theme-muted-foreground)] mb-1 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Notas
                  </p>
                  <p className="text-sm text-[var(--theme-foreground)]">{viagem.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Atividades */}
          {viagem.atividades && viagem.atividades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                  Atividades Planejadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {viagem.atividades.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg px-4 py-3"
                      style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-card)' }}
                    >
                      <Circle className="h-4 w-4 flex-shrink-0 mt-0.5 text-[var(--theme-accent)]" />
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gastos da Viagem */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                Gastos da Viagem
              </CardTitle>
              <Button
                size="sm"
                onClick={() => navigate('/pessoal/custos/novo')}
                style={{ background: 'var(--theme-accent)', color: '#fff' }}
              >
                <Plus className="h-4 w-4 mr-1" /> Registrar Gasto
              </Button>
            </CardHeader>
            <CardContent>
              {custos.length === 0 ? (
                <p className="text-sm text-center py-4 text-[var(--theme-muted-foreground)]">
                  Nenhum gasto registrado para esta viagem ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {custos.map((c) => (
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
                      <span className="font-bold text-red-500">
                        - {formatCurrency(c.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Financeiro */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--theme-muted-foreground)]">Orçamento</span>
                  <span className="font-bold text-[var(--theme-foreground)]">
                    {formatCurrency(viagem.orcamento)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--theme-muted-foreground)]">Gasto</span>
                  <span className="font-bold text-red-500">
                    {formatCurrency(totalCustos)}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-[var(--theme-muted)]">
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{
                      width: `${percentualGasto}%`,
                      background: percentualGasto >= 90 ? '#EF4444' : 'var(--theme-accent)',
                    }}
                  />
                </div>
                <p className="text-xs text-[var(--theme-muted-foreground)] mt-1 text-right">
                  {percentualGasto.toFixed(0)}% do orçamento utilizado
                </p>
              </div>

              <div
                className="rounded-lg p-3"
                style={{
                  background: saldoRestante >= 0 ? 'rgba(5,150,105,0.1)' : 'rgba(239,68,68,0.1)',
                }}
              >
                <p className="text-xs text-[var(--theme-muted-foreground)]">Saldo Restante</p>
                <p
                  className="text-xl font-bold"
                  style={{ color: saldoRestante >= 0 ? '#0D5C7A' : '#EF4444' }}
                >
                  {formatCurrency(Math.abs(saldoRestante))}
                  {saldoRestante < 0 && ' (estourado)'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
