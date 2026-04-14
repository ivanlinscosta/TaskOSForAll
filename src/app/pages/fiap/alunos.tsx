import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Search,
  Loader,
  Star,
  CalendarCheck2,
  GraduationCap,
  LayoutGrid,
  List,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import * as alunosService from '../../../services/alunos-service';
import { mockAlunos } from '../../../lib/mock-data';
import { PersonSummaryCard } from '../../components/ui/person-summary-card';

type ViewMode = 'grid' | 'list';

export function Alunos() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [alunos, setAlunos] = useState<any[]>(mockAlunos);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    carregarAlunos();
  }, []);

  const carregarAlunos = async () => {
    try {
      setIsLoading(true);
      const alunosFirebase = await alunosService.listarAlunos();
      if (alunosFirebase && alunosFirebase.length > 0) {
        setAlunos(alunosFirebase as any);
      } else {
        setAlunos(mockAlunos);
      }
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      toast.error('Erro ao carregar alunos');
      setAlunos(mockAlunos);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAlunos = alunos.filter((aluno) =>
    (aluno.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (aluno.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (aluno.curso || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calcularMedia = (aluno: any) => {
    const avaliacoes = aluno.avaliacoes || aluno.notas || [];
    if (!avaliacoes.length) return '0.0';

    const somaPesos = avaliacoes.reduce((acc: number, item: any) => acc + (item.peso || 1), 0);
    const somaNotas = avaliacoes.reduce(
      (acc: number, item: any) => acc + (item.nota || item.valor || 0) * (item.peso || 1),
      0
    );

    return somaPesos > 0 ? (somaNotas / somaPesos).toFixed(1) : '0.0';
  };

  const calcularPresenca = (aluno: any) => {
    return 85 + (parseInt(aluno.id || '0') % 15);
  };

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--theme-foreground)]">Gestão de Alunos</h1>
          <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader className="h-3.5 w-3.5 animate-spin" />
                Carregando...
              </span>
            ) : (
              `${filteredAlunos.length} alunos cadastrados`
            )}
          </p>
        </div>

        <Button
          variant="theme"
          size="sm"
          className="gap-2 rounded-xl px-4"
          onClick={() => navigate('/fiap/alunos/novo')}
        >
          <Plus className="h-4 w-4" />
          Novo Aluno
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-muted-foreground)]" />
          <Input
            placeholder="Buscar por nome, email ou curso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 rounded-xl pl-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-1">
          <Button
            type="button"
            variant={viewMode === 'grid' ? 'theme' : 'ghost'}
            size="sm"
            className="h-8 gap-2 rounded-lg px-3"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
            Grade
          </Button>
          <Button
            type="button"
            variant={viewMode === 'list' ? 'theme' : 'ghost'}
            size="sm"
            className="h-8 gap-2 rounded-lg px-3"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
            Lista
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-14">
          <Loader className="h-8 w-8 animate-spin text-[var(--theme-accent)]" />
        </div>
      ) : filteredAlunos.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-[var(--theme-muted-foreground)]">Nenhum aluno encontrado</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredAlunos.map((aluno) => {
            const media = calcularMedia(aluno);
            const presenca = calcularPresenca(aluno);

            return (
              <PersonSummaryCard
                key={aluno.id}
                variant="student"
                name={aluno.nome}
                email={aluno.email}
                subtitle={aluno.curso}
                image={aluno.foto}
                badgeText={parseFloat(media) >= 7 ? 'Aprovado' : 'Em atenção'}
                highlightText={parseFloat(media) >= 9 ? 'Destaque' : undefined}
                locationText={`Presença ${presenca}%`}
                actionLabel="Avaliar aluno"
                onAction={() => navigate(`/fiap/alunos/${aluno.id}/avaliacao`)}
                onOpen={() => navigate(`/fiap/alunos/${aluno.id}`)}
                onEdit={(e) => {
                  e.stopPropagation();
                  navigate(`/fiap/alunos/editar/${aluno.id}`);
                }}
                metrics={[
                  {
                    label: 'média',
                    value: media,
                    icon: <Star className="h-3.5 w-3.5" />,
                  },
                  {
                    label: 'presença',
                    value: `${presenca}%`,
                    icon: <CalendarCheck2 className="h-3.5 w-3.5" />,
                  },
                  {
                    label: 'avaliações',
                    value: (aluno.avaliacoes || aluno.notas || []).length || 0,
                    icon: <GraduationCap className="h-3.5 w-3.5" />,
                  },
                ]}
              />
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlunos.map((aluno) => {
            const media = calcularMedia(aluno);
            const presenca = calcularPresenca(aluno);

            return (
              <div
                key={aluno.id}
                onClick={() => navigate(`/fiap/alunos/${aluno.id}`)}
                className="flex cursor-pointer items-center gap-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-4 transition-all hover:border-[var(--theme-accent)] hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--theme-background-secondary)]">
                  {aluno.foto ? (
                    <img src={aluno.foto} alt={aluno.nome} className="h-full w-full object-cover" />
                  ) : (
                    <GraduationCap className="h-5 w-5 text-[var(--theme-accent)]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--theme-foreground)]">
                      {aluno.nome}
                    </h3>
                    <span className="rounded-full bg-[var(--theme-background-secondary)] px-2 py-0.5 text-[11px] text-[var(--theme-muted-foreground)]">
                      {aluno.curso || 'Sem curso'}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        parseFloat(media) >= 7
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {parseFloat(media) >= 7 ? 'Aprovado' : 'Em atenção'}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-xs text-[var(--theme-muted-foreground)]">
                    {aluno.email}
                  </p>
                </div>

                <div className="hidden items-center gap-6 md:flex">
                  <div className="text-center">
                    <p className="text-[11px] text-[var(--theme-muted-foreground)]">Média</p>
                    <p className="text-sm font-semibold">{media}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-[var(--theme-muted-foreground)]">Presença</p>
                    <p className="text-sm font-semibold">{presenca}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-[var(--theme-muted-foreground)]">Avaliações</p>
                    <p className="text-sm font-semibold">
                      {(aluno.avaliacoes || aluno.notas || []).length || 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/fiap/alunos/editar/${aluno.id}`);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="theme"
                    className="rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/fiap/alunos/${aluno.id}/avaliacao`);
                    }}
                  >
                    Avaliar
                  </Button>

                  <ChevronRight className="h-4 w-4 text-[var(--theme-muted-foreground)]" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}