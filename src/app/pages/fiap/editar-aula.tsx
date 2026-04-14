import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Plus, X, Loader } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import * as aulasService from '../../../services/aulas-service';

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function EditarAula() {
  const navigate = useNavigate();
  const { disciplinaId, aulaId } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    disciplina: '',
    data: '',
    duracao: '',
    descricao: '',
    planoDeAula: '',
    objetivos: [''],
    topicos: [''],
    materiais: [{ id: uid(), tipo: 'pdf', nome: '', url: '' }],
    atividades: [{ id: uid(), titulo: '', descricao: '', data: '' }],
    avaliacoes: [{ id: uid(), titulo: '', descricao: '', peso: '', data: '' }],
  });

  useEffect(() => {
    if (disciplinaId && aulaId) carregarAula();
  }, [disciplinaId, aulaId]);

  const carregarAula = async () => {
    try {
      setIsLoading(true);

      const aula = await aulasService.buscarAulaPorId(disciplinaId || '', aulaId || '');

      if (!aula) {
        toast.error('Aula não encontrada');
        navigate('/fiap/aulas');
        return;
      }

      setFormData({
        titulo: aula.titulo || '',
        disciplina: aula.disciplina || '',
        data: aula.data || '',
        duracao: String(aula.duracao || ''),
        descricao: aula.descricao || '',
        planoDeAula: aula.planoDeAula || '',
        objetivos: aula.objetivos?.length ? aula.objetivos : [''],
        topicos: aula.topicos?.length ? aula.topicos : [''],
        materiais: aula.materiais?.length
          ? aula.materiais
          : [{ id: uid(), tipo: 'pdf', nome: '', url: '' }],
        atividades: aula.atividades?.length
          ? aula.atividades.map((a) => ({ ...a, data: a.data || '' }))
          : [{ id: uid(), titulo: '', descricao: '', data: '' }],
        avaliacoes: aula.avaliacoes?.length
          ? aula.avaliacoes.map((a) => ({
              ...a,
              peso: a.peso ? String(a.peso) : '',
              data: a.data || '',
            }))
          : [{ id: uid(), titulo: '', descricao: '', peso: '', data: '' }],
      });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar aula');
      navigate('/fiap/aulas');
    } finally {
      setIsLoading(false);
    }
  };

  const updateArrayField = (
    field: 'objetivos' | 'topicos',
    index: number,
    value: string
  ) => {
    const next = [...formData[field]];
    next[index] = value;
    setFormData({ ...formData, [field]: next });
  };

  const addArrayField = (field: 'objetivos' | 'topicos') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayField = (field: 'objetivos' | 'topicos', index: number) => {
    const next = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: next.length ? next : [''] });
  };

  const updateObjectList = (
    field: 'materiais' | 'atividades' | 'avaliacoes',
    index: number,
    key: string,
    value: string
  ) => {
    const next = [...(formData[field] as any[])];
    next[index] = { ...next[index], [key]: value };
    setFormData({ ...formData, [field]: next });
  };

  const addObjectList = (field: 'materiais' | 'atividades' | 'avaliacoes') => {
    const map = {
      materiais: { id: uid(), tipo: 'pdf', nome: '', url: '' },
      atividades: { id: uid(), titulo: '', descricao: '', data: '' },
      avaliacoes: { id: uid(), titulo: '', descricao: '', peso: '', data: '' },
    };

    setFormData({
      ...formData,
      [field]: [...(formData[field] as any[]), map[field]],
    });
  };

  const removeObjectList = (
    field: 'materiais' | 'atividades' | 'avaliacoes',
    index: number
  ) => {
    const next = (formData[field] as any[]).filter((_, i) => i !== index);

    const fallback = {
      materiais: [{ id: uid(), tipo: 'pdf', nome: '', url: '' }],
      atividades: [{ id: uid(), titulo: '', descricao: '', data: '' }],
      avaliacoes: [{ id: uid(), titulo: '', descricao: '', peso: '', data: '' }],
    };

    setFormData({
      ...formData,
      [field]: next.length ? next : fallback[field],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!disciplinaId || !aulaId) {
      toast.error('Identificador da aula inválido');
      return;
    }

    if (!formData.titulo || !formData.disciplina || !formData.data || !formData.duracao) {
      toast.error('Preencha título, disciplina, data e duração');
      return;
    }

    try {
      setIsSaving(true);

      await aulasService.atualizarAula(disciplinaId, aulaId, {
        titulo: formData.titulo,
        disciplina: formData.disciplina,
        data: formData.data,
        duracao: Number(formData.duracao),
        descricao: formData.descricao,
        planoDeAula: formData.planoDeAula,
        objetivos: formData.objetivos.filter(Boolean),
        topicos: formData.topicos.filter(Boolean),
        materiais: formData.materiais.filter((m) => m.nome || m.url) as any,
        atividades: formData.atividades
          .filter((a) => a.titulo || a.descricao || a.data)
          .map((a) => ({ ...a, data: a.data || undefined })) as any,
        avaliacoes: formData.avaliacoes
          .filter((a) => a.titulo || a.descricao || a.data)
          .map((a) => ({
            ...a,
            peso: a.peso ? Number(a.peso) : undefined,
            data: a.data || undefined,
          })) as any,
      });

      toast.success('Aula atualizada com sucesso!');
      navigate('/fiap/aulas');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar aula');
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

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/fiap/aulas')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Editar Aula</h1>
          <p className="mt-1 text-[var(--theme-muted-foreground)]">
            Atualize a aula e seus eventos vinculados
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="rounded-[28px]">
          <CardHeader>
            <CardTitle>Informações básicas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título da aula *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="disciplina">Disciplina *</Label>
              <Input
                id="disciplina"
                value={formData.disciplina}
                onChange={(e) => setFormData({ ...formData, disciplina: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data da aula *</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracao">Duração (min) *</Label>
              <Input
                id="duracao"
                type="number"
                min="1"
                value={formData.duracao}
                onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                rows={4}
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="planoDeAula">Plano de aula</Label>
              <Textarea
                id="planoDeAula"
                rows={5}
                value={formData.planoDeAula}
                onChange={(e) => setFormData({ ...formData, planoDeAula: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px]">
          <CardHeader>
            <CardTitle>Objetivos e tópicos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Objetivos</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => addArrayField('objetivos')}>
                  <Plus className="mr-2 h-3 w-3" />
                  Adicionar
                </Button>
              </div>

              {formData.objetivos.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input value={item} onChange={(e) => updateArrayField('objetivos', index, e.target.value)} />
                  {formData.objetivos.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayField('objetivos', index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Tópicos</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => addArrayField('topicos')}>
                  <Plus className="mr-2 h-3 w-3" />
                  Adicionar
                </Button>
              </div>

              {formData.topicos.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input value={item} onChange={(e) => updateArrayField('topicos', index, e.target.value)} />
                  {formData.topicos.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayField('topicos', index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px]">
          <CardHeader>
            <CardTitle>Materiais da aula</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.materiais.map((material, index) => (
              <div key={material.id} className="rounded-2xl border border-[var(--theme-border)] p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[140px_1fr_1fr_auto]">
                  <select
                    className="rounded-md border border-[var(--theme-border)] bg-[var(--theme-background)] px-3 py-2 text-[var(--theme-foreground)]"
                    value={material.tipo}
                    onChange={(e) => updateObjectList('materiais', index, 'tipo', e.target.value)}
                  >
                    <option value="pdf">PDF</option>
                    <option value="ppt">PowerPoint</option>
                    <option value="doc">Documento</option>
                    <option value="link">Link</option>
                    <option value="video">Vídeo</option>
                  </select>

                  <Input
                    value={material.nome}
                    onChange={(e) => updateObjectList('materiais', index, 'nome', e.target.value)}
                    placeholder="Nome do material"
                  />

                  <Input
                    value={material.url}
                    onChange={(e) => updateObjectList('materiais', index, 'url', e.target.value)}
                    placeholder="URL"
                  />

                  <Button type="button" variant="ghost" size="icon" onClick={() => removeObjectList('materiais', index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={() => addObjectList('materiais')}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar material
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[28px]">
          <CardHeader>
            <CardTitle>Atividades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.atividades.map((atividade, index) => (
              <div key={atividade.id} className="rounded-2xl border border-[var(--theme-border)] p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
                  <Input
                    value={atividade.titulo}
                    onChange={(e) => updateObjectList('atividades', index, 'titulo', e.target.value)}
                    placeholder="Título da atividade"
                  />
                  <Input
                    type="date"
                    value={atividade.data}
                    onChange={(e) => updateObjectList('atividades', index, 'data', e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeObjectList('atividades', index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  rows={3}
                  className="mt-3"
                  value={atividade.descricao}
                  onChange={(e) => updateObjectList('atividades', index, 'descricao', e.target.value)}
                  placeholder="Descrição da atividade"
                />
              </div>
            ))}

            <Button type="button" variant="outline" onClick={() => addObjectList('atividades')}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar atividade
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[28px]">
          <CardHeader>
            <CardTitle>Avaliações previstas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.avaliacoes.map((avaliacao, index) => (
              <div key={avaliacao.id} className="rounded-2xl border border-[var(--theme-border)] p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_180px_auto]">
                  <Input
                    value={avaliacao.titulo}
                    onChange={(e) => updateObjectList('avaliacoes', index, 'titulo', e.target.value)}
                    placeholder="Título da avaliação"
                  />
                  <Input
                    value={avaliacao.peso}
                    type="number"
                    onChange={(e) => updateObjectList('avaliacoes', index, 'peso', e.target.value)}
                    placeholder="Peso"
                  />
                  <Input
                    type="date"
                    value={avaliacao.data}
                    onChange={(e) => updateObjectList('avaliacoes', index, 'data', e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeObjectList('avaliacoes', index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  rows={3}
                  className="mt-3"
                  value={avaliacao.descricao}
                  onChange={(e) => updateObjectList('avaliacoes', index, 'descricao', e.target.value)}
                  placeholder="Descrição da avaliação"
                />
              </div>
            ))}

            <Button type="button" variant="outline" onClick={() => addObjectList('avaliacoes')}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar avaliação
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/fiap/aulas')}>
            Cancelar
          </Button>
          <Button type="submit" variant="theme" disabled={isSaving}>
            {isSaving ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}