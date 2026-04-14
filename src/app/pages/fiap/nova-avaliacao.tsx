import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { toast } from 'sonner';
import * as alunosService from '../../../services/alunos-service';
import { mockAlunos } from '../../../lib/mock-data';

export function NovaAvaliacao() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [aluno, setAluno] = useState<any>(null);

  const [formData, setFormData] = useState({
    disciplina: '',
    tipo: '',
    nota: '',
    peso: '1',
    data: new Date().toISOString().split('T')[0],
    comentario: '',
    participacao: '',
    engajamento: '',
    entrega: '',
    frequencia: '',
  });

  useEffect(() => {
    if (id) carregarAluno();
  }, [id]);

  const carregarAluno = async () => {
    try {
      setIsLoading(true);

      const alunoFirebase = await alunosService.buscarAlunoPorId(id || '');

      if (alunoFirebase) {
        setAluno(alunoFirebase);
        return;
      }

      const alunoMock = mockAlunos.find((a) => a.id === id);
      if (alunoMock) {
        setAluno(alunoMock);
        return;
      }

      toast.error('Aluno não encontrado');
      navigate('/fiap/alunos');
    } catch (error) {
      console.error('Erro ao carregar aluno:', error);
      toast.error('Erro ao carregar aluno');
      navigate('/fiap/alunos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      toast.error('ID do aluno não encontrado');
      return;
    }

    if (!formData.disciplina || !formData.tipo || !formData.nota || !formData.data) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      setIsSaving(true);

      await alunosService.adicionarAvaliacaoAluno(id, {
        disciplina: formData.disciplina,
        tipo: formData.tipo as any,
        nota: Number(formData.nota),
        peso: Number(formData.peso || 1),
        data: formData.data,
        comentario: formData.comentario,
        desempenho: {
          participacao: formData.participacao,
          engajamento: formData.engajamento,
          entrega: formData.entrega,
          frequencia: formData.frequencia,
        },
      });

      toast.success('Avaliação salva com sucesso!');
      navigate(`/fiap/alunos/${id}`);
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      toast.error('Erro ao salvar avaliação');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-[var(--theme-accent)]" />
      </div>
    );
  }

  if (!aluno) return null;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/fiap/alunos')}
          className="h-8 w-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div>
          <h1 className="text-xl font-bold text-[var(--theme-foreground)]">
            Nova Avaliação Acadêmica
          </h1>
          <p className="text-xs text-[var(--theme-muted-foreground)]">
            Registrar avaliação para {aluno.nome}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados da Avaliação</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="disciplina" className="text-sm">Disciplina *</Label>
                <Input
                  id="disciplina"
                  value={formData.disciplina}
                  onChange={(e) => setFormData({ ...formData, disciplina: e.target.value })}
                  placeholder="Ex: Machine Learning"
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo" className="text-sm">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  required
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prova">Prova</SelectItem>
                    <SelectItem value="Trabalho">Trabalho</SelectItem>
                    <SelectItem value="Projeto">Projeto</SelectItem>
                    <SelectItem value="Checkpoint">Checkpoint</SelectItem>
                    <SelectItem value="Global Solution">Global Solution</SelectItem>
                    <SelectItem value="Challenge">Challenge</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nota" className="text-sm">Nota *</Label>
                <Input
                  id="nota"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.nota}
                  onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="peso" className="text-sm">Peso</Label>
                <Input
                  id="peso"
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  value={formData.peso}
                  onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data" className="text-sm">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Participação</Label>
                <Select
                  value={formData.participacao}
                  onValueChange={(value) => setFormData({ ...formData, participacao: value })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excelente">Excelente</SelectItem>
                    <SelectItem value="boa">Boa</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Engajamento</Label>
                <Select
                  value={formData.engajamento}
                  onValueChange={(value) => setFormData({ ...formData, engajamento: value })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excelente">Excelente</SelectItem>
                    <SelectItem value="bom">Bom</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="baixo">Baixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Entrega</Label>
                <Select
                  value={formData.entrega}
                  onValueChange={(value) => setFormData({ ...formData, entrega: value })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-prazo">No prazo</SelectItem>
                    <SelectItem value="com-atraso">Com atraso</SelectItem>
                    <SelectItem value="incompleta">Incompleta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Frequência percebida</Label>
                <Select
                  value={formData.frequencia}
                  onValueChange={(value) => setFormData({ ...formData, frequencia: value })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="comentario" className="text-sm">Comentários / Observações</Label>
                <Textarea
                  id="comentario"
                  value={formData.comentario}
                  onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                  placeholder="Descreva o desempenho do aluno, pontos fortes, dificuldades e contexto da avaliação."
                  rows={5}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="theme" className="gap-2" disabled={isSaving}>
                {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Salvando...' : 'Salvar Avaliação'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/fiap/alunos')}
                disabled={isSaving}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}