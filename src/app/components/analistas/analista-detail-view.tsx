import {
  Mail,
  Phone,
  Briefcase,
  Users,
  CalendarDays,
  MapPin,
  User,
  ClipboardList,
  Target,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { cn } from '../../../lib/cn';

interface PlanoAcao {
  plano: string;
  tipo: string;
  dataCombinada: string;
  avaliacaoId?: string;
  avaliacaoData?: string;
  avaliacaoTipo?: string;
}

interface AvaliacaoAnalista {
  id?: string;
  analistaId: string;
  analistaNome: string;
  tipo: string;
  conceito: 'destaca-se' | 'alinhado' | 'abaixo-do-esperado';
  data: string;
  comentario: string;
  planosAcao: PlanoAcao[];
  criadoEm?: Date;
}

interface Analista {
  id?: string;
  nome: string;
  email: string;
  telefone?: string;
  funcao: string;
  squad?: string;
  senioridade?: string;
  salario?: number;
  foto?: string;
  dataAdmissao?: Date;
  dataNascimento?: Date;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  skills?: string[];
  observacoes?: string;
}

interface Props {
  analista: Analista;
  avaliacoes: AvaliacaoAnalista[];
}

function getInitials(name: string) {
  return (name || 'Usuário')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function getConceitoLabel(conceito: AvaliacaoAnalista['conceito']) {
  const labels = {
    'destaca-se': 'Destaca-se',
    alinhado: 'Alinhado',
    'abaixo-do-esperado': 'Abaixo do esperado',
  };
  return labels[conceito];
}

function getConceitoStyles(conceito: AvaliacaoAnalista['conceito']) {
  if (conceito === 'destaca-se') {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
  if (conceito === 'abaixo-do-esperado') {
    return 'bg-red-100 text-red-700 border-red-200';
  }
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

function getResumoConceitos(avaliacoes: AvaliacaoAnalista[]) {
  const resumo = {
    destacaSe: 0,
    alinhado: 0,
    abaixo: 0,
  };

  avaliacoes.forEach((item) => {
    if (item.conceito === 'destaca-se') resumo.destacaSe += 1;
    if (item.conceito === 'alinhado') resumo.alinhado += 1;
    if (item.conceito === 'abaixo-do-esperado') resumo.abaixo += 1;
  });

  return resumo;
}

export function AnalistaDetailView({ analista, avaliacoes }: Props) {
  const planosAcao = avaliacoes.flatMap((avaliacao) =>
    (avaliacao.planosAcao || []).map((plano) => ({
      ...plano,
      avaliacaoId: avaliacao.id,
      avaliacaoData: avaliacao.data,
      avaliacaoTipo: avaliacao.tipo,
    }))
  );

  const ultimaAvaliacao = avaliacoes.length > 0 ? avaliacoes[0] : null;
  const resumo = getResumoConceitos(avaliacoes);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_1fr]">
        {/* Card principal */}
        <Card className="overflow-hidden rounded-[28px] border border-[var(--theme-border)] bg-[var(--theme-card)] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="h-3 bg-gradient-to-r from-orange-400 via-pink-500 to-fuchsia-500" />
          <CardContent className="p-6">
            <div className="flex flex-col gap-6">
              {/* Foto e nome centralizados */}
              <div className="rounded-[28px] bg-[var(--theme-background-secondary)] p-8">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-48 w-48 border-4 border-white shadow-xl">
                    <AvatarImage src={analista.foto || undefined} />
                    <AvatarFallback className="text-4xl font-semibold">
                      {getInitials(analista.nome)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="mt-6">
                    <h1 className="text-3xl font-bold leading-tight text-[var(--theme-foreground)]">
                      {analista.nome}
                    </h1>
                    <p className="mt-2 text-base text-[var(--theme-muted-foreground)]">
                      {analista.funcao}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {analista.senioridade && (
                      <Badge className="rounded-full bg-orange-100 text-orange-700 hover:bg-orange-100">
                        {analista.senioridade}
                      </Badge>
                    )}
                    {analista.squad && (
                      <Badge variant="outline" className="rounded-full">
                        {analista.squad}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-5">
                    {ultimaAvaliacao ? (
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-4 py-1.5 text-sm font-semibold',
                          getConceitoStyles(ultimaAvaliacao.conceito)
                        )}
                      >
                        {getConceitoLabel(ultimaAvaliacao.conceito)}
                      </span>
                    ) : (
                      <span className="text-sm text-[var(--theme-muted-foreground)]">
                        Sem avaliação registrada
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Informações */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-4 w-4 text-[var(--theme-accent)]" />
                    E-mail
                  </div>
                  <p className="text-sm text-[var(--theme-muted-foreground)] break-all">
                    {analista.email}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Phone className="h-4 w-4 text-[var(--theme-accent)]" />
                    Telefone
                  </div>
                  <p className="text-sm text-[var(--theme-muted-foreground)]">
                    {analista.telefone || 'Não informado'}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4 text-[var(--theme-accent)]" />
                    Squad
                  </div>
                  <p className="text-sm text-[var(--theme-muted-foreground)]">
                    {analista.squad || 'Não informado'}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <CalendarDays className="h-4 w-4 text-[var(--theme-accent)]" />
                    Admissão
                  </div>
                  <p className="text-sm text-[var(--theme-muted-foreground)]">
                    {analista.dataAdmissao
                      ? new Date(analista.dataAdmissao).toLocaleDateString('pt-BR')
                      : 'Não informado'}
                  </p>
                </div>
              </div>

              {(analista.cidade || analista.estado || analista.endereco) && (
                <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-[var(--theme-accent)]" />
                    Localização
                  </div>
                  <p className="text-sm text-[var(--theme-muted-foreground)]">
                    {[analista.endereco, analista.cidade, analista.estado]
                      .filter(Boolean)
                      .join(' • ') || 'Não informado'}
                  </p>
                </div>
              )}

              {analista.skills && analista.skills.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-[var(--theme-foreground)]">
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analista.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-[var(--theme-background-secondary)] px-3 py-1 text-xs font-medium text-[var(--theme-foreground)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analista.observacoes && (
                <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4 text-[var(--theme-accent)]" />
                    Observações
                  </div>
                  <p className="text-sm leading-6 text-[var(--theme-muted-foreground)]">
                    {analista.observacoes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cards laterais */}
        <div className="grid grid-cols-1 gap-5">
          <Card className="rounded-[28px] border border-[var(--theme-border)] bg-[var(--theme-card)] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--theme-accent)]" />
                <h2 className="text-lg font-semibold">Resumo de desempenho</h2>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{resumo.destacaSe}</p>
                  <p className="mt-1 text-xs text-emerald-700">Destaca-se</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4 text-center">
                  <p className="text-2xl font-bold text-amber-700">{resumo.alinhado}</p>
                  <p className="mt-1 text-xs text-amber-700">Alinhado</p>
                </div>
                <div className="rounded-2xl bg-red-50 p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">{resumo.abaixo}</p>
                  <p className="mt-1 text-xs text-red-700">Abaixo</p>
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
                <Target className="h-4 w-4 text-[var(--theme-accent)]" />
                <h2 className="text-lg font-semibold">Acompanhamento</h2>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                  <p className="text-sm font-medium">Planos de ação ativos</p>
                  <p className="mt-1 text-2xl font-bold">{planosAcao.length}</p>
                </div>

                <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                  <p className="text-sm font-medium">Última avaliação</p>
                  <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">
                    {ultimaAvaliacao
                      ? `${new Date(ultimaAvaliacao.data).toLocaleDateString('pt-BR')} • ${ultimaAvaliacao.tipo}`
                      : 'Nenhuma avaliação registrada'}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
                  <p className="text-sm font-medium">Status geral</p>
                  <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">
                    {ultimaAvaliacao
                      ? getConceitoLabel(ultimaAvaliacao.conceito)
                      : 'Sem dados suficientes'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.1fr_1fr]">
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
              <div className="space-y-3">
                {avaliacoes.map((avaliacao) => (
                  <div
                    key={avaliacao.id}
                    className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--theme-foreground)]">
                          {avaliacao.tipo}
                        </p>
                        <p className="text-xs text-[var(--theme-muted-foreground)]">
                          {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <span
                        className={cn(
                          'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                          getConceitoStyles(avaliacao.conceito)
                        )}
                      >
                        {getConceitoLabel(avaliacao.conceito)}
                      </span>
                    </div>

                    <p className="text-sm leading-6 text-[var(--theme-muted-foreground)]">
                      {avaliacao.comentario}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border border-[var(--theme-border)] bg-[var(--theme-card)] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[var(--theme-accent)]" />
              <h2 className="text-lg font-semibold">Feedbacks e acompanhamento</h2>
            </div>

            {avaliacoes.length === 0 ? (
              <p className="text-sm text-[var(--theme-muted-foreground)]">
                Nenhum feedback disponível.
              </p>
            ) : (
              <div className="space-y-3">
                {avaliacoes.map((avaliacao) => (
                  <div
                    key={`feedback-${avaliacao.id}`}
                    className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--theme-foreground)]">
                        {avaliacao.tipo}
                      </p>
                      <span className="text-xs text-[var(--theme-muted-foreground)]">
                        {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <p className="text-sm leading-6 text-[var(--theme-muted-foreground)]">
                      {avaliacao.comentario}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[28px] border border-[var(--theme-border)] bg-[var(--theme-card)] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-[var(--theme-accent)]" />
            <h2 className="text-lg font-semibold">Planos de ação</h2>
          </div>

          {planosAcao.length === 0 ? (
            <p className="text-sm text-[var(--theme-muted-foreground)]">
              Nenhum plano de ação registrado.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[var(--theme-border)]">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-[var(--theme-background-secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Plano</th>
                    <th className="px-4 py-3 text-left font-medium">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium">Data combinada</th>
                    <th className="px-4 py-3 text-left font-medium">Avaliação</th>
                    <th className="px-4 py-3 text-left font-medium">Data da avaliação</th>
                  </tr>
                </thead>
                <tbody>
                  {planosAcao.map((plano, index) => (
                    <tr
                      key={`${plano.avaliacaoId}-${index}`}
                      className="border-t border-[var(--theme-border)]"
                    >
                      <td className="px-4 py-3">{plano.plano}</td>
                      <td className="px-4 py-3 text-[var(--theme-muted-foreground)]">
                        {plano.tipo}
                      </td>
                      <td className="px-4 py-3 text-[var(--theme-muted-foreground)]">
                        {new Date(plano.dataCombinada).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-[var(--theme-muted-foreground)]">
                        {plano.avaliacaoTipo}
                      </td>
                      <td className="px-4 py-3 text-[var(--theme-muted-foreground)]">
                        {plano.avaliacaoData
                          ? new Date(plano.avaliacaoData).toLocaleDateString('pt-BR')
                          : '-'}
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