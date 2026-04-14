import { useState, useEffect } from 'react';
import {
  Plus,
  Loader,
  X,
  CheckSquare,
  Circle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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
import * as tarefasService from '../../../services/tarefas-pessoais-service';

type Status = 'backlog' | 'doing' | 'done';

const COLUNAS: { status: Status; label: string; icon: React.ElementType; cor: string }[] = [
  { status: 'backlog', label: 'A Fazer', icon: Circle, cor: '#6B7280' },
  { status: 'doing', label: 'Em Progresso', icon: Clock, cor: '#F59E0B' },
  { status: 'done', label: 'Concluído', icon: CheckSquare, cor: '#059669' },
];

const PRIORIDADE_COR: Record<string, string> = {
  baixa: '#6B7280',
  media: '#F59E0B',
  alta: '#EF4444',
};

export function TarefasPessoais() {
  const [tarefas, setTarefas] = useState<tarefasService.TarefaPessoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);

  const [novaForm, setNovaForm] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'media' as 'baixa' | 'media' | 'alta',
    categoria: 'pessoal' as tarefasService.CategoriaTarefaPessoal,
    dataVencimento: '',
    status: 'backlog' as Status,
  });

  useEffect(() => {
    carregarTarefas();
  }, []);

  const carregarTarefas = async () => {
    setIsLoading(true);
    try {
      setTarefas(await tarefasService.listarTarefasPessoais());
    } catch {
      toast.error('Erro ao carregar tarefas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!novaForm.titulo.trim()) {
      toast.error('Informe o título da tarefa');
      return;
    }
    try {
      const id = await tarefasService.criarTarefaPessoal({
        titulo: novaForm.titulo,
        descricao: novaForm.descricao,
        prioridade: novaForm.prioridade,
        categoria: novaForm.categoria,
        status: novaForm.status,
        dataVencimento: novaForm.dataVencimento ? new Date(novaForm.dataVencimento) : undefined,
        tags: [],
        checklist: [],
      });
      const nova: tarefasService.TarefaPessoal = {
        id,
        titulo: novaForm.titulo,
        descricao: novaForm.descricao,
        prioridade: novaForm.prioridade,
        categoria: novaForm.categoria,
        status: novaForm.status,
        dataVencimento: novaForm.dataVencimento ? new Date(novaForm.dataVencimento) : undefined,
        tags: [],
        checklist: [],
      };
      setTarefas((prev) => [...prev, nova]);
      setDialogOpen(false);
      setNovaForm({ titulo: '', descricao: '', prioridade: 'media', categoria: 'pessoal', dataVencimento: '', status: 'backlog' });
      toast.success('Tarefa criada!');
    } catch {
      toast.error('Erro ao criar tarefa');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tarefasService.deletarTarefaPessoal(id);
      setTarefas((prev) => prev.filter((t) => t.id !== id));
      toast.success('Tarefa excluída!');
    } catch {
      toast.error('Erro ao excluir tarefa');
    }
  };

  const handleMoveStatus = async (tarefa: tarefasService.TarefaPessoal, novoStatus: Status) => {
    try {
      await tarefasService.atualizarTarefaPessoal(tarefa.id!, { status: novoStatus });
      setTarefas((prev) => prev.map((t) => (t.id === tarefa.id ? { ...t, status: novoStatus } : t)));
    } catch {
      toast.error('Erro ao mover tarefa');
    }
  };

  const handleDragStart = (id: string) => setDragging(id);
  const handleDragEnd = () => setDragging(null);
  const handleDrop = async (status: Status) => {
    if (!dragging) return;
    const tarefa = tarefas.find((t) => t.id === dragging);
    if (tarefa && tarefa.status !== status) {
      await handleMoveStatus(tarefa, status);
    }
    setDragging(null);
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
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Tarefas Pessoais</h1>
          <p className="text-[var(--theme-muted-foreground)] mt-1">{tarefas.length} tarefas no total</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="gap-2"
          style={{ background: 'var(--theme-accent)', color: '#fff' }}
        >
          <Plus className="h-4 w-4" /> Nova Tarefa
        </Button>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUNAS.map(({ status, label, icon: Icon, cor }) => {
          const tarefasColuna = tarefas.filter((t) => t.status === status);
          return (
            <div
              key={status}
              className="flex flex-col rounded-xl p-4 min-h-[400px]"
              style={{ background: 'var(--theme-background-secondary)' }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" style={{ color: cor }} />
                  <h3 className="font-semibold text-[var(--theme-foreground)]">{label}</h3>
                </div>
                <Badge
                  className="text-xs"
                  style={{ background: `${cor}20`, color: cor }}
                >
                  {tarefasColuna.length}
                </Badge>
              </div>

              <div className="flex-1 space-y-2">
                {tarefasColuna.map((tarefa) => (
                  <div
                    key={tarefa.id}
                    draggable
                    onDragStart={() => handleDragStart(tarefa.id!)}
                    onDragEnd={handleDragEnd}
                    className="rounded-xl p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
                    style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-[var(--theme-foreground)] leading-tight">
                        {tarefa.titulo}
                      </p>
                      <button
                        onClick={() => handleDelete(tarefa.id!)}
                        className="flex-shrink-0 text-[var(--theme-muted-foreground)] hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {tarefa.descricao && (
                      <p className="text-xs text-[var(--theme-muted-foreground)] mb-2 line-clamp-2">
                        {tarefa.descricao}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge
                        className="text-xs py-0"
                        style={{
                          background: `${PRIORIDADE_COR[tarefa.prioridade]}20`,
                          color: PRIORIDADE_COR[tarefa.prioridade],
                        }}
                      >
                        {tarefa.prioridade}
                      </Badge>
                      <Badge variant="outline" className="text-xs py-0">
                        {tarefasService.CATEGORIAS_TAREFAS_LABELS[tarefa.categoria]}
                      </Badge>
                    </div>

                    {tarefa.dataVencimento && (
                      <p className="text-xs text-[var(--theme-muted-foreground)]">
                        Vence: {format(new Date(tarefa.dataVencimento), "d MMM", { locale: ptBR })}
                      </p>
                    )}

                    {/* Botões de movimentação */}
                    <div className="flex gap-1 mt-2 pt-2 border-t border-[var(--theme-border)]">
                      {COLUNAS.filter((c) => c.status !== status).map((col) => (
                        <button
                          key={col.status}
                          onClick={() => handleMoveStatus(tarefa, col.status)}
                          className="flex-1 text-xs rounded px-1 py-0.5 transition-colors hover:opacity-80"
                          style={{ background: `${col.cor}20`, color: col.cor }}
                        >
                          → {col.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {tarefasColuna.length === 0 && (
                  <div
                    className="flex items-center justify-center rounded-xl border-2 border-dashed py-8 text-sm"
                    style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-muted-foreground)' }}
                  >
                    Nenhuma tarefa aqui
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog Nova Tarefa */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Tarefa Pessoal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Título *</Label>
              <Input
                placeholder="O que precisa ser feito?"
                value={novaForm.titulo}
                onChange={(e) => setNovaForm((f) => ({ ...f, titulo: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                placeholder="Detalhes adicionais..."
                value={novaForm.descricao}
                onChange={(e) => setNovaForm((f) => ({ ...f, descricao: e.target.value }))}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prioridade</Label>
                <Select
                  value={novaForm.prioridade}
                  onValueChange={(v) => setNovaForm((f) => ({ ...f, prioridade: v as any }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={novaForm.categoria}
                  onValueChange={(v) => setNovaForm((f) => ({ ...f, categoria: v as any }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tarefasService.CATEGORIAS_TAREFAS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status inicial</Label>
                <Select
                  value={novaForm.status}
                  onValueChange={(v) => setNovaForm((f) => ({ ...f, status: v as any }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">A Fazer</SelectItem>
                    <SelectItem value="doing">Em Progresso</SelectItem>
                    <SelectItem value="done">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={novaForm.dataVencimento}
                  onChange={(e) => setNovaForm((f) => ({ ...f, dataVencimento: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              style={{ background: 'var(--theme-accent)', color: '#fff' }}
            >
              Criar Tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
