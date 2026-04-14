import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Circle, Clock, CheckCircle2, GripVertical, Loader, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../../lib/cn';
import { toast } from 'sonner';
import { useAuth } from '../../../lib/auth-context';
import * as tarefasService from '../../../services/tarefas-firebase-service';
import { Task } from '../../../types';
import { mockTasks } from '../../../lib/mockData';

export function KanbanFIAP() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tarefas, setTarefas] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const columns = [
    { id: 'backlog' as const, title: 'Backlog', icon: Circle, color: 'text-gray-500' },
    { id: 'doing' as const, title: 'Em Progresso', icon: Clock, color: 'text-yellow-500' },
    { id: 'done' as const, title: 'Concluído', icon: CheckCircle2, color: 'text-green-500' },
  ];

  useEffect(() => {
    carregarTarefas();
  }, []);

  const carregarTarefas = async () => {
    try {
      setIsLoading(true);
      const tarefasFirebase = await tarefasService.listTasksByContext('fiap');
      if (tarefasFirebase && tarefasFirebase.length > 0) {
        setTarefas(tarefasFirebase);
      } else {
        setTarefas(mockTasks.filter(t => t.context === 'fiap'));
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      setTarefas(mockTasks.filter(t => t.context === 'fiap'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    if (e.currentTarget instanceof HTMLElement) {
      setTimeout(() => { e.currentTarget.style.opacity = '0.4'; }, 0);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, newStatus: 'backlog' | 'doing' | 'done') => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedTask || draggedTask.status === newStatus) return;

    const oldStatus = draggedTask.status;
    const taskId = draggedTask.id;

    // Optimistic update
    setTarefas(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await tarefasService.updateTaskStatus(taskId, newStatus);
      toast.success(`Tarefa movida para "${columns.find(c => c.id === newStatus)?.title}"`);
    } catch (error) {
      console.error('Erro ao mover tarefa:', error);
      setTarefas(prev => prev.map(t => t.id === taskId ? { ...t, status: oldStatus } : t));
      toast.error('Erro ao mover tarefa');
    }
    setDraggedTask(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    try {
      await tarefasService.deleteTask(taskId);
      setTarefas(prev => prev.filter(t => t.id !== taskId));
      toast.success('Tarefa excluída!');
    } catch (error) {
      toast.error('Erro ao excluir tarefa');
    }
  };

  const getPrioridadeColor = (p: string) => {
    const c: Record<string, string> = { low: 'bg-gray-500', medium: 'bg-blue-500', high: 'bg-orange-500', baixa: 'bg-gray-500', media: 'bg-blue-500', alta: 'bg-orange-500', critica: 'bg-red-500' };
    return c[p] || 'bg-gray-500';
  };

  const getPrioridadeLabel = (p: string) => {
    const l: Record<string, string> = { low: 'Baixa', medium: 'Média', high: 'Alta', baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica' };
    return l[p] || p;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-8 h-8 animate-spin text-[var(--theme-accent)]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Kanban FIAP</h1>
          <p className="text-[var(--theme-muted-foreground)] mt-1">Arraste as tarefas entre as colunas para alterar o status</p>
        </div>
        <Button variant="theme" className="gap-2" onClick={() => navigate('/fiap/kanban/nova')}>
          <Plus className="w-4 h-4" /> Nova Tarefa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(column => {
          const columnTarefas = tarefas.filter(t => t.status === column.id);
          const Icon = column.icon;
          return (
            <div
              key={column.id}
              className="space-y-4"
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <Card className="bg-[var(--theme-background-secondary)]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-5 h-5", column.color)} />
                      <span>{column.title}</span>
                    </div>
                    <Badge variant="secondary">{columnTarefas.length}</Badge>
                  </CardTitle>
                </CardHeader>
              </Card>

              <div className={cn(
                "space-y-3 min-h-[200px] p-2 rounded-lg transition-all",
                dragOverColumn === column.id && "bg-[var(--theme-accent)]/10 border-2 border-dashed border-[var(--theme-accent)]"
              )}>
                {columnTarefas.map(tarefa => (
                  <Card
                    key={tarefa.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, tarefa)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "cursor-grab active:cursor-grabbing hover:shadow-lg transition-all group",
                      draggedTask?.id === tarefa.id && "opacity-40"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <GripVertical className="w-4 h-4 text-[var(--theme-muted-foreground)] mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-[var(--theme-foreground)] text-sm">{tarefa.title}</h4>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getPrioridadeColor(tarefa.priority))} />
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(tarefa.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-[var(--theme-muted-foreground)] line-clamp-2">{tarefa.description}</p>
                          {tarefa.checklist && tarefa.checklist.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs text-[var(--theme-muted-foreground)]">
                                <span>Progresso</span>
                                <span>{tarefa.checklist.filter(c => c.completed).length}/{tarefa.checklist.length}</span>
                              </div>
                              <div className="w-full h-1.5 bg-[var(--theme-muted)] rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--theme-accent)] transition-all" style={{ width: `${(tarefa.checklist.filter(c => c.completed).length / tarefa.checklist.length) * 100}%` }} />
                              </div>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="text-[10px]">{getPrioridadeLabel(tarefa.priority)}</Badge>
                            {tarefa.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {columnTarefas.length === 0 && (
                  <div className="text-center py-8 text-sm text-[var(--theme-muted-foreground)]">
                    {dragOverColumn === column.id ? 'Solte aqui!' : 'Nenhuma tarefa'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
