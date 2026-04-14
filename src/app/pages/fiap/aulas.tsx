import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  Download,
  FolderKanban,
  BookOpen,
  CheckSquare,
  ClipboardCheck,
  Loader,
  Pencil,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import * as aulasService from '../../../services/aulas-service';

const tipoIcons: Record<string, string> = {
  pdf: '📄',
  ppt: '📊',
  link: '🔗',
  video: '🎥',
  doc: '📝',
};

function normalizeUrl(url: string) {
  if (!url) return '';
  return url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `https://${url}`;
}

export function Aulas() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [disciplinas, setDisciplinas] = useState<aulasService.DisciplinaComAulas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      const data = await aulasService.listarDisciplinasComAulas();
      setDisciplinas(data);
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
      toast.error('Erro ao carregar aulas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcluirAula = async (
    disciplinaId: string,
    aulaId: string,
    titulo: string
  ) => {
    const confirmado = window.confirm(`Deseja realmente excluir a aula "${titulo}"?`);
    if (!confirmado) return;

    try {
      setDeletingId(aulaId);
      await aulasService.deletarAula(disciplinaId, aulaId);
      toast.success('Aula excluída com sucesso!');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir aula:', error);
      toast.error('Erro ao excluir aula');
    } finally {
      setDeletingId(null);
    }
  };

  const disciplinasFiltradas = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return disciplinas;

    return disciplinas
      .map((disciplina) => ({
        ...disciplina,
        aulas: disciplina.aulas.filter((aula) => {
          const materiaisTexto = (aula.materiais || [])
            .map((m) => `${m.nome} ${m.url}`)
            .join(' ')
            .toLowerCase();

          const topicosTexto = (aula.topicos || []).join(' ').toLowerCase();
          const atividadesTexto = (aula.atividades || [])
            .map((a) => `${a.titulo} ${a.descricao}`)
            .join(' ')
            .toLowerCase();

          return (
            (aula.titulo || '').toLowerCase().includes(term) ||
            (aula.disciplina || '').toLowerCase().includes(term) ||
            (aula.descricao || '').toLowerCase().includes(term) ||
            (aula.planoDeAula || '').toLowerCase().includes(term) ||
            materiaisTexto.includes(term) ||
            topicosTexto.includes(term) ||
            atividadesTexto.includes(term)
          );
        }),
      }))
      .filter((disciplina) => disciplina.aulas.length > 0);
  }, [disciplinas, searchTerm]);

  const totalAulas = disciplinas.reduce((acc, item) => acc + item.aulas.length, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Gestão de Aulas</h1>
          <p className="mt-1 text-[var(--theme-muted-foreground)]">
            {isLoading
              ? 'Carregando aulas...'
              : `${totalAulas} aulas em ${disciplinas.length} disciplinas`}
          </p>
        </div>

        <Button
          variant="theme"
          className="gap-2"
          onClick={() => navigate('/fiap/aulas/nova')}
        >
          <Plus className="h-4 w-4" />
          Nova Aula
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-muted-foreground)]" />
        <Input
          placeholder="Buscar por aula, disciplina, tópico ou material..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="h-8 w-8 animate-spin text-[var(--theme-accent)]" />
        </div>
      ) : disciplinasFiltradas.length === 0 ? (
        <Card className="rounded-[28px]">
          <CardContent className="py-16 text-center text-[var(--theme-muted-foreground)]">
            Nenhuma aula encontrada.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {disciplinasFiltradas.map((disciplina) => (
            <Card key={disciplina.id} className="overflow-hidden rounded-[28px]">
              <CardHeader className="border-b border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-2xl">{disciplina.nome}</CardTitle>
                    <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">
                      {disciplina.descricao || `${disciplina.aulas.length} aulas cadastradas`}
                    </p>
                  </div>
                  <Badge variant="theme">{disciplina.aulas.length} aulas</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-5">
                {disciplina.aulas.map((aula) => (
                  <details
                    key={aula.id}
                    className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4"
                  >
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-[var(--theme-foreground)]">
                            {aula.titulo}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="outline" className="gap-1">
                              <Calendar className="h-3 w-3" />
                              {aula.data
                                ? format(new Date(aula.data), "d 'de' MMM, yyyy", {
                                    locale: ptBR,
                                  })
                                : 'Sem data'}
                            </Badge>

                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {aula.duracao} min
                            </Badge>

                            <Badge variant="secondary" className="gap-1">
                              <BookOpen className="h-3 w-3" />
                              {aula.topicos?.length || 0} tópicos
                            </Badge>

                            <Badge variant="secondary" className="gap-1">
                              <FolderKanban className="h-3 w-3" />
                              {aula.materiais?.length || 0} materiais
                            </Badge>

                            <Badge variant="secondary" className="gap-1">
                              <CheckSquare className="h-3 w-3" />
                              {aula.atividades?.length || 0} atividades
                            </Badge>

                            <Badge variant="secondary" className="gap-1">
                              <ClipboardCheck className="h-3 w-3" />
                              {aula.avaliacoes?.length || 0} avaliações
                            </Badge>
                          </div>

                          <p className="mt-3 text-sm text-[var(--theme-muted-foreground)]">
                            {aula.descricao || 'Sem descrição'}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(`/fiap/aulas/editar/${disciplina.id}/${aula.id}`);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2 text-red-600 hover:text-red-700"
                            disabled={deletingId === aula.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleExcluirAula(disciplina.id, aula.id!, aula.titulo);
                            }}
                          >
                            {deletingId === aula.id ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </summary>

                    <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
                      <div className="space-y-5">
                        <div>
                          <h4 className="mb-2 font-semibold text-[var(--theme-foreground)]">
                            Plano de aula
                          </h4>
                          <div className="rounded-xl bg-[var(--theme-background-secondary)] p-4 text-sm text-[var(--theme-muted-foreground)]">
                            {aula.planoDeAula || 'Não informado'}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-2 font-semibold text-[var(--theme-foreground)]">
                            Objetivos
                          </h4>
                          <ul className="space-y-2">
                            {(aula.objetivos || []).map((item, index) => (
                              <li
                                key={index}
                                className="rounded-xl bg-[var(--theme-background-secondary)] px-4 py-3 text-sm text-[var(--theme-muted-foreground)]"
                              >
                                {item}
                              </li>
                            ))}
                            {!aula.objetivos?.length && (
                              <p className="text-sm text-[var(--theme-muted-foreground)]">
                                Nenhum objetivo cadastrado.
                              </p>
                            )}
                          </ul>
                        </div>

                        <div>
                          <h4 className="mb-2 font-semibold text-[var(--theme-foreground)]">
                            Tópicos
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {(aula.topicos || []).map((topico, index) => (
                              <Badge key={index} variant="secondary">
                                {topico}
                              </Badge>
                            ))}
                            {!aula.topicos?.length && (
                              <p className="text-sm text-[var(--theme-muted-foreground)]">
                                Nenhum tópico cadastrado.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <h4 className="mb-2 font-semibold text-[var(--theme-foreground)]">
                            Materiais
                          </h4>
                          <div className="space-y-2">
                            {(aula.materiais || []).map((material) => {
                              const url = normalizeUrl(material.url);

                              return (
                                <div
                                  key={material.id}
                                  className="flex items-center gap-3 rounded-xl bg-[var(--theme-background-secondary)] p-3"
                                >
                                  <div className="text-2xl">{tipoIcons[material.tipo] || '📄'}</div>

                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium">
                                      {material.nome || 'Material sem nome'}
                                    </div>

                                    {material.url ? (
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block truncate text-xs text-blue-600 underline hover:text-blue-700"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {material.url}
                                      </a>
                                    ) : (
                                      <div className="truncate text-xs text-[var(--theme-muted-foreground)]">
                                        Sem link
                                      </div>
                                    )}
                                  </div>

                                  {material.url ? (
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-[var(--theme-muted-foreground)] hover:text-[var(--theme-foreground)]"
                                    >
                                      {material.tipo === 'link' ? (
                                        <LinkIcon className="h-4 w-4" />
                                      ) : (
                                        <Download className="h-4 w-4" />
                                      )}
                                    </a>
                                  ) : material.tipo === 'link' ? (
                                    <LinkIcon className="h-4 w-4 text-[var(--theme-muted-foreground)]" />
                                  ) : (
                                    <Download className="h-4 w-4 text-[var(--theme-muted-foreground)]" />
                                  )}
                                </div>
                              );
                            })}

                            {!aula.materiais?.length && (
                              <p className="text-sm text-[var(--theme-muted-foreground)]">
                                Nenhum material cadastrado.
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-2 font-semibold text-[var(--theme-foreground)]">
                            Atividades
                          </h4>
                          <div className="space-y-2">
                            {(aula.atividades || []).map((atividade) => (
                              <div
                                key={atividade.id}
                                className="rounded-xl bg-[var(--theme-background-secondary)] p-3"
                              >
                                <div className="text-sm font-medium">
                                  {atividade.titulo || 'Atividade'}
                                </div>
                                <div className="mt-1 text-sm text-[var(--theme-muted-foreground)]">
                                  {atividade.descricao || 'Sem descrição'}
                                </div>
                              </div>
                            ))}

                            {!aula.atividades?.length && (
                              <p className="text-sm text-[var(--theme-muted-foreground)]">
                                Nenhuma atividade cadastrada.
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-2 font-semibold text-[var(--theme-foreground)]">
                            Avaliações previstas
                          </h4>
                          <div className="space-y-2">
                            {(aula.avaliacoes || []).map((avaliacao) => (
                              <div
                                key={avaliacao.id}
                                className="rounded-xl bg-[var(--theme-background-secondary)] p-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-sm font-medium">
                                    {avaliacao.titulo || 'Avaliação'}
                                  </div>
                                  {avaliacao.peso ? (
                                    <Badge variant="outline">Peso {avaliacao.peso}</Badge>
                                  ) : null}
                                </div>
                                <div className="mt-1 text-sm text-[var(--theme-muted-foreground)]">
                                  {avaliacao.descricao || 'Sem descrição'}
                                </div>
                              </div>
                            ))}

                            {!aula.avaliacoes?.length && (
                              <p className="text-sm text-[var(--theme-muted-foreground)]">
                                Nenhuma avaliação cadastrada.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}