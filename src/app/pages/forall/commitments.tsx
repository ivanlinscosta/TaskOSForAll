import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Loader, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import * as gcalService from '../../../services/google-calendar-service';
import { useAuth } from '../../../lib/auth-context';
import { listWorkspaceEntity } from '../../../services/forall-data-service';
import { listarViagens } from '../../../services/viagens-service';
import { listarTarefasPessoais } from '../../../services/tarefas-pessoais-service';

type EventItem = {
  id: string;
  title: string;
  description?: string;
  date: Date;
  type: 'reuniao' | 'tarefa' | 'viagem' | 'google' | 'apple';
};

const TYPE_META: Record<EventItem['type'], { label: string; badgeClass: string; cardClass: string }> = {
  reuniao: {
    label: 'Reunião',
    badgeClass: 'bg-blue-100 text-blue-700',
    cardClass: 'border-blue-200 bg-blue-500 text-white',
  },
  tarefa: {
    label: 'Prazo',
    badgeClass: 'bg-orange-100 text-orange-700',
    cardClass: 'border-orange-200 bg-orange-500 text-white',
  },
  viagem: {
    label: 'Viagem',
    badgeClass: 'bg-violet-100 text-violet-700',
    cardClass: 'border-violet-200 bg-violet-500 text-white',
  },
  google: {
    label: 'Google',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    cardClass: 'border-emerald-200 bg-emerald-500 text-white',
  },
  apple: {
    label: 'Apple',
    badgeClass: 'bg-gray-100 text-gray-700',
    cardClass: 'border-gray-200 bg-gray-700 text-white',
  },
};

function parseICS(text: string): EventItem[] {
  const events: EventItem[] = [];
  const blocks = text.split('BEGIN:VEVENT');
  blocks.slice(1).forEach((block, i) => {
    const get = (key: string) => {
      const match = block.match(new RegExp(`${key}[^:]*:([^\r\n]+)`));
      return match ? match[1].trim() : '';
    };
    const parseICSDate = (raw: string): Date | null => {
      const clean = raw.replace(/[TZ]/g, '');
      if (clean.length >= 8) {
        const y = +clean.slice(0, 4), mo = +clean.slice(4, 6) - 1, d = +clean.slice(6, 8);
        const h = +clean.slice(8, 10) || 0, min = +clean.slice(10, 12) || 0;
        const dt = new Date(y, mo, d, h, min);
        return isNaN(dt.getTime()) ? null : dt;
      }
      return null;
    };
    const title = get('SUMMARY').replace(/\\n/g, ' ').replace(/\\,/g, ',') || 'Evento Apple';
    const description = get('DESCRIPTION').replace(/\\n/g, ' ').replace(/\\,/g, ',');
    const date = parseICSDate(get('DTSTART'));
    if (date) {
      events.push({ id: `apple-${i}-${Date.now()}`, title, description: description || undefined, date, type: 'apple' });
    }
  });
  return events;
}

