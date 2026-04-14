import { useEffect, useMemo, useState } from 'react';
import {
  addDays,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BookOpen,
  CheckSquare,
  ClipboardCheck,
  Clock3,
  Loader,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import * as aulasService from '../../../services/aulas-service';

const tipoConfig = {
  aula: {
    label: 'Aula',
    icon: BookOpen,
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    cardClass: 'bg-blue-500 text-white border-blue-400',
    detailBadgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  atividade: {
    label: 'Atividade',
    icon: CheckSquare,
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
    cardClass: 'bg-orange-400 text-white border-orange-300',
    detailBadgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  avaliacao: {
    label: 'Avaliação',
    icon: ClipboardCheck,
    badgeClass: 'bg-violet-100 text-violet-700 border-violet-200',
    cardClass: 'bg-violet-500 text-white border-violet-400',
    detailBadgeClass: 'bg-violet-100 text-violet-700 border-violet-200',
  },
} as const;

function getHourLabel(dateStr: string) {
  const date = parseISO(dateStr);
  return format(date, 'HH:mm');
}

function safeDateString(dateStr: string) {
  if (!dateStr) return '';
  if (dateStr.length === 10) return `${dateStr}T08:00:00`;
  return dateStr;
}

export function Cronograma() {
  const [eventos, setEventos] = useState<aulasService.EventoCronograma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    carregarCronograma();
  }, []);

  const carregarCronograma = async () => {
    try {
      setIsLoading(true);
      const data = await aulasService.listarEventosCronograma();
      setEventos(
        data.map((item) => ({
          ...item,
          data: safeDateString(item.data),
        }))
      );
    } catch (error) {
      console.error('Erro ao carregar cronograma:', error);
      toast.error('Erro ao carregar cronograma');
    } finally {
      setIsLoading(false);
    }
  };

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const eventosDaSemana = useMemo(() => {
    return eventos.filter((evento) => {
      const dataEvento = parseISO(evento.data);
      return isWithinInterval(dataEvento, { start: weekStart, end: weekEnd });
    });
  }, [eventos, weekStart, weekEnd]);

  const eventosPorDia = useMemo(() => {
    return days.map((day) => ({
      day,
      eventos: eventosDaSemana
        .filter((evento) => isSameDay(parseISO(evento.data), day))
        .sort((a, b) => parseISO(a.data).getTime() - parseISO(b.data).getTime()),
    }));
  }, [days, eventosDaSemana]);

  const eventosSelecionados = useMemo(() => {
    return eventos
      .filter((evento) => isSameDay(parseISO(evento.data), selectedDate))
      .sort((a, b) => parseISO(a.data).getTime() - parseISO(b.data).getTime());
  }, [eventos, selectedDate]);

  const maxRows = 6;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Cronograma</h1>
          <p className="mt-1 text-[var(--theme-muted-foreground)]">
            Visualização semanal de aulas, atividades e avaliações.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Hoje
          </Button>
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className={tipoConfig.aula.badgeClass}>Aulas</Badge>
        <Badge className={tipoConfig.atividade.badgeClass}>Atividades</Badge>
        <Badge className={tipoConfig.avaliacao.badgeClass}>Avaliações</Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="h-8 w-8 animate-spin text-[var(--theme-accent)]" />
        </div>
      ) : (
        <>
          <Card className="overflow-hidden rounded-[28px]">
            <CardHeader className="border-b border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-2xl">
                  Semana de {format(weekStart, "d 'de' MMM", { locale: ptBR })} até{' '}
                  {format(weekEnd, "d 'de' MMM", { locale: ptBR })}
                </CardTitle>
                <span className="text-sm text-[var(--theme-muted-foreground)]">
                  {format(weekStart, 'MMMM yyyy', { locale: ptBR })}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-3">
                {eventosPorDia.map(({ day, eventos }) => (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[380px] cursor-pointer rounded-2xl border p-3 transition ${
                      isSameDay(day, selectedDate)
                        ? 'border-[var(--theme-accent)] bg-[var(--theme-background-secondary)]'
                        : 'border-[var(--theme-border)] bg-[var(--theme-background)]'
                    }`}
                  >
                    <div className="mb-3 border-b border-[var(--theme-border)] pb-2">
                      <p className="text-xs uppercase text-[var(--theme-muted-foreground)]">
                        {format(day, 'EEE', { locale: ptBR })}
                      </p>
                      <p className="text-lg font-bold text-[var(--theme-foreground)]">
                        {format(day, 'd')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {eventos.slice(0, maxRows).map((evento) => {
                        const config = tipoConfig[evento.tipo];

                        return (
                          <div
                            key={evento.id}
                            className={`rounded-xl border p-2 text-xs shadow-sm ${config.cardClass}`}
                          >
                            <div className="font-semibold">{evento.titulo}</div>
                            <div className="mt-1 opacity-90">{getHourLabel(evento.data)}</div>
                            <div className="mt-1 truncate opacity-90">{evento.disciplina}</div>
                          </div>
                        );
                      })}

                      {eventos.length > maxRows && (
                        <div className="rounded-xl bg-[var(--theme-background-secondary)] px-3 py-2 text-xs text-[var(--theme-muted-foreground)]">
                          + {eventos.length - maxRows} eventos
                        </div>
                      )}

                      {eventos.length === 0 && (
                        <div className="rounded-xl border border-dashed border-[var(--theme-border)] px-3 py-8 text-center text-xs text-[var(--theme-muted-foreground)]">
                          Sem eventos
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px]">
            <CardHeader>
              <CardTitle className="text-xl">
                Detalhes de {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {eventosSelecionados.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--theme-border)] p-8 text-center text-[var(--theme-muted-foreground)]">
                  Nenhum evento nesta data.
                </div>
              ) : (
                eventosSelecionados.map((evento) => {
                  const config = tipoConfig[evento.tipo];
                  const Icon = config.icon;

                  return (
                    <div
                      key={evento.id}
                      className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={config.detailBadgeClass}>
                              <Icon className="mr-1 h-3 w-3" />
                              {config.label}
                            </Badge>
                            <Badge variant="outline">{evento.disciplina}</Badge>
                            <Badge variant="outline" className="gap-1">
                              <Clock3 className="h-3 w-3" />
                              {getHourLabel(evento.data)}
                            </Badge>
                          </div>

                          <h3 className="mt-3 text-lg font-semibold text-[var(--theme-foreground)]">
                            {evento.titulo}
                          </h3>

                          {evento.aulaTitulo && evento.tipo !== 'aula' ? (
                            <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">
                              Vinculado à aula: <strong>{evento.aulaTitulo}</strong>
                            </p>
                          ) : null}

                          <p className="mt-2 text-sm leading-6 text-[var(--theme-muted-foreground)]">
                            {evento.descricao}
                          </p>
                        </div>

                        {evento.duracao ? (
                          <div className="rounded-xl bg-[var(--theme-background-secondary)] px-3 py-2 text-sm font-medium">
                            {evento.duracao} min
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}