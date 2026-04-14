import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Loader,
  MessageSquare,
  Plane,
  Receipt,
  Users,
  Wallet,
  Plus,
  Sparkles,
  Clock3,
  Tag,
  MapPin,
  CircleDollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../../lib/auth-context';
import { listWorkspaceEntity, type ForAllEntity } from '../../../services/forall-data-service';

const ENTITY_META: Record<
  string,
  {
    title: string;
    icon: any;
    empty: string;
    actionLabel?: string;
    chatAction?: string;
  }
> = {
  tasks: {
    title: 'Tarefas',
    icon: CheckSquare,
    empty: 'Nenhuma tarefa encontrada.',
    actionLabel: 'Nova tarefa',
    chatAction: 'tarefa',
  },
  feedbacks: {
    title: 'Feedbacks',
    icon: MessageSquare,
    empty: 'Nenhum feedback encontrado.',
    actionLabel: 'Novo feedback',
    chatAction: 'feedback',
  },
  meetings: {
    title: 'Reuniões',
    icon: Calendar,
    empty: 'Nenhuma reunião encontrada.',
    actionLabel: 'Nova reunião',
  },
  students: {
    title: 'Pessoas acompanhadas',
    icon: Users,
    empty: 'Nenhum registro encontrado.',
  },
  classes: {
    title: 'Planejamentos',
    icon: BookOpen,
    empty: 'Nenhum planejamento encontrado.',
  },
  finance: {
    title: 'Finanças',
    icon: Wallet,
    empty: 'Nenhum lançamento financeiro encontrado.',
    actionLabel: 'Novo lançamento',
    chatAction: 'gasto',
  },
  expenses: {
    title: 'Gastos',
    icon: Receipt,
    empty: 'Nenhum gasto encontrado.',
    actionLabel: 'Novo gasto',
    chatAction: 'gasto',
  },
  trips: {
    title: 'Viagens',
    icon: Plane,
    empty: 'Nenhuma viagem encontrada.',
    actionLabel: 'Nova viagem',
    chatAction: 'viagem',
  },
};

function formatDateValue(value: any) {
  if (!value) return '';
  const date =
    typeof value?.toDate === 'function'
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(value: any) {
  const numeric = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (Number.isNaN(numeric)) return String(value || '');
  return numeric.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function toLabel(value: string) {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/^\w/, (m) => m.toUpperCase());
}

function getTaskPriorityLabel(value?: string) {
  const map: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
  };
  return map[String(value || '').toLowerCase()] || value || 'Sem prioridade';
}

function getTaskStatusLabel(value?: string) {
  const map: Record<string, string> = {
    backlog: 'A fazer',
    doing: 'Em progresso',
    done: 'Concluída',
    concluida: 'Concluída',
    agendada: 'Agendada',
    planejada: 'Planejada',
  };
  return map[String(value || '').toLowerCase()] || value || '';
}

function getFriendlyCardData(entity: string, item: Record<string, any>) {
  switch (entity) {
    case 'tasks':
      return {
        title: item.title || item.titulo || 'Tarefa',
        subtitle: item.description || item.descricao || '',
        badge: getTaskStatusLabel(item.status),
        metrics: [
          item.priority || item.prioridade
            ? { icon: Tag, label: 'Prioridade', value: getTaskPriorityLabel(item.priority || item.prioridade) }
            : null,
          item.dueDateText || item.prazo || item.dataVencimento
            ? {
                icon: Clock3,
                label: 'Prazo',
                value: item.dueDateText || formatDateValue(item.prazo || item.dataVencimento),
              }
            : null,
          item.workspaceType
            ? { icon: CheckSquare, label: 'Workspace', value: item.workspaceType === 'work' ? 'Trabalho' : 'Vida pessoal' }
            : null,
        ].filter(Boolean),
      };

    case 'expenses':
    case 'finance':
      return {
        title: item.descricao || item.title || 'Lançamento financeiro',
        subtitle: item.categoria ? `Categoria: ${item.categoria}` : '',
        badge: item.tipoGasto || item.natureza || item.tipo || '',
        metrics: [
          item.valor !== undefined && item.valor !== null
            ? { icon: CircleDollarSign, label: 'Valor', value: formatCurrency(item.valor) }
            : null,
          item.data ? { icon: Calendar, label: 'Data', value: formatDateValue(item.data) } : null,
          item.tipo ? { icon: Tag, label: 'Tipo', value: toLabel(String(item.tipo)) } : null,
        ].filter(Boolean),
      };

    case 'feedbacks':
      return {
        title: item.pessoa || item.analistaNome || item.title || 'Feedback',
        subtitle: item.descricao || item.description || item.contexto || '',
        badge: item.tipo || '',
        metrics: [
          item.contexto ? { icon: MessageSquare, label: 'Contexto', value: item.contexto } : null,
          item.workspaceType
            ? { icon: CheckSquare, label: 'Workspace', value: item.workspaceType === 'work' ? 'Trabalho' : 'Vida pessoal' }
            : null,
        ].filter(Boolean),
      };

    case 'trips':
      return {
        title: item.destino || item.title || 'Viagem',
        subtitle: item.objetivo || '',
        badge: getTaskStatusLabel(item.status),
        metrics: [
          item.dataIda ? { icon: Calendar, label: 'Ida', value: formatDateValue(item.dataIda) } : null,
          item.dataVolta ? { icon: Calendar, label: 'Volta', value: formatDateValue(item.dataVolta) } : null,
          item.destino ? { icon: MapPin, label: 'Destino', value: item.destino } : null,
        ].filter(Boolean),
      };

    case 'meetings':
      return {
        title: item.titulo || item.title || 'Reunião',
        subtitle: item.descricao || item.description || item.notas || '',
        badge: getTaskStatusLabel(item.status),
        metrics: [
          item.data || item.dateText
            ? { icon: Calendar, label: 'Data', value: formatDateValue(item.data || item.dateText) }
            : null,
          item.participantes?.length
            ? { icon: Users, label: 'Participantes', value: `${item.participantes.length}` }
            : null,
        ].filter(Boolean),
      };

    case 'students':
      return {
        title: item.nome || item.name || 'Pessoa',
        subtitle: item.curso || item.email || '',
        badge: item.status || '',
        metrics: [
          item.email ? { icon: MessageSquare, label: 'Email', value: item.email } : null,
          item.curso ? { icon: BookOpen, label: 'Curso', value: item.curso } : null,
        ].filter(Boolean),
      };

    case 'classes':
      return {
        title: item.titulo || item.title || 'Planejamento',
        subtitle: item.descricao || item.description || '',
        badge: item.disciplina || '',
        metrics: [
          item.data ? { icon: Calendar, label: 'Data', value: formatDateValue(item.data) } : null,
          item.disciplina ? { icon: BookOpen, label: 'Disciplina', value: item.disciplina } : null,
        ].filter(Boolean),
      };

    default:
      return {
        title: item.title || item.titulo || item.nome || item.descricao || item.destino || 'Registro',
        subtitle: item.description || item.descricao || item.contexto || item.objetivo || '',
        badge: '',
        metrics: [],
      };
  }
}

