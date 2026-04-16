import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Plane,
  Calendar,
  Wallet,
  Trash2,
  Eye,
  Loader,
  MapPin,
  Pencil,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import * as viagensService from '../../../services/viagens-service';
import { formatCurrency } from '../../../lib/utils';
import { PlanViagemIADialog } from '../../components/PlanViagemIADialog';
import type { ViagemPlanResult } from '../../../services/viagem-ai-service';

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
  planejada: '#059669',
  em_andamento: '#3B82F6',
  concluida: '#6B7280',
  cancelada: '#EF4444',
};

export function Viagens() {
  const navigate = useNavigate();
  const [viagens, setViagens] = useState<viagensService.Viagem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [planIAOpen, setPlanIAOpen] = useState(false);

  const handleAIPlanAccepted = async (plan: ViagemPlanResult) => {
    try {
      const orcamentoDetalhado: viagensService.ItemOrcamento[] = plan.orcamentoDetalhado.map((o) => {
        const item: viagensService.ItemOrcamento = {
          categoria: o.categoria,
          valor: o.valor,
          formaPagamento: o.formaPagamento,
        };
        if (o.formaPagamento === 'a_prazo' && o.parcelas) item.parcelas = o.parcelas;
        return item;
      });

      const atividades: viagensService.Atividade[] = plan.atividades.map((a, i) => ({
        id: crypto.randomUUID(),
        nome: a.nome,
        data: a.data,
        horario: a.horario,
      }));

      await viagensService.criarViagem({
        destino: plan.destino,
        descricao: plan.descricao,
        dataIda: new Date(plan.dataIda),
        dataVolta: new Date(plan.dataVolta),
        orcamento: plan.orcamentoTotal,
        gastoReal: 0,
        status: 'planejada',
        atividades,
        orcamentoDetalhado,
        notas: plan.notas,
      });
      toast.success('Viagem criada com sucesso a partir do plano de IA!');
      carregarViagens();
    } catch {
      toast.error('Erro ao criar viagem a partir do plano');
    }
  };

  useEffect(() => {
    carregarViagens();
  }, []);

  const carregarViagens = async () => {
    setIsLoading(true);
    try {
      setViagens(await viagensService.listarViagens());
    } catch {
      toast.error('Erro ao carregar viagens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta viagem?')) return;
    try {
      await viagensService.deletarViagem(id!);
      setViagens((prev) => prev.filter((v) => v.id !== id));
      toast.success('Viagem excluída!');
    } catch {
      toast.error('Erro ao excluir viagem');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin text-[var(--theme-accent)]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Minhas Viagens</h1>
          <p className="text-[var(--theme-muted-foreground)] mt-1">
            {viagens.length} viagens registradas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setPlanIAOpen(true)}
          >
            <Sparkles className="h-4 w-4" style={{ color: 'var(--theme-accent)' }} />
            Planejar com IA
          </Button>
          <Button
            onClick={() => navigate('/pessoal/viagens/nova')}
            className="gap-2"
            style={{ background: 'var(--theme-accent)', color: '#fff' }}
          >
            <Plus className="h-4 w-4" /> Nova Viagem
          </Button>
        </div>
      </div>

      {viagens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Plane className="h-16 w-16 text-[var(--theme-muted-foreground)] mb-4" />
          <h3 className="text-xl font-semibold text-[var(--theme-foreground)] mb-2">
            Nenhuma viagem cadastrada
          </h3>
          <p className="text-[var(--theme-muted-foreground)] mb-6">
            Comece planejando sua próxima aventura!
          </p>
          <Button
            onClick={() => navigate('/pessoal/viagens/nova')}
            style={{ background: 'var(--theme-accent)', color: '#fff' }}
          >
            <Plus className="h-4 w-4 mr-2" /> Planejar Primeira Viagem
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {viagens.map((viagem) => {
            const duracao =
              viagem.dataVolta
                ? Math.ceil(
                    (new Date(viagem.dataVolta).getTime() - new Date(viagem.dataIda).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : null;

            const percentualGasto =
              viagem.orcamento > 0 && viagem.gastoReal
                ? Math.min((viagem.gastoReal / viagem.orcamento) * 100, 100)
                : 0;

            return (
              <Card key={viagem.id} className="hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: 'rgba(5,150,105,0.1)' }}
                      >
                        <Plane className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{viagem.destino}</CardTitle>
                        {duracao && (
                          <p className="text-xs text-[var(--theme-muted-foreground)]">
                            {duracao} dias
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      style={{
                        background: STATUS_CORES[viagem.status],
                        color: STATUS_TEXT_CORES[viagem.status],
                      }}
                    >
                      {STATUS_LABELS[viagem.status]}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-[var(--theme-muted-foreground)]">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(viagem.dataIda), "d MMM yyyy", { locale: ptBR })}
                      {viagem.dataVolta &&
                        ` → ${format(new Date(viagem.dataVolta), "d MMM yyyy", { locale: ptBR })}`}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--theme-muted-foreground)] flex items-center gap-1">
                        <Wallet className="h-3.5 w-3.5" /> Orçamento
                      </span>
                      <span className="font-medium text-[var(--theme-foreground)]">
                        {formatCurrency(viagem.orcamento)}
                      </span>
                    </div>
                    {viagem.gastoReal !== undefined && viagem.gastoReal > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--theme-muted-foreground)]">Gasto real</span>
                          <span
                            className="font-medium"
                            style={{
                              color: percentualGasto >= 90 ? '#EF4444' : 'var(--theme-accent)',
                            }}
                          >
                            {formatCurrency(viagem.gastoReal)}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[var(--theme-muted)]">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${percentualGasto}%`,
                              background: percentualGasto >= 90 ? '#EF4444' : 'var(--theme-accent)',
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {viagem.descricao && (
                    <p className="text-xs text-[var(--theme-muted-foreground)] line-clamp-2">
                      {viagem.descricao}
                    </p>
                  )}

                  {viagem.atividades && viagem.atividades.length > 0 && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[var(--theme-muted-foreground)]" />
                      <span className="text-xs text-[var(--theme-muted-foreground)]">
                        {viagem.atividades.length} atividade{viagem.atividades.length !== 1 ? 's' : ''} planejada{viagem.atividades.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => navigate(`/pessoal/viagens/${viagem.id}`)}
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      title="Editar viagem"
                      onClick={() => navigate(`/pessoal/viagens/editar/${viagem.id}`)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 border-red-200 hover:bg-red-50"
                      onClick={() => handleDelete(viagem.id!)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <PlanViagemIADialog
        open={planIAOpen}
        onOpenChange={setPlanIAOpen}
        onAccept={handleAIPlanAccepted}
      />
    </div>
  );
}
