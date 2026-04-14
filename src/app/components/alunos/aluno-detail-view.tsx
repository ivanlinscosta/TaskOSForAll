import {
  Mail,
  Phone,
  GraduationCap,
  CalendarDays,
  MapPin,
  ClipboardList,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Aluno, AvaliacaoAluno } from '../../../services/alunos-service';

interface Props {
  aluno: Aluno;
}

function getInitials(name: string) {
  return (name || 'Aluno')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function calcularMediaPonderada(avaliacoes: AvaliacaoAluno[]) {
  if (!avaliacoes?.length) return 0;

  const somaPesos = avaliacoes.reduce((acc, item) => acc + (item.peso || 1), 0);
  const somaNotas = avaliacoes.reduce(
    (acc, item) => acc + (item.nota || 0) * (item.peso || 1),
    0
  );

  return somaPesos > 0 ? somaNotas / somaPesos : 0;
}

function mediaPorTipo(avaliacoes: AvaliacaoAluno[], tipo: string) {
  const lista = avaliacoes.filter((a) => a.tipo === tipo);
  if (!lista.length) return 0;
  return lista.reduce((acc, item) => acc + item.nota, 0) / lista.length;
}

export function AlunoDetailView({ aluno }: Props) {
  const avaliacoes = aluno.avaliacoes || [];
  const mediaGeral = calcularMediaPonderada(avaliacoes);
  const mediaProvas = mediaPorTipo(avaliacoes, 'Prova');
  const mediaTrabalhos = mediaPorTipo(avaliacoes, 'Trabalho');
  const mediaProjetos = mediaPorTipo(avaliacoes, 'Projeto');

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_1fr]">
        <Card className="overflow-hidden rounded-[28px] border border-[var(--theme-border)] bg-[var(--theme-card)] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="h-3 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500" />
          <CardContent className="p-6">
            <div className="rounded-[28px] bg-[var(--theme-background-secondary)] p-8">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-44 w-44 border-4 border-white shadow-xl">
                  <AvatarImage src={aluno.foto || undefined} />
                  <AvatarFallback className="text-4xl font-semibold">
                    {getInitials(aluno.nome)}
                  </AvatarFallback>
                </Avatar>

                <div className="mt-6">
                  <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">
                    {aluno.nome}
                  </h1>
                  <p className="mt-2 text-base text-[var(--theme-muted-foreground)]">
                    {aluno.curso}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {aluno.turma && <Badge variant="outline">{aluno.turma}</Badge>}
                  {aluno.periodo && <Badge>{aluno.periodo}</Badge>}
                  {aluno.ra && <Badge variant="secondary">RA {aluno.ra}</Badge>}
                </div>

                <div className="mt-5 rounded-full bg-[var(--theme-accent)]/10 px-4 py-2 text-sm font-semibold text-[var(--theme-accent)]">
                  Média geral {mediaGeral.toFixed(1)}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4 text-[var(--theme-accent)]" />
                  E-mail
                </div>
                <p className="text-sm text-[var(--theme-muted-foreground)] break-all">
                  {aluno.email}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Phone className="h-4 w-4 text-[var(--theme-accent)]" />
                  Telefone
                </div>
                <p className="text-sm text-[var(--theme-muted-foreground)]">
                  {aluno.telefone || 'Não informado'}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <GraduationCap className="h-4 w-4 text-[var(--theme-accent)]" />
                  Curso / Turma
                </div>
                <p className="text-sm text-[var(--theme-muted-foreground)]">
                  {[aluno.curso, aluno.turma].filter(Boolean).join(' • ')}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4 text-[var(--theme-accent)]" />
                  Nascimento
                </div>
                <p className="text-sm text-[var(--theme-muted-foreground)]">
                  {aluno.dataNascimento
                    ? new Date(aluno.dataNascimento).toLocaleDateString('pt-BR')
                    : 'Não informado'}
                </p>
              </div>
            </div>

            {(aluno.endereco || aluno.cidade || aluno.estado) && (
              <div className="mt-5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-[var(--theme-accent)]" />
                  Endereço
                </div>
                <p className="text-sm text-[var(--theme-muted-foreground)]">
                  {[aluno.endereco, aluno.cidade, aluno.estado, aluno.cep]
                    .filter(Boolean)
                    .join(' • ') || 'Não informado'}
                </p>
              </div>
            )}

            {aluno.observacoes && (
              <div className="mt-5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <ClipboardList className="h-4 w-4 text-[var(--theme-accent)]" />
                  Observações
                </div>
                <p className="text-sm leading-6 text-[var(--theme-muted-foreground)]">
                  {aluno.observacoes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-5">
          <Card className="rounded-[28px] border border-[var(--theme-border)] bg-[var(--theme-card)] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--theme-accent)]" />
                <h2 className="text-lg font-semibold">Resumo acadêmico</h2>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-blue-50 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">{mediaProvas.toFixed(1)}</p>
                  <p className="mt-1 text-xs text-blue-700">Provas</p>
                </div>
                <div className="rounded-2xl bg-violet-50 p-4 text-center">
                  <p className="text-2xl font-bold text-violet-700">{mediaTrabalhos.toFixed(1)}</p>
                  <p className="mt-1 text-xs text-violet-700">Trabalhos</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{mediaProjetos.toFixed(1)}</p>
                  <p className="mt-1 text-xs text-emerald-700">Projetos</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                <p className="text-sm font-medium text-[var(--theme-foreground)]">
                  Total de avaliações
                </p>
                <p className="mt-1 text-3xl font-bold text-[var(--theme-foreground)]">
                  {avaliacoes.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-[var(--theme-border)] bg-[var(--theme-card)] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[var(--theme-accent)]" />
                <h2 className="text-lg font-semibold">Acompanhamento</h2>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                  <p className="text-sm font-medium">Status acadêmico</p>
                  <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">
                    {mediaGeral >= 7 ? 'Bom desempenho' : mediaGeral >= 5 ? 'Em atenção' : 'Risco acadêmico'}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                  <p className="text-sm font-medium">Última avaliação</p>
                  <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">
                    {avaliacoes[0]
                      ? `${new Date(avaliacoes[0].data).toLocaleDateString('pt-BR')} • ${avaliacoes[0].disciplina}`
                      : 'Nenhuma avaliação registrada'}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                  <p className="text-sm font-medium">Comentário recente</p>
                  <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">
                    {avaliacoes[0]?.comentario || 'Sem observações registradas'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-[28px] border border-[var(--theme-border)] bg-[var(--theme-card)] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[var(--theme-accent)]" />
            <h2 className="text-lg font-semibold">Histórico de avaliações</h2>
          </div>

          {avaliacoes.length === 0 ? (
            <p className="text-sm text-[var(--theme-muted-foreground)]">
              Nenhuma avaliação registrada.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[var(--theme-border)]">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-[var(--theme-background-secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Disciplina</th>
                    <th className="px-4 py-3 text-left font-medium">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium">Nota</th>
                    <th className="px-4 py-3 text-left font-medium">Peso</th>
                    <th className="px-4 py-3 text-left font-medium">Data</th>
                    <th className="px-4 py-3 text-left font-medium">Comentário</th>
                  </tr>
                </thead>
                <tbody>
                  {avaliacoes.map((avaliacao, index) => (
                    <tr key={index} className="border-t border-[var(--theme-border)]">
                      <td className="px-4 py-3">{avaliacao.disciplina}</td>
                      <td className="px-4 py-3 text-[var(--theme-muted-foreground)]">{avaliacao.tipo}</td>
                      <td className="px-4 py-3 font-semibold">{avaliacao.nota}</td>
                      <td className="px-4 py-3 text-[var(--theme-muted-foreground)]">{avaliacao.peso}</td>
                      <td className="px-4 py-3 text-[var(--theme-muted-foreground)]">
                        {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-[var(--theme-muted-foreground)]">
                        {avaliacao.comentario || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}