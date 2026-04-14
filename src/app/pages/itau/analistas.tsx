import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Search,
  Loader,
  Star,
  Users,
  Clock3,
  LayoutGrid,
  List,
  ChevronRight,
  Pencil,
  Briefcase,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import * as analistasService from '../../../services/analistas-service';
import { mockAnalistas } from '../../../lib/mock-data';
import { PersonSummaryCard } from '../../components/ui/person-summary-card';

type ViewMode = 'grid' | 'list';

export function Analistas() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [analistas, setAnalistas] = useState<any[]>(mockAnalistas);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    carregarAnalistas();
  }, []);

  const carregarAnalistas = async () => {
    try {
      setIsLoading(true);
      const analistasFirebase = await analistasService.listarAnalistas();
      if (analistasFirebase && analistasFirebase.length > 0) {
        setAnalistas(analistasFirebase as any);
      } else {
        setAnalistas(mockAnalistas);
      }
    } catch (error) {
      console.error('Erro ao carregar analistas:', error);
      toast.error('Erro ao carregar analistas');
      setAnalistas(mockAnalistas);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAnalistas = analistas.filter((analista) =>
    (analista.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (analista.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (analista.funcao || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calcularMediaAvaliacoes = (analista: any) => {
    if (!analista.avaliacoes || analista.avaliacoes.length === 0) return '0.0';
    const soma = analista.avaliacoes.reduce((acc: number, av: any) => acc + (av.nota || 0), 0);
    return (soma / analista.avaliacoes.length).toFixed(1);
  };

  const calcularTempoEmpresa = (dataAdmissao: any) => {
    if (!dataAdmissao) return '-';

    const hoje = new Date();
    const diff = hoje.getTime() - new Date(dataAdmissao).getTime();
    const anos = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const meses = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));

    if (anos > 0) return `${anos}a ${meses}m`;
    return `${meses} meses`;
  };

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--theme-foreground)]">
            Gestão de Analistas
          </h1>
          <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader className="h-3.5 w-3.5 animate-spin" />
                Carregando...
              </span>
            ) : (
              `${filteredAnalistas.length} analistas no time`
            )}
          </p>
        </div>

        <Button
          variant="theme"
          size="sm"
          className="gap-2 rounded-xl px-4"
          onClick={() => navigate('/itau/analistas/novo')}
        >
          <Plus className="h-4 w-4" />
          Novo Analista
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-muted-foreground)]" />
          <Input
            placeholder="Buscar por nome, email ou função..."
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
      ) : filteredAnalistas.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-[var(--theme-muted-foreground)]">Nenhum analista encontrado</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredAnalistas.map((analista) => {
            const mediaAvaliacoes = calcularMediaAvaliacoes(analista);

            return (
              <PersonSummaryCard
                key={analista.id}
                variant="analyst"
                name={analista.nome}
                email={analista.email}
                subtitle={analista.funcao}
                image={analista.foto}
                badgeText={analista.senioridade || 'Pleno'}
                highlightText={parseFloat(mediaAvaliacoes) >= 9 ? 'Top' : undefined}
                locationText={analista.squad || 'Sem squad'}
                actionLabel="Registrar feedback"
                onAction={() => navigate(`/itau/analistas/${analista.id}/avaliacao`)}
                onOpen={() => navigate(`/itau/analistas/${analista.id}`)}
                onEdit={(e) => {
                  e.stopPropagation();
                  navigate(`/itau/analistas/editar/${analista.id}`);
                }}
                metrics={[
                  {
                    label: 'média',
                    value: mediaAvaliacoes,
                    icon: <Star className="h-3.5 w-3.5" />,
                  },
                  {
                    label: 'squad',
                    value: analista.squad || '-',
                    icon: <Users className="h-3.5 w-3.5" />,
                  },
                  {
                    label: 'tempo',
                    value: calcularTempoEmpresa(analista.dataAdmissao),
                    icon: <Clock3 className="h-3.5 w-3.5" />,
                  },
                ]}
              />
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAnalistas.map((analista) => {
            const mediaAvaliacoes = calcularMediaAvaliacoes(analista);

            return (
              <div
                key={analista.id}
                onClick={() => navigate(`/itau/analistas/${analista.id}`)}
                className="flex cursor-pointer items-center gap-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-4 transition-all hover:border-[var(--theme-accent)] hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--theme-background-secondary)]">
                  {analista.foto ? (
                    <img
                      src={analista.foto}
                      alt={analista.nome}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Briefcase className="h-5 w-5 text-[var(--theme-accent)]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--theme-foreground)]">
                      {analista.nome}
                    </h3>
                    <span className="rounded-full bg-[var(--theme-background-secondary)] px-2 py-0.5 text-[11px] text-[var(--theme-muted-foreground)]">
                      {analista.funcao || 'Sem função'}
                    </span>
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] text-orange-700">
                      {analista.senioridade || 'Pleno'}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-xs text-[var(--theme-muted-foreground)]">
                    {analista.email}
                  </p>
                </div>

                <div className="hidden items-center gap-6 md:flex">
                  <div className="text-center">
                    <p className="text-[11px] text-[var(--theme-muted-foreground)]">Média</p>
                    <p className="text-sm font-semibold">{mediaAvaliacoes}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-[var(--theme-muted-foreground)]">Squad</p>
                    <p className="text-sm font-semibold">{analista.squad || '-'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-[var(--theme-muted-foreground)]">Tempo</p>
                    <p className="text-sm font-semibold">
                      {calcularTempoEmpresa(analista.dataAdmissao)}
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
                      navigate(`/itau/analistas/editar/${analista.id}`);
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
                      navigate(`/itau/analistas/${analista.id}/avaliacao`);
                    }}
                  >
                    Feedback
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