export function ForAllEntityHub() {
  const navigate = useNavigate();
  const { workspace = 'work', entity = 'tasks' } = useParams();
  const { user } = useAuth();
  const [items, setItems] = useState<Array<Record<string, any>>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const meta = ENTITY_META[entity] || ENTITY_META.tasks;
  const Icon = meta.icon;

  useEffect(() => {
    void loadItems();
  }, [user?.uid, workspace, entity]);

  const loadItems = async () => {
    if (!user?.uid) return;
    try {
      setIsLoading(true);
      const data = await listWorkspaceEntity(
        user.uid,
        (entity as ForAllEntity) || 'tasks',
        workspace === 'life' ? 'life' : 'work',
      );
      setItems(data);
    } finally {
      setIsLoading(false);
    }
  };

  const workspaceLabel = workspace === 'life' ? 'Vida pessoal' : 'Trabalho';

  const createHref = useMemo(() => {
    if (entity === 'trips') return '/pessoal/viagens/nova';
    if (meta.chatAction) return `/chat?action=${meta.chatAction}&workspace=${workspace}`;
    return '/chat';
  }, [entity, meta.chatAction, workspace]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[var(--theme-background-secondary)] p-3 text-[var(--theme-accent)]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--theme-foreground)]">{meta.title}</h1>
            <p className="text-sm text-[var(--theme-muted-foreground)]">
              Registros do workspace <strong>{workspaceLabel}</strong>
            </p>
          </div>
        </div>

        {meta.actionLabel ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate('/chat')}>
              <Sparkles className="h-4 w-4" />
              Chat guiado
            </Button>
            <Button
              className="gap-2"
              style={{
                background: 'var(--theme-accent)',
                color: 'var(--theme-accent-foreground)',
              }}
              onClick={() => navigate(createHref)}
            >
              <Plus className="h-4 w-4" />
              {meta.actionLabel}
            </Button>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-[var(--theme-accent)]" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-16 text-center">
            <p className="text-sm text-[var(--theme-muted-foreground)]">{meta.empty}</p>
            {meta.actionLabel ? (
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" onClick={() => navigate('/chat')}>
                  Usar chat
                </Button>
                <Button
                  style={{
                    background: 'var(--theme-accent)',
                    color: 'var(--theme-accent-foreground)',
                  }}
                  onClick={() => navigate(createHref)}
                >
                  {meta.actionLabel}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {items.map((item) => {
            const friendly = getFriendlyCardData(entity, item);
            return (
              <Card
                key={`${item.collectionName}-${item.id}`}
                className="overflow-hidden rounded-3xl border-[var(--theme-border)] bg-[var(--theme-card)] shadow-sm transition-all hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <CardTitle className="text-xl font-semibold text-[var(--theme-foreground)]">
                        {friendly.title}
                      </CardTitle>
                      {friendly.subtitle ? (
                        <p className="max-w-xl text-sm leading-6 text-[var(--theme-muted-foreground)]">
                          {friendly.subtitle}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                        {item.collectionName === 'tarefas_pessoais'
                          ? 'Tarefa pessoal'
                          : item.collectionName === 'custos'
                            ? 'Financeiro'
                            : toLabel(String(item.collectionName))}
                      </Badge>

                      {friendly.badge ? (
                        <Badge
                          className="rounded-full px-3 py-1 text-xs"
                          style={{
                            background: 'var(--theme-background-secondary)',
                            color: 'var(--theme-foreground)',
                          }}
                        >
                          {friendly.badge}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {friendly.metrics.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {friendly.metrics.map((metric: any) => {
                        const MetricIcon = metric.icon;
                        return (
                          <div
                            key={`${item.id}-${metric.label}`}
                            className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4"
                          >
                            <div className="mb-2 flex items-center gap-2 text-[var(--theme-muted-foreground)]">
                              <MetricIcon className="h-4 w-4" />
                              <span className="text-[11px] font-semibold uppercase tracking-wide">
                                {metric.label}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-[var(--theme-foreground)]">
                              {metric.value || '—'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {entity === 'tasks' && (item.description || item.descricao) ? (
                    <div className="rounded-2xl bg-[var(--theme-background-secondary)] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--theme-muted-foreground)]">
                        Detalhes
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--theme-foreground)]">
                        {item.description || item.descricao}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
