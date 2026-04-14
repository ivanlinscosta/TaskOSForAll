import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Loader } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { AlunoDetailView } from '../../components/alunos/aluno-detail-view';
import * as alunosService from '../../../services/alunos-service';
import { mockAlunos } from '../../../lib/mock-data';

export function DetalheAluno() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [aluno, setAluno] = useState<any>(null);

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
            Detalhes do Aluno
          </h1>
          <p className="text-xs text-[var(--theme-muted-foreground)]">
            Informações acadêmicas e histórico de desempenho
          </p>
        </div>
      </div>

      <AlunoDetailView aluno={aluno} />
    </div>
  );
}