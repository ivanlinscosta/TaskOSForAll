import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  User,
  CalendarDays,
  ClipboardList,
  Target,
  Loader,
} from 'lucide-react';
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
import * as analistasService from '../../../services/analistas-service';
import * as avaliacoesAnalistasService from '../../../services/avaliacoes-analistas-service';
import { mockAnalistas } from '../../../lib/mock-data';

interface PlanoAcao {
  id: string;
  plano: string;
  tipo: string;
  dataCombinada: string;
}

export function NovaAvaliacaoAnalista() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [analista, setAnalista] = useState<any>(null);

  const [formData, setFormData] = useState({
    tipo: '',
    conceito: '',
    data: new Date().toISOString().split('T')[0],
    comentario: '',
  });

  const [planoAtual, setPlanoAtual] = useState({
    plano: '',
    tipo: '',
    dataCombinada: '',
  });

  const [planosAcao, setPlanosAcao] = useState<PlanoAcao[]>([]);

  useEffect(() => {
    if (id) {
      carregarAnalista();
    }
  }, [id]);

  const nomeAnalista = useMemo(() => analista?.nome || '', [analista]);

  const carregarAnalista = async () => {
    try {
      setIsLoading(true);

      const analistaFirebase = await analistasService.buscarAnalistaPorId(id || '');

      if (analistaFirebase) {
        setAnalista(analistaFirebase);
        return;
      }

      const analistaMock = mockAnalistas.find((a) => a.id === id);
      if (analistaMock) {
        setAnalista(analistaMock);
        return;
      }

      toast.error('Analista não encontrado');
      navigate('/itau/analistas');
    } catch (error) {
      console.error('Erro ao carregar analista:', error);
      toast.error('Erro ao carregar analista');
      navigate('/itau/analistas');
    } finally {
      setIsLoading(false);
    }
  };

  const adicionarPlanoAcao = () => {
    if (!planoAtual.plano || !planoAtual.tipo || !planoAtual.dataCombinada) {
      toast.error('Preencha plano, tipo e data combinada');
      return;
    }

    const novoPlano: PlanoAcao = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      plano: planoAtual.plano,
      tipo: planoAtual.tipo,
      dataCombinada: planoAtual.dataCombinada,
    };

    setPlanosAcao((prev) => [...prev, novoPlano]);
    setPlanoAtual({
      plano: '',
      tipo: '',
      dataCombinada: '',
    });
  };

  const removerPlanoAcao = (idPlano: string) => {
    setPlanosAcao((prev) => prev.filter((item) => item.id !== idPlano));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      toast.error('ID do analista não encontrado');
      return;
    }

    if (!analista) {
      toast.error('Analista não carregado');
      return;
    }

    if (!formData.tipo || !formData.conceito || !formData.data || !formData.comentario) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setIsSaving(true);

      await avaliacoesAnalistasService.salvarAvaliacaoAnalista({
        analistaId: id,
        analistaNome: analista.nome,
        tipo: formData.tipo,
        conceito: formData.conceito as 'destaca-se' | 'alinhado' | 'abaixo-do-esperado',
        data: formData.data,
        comentario: formData.comentario,
        planosAcao: planosAcao.map((item) => ({
          plano: item.plano,
          tipo: item.tipo,
          dataCombinada: item.dataCombinada,
        })),
      });

      toast.success('Avaliação salva com sucesso!');
      navigate('/itau/analistas');
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

  if (!analista) {
    return null;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/itau/analistas')}
          className="h-8 w-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div>
          <h1 className="text-xl font-bold text-[var(--theme-foreground)]">
            Nova Avaliação de Desempenho
          </h1>
          <p className="text-xs text-[var(--theme-muted-foreground)]">
            Registrar avaliação para {analista.nome}
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
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="nomeAnalista" className="text-sm">
                  Nome do Analista
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-muted-foreground)]" />
                  <Input
                    id="nomeAnalista"
                    value={nomeAnalista}
                    readOnly
                    className="h-9 pl-10 text-sm opacity-90"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tipo" className="text-sm">
                  Tipo de Avaliação *
                </Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  required
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Avaliação Mensal</SelectItem>
                    <SelectItem value="trimestral">Avaliação Trimestral</SelectItem>
                    <SelectItem value="semestral">Avaliação Semestral</SelectItem>
                    <SelectItem value="anual">Avaliação Anual</SelectItem>
                    <SelectItem value="projeto">Avaliação de Projeto</SelectItem>
                    <SelectItem value="promocao">Avaliação de Promoção</SelectItem>
                    <SelectItem value="feedback">Feedback Pontual</SelectItem>
                    <SelectItem value="pdi">PDI - Plano de Desenvolvimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conceito" className="text-sm">
                  Conceito *
                </Label>
                <Select
                  value={formData.conceito}
                  onValueChange={(value) => setFormData({ ...formData, conceito: value })}
                  required
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione o conceito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="destaca-se">Destaca-se</SelectItem>
                    <SelectItem value="alinhado">Alinhado</SelectItem>
                    <SelectItem value="abaixo-do-esperado">Abaixo do esperado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="data" className="text-sm">
                  Data da Avaliação *
                </Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-muted-foreground)]" />
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                    className="h-9 pl-10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="comentario" className="text-sm">
                  Comentários / Avaliação Escrita *
                </Label>
                <div className="relative">
                  <ClipboardList className="absolute left-3 top-3 h-4 w-4 text-[var(--theme-muted-foreground)]" />
                  <Textarea
                    id="comentario"
                    value={formData.comentario}
                    onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                    placeholder="Descreva a avaliação do analista, pontos fortes, pontos de atenção e contexto da avaliação."
                    rows={6}
                    required
                    className="pl-10 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-[var(--theme-border)] p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-[var(--theme-accent)]" />
                <h2 className="text-sm font-semibold text-[var(--theme-foreground)]">
                  Planos de Ação
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-end">
                <div className="space-y-2">
                  <Label htmlFor="plano" className="text-sm">
                    Plano
                  </Label>
                  <Input
                    id="plano"
                    value={planoAtual.plano}
                    onChange={(e) => setPlanoAtual({ ...planoAtual, plano: e.target.value })}
                    placeholder="Ex: Melhorar comunicação com o time"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoPlano" className="text-sm">
                    Tipo
                  </Label>
                  <Select
                    value={planoAtual.tipo}
                    onValueChange={(value) => setPlanoAtual({ ...planoAtual, tipo: value })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                      <SelectItem value="comportamental">Comportamental</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="gestao">Gestão</SelectItem>
                      <SelectItem value="entrega">Entrega</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataCombinada" className="text-sm">
                    Data Combinada
                  </Label>
                  <Input
                    id="dataCombinada"
                    type="date"
                    value={planoAtual.dataCombinada}
                    onChange={(e) => setPlanoAtual({ ...planoAtual, dataCombinada: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={adicionarPlanoAcao}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>

              {planosAcao.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-[var(--theme-border)]">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="bg-[var(--theme-background-secondary)]">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-[var(--theme-foreground)]">
                          Plano
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-[var(--theme-foreground)]">
                          Tipo
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-[var(--theme-foreground)]">
                          Data combinada
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-[var(--theme-foreground)]">
                          Ação
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {planosAcao.map((item) => (
                        <tr key={item.id} className="border-t border-[var(--theme-border)]">
                          <td className="px-3 py-2 text-[var(--theme-foreground)]">{item.plano}</td>
                          <td className="px-3 py-2 text-[var(--theme-muted-foreground)]">{item.tipo}</td>
                          <td className="px-3 py-2 text-[var(--theme-muted-foreground)]">{item.dataCombinada}</td>
                          <td className="px-3 py-2 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removerPlanoAcao(item.id)}
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="theme" className="gap-2" disabled={isSaving}>
                {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Salvando...' : 'Salvar Avaliação'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/itau/analistas')}
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