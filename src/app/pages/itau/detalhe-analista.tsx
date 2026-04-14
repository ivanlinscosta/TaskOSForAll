import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Loader } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { AnalistaDetailView } from '../../components/analistas/analista-detail-view';
import * as analistasService from '../../../services/analistas-service';
import * as avaliacoesAnalistasService from '../../../services/avaliacoes-analistas-service';
import { mockAnalistas } from '../../../lib/mock-data';

export function DetalheAnalista() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [analista, setAnalista] = useState<any>(null);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      carregarDados();
    }
  }, [id]);

  const carregarDados = async () => {
    try {
      setIsLoading(true);

      const [analistaFirebase, avaliacoesFirebase] = await Promise.all([
        analistasService.buscarAnalistaPorId(id || ''),
        avaliacoesAnalistasService.listarAvaliacoesAnalista(id || ''),
      ]);

      if (analistaFirebase) {
        setAnalista(analistaFirebase);
        setAvaliacoes(avaliacoesFirebase || []);
        return;
      }

      const analistaMock = mockAnalistas.find((a) => a.id === id);
      if (analistaMock) {
        setAnalista(analistaMock);
        setAvaliacoes(avaliacoesFirebase || []);
        return;
      }

      toast.error('Analista não encontrado');
      navigate('/itau/analistas');
    } catch (error) {
      console.error('Erro ao carregar detalhes do analista:', error);
      toast.error('Erro ao carregar detalhes do analista');
      navigate('/itau/analistas');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-[var(--theme-accent)]" />
      </div>
    );
  }

  if (!analista) return null;

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
            Detalhes do Analista
          </h1>
          <p className="text-xs text-[var(--theme-muted-foreground)]">
            Informações, histórico e acompanhamento
          </p>
        </div>
      </div>

      <AnalistaDetailView analista={analista} avaliacoes={avaliacoes} />
    </div>
  );
}