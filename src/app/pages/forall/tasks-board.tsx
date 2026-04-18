import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Plus,
  Loader,
  X,
  CheckSquare,
  Circle,
  Clock3,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../../lib/auth-context';
import { listWorkspaceEntity, createOwnedRecord } from '../../../services/forall-data-service';
import { COLLECTIONS } from '../../../lib/firebase-config';

type Status = 'backlog' | 'doing' | 'done';

type TaskRecord = {
  id?: string;
  collectionName?: string;
  title: string;
  description?: string;
  priority: 'baixa' | 'media' | 'alta' | 'low' | 'medium' | 'high';
  status: Status;
  dueDateText?: string;
  workspaceType: 'work' | 'life';
};

const COLUNAS: { status: Status; label: string; icon: React.ElementType; color: string }[] = [
  { status: 'backlog', label: 'A Fazer', icon: Circle, color: '#6B7280' },
  { status: 'doing', label: 'Em progresso', icon: Clock3, color: '#F59E0B' },
  { status: 'done', label: 'Concluído', icon: CheckSquare, color: '#0D5C7A' },
];

const PRIORITY_COLORS: Record<string, string> = {
  baixa: '#6B7280',
  low: '#6B7280',
  media: '#F59E0B',
  medium: '#F59E0B',
  alta: '#EF4444',
  high: '#EF4444',
};

function getPriorityLabel(priority: string) {
  const map: Record<string, string> = {
    baixa: 'Baixa',
    low: 'Baixa',
    media: 'Média',
    medium: 'Média',
    alta: 'Alta',
    high: 'Alta',
  };
  return map[priority] || priority;
}

export function ForAllTasksBoard() {
  const navigate = useNavigate();
  const { workspace = 'life' } = useParams();
  const { user, userProfile } = useAuth();

  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'media',
    dueDateText: '',
    status: 'backlog' as Status,
  });

  const collectionName = workspace === 'work' ? COLLECTIONS.TAREFAS : COLLECTIONS.TAREFAS_PESSOAIS;
  const workspaceLabel = workspace === 'work' ? 'Trabalho' : 'Vida pessoal';

  useEffect(() => {
    void loadTasks();
  }, [user?.uid, workspace]);

  const loadTasks = async () => {
    if (!user?.uid) return;
    try {
      setIsLoading(true);
      const data = await listWorkspaceEntity(user.uid, 'tasks', workspace === 'work' ? 'work' : 'life');
      const normalized = data.map((item) => ({
        id: item.id,
        collectionName: item.collectionName,
        title: item.title || item.titulo || '',
        description: item.description || item.descricao || '',
        priority: item.priority || item.prioridade || 'media',
        status: item.status || 'backlog',
        dueDateText: item.dueDateText || item.prazo || '',
        workspaceType: item.workspaceType || workspace,
      }));
      setTasks(normalized as TaskRecord[]);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar tarefas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user?.uid || !form.title.trim()) {
      toast.error('Informe o título da tarefa');
      return;
    }

    try {
      const id = await createOwnedRecord(collectionName, {
        ownerId: user.uid,
        ownerName: userProfile?.nome || user.displayName || '',
        ownerGoals:
          workspace === 'work'
            ? userProfile?.preferencias?.workGoals || []
            : userProfile?.preferencias?.lifeGoals || [],
        workspaceType: workspace === 'work' ? 'work' : 'life',
        title: form.title,
        description: form.description,
        dueDateText: form.dueDateText,
        priority: form.priority,
        status: form.status,
        source: 'manual_form',
      });

      setTasks((prev) => [
        {
          id,
          title: form.title,
          description: form.description,
          priority: form.priority as any,
          status: form.status,
          dueDateText: form.dueDateText,
          workspaceType: workspace as any,
          collectionName,
        },
        ...prev,
      ]);

      setDialogOpen(false);
      setForm({ title: '', description: '', priority: 'media', dueDateText: '', status: 'backlog' });
      toast.success('Tarefa criada com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar tarefa');
    }
  };

  const updateTaskStatusLocal = (taskId: string, newStatus: Status) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)));
  };

  const handleDrop = (status: Status) => {
    if (!dragging) return;
    updateTaskStatusLocal(dragging, status);
    setDragging(null);
    toast.success('Status atualizado na visualização');
  };

  const summary = useMemo(() => {
    return {
      total: tasks.length,
      backlog: tasks.filter((t) => t.status === 'backlog').length,
      doing: tasks.filter((t) => t.status === 'doing').length,
      done: tasks.filter((t) => t.status === 'done').length,
    };
  }, [tasks]);

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
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Tarefas</h1>
          <p className="mt-1 text-[var(--theme-muted-foreground)]">
            Quadro kanban do workspace <strong>{workspaceLabel}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate(`/chat?action=tarefa&workspace=${workspace}`)}>
            <Sparkles className="h-4 w-4" />
            Chat guiado
          </Button>
          <Button className="gap-2" style={{ background: 'var(--theme-accent)', color: 'var(--theme-accent-foreground)' }} onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova tarefa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: 'Total', value: summary.total },
          { label: 'A fazer', value: summary.backlog },
          { label: 'Em progresso', value: summary.doing },
          { label: 'Concluídas', value: summary.done },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-sm text-[var(--theme-muted-foreground)]">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-[var(--theme-foreground)]">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {COLUNAS.map(({ status, label, icon: Icon, color }) => {
          const colTasks = tasks.filter((task) => task.status === status);
          return (
            <div
              key={status}
              className="min-h-[480px] rounded-[28px] bg-[var(--theme-background-secondary)] p-4 shadow-sm"
              style={{ border: '0.75px solid #EDEAE4' }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status)}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" style={{ color }} />
                  <h3 className="text-xl font-semibold text-[var(--theme-foreground)]">{label}</h3>
                </div>
                <Badge variant="outline">{colTasks.length}</Badge>
              </div>

              <div className="space-y-3">
                {colTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-background)] px-4 py-10 text-center text-sm text-[var(--theme-muted-foreground)]">
                    Nenhuma tarefa aqui
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDragging(task.id || null)}
                      onDragEnd={() => setDragging(null)}
                      className="cursor-grab rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-[var(--theme-foreground)]">{task.title}</p>
                          {task.description ? (
                            <p className="mt-2 text-sm leading-6 text-[var(--theme-muted-foreground)]">
                              {task.description}
                            </p>
                          ) : null}
                        </div>
                        <button
                          onClick={() => setTasks((prev) => prev.filter((item) => item.id !== task.id))}
                          className="text-[var(--theme-muted-foreground)] hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge
                          className="rounded-full px-3 py-1 text-xs"
                          style={{
                            background: `${PRIORITY_COLORS[task.priority] || '#6B7280'}20`,
                            color: PRIORITY_COLORS[task.priority] || '#6B7280',
                          }}
                        >
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        <Badge variant="outline">{workspaceLabel}</Badge>
                      </div>

                      {task.dueDateText ? (
                        <p className="mt-3 text-xs text-[var(--theme-muted-foreground)]">
                          Vence: {task.dueDateText}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nova tarefa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={4} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(value) => setForm((prev) => ({ ...prev, priority: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status inicial</Label>
                <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as Status }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">A fazer</SelectItem>
                    <SelectItem value="doing">Em progresso</SelectItem>
                    <SelectItem value="done">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prazo</Label>
                <Input value={form.dueDateText} onChange={(e) => setForm((prev) => ({ ...prev, dueDateText: e.target.value }))} placeholder="Ex.: 20 abr" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} style={{ background: 'var(--theme-accent)', color: 'var(--theme-accent-foreground)' }}>
              Salvar tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
