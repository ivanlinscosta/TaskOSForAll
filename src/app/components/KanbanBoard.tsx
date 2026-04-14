import { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { mockTasks } from '../../../lib/mockData';
import { Task } from '../../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Plus, GripVertical, Calendar, Tag, CheckCircle2, Circle, Loader } from 'lucide-react';
import { cn, formatDate } from '../../../lib/utils';
import { toast } from 'sonner';
import * as tarefasService from '../../../services/tarefas-firebase-service';
import { useAuth } from '../../../lib/auth-context';

interface KanbanBoardProps {
  context: 'fiap' | 'itau';
}

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
}

const TaskCard = ({ task, onUpdate, onStatusChange }: TaskCardProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const completedItems = task.checklist.filter((item) => item.completed).length;

  return (
    <div
      ref={drag}
      className={cn(
        'cursor-move transition-opacity',
        isDragging && 'opacity-50'
      )}
    >
      <Dialog>
        <DialogTrigger asChild>
          <Card className="mb-3 hover:shadow-md transition-all hover:border-primary cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start gap-2 mb-2">
                <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    task.priority === 'high' && 'border-red-500 text-red-700',
                    task.priority === 'medium' && 'border-yellow-500 text-yellow-700',
                    task.priority === 'low' && 'border-gray-500 text-gray-700'
                  )}
                >
                  {task.priority === 'high'
                    ? 'Alta'
                    : task.priority === 'medium'
                    ? 'Média'
                    : 'Baixa'}
                </Badge>

                {task.checklist.length > 0 && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {completedItems}/{task.checklist.length}
                  </Badge>
                )}
              </div>

              {task.dueDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.dueDate)}
                </div>
              )}

              {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {task.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{task.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </DialogTrigger>

        {/* Task Detail Modal */}
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{task.title}</DialogTitle>
            <DialogDescription>Detalhes da tarefa</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={task.description}
                  className="mt-2"
                  rows={3}
                  readOnly
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prioridade</Label>
                  <Select value={task.priority} disabled>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={task.status} disabled>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="doing">Em Progresso</SelectItem>
                      <SelectItem value="done">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {task.dueDate && (
                <div>
                  <Label>Prazo</Label>
                  <Input
                    type="text"
                    value={formatDate(task.dueDate)}
                    className="mt-2"
                    readOnly
                  />
                </div>
              )}

              {task.checklist.length > 0 && (
                <div>
                  <Label>Checklist ({completedItems}/{task.checklist.length})</Label>
                  <div className="space-y-2 mt-2">
                    {task.checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Checkbox checked={item.completed} disabled />
                        <span className={cn(
                          'text-sm',
                          item.completed && 'line-through text-muted-foreground'
                        )}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {task.tags.length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface ColumnProps {
  title: string;
  status: Task['status'];
  tasks: Task[];
  count: number;
  onDrop: (taskId: string, newStatus: Task['status']) => void;
  onUpdate: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
}

const KanbanColumn = ({ title, status, tasks, count, onDrop, onUpdate, onStatusChange }: ColumnProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: { id: string; status: string }) => {
      if (item.status !== status) {
        onDrop(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={cn(
        'flex-1 min-w-[320px] transition-colors',
        isOver && 'opacity-80'
      )}
    >
      <Card className={cn('h-full', isOver && 'border-primary')}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="secondary">{count}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-2">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Circle className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma tarefa
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onUpdate={onUpdate}
                  onStatusChange={onStatusChange}
                />
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default function KanbanBoard({ context }: KanbanBoardProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(
    mockTasks.filter((t) => t.context === context)
  );
  const [isLoading, setIsLoading] = useState(false);

  // Carregar tarefas do Firebase ao montar o componente
  useEffect(() => {
    loadTasks();
  }, [context]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const firebaseTasks = await tarefasService.listTasksByContext(context);
      if (firebaseTasks.length > 0) {
        setTasks(firebaseTasks);
      }
    } catch (error) {
      console.warn('Erro ao carregar tarefas do Firebase, usando mock:', error);
      // Manter as tarefas mock se houver erro
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (taskId: string, newStatus: Task['status']) => {
    try {
      // Atualizar estado local imediatamente
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );

      // Persistir no Firebase
      if (user) {
        await tarefasService.updateTaskStatus(taskId, newStatus);
        
        // Mostrar mensagem de sucesso
        const statusLabel = {
          'backlog': 'Backlog',
          'doing': 'Em Progresso',
          'done': 'Concluído'
        }[newStatus];
        
        toast.success(`Tarefa movida para ${statusLabel}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast.error('Erro ao atualizar tarefa');
      // Recarregar tarefas em caso de erro
      loadTasks();
    }
  };

  const handleUpdate = (updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    handleDrop(taskId, newStatus);
  };

  const backlogTasks = tasks.filter((t) => t.status === 'backlog');
  const doingTasks = tasks.filter((t) => t.status === 'doing');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Kanban {context === 'fiap' ? 'FIAP' : 'Itaú'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  Carregando tarefas...
                </span>
              ) : (
                `${tasks.length} tarefas • ${doingTasks.length} em progresso`
              )}
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-6 overflow-x-auto pb-4">
          <KanbanColumn
            title="Backlog"
            status="backlog"
            tasks={backlogTasks}
            count={backlogTasks.length}
            onDrop={handleDrop}
            onUpdate={handleUpdate}
            onStatusChange={handleStatusChange}
          />
          <KanbanColumn
            title="Em Progresso"
            status="doing"
            tasks={doingTasks}
            count={doingTasks.length}
            onDrop={handleDrop}
            onUpdate={handleUpdate}
            onStatusChange={handleStatusChange}
          />
          <KanbanColumn
            title="Concluído"
            status="done"
            tasks={doneTasks}
            count={doneTasks.length}
            onDrop={handleDrop}
            onUpdate={handleUpdate}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </DndProvider>
  );
}
