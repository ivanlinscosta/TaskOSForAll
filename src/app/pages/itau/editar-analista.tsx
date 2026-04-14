import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Loader, Upload, Trash2, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { toast } from 'sonner';
import * as analistasService from '../../../services/analistas-service';
import { mockAnalistas } from '../../../lib/mock-data';
import { criarNotificacao } from '../../../services/notifications-service';

export function EditarAnalista() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [analista, setAnalista] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [removeCurrentPhoto, setRemoveCurrentPhoto] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    funcao: '',
    squad: '',
    senioridade: '',
    dataAdmissao: '',
    salario: '',
    observacoes: '',
    foto: '',
  });

  useEffect(() => {
    if (id) {
      carregarAnalista();
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
    return (formData.nome || 'Usuário')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [formData.nome]);

  const carregarAnalista = async () => {
    try {
      setIsLoading(true);

      const analistaFirebase = await analistasService.buscarAnalistaPorId(id || '');

      if (analistaFirebase) {
        setAnalista(analistaFirebase);
        setFormData({
          nome: analistaFirebase.nome || '',
          email: analistaFirebase.email || '',
          telefone: analistaFirebase.telefone || '',
          funcao: analistaFirebase.funcao || '',
          squad: analistaFirebase.squad || '',
          senioridade: analistaFirebase.senioridade || '',
          dataAdmissao: analistaFirebase.dataAdmissao
            ? new Date(analistaFirebase.dataAdmissao).toISOString().split('T')[0]
            : '',
          salario: analistaFirebase.salario?.toString() || '',
          observacoes: analistaFirebase.observacoes || '',
          foto: analistaFirebase.foto || '',
        });
        setPhotoPreview(analistaFirebase.foto || '');
        return;
      }

      const analistaMock = mockAnalistas.find((a) => a.id === id);

      if (analistaMock) {
        setAnalista(analistaMock);
        setFormData({
          nome: analistaMock.nome || '',
          email: analistaMock.email || '',
          telefone: analistaMock.telefone || '',
          funcao: analistaMock.funcao || '',
          squad: analistaMock.squad || '',
          senioridade: analistaMock.senioridade || '',
          dataAdmissao: analistaMock.dataAdmissao
            ? new Date(analistaMock.dataAdmissao).toISOString().split('T')[0]
            : '',
          salario: analistaMock.salario?.toString() || '',
          observacoes: analistaMock.observacoes || '',
          foto: analistaMock.foto || '',
        });
        setPhotoPreview(analistaMock.foto || '');
      } else {
        toast.error('Analista não encontrado');
        navigate('/itau/analistas');
      }
    } catch (error) {
      console.error('Erro ao carregar analista:', error);
      toast.error('Erro ao carregar analista');
      navigate('/itau/analistas');
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
      toast.error('ID do analista não encontrado');
      return;
    }

    try {
      setIsSaving(true);

      await analistasService.atualizarAnalista(id, {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        funcao: formData.funcao,
        squad: formData.squad,
        senioridade: formData.senioridade,
        dataAdmissao: formData.dataAdmissao ? new Date(formData.dataAdmissao) : undefined,
        salario: formData.salario ? parseFloat(formData.salario) : undefined,
        observacoes: formData.observacoes,
      });

      if (removeCurrentPhoto) {
        await analistasService.removerFotoAnalista(id);
      }

      if (selectedPhoto) {
        await analistasService.uploadFotoAnalista(id, selectedPhoto);
      }

      toast.success('Analista atualizado com sucesso!');
      navigate('/itau/analistas');

      await criarNotificacao({
      titulo: 'Novo feedback',
      mensagem: `${analista.nome} recebeu uma avaliação`,
      tipo: 'feedback',
      lida: false,
      contexto: 'itau',
      userId: analista.id
    });

      
    } catch (error) {
      console.error('Erro ao atualizar analista:', error);
      toast.error('Erro ao atualizar analista');
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

  if (!analista) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/itau/analistas')}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div>
          <h1 className="text-xl font-bold text-[var(--theme-foreground)]">
            Editar Analista
          </h1>
          <p className="text-xs text-[var(--theme-muted-foreground)]">
            Atualize as informações do analista
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Foto do Analista</CardTitle>
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
          <CardTitle className="text-base">Informações do Analista</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm">
                  Nome Completo *
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">
                  Email Corporativo *
                </Label>
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
                <Label htmlFor="telefone" className="text-sm">
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="funcao" className="text-sm">
                  Função *
                </Label>
                <Input
                  id="funcao"
                  value={formData.funcao}
                  onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="squad" className="text-sm">
                  Squad
                </Label>
                <Input
                  id="squad"
                  value={formData.squad}
                  onChange={(e) => setFormData({ ...formData, squad: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senioridade" className="text-sm">
                  Senioridade
                </Label>
                <Input
                  id="senioridade"
                  value={formData.senioridade}
                  onChange={(e) => setFormData({ ...formData, senioridade: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataAdmissao" className="text-sm">
                  Data de Admissão
                </Label>
                <Input
                  id="dataAdmissao"
                  type="date"
                  value={formData.dataAdmissao}
                  onChange={(e) => setFormData({ ...formData, dataAdmissao: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salario" className="text-sm">
                  Salário
                </Label>
                <Input
                  id="salario"
                  type="number"
                  step="0.01"
                  value={formData.salario}
                  onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes" className="text-sm">
                Observações
              </Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="text-sm"
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving && <Loader className="h-4 w-4 animate-spin" />}
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/itau/analistas')}
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