import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save, Loader, Upload, Trash2, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { toast } from 'sonner';
import * as alunosService from '../../../services/alunos-service';
import { mockAlunos } from '../../../lib/mock-data';

export function EditarAluno() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [aluno, setAluno] = useState<any>(null);

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [removeCurrentPhoto, setRemoveCurrentPhoto] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    curso: '',
    turma: '',
    periodo: '',
    ra: '',
    dataNascimento: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    observacoes: '',
    foto: '',
  });

  useEffect(() => {
    if (id) {
      carregarAluno();
    }
  }, [id]);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const initials = useMemo(() => {
    return (formData.nome || 'Aluno')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [formData.nome]);

  const carregarAluno = async () => {
    try {
      setIsLoading(true);

      const alunoFirebase = await alunosService.buscarAlunoPorId(id || '');

      if (alunoFirebase) {
        setAluno(alunoFirebase);
        setFormData({
          nome: alunoFirebase.nome || '',
          email: alunoFirebase.email || '',
          telefone: alunoFirebase.telefone || '',
          curso: alunoFirebase.curso || '',
          turma: alunoFirebase.turma || '',
          periodo: alunoFirebase.periodo || '',
          ra: alunoFirebase.ra || '',
          dataNascimento: alunoFirebase.dataNascimento
            ? new Date(alunoFirebase.dataNascimento).toISOString().split('T')[0]
            : '',
          endereco: alunoFirebase.endereco || '',
          cidade: alunoFirebase.cidade || '',
          estado: alunoFirebase.estado || '',
          cep: alunoFirebase.cep || '',
          observacoes: alunoFirebase.observacoes || '',
          foto: alunoFirebase.foto || '',
        });
        setPhotoPreview(alunoFirebase.foto || '');
        return;
      }

      const alunoMock = mockAlunos.find((a) => a.id === id);

      if (alunoMock) {
        setAluno(alunoMock);
        setFormData({
          nome: alunoMock.nome || '',
          email: alunoMock.email || '',
          telefone: alunoMock.telefone || '',
          curso: alunoMock.curso || '',
          turma: alunoMock.turma || '',
          periodo: alunoMock.periodo || '',
          ra: alunoMock.ra || '',
          dataNascimento: '',
          endereco: '',
          cidade: '',
          estado: '',
          cep: '',
          observacoes: alunoMock.observacoes || '',
          foto: alunoMock.foto || '',
        });
        setPhotoPreview(alunoMock.foto || '');
      } else {
        toast.error('Aluno não encontrado');
        navigate('/fiap/alunos');
      }
    } catch (error) {
      console.error('Erro ao carregar aluno:', error);
      toast.error('Erro ao carregar aluno');
      navigate('/fiap/alunos');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem');
      return;
    }

    if (photoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedPhoto(file);
    setPhotoPreview(previewUrl);
    setRemoveCurrentPhoto(false);
  };

  const handleRemovePhoto = () => {
    if (photoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }

    setSelectedPhoto(null);
    setPhotoPreview('');
    setRemoveCurrentPhoto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      toast.error('ID do aluno não encontrado');
      return;
    }

    try {
      setIsSaving(true);

      await alunosService.atualizarAluno(id, {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        curso: formData.curso,
        turma: formData.turma,
        periodo: formData.periodo,
        ra: formData.ra,
        dataNascimento: formData.dataNascimento ? new Date(formData.dataNascimento) : undefined,
        endereco: formData.endereco,
        cidade: formData.cidade,
        estado: formData.estado,
        cep: formData.cep,
        observacoes: formData.observacoes,
      });

      if (removeCurrentPhoto && alunosService.removerFotoAluno) {
        await alunosService.removerFotoAluno(id);
      }

      if (selectedPhoto && alunosService.uploadFotoAluno) {
        await alunosService.uploadFotoAluno(id, selectedPhoto);
      }

      toast.success('Aluno atualizado com sucesso!');
      navigate('/fiap/alunos');
    } catch (error) {
      console.error('Erro ao atualizar aluno:', error);
      toast.error('Erro ao atualizar aluno');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-[var(--theme-accent)]" />
      </div>
    );
  }

  if (!aluno) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
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
            Editar Aluno
          </h1>
          <p className="text-xs text-[var(--theme-muted-foreground)]">
            Atualize as informações do aluno
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Foto do Aluno</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar className="h-24 w-24 border">
              <AvatarImage src={photoPreview || undefined} />
              <AvatarFallback className="bg-[var(--theme-background-secondary)]">
                {photoPreview ? initials : <User className="h-8 w-8 text-[var(--theme-muted-foreground)]" />}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-wrap gap-2">
              <Label
                htmlFor="foto"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <Upload className="h-4 w-4" />
                Escolher Foto
              </Label>

              <Input
                id="foto"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

              {(photoPreview || formData.foto) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemovePhoto}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover Foto
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informações Pessoais</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataNascimento" className="text-sm">Data de Nascimento</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-sm">Telefone</Label>
                <Input
                  id="telefone"
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="border-t border-[var(--theme-border)] pt-5">
              <h2 className="mb-4 text-sm font-semibold text-[var(--theme-foreground)]">
                Informações Acadêmicas
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="curso" className="text-sm">Curso *</Label>
                  <Input
                    id="curso"
                    value={formData.curso}
                    onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                    required
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ra" className="text-sm">RA</Label>
                  <Input
                    id="ra"
                    value={formData.ra}
                    onChange={(e) => setFormData({ ...formData, ra: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="turma" className="text-sm">Turma</Label>
                  <Input
                    id="turma"
                    value={formData.turma}
                    onChange={(e) => setFormData({ ...formData, turma: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodo" className="text-sm">Período</Label>
                  <select
                    id="periodo"
                    className="h-9 w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-background)] px-3 text-sm text-[var(--theme-foreground)]"
                    value={formData.periodo}
                    onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Noturno">Noturno</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--theme-border)] pt-5">
              <h2 className="mb-4 text-sm font-semibold text-[var(--theme-foreground)]">
                Endereço
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="endereco" className="text-sm">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="cidade" className="text-sm">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado" className="text-sm">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      maxLength={2}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cep" className="text-sm">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--theme-border)] pt-5">
              <div className="space-y-2">
                <Label htmlFor="observacoes" className="text-sm">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="text-sm"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving && <Loader className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/fiap/alunos')}
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