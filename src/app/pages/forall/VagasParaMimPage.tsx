import { useState } from 'react';
import {
  Sparkles, Briefcase, MapPin, Clock, DollarSign,
  ExternalLink, RefreshCw, Code2, Palette,
  Wallet, Megaphone, Users, BookOpen, Heart, ShoppingCart, LayoutGrid,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { getVagasSalvas, type VagaRecomendada } from '../../../services/vagas-ia-service';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { VagasBuscarDialog } from '../../components/VagasBuscarDialog';

// ── Área → cor/ícone ────────────────────────────────────────────────────────
const AREA_CONFIG: Record<string, { gradient: string; Icon: React.FC<any>; label: string }> = {
  tecnologia:    { gradient: 'from-blue-500 to-cyan-400',    Icon: Code2,        label: 'Tecnologia' },
  design:        { gradient: 'from-violet-500 to-pink-400',  Icon: Palette,      label: 'Design' },
  financas:      { gradient: 'from-emerald-500 to-teal-400', Icon: Wallet,       label: 'Finanças' },
  marketing:     { gradient: 'from-orange-500 to-amber-400', Icon: Megaphone,    label: 'Marketing' },
  rh:            { gradient: 'from-teal-500 to-cyan-400',    Icon: Users,        label: 'RH' },
  administrativo:{ gradient: 'from-slate-500 to-gray-400',   Icon: LayoutGrid,   label: 'Administrativo' },
  saude:         { gradient: 'from-red-500 to-pink-400',     Icon: Heart,        label: 'Saúde' },
  educacao:      { gradient: 'from-indigo-500 to-violet-400',Icon: BookOpen,     label: 'Educação' },
  vendas:        { gradient: 'from-amber-500 to-yellow-400', Icon: ShoppingCart, label: 'Vendas' },
  outros:        { gradient: 'from-gray-500 to-slate-400',   Icon: Briefcase,    label: 'Outros' },
};

const FONTE_COLORS: Record<string, string> = {
  LinkedIn:  '#0A66C2',
  Indeed:    '#003A9B',
  Catho:     '#E10000',
  Gupy:      '#00C46A',
  'Vagas.com': '#FF6600',
};

function VagaCard({ vaga }: { vaga: VagaRecomendada }) {
  const cfg = AREA_CONFIG[vaga.area] ?? AREA_CONFIG['outros'];
  const { Icon } = cfg;
  const fonteColor = FONTE_COLORS[vaga.fonte] ?? '#6B7280';

  return (
    <Card className="overflow-hidden flex flex-col">
      {/* Banner ilustrado */}
      <div className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${cfg.gradient}`}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 70% 30%, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="flex flex-col items-center gap-2 text-white z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <Icon className="h-6 w-6" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{cfg.label}</span>
        </div>
        <Badge
          className="absolute right-3 top-3 text-[10px] font-bold border-0"
          style={{ background: fonteColor, color: '#fff' }}
        >
          {vaga.fonte}
        </Badge>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        {/* Título e empresa */}
        <div>
          <h3 className="font-bold text-[var(--theme-foreground)] leading-tight">{vaga.titulo}</h3>
          <p className="text-sm text-[var(--theme-muted-foreground)] mt-0.5">{vaga.empresa}</p>
        </div>

        {/* Badges de info */}
        <div className="flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'var(--theme-background-secondary)', color: 'var(--theme-foreground)' }}>
            <MapPin className="h-3 w-3" /> {vaga.localizacao}
          </span>
          <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'var(--theme-background-secondary)', color: 'var(--theme-foreground)' }}>
            <Clock className="h-3 w-3" /> {vaga.modeloTrabalho}
          </span>
          {vaga.salario && (
            <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-emerald-700" style={{ background: '#D1FAE5' }}>
              <DollarSign className="h-3 w-3" /> {vaga.salario}
            </span>
          )}
        </div>

        {/* Descrição */}
        <p className="text-sm text-[var(--theme-muted-foreground)] leading-relaxed line-clamp-3">{vaga.descricao}</p>

        {/* Skills */}
        {vaga.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {vaga.skills.slice(0, 5).map((s) => (
              <span key={s} className="rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ background: 'var(--theme-accent)15', color: 'var(--theme-accent)' }}>
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Botão */}
        <div className="mt-auto pt-1">
          <a
            href={vaga.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg h-10 px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
            style={{ background: fonteColor, color: '#fff' }}
          >
            <ExternalLink className="h-4 w-4" />
            Ver vaga
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export function VagasParaMimPage() {
  const { userProfile } = useAuth();
  const [vagas, setVagas] = useState<VagaRecomendada[]>(() => getVagasSalvas());
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSuccess = () => {
    setVagas(getVagasSalvas());
  };

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)] flex items-center gap-2">
            <Sparkles className="h-7 w-7" style={{ color: 'var(--theme-accent)' }} />
            Vagas Para Mim
          </h1>
          <p className="mt-1 text-[var(--theme-muted-foreground)]">
            Recomendações personalizadas com base no seu perfil profissional
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="gap-2"
          style={{ background: 'var(--theme-accent)', color: '#fff' }}
        >
          <RefreshCw className="h-4 w-4" />
          Buscar novas vagas com IA
        </Button>
      </div>

      {/* Resumo do perfil */}
      {(userProfile?.cargo || userProfile?.curriculoTexto) && (
        <Card style={{ borderLeft: '4px solid var(--theme-accent)' }}>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-accent)' }}>
              Seu perfil profissional
            </p>
            {userProfile.curriculoTexto ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--theme-foreground)]">
                  {userProfile.cargo}{userProfile.areaAtuacao ? ` · ${userProfile.areaAtuacao}` : ''}
                </p>
                <p className="text-sm text-[var(--theme-muted-foreground)] line-clamp-4 whitespace-pre-line">
                  {userProfile.curriculoTexto.slice(0, 600)}
                  {userProfile.curriculoTexto.length > 600 ? '...' : ''}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                {userProfile.cargo && (
                  <div className="flex items-start gap-2">
                    <Briefcase className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--theme-accent)' }} />
                    <div>
                      <p className="text-[10px] text-[var(--theme-muted-foreground)]">Cargo</p>
                      <p className="text-sm font-medium text-[var(--theme-foreground)]">{userProfile.cargo}</p>
                    </div>
                  </div>
                )}
                {userProfile.areaAtuacao && (
                  <div className="flex items-start gap-2">
                    <LayoutGrid className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--theme-accent)' }} />
                    <div>
                      <p className="text-[10px] text-[var(--theme-muted-foreground)]">Área</p>
                      <p className="text-sm font-medium text-[var(--theme-foreground)]">{userProfile.areaAtuacao}</p>
                    </div>
                  </div>
                )}
                {userProfile.anosExperiencia && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--theme-accent)' }} />
                    <div>
                      <p className="text-[10px] text-[var(--theme-muted-foreground)]">Experiência</p>
                      <p className="text-sm font-medium text-[var(--theme-foreground)]">{userProfile.anosExperiencia}</p>
                    </div>
                  </div>
                )}
                {userProfile.habilidadesAtuais && (
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--theme-accent)' }} />
                    <div>
                      <p className="text-[10px] text-[var(--theme-muted-foreground)]">Skills</p>
                      <p className="text-sm font-medium text-[var(--theme-foreground)] line-clamp-2">{userProfile.habilidadesAtuais}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de vagas */}
      {vagas.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--theme-background-secondary)' }}>
            <Briefcase className="h-7 w-7" style={{ color: 'var(--theme-accent)' }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--theme-foreground)]">Nenhuma vaga encontrada ainda</p>
            <p className="mt-1 text-sm text-[var(--theme-muted-foreground)]">Clique em "Buscar novas vagas com IA" para começar</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2" style={{ background: 'var(--theme-accent)', color: '#fff' }}>
            <Sparkles className="h-4 w-4" /> Buscar vagas agora
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--theme-muted-foreground)]">
            {vagas.length} vagas encontradas com base no seu perfil
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vagas.map((vaga, i) => <VagaCard key={i} vaga={vaga} />)}
          </div>
        </>
      )}
      <VagasBuscarDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={handleSuccess} />
    </div>
  );
}