function tryParseDate(value: any) {
  if (!value) return null;
  const date =
    typeof value?.toDate === 'function'
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function ForAllCommitmentsPage() {
  const navigate = useNavigate();
  const { workspace = 'life' } = useParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [gcalConnected, setGcalConnected] = useState(gcalService.isCalendarConnected());
  const [gcalLoading, setGcalLoading] = useState(false);
  const [appleImported, setAppleImported] = useState(false);
  const appleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadEvents();
  }, [user?.uid, workspace]);

  const loadEvents = async () => {
    if (!user?.uid) return;
    try {
      setIsLoading(true);
      const [meetings, tasks, wsTrips, directViagens, tarefasPessoais] = await Promise.all([
        listWorkspaceEntity(user.uid, 'meetings', workspace === 'work' ? 'work' : 'life'),
        listWorkspaceEntity(user.uid, 'tasks', workspace === 'work' ? 'work' : 'life'),
        listWorkspaceEntity(user.uid, 'trips', workspace === 'work' ? 'work' : 'life'),
        listarViagens(),
        listarTarefasPessoais(),
      ]);

      const normalized: EventItem[] = [];

      meetings.forEach((item) => {
        const date = tryParseDate(item.data || item.dateText);
        if (date) {
          normalized.push({
            id: `meeting-${item.id}`,
            title: item.titulo || item.title || 'Reunião',
            description: item.descricao || item.description || '',
            date,
            type: 'reuniao',
          });
        }
      });

      tasks.forEach((item) => {
        const date = tryParseDate(item.dataVencimento || item.dueDate || item.dueDateText);
        if (date) {
          normalized.push({
            id: `task-${item.id}`,
            title: item.title || item.titulo || 'Tarefa',
            description: item.description || item.descricao || '',
            date,
            type: 'tarefa',
          });
        }
      });

      // Tarefas pessoais com vencimento
      tarefasPessoais.forEach((t) => {
        if (t.dataVencimento && t.status !== 'done') {
          const date = tryParseDate(t.dataVencimento);
          if (date) {
            normalized.push({
              id: `ptask-${t.id}`,
              title: t.titulo,
              description: t.descricao || '',
              date,
              type: 'tarefa',
            });
          }
        }
      });

      // Viagens do workspace (listWorkspaceEntity)
      const tripIds = new Set<string>();
      wsTrips.forEach((item) => {
        const date = tryParseDate(item.dataIda);
        if (date) {
          tripIds.add(item.id);
          normalized.push({
            id: `trip-${item.id}`,
            title: item.destino || item.title || 'Viagem',
            description: item.descricao || item.objetivo || '',
            date,
            type: 'viagem',
          });
        }
      });

      // Viagens diretas (planejadas com IA e outras) — evita duplicatas
      directViagens.forEach((v) => {
        if (tripIds.has(v.id!)) return;
        const date = tryParseDate(v.dataIda);
        if (date) {
          normalized.push({
            id: `trip-${v.id}`,
            title: `✈️ ${v.destino}`,
            description: v.descricao || '',
            date,
            type: 'viagem',
          });
          // Também adicionar data de volta como evento
          if (v.dataVolta) {
            const volta = tryParseDate(v.dataVolta);
            if (volta) {
              normalized.push({
                id: `trip-volta-${v.id}`,
                title: `🏠 Volta: ${v.destino}`,
                description: '',
                date: volta,
                type: 'viagem',
              });
            }
          }
        }
      });

      // Carregar eventos do Google Calendar se conectado
      if (gcalService.isCalendarConnected()) {
        try {
          const now = new Date();
          const twoMonths = new Date(now);
          twoMonths.setMonth(twoMonths.getMonth() + 2);
          const gcalEvents = await gcalService.listarEventosCalendar(
            new Date(now.getFullYear(), now.getMonth() - 1, 1),
            twoMonths,
          );
          gcalEvents.forEach((ge) => {
            const dateStr = ge.start.dateTime || ge.start.date;
            const date = tryParseDate(dateStr);
            if (date) {
              normalized.push({
                id: `gcal-${ge.id}`,
                title: ge.summary || 'Evento Google',
                description: ge.description || '',
                date,
                type: 'google',
              });
            }
          });
        } catch (err) {
          console.warn('[Google Calendar] Erro ao carregar eventos:', err);
        }
      }

      setEvents(normalized.sort((a, b) => a.date.getTime() - b.date.getTime()));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGoogleCalendar = async () => {
    setGcalLoading(true);
    try {
      await gcalService.getCalendarAccessToken();
      setGcalConnected(true);
      toast.success('Google Calendar conectado! Recarregando eventos...');
      await loadEvents();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao conectar com o Google Calendar');
    } finally {
      setGcalLoading(false);
    }
  };

  const handleAppleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const imported = parseICS(text);
      if (imported.length === 0) {
        toast.error('Nenhum evento encontrado no arquivo .ics.');
        return;
      }
      setEvents((prev) => {
        const withoutOldApple = prev.filter((ev) => ev.type !== 'apple');
        return [...withoutOldApple, ...imported];
      });
      setAppleImported(true);
      toast.success(`${imported.length} evento(s) importado(s) do Apple Calendar.`);
    } catch {
      toast.error('Erro ao ler o arquivo. Verifique se é um .ics válido.');
    }
  };

  const weekStart = startOfWeek(weekAnchor, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const selectedEvents = events.filter((event) => isSameDay(event.date, selectedDate));
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
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Compromissos</h1>
          <p className="mt-1 text-[var(--theme-muted-foreground)]">
            Agenda do workspace <strong>{workspaceLabel}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sincronizar com outras agendas */}
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-background-secondary)] px-3 py-1.5">
            <span className="text-xs text-[var(--theme-muted-foreground)] mr-1">Sincronizar com outras agendas</span>
            {gcalConnected ? (
              <Badge className="bg-emerald-100 text-emerald-700 gap-1 text-xs px-2 py-0.5">
                <CalendarDays className="h-3 w-3" /> Google
              </Badge>
            ) : (
              <button
                onClick={handleConnectGoogleCalendar}
                disabled={gcalLoading}
                title="Conectar Google Calendar"
                className="flex items-center gap-1.5 rounded-lg border border-[var(--theme-border)] bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700"
              >
                {/* Google Calendar icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="3" fill="white" stroke="#E0E0E0"/>
                  <rect x="3" y="8" width="18" height="2" fill="#4285F4"/>
                  <rect x="7" y="3" width="2" height="4" rx="1" fill="#4285F4"/>
                  <rect x="15" y="3" width="2" height="4" rx="1" fill="#4285F4"/>
                  <text x="12" y="19" textAnchor="middle" fontSize="7" fontWeight="700" fill="#4285F4">G</text>
                </svg>
                {gcalLoading ? 'Conectando...' : 'Google'}
              </button>
            )}
            {appleImported ? (
              <Badge className="bg-gray-100 text-gray-700 gap-1 text-xs px-2 py-0.5">
                <CalendarDays className="h-3 w-3" /> Apple importado
              </Badge>
            ) : (
              <button
                onClick={() => appleInputRef.current?.click()}
                title="Importar .ics do Apple Calendar"
                className="flex items-center gap-1.5 rounded-lg border border-[var(--theme-border)] bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="4" width="20" height="18" rx="3" fill="white" stroke="#E0E0E0"/>
                  <rect x="2" y="4" width="20" height="6" rx="3" fill="#FF3B30"/>
                  <rect x="2" y="8" width="20" height="2" fill="#FF3B30"/>
                  <text x="12" y="10" textAnchor="middle" fontSize="4" fontWeight="700" fill="white">APR</text>
                  <text x="12" y="19" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1C1C1E">18</text>
                </svg>
                Apple
              </button>
            )}
            <input
              ref={appleInputRef}
              type="file"
              accept=".ics"
              className="hidden"
              onChange={handleAppleFileChange}
            />
          </div>

          <Button variant="outline" className="gap-2" onClick={() => navigate(`/chat?workspace=${workspace}`)}>
            <Sparkles className="h-4 w-4" />
            Chat guiado
          </Button>
          <Button className="gap-2" style={{ background: 'var(--theme-accent)', color: 'var(--theme-accent-foreground)' }} onClick={() => navigate(`/chat?workspace=${workspace}`)}>
            <Plus className="h-4 w-4" />
            Novo compromisso
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className={TYPE_META.reuniao.badgeClass}>Reuniões</Badge>
        <Badge className={TYPE_META.tarefa.badgeClass}>Prazos</Badge>
        <Badge className={TYPE_META.viagem.badgeClass}>Viagens</Badge>
        {gcalConnected && <Badge className={TYPE_META.google.badgeClass}>Google Calendar</Badge>}
        {appleImported && <Badge className={TYPE_META.apple.badgeClass}>Apple Calendar</Badge>}
      </div>

      <Card className="overflow-hidden rounded-[28px]">
        <CardHeader className="border-b border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-2xl">
              Semana de {format(weekStart, "d 'de' MMM", { locale: ptBR })} até {format(addDays(weekStart, 6), "d 'de' MMM", { locale: ptBR })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setWeekAnchor(addDays(weekAnchor, -7))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => { setWeekAnchor(new Date()); setSelectedDate(new Date()); }}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={() => setWeekAnchor(addDays(weekAnchor, 7))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-7">
            {weekDays.map((day) => {
              const dayEvents = events.filter((event) => isSameDay(event.date, day));
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[260px] cursor-pointer rounded-2xl border p-3 transition ${
                    isSameDay(day, selectedDate)
                      ? 'border-[var(--theme-accent)] bg-[var(--theme-background-secondary)]'
                      : 'border-[var(--theme-border)] bg-[var(--theme-background)]'
                  }`}
                >
                  <div className="mb-3 border-b border-[var(--theme-border)] pb-2">
                    <p className="text-xs uppercase text-[var(--theme-muted-foreground)]">{format(day, 'EEEEEE', { locale: ptBR })}</p>
                    <p className="text-3xl font-bold text-[var(--theme-foreground)]">{format(day, 'd')}</p>
                  </div>

                  <div className="space-y-2">
                    {dayEvents.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[var(--theme-border)] px-3 py-8 text-center text-xs text-[var(--theme-muted-foreground)]">
                        Sem eventos
                      </div>
                    ) : (
                      dayEvents.map((event) => {
                        const meta = TYPE_META[event.type];
                        return (
                          <div key={event.id} className={`rounded-xl border p-2 text-xs shadow-sm ${meta.cardClass}`}>
                            <div className="font-semibold">{event.title}</div>
                            <div className="mt-1 opacity-90">{meta.label}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
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
          {selectedEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--theme-border)] p-8 text-center text-[var(--theme-muted-foreground)]">
              Nenhum evento nesta data.
            </div>
          ) : (
            selectedEvents.map((event) => {
              const meta = TYPE_META[event.type];
              return (
                <div key={event.id} className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={meta.badgeClass}>{meta.label}</Badge>
                    <Badge variant="outline" className="gap-1">
                      <Clock3 className="h-3 w-3" />
                      {format(event.date, 'HH:mm')}
                    </Badge>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-[var(--theme-foreground)]">{event.title}</h3>
                  {event.description ? (
                    <p className="mt-2 text-sm leading-6 text-[var(--theme-muted-foreground)]">{event.description}</p>
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
