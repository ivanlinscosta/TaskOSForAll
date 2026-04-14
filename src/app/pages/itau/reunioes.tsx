import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Calendar, Clock, Users, Video, Sparkles, CheckCircle2, AlertCircle, Loader, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../../lib/cn';
import { toast } from 'sonner';
import * as reunioesService from '../../../services/reunioes-service';

export function Reunioes() {
  const navigate = useNavigate();
  const [reunioes, setReunioes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    carregarReunioes();
  }, []);

  const carregarReunioes = async () => {
    try {
      setIsLoading(true);
      const reunioesFirebase = await reunioesService.listarReunioes();
      // Mostra o que veio do Firebase (mesmo que vazio)
      setReunioes(reunioesFirebase || []);
    } catch (error) {
      console.error('Erro ao carregar reuniões:', error);
      toast.error('Erro ao carregar reuniões. Verifique sua conexão.');
      setReunioes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReuniao = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta reunião?')) return;
    try {
      await reunioesService.deletarReuniao(id);
      setReunioes(prev => prev.filter(r => r.id !== id));
      toast.success('Reunião excluída!');
    } catch (error) {
      toast.error('Erro ao excluir reunião');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = { agendada: 'default', concluida: 'secondary', cancelada: 'destructive' };
    return variants[status] || 'default';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-8 h-8 animate-spin text-[var(--theme-accent)]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Gestão de Reuniões</h1>
          <p className="text-[var(--theme-muted-foreground)] mt-1">{reunioes.length} reuniões registradas</p>
        </div>
        <Button variant="theme" className="gap-2" onClick={() => navigate('/itau/reunioes/nova')}>
          <Plus className="w-4 h-4" /> Nova Reunião
        </Button>
      </div>

      <div className="space-y-4">
        {reunioes.map(reuniao => (
          <Card key={reuniao.id} className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Video className="w-5 h-5 text-[var(--theme-accent)]" />
                    <CardTitle className="text-xl">{reuniao.titulo}</CardTitle>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={getStatusBadge(reuniao.status)}>{reuniao.status}</Badge>
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="w-3 h-3" />
                      {reuniao.data ? format(new Date(reuniao.data), "d 'de' MMM, yyyy", { locale: ptBR }) : '-'}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="w-3 h-3" />
                      {reuniao.data ? format(new Date(reuniao.data), 'HH:mm') : '-'} {reuniao.duracao ? `• ${reuniao.duracao} min` : ''}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Users className="w-3 h-3" />
                      {reuniao.participantes?.length || 0} participantes
                    </Badge>
                  </div>
                </div>
                <button onClick={() => handleDeleteReuniao(reuniao.id)} className="text-red-500 hover:text-red-700 p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {reuniao.participantes && reuniao.participantes.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-[var(--theme-foreground)]">Participantes</h4>
                  <div className="flex flex-wrap gap-2">
                    {reuniao.participantes.map((p: string, i: number) => (
                      <Badge key={i} variant="secondary">{p}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {reuniao.notas && (
                <div>
                  <h4 className="font-semibold mb-2 text-[var(--theme-foreground)]">Notas da Reunião</h4>
                  <p className="text-sm text-[var(--theme-muted-foreground)] p-3 rounded-lg bg-[var(--theme-background-secondary)]">{reuniao.notas}</p>
                </div>
              )}
              {reuniao.descricao && (
                <div>
                  <h4 className="font-semibold mb-2 text-[var(--theme-foreground)]">Descrição</h4>
                  <p className="text-sm text-[var(--theme-muted-foreground)] p-3 rounded-lg bg-[var(--theme-background-secondary)]">{reuniao.descricao}</p>
                </div>
              )}
              {reuniao.resumoIA && (
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <h4 className="font-semibold mb-2 text-purple-600 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Resumo Gerado por IA
                  </h4>
                  <p className="text-sm text-[var(--theme-foreground)]">{reuniao.resumoIA}</p>
                </div>
              )}
              {reuniao.acoes && reuniao.acoes.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 text-[var(--theme-foreground)]">Ações ({reuniao.acoes.length})</h4>
                  <div className="space-y-2">
                    {reuniao.acoes.map((acao: any) => (
                      <div key={acao.id} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--theme-background-secondary)]">
                        <div className="mt-1">
                          {acao.status === 'concluida' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                           acao.status === 'em_progresso' ? <Clock className="w-4 h-4 text-blue-500" /> :
                           <AlertCircle className="w-4 h-4 text-orange-500" />}
                        </div>
                        <div className="flex-1">
                          <p className={cn("text-sm text-[var(--theme-foreground)] mb-1", acao.status === 'concluida' && "line-through text-[var(--theme-muted-foreground)]")}>{acao.descricao}</p>
                          <div className="flex items-center gap-2 text-xs text-[var(--theme-muted-foreground)]">
                            <span>Responsável: {acao.responsavel}</span>
                            {acao.prazo && <><span>•</span><span>Prazo: {format(new Date(acao.prazo), "d 'de' MMM", { locale: ptBR })}</span></>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {reunioes.length === 0 && (
          <div className="text-center py-12 text-[var(--theme-muted-foreground)]">
            <p>Nenhuma reunião encontrada.</p>
            <Button variant="theme" className="mt-4 gap-2" onClick={() => navigate('/itau/reunioes/nova')}>
              <Plus className="w-4 h-4" /> Agendar Primeira Reunião
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
