import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Loader } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../../lib/auth-context';
import * as tarefasService from '../../../services/tarefas-firebase-service';

export function NovaTarefaItau() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'medium',
    categoria: '',
    squad: '',
    sprint: '',
    dataEntrega: '',
    responsavel: '',
    status: 'backlog',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.descricao) {
      toast.error('Preencha título e descrição');
      return;
    }

    try {
      setIsSaving(true);
      const tags: string[] = [];
      if (formData.categoria) tags.push(formData.categoria);
      if (formData.squad) tags.push(formData.squad);
      if (formData.sprint) tags.push(formData.sprint);

      const taskData = {
        id: '',
        title: formData.titulo,
        description: formData.descricao,
        status: formData.status as 'backlog' | 'doing' | 'done',
        priority: formData.prioridade as 'low' | 'medium' | 'high',
        context: 'itau' as const,
        tags,
        dueDate: formData.dataEntrega ? new Date(formData.dataEntrega) : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        checklist: [],
        assignedTo: formData.responsavel || undefined,
      };

      await tarefasService.createTask(taskData, user?.uid || '');
      toast.success('Tarefa criada com sucesso!');
      navigate('/itau/kanban');
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/itau/kanban')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Nova Tarefa</h1>
          <p className="text-[var(--theme-muted-foreground)] mt-1">Adicione uma nova tarefa ao kanban Itaú</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>Informações da Tarefa</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input id="titulo" placeholder="Ex: Implementar API de pagamentos" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea id="descricao" placeholder="Descreva os detalhes da tarefa..." value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} required rows={4} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="squad">Squad</Label>
                <Input id="squad" placeholder="Ex: Payments Squad" value={formData.squad} onChange={(e) => setFormData({ ...formData, squad: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sprint">Sprint</Label>
                <Input id="sprint" placeholder="Ex: Sprint 42" value={formData.sprint} onChange={(e) => setFormData({ ...formData, sprint: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade *</Label>
                <select id="prioridade" className="w-full px-3 py-2 rounded-md border border-[var(--theme-border)] bg-[var(--theme-background)] text-[var(--theme-foreground)]" value={formData.prioridade} onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })} required>
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <select id="categoria" className="w-full px-3 py-2 rounded-md border border-[var(--theme-border)] bg-[var(--theme-background)] text-[var(--theme-foreground)]" value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}>
                  <option value="">Selecione...</option>
                  <option value="Backend">Backend</option>
                  <option value="Frontend">Frontend</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Design">Design</option>
                  <option value="QA">QA</option>
                  <option value="Infraestrutura">Infraestrutura</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataEntrega">Data de Entrega</Label>
                <Input id="dataEntrega" type="date" value={formData.dataEntrega} onChange={(e) => setFormData({ ...formData, dataEntrega: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status Inicial *</Label>
                <select id="status" className="w-full px-3 py-2 rounded-md border border-[var(--theme-border)] bg-[var(--theme-background)] text-[var(--theme-foreground)]" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} required>
                  <option value="backlog">Backlog</option>
                  <option value="doing">Em Progresso</option>
                  <option value="done">Concluído</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/itau/kanban')}>Cancelar</Button>
          <Button type="submit" variant="theme" disabled={isSaving} className="gap-2">
            {isSaving && <Loader className="w-4 h-4 animate-spin" />}
            {isSaving ? 'Salvando...' : 'Criar Tarefa'}
          </Button>
        </div>
      </form>
    </div>
  );
}
