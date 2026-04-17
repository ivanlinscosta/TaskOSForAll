import { useState, useEffect } from 'react';
import { Sparkles, Briefcase, MapPin, Star, BookOpen, Search, Brain, Zap, Target, CheckCircle } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { useAppStore } from '../../stores/useAppStore';
import { buscarVagasIA, salvarVagas } from '../../services/vagas-ia-service';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

const LOADING_STEPS = [
  { icon: Search,       text: 'Analisando seu perfil profissional...' },
  { icon: Brain,        text: 'Identificando suas principais habilidades...' },
  { icon: Target,       text: 'Buscando as melhores oportunidades para você...' },
  { icon: Zap,          text: 'Cruzando dados com o mercado de trabalho...' },
  { icon: Search,       text: 'Pesquisando vagas no LinkedIn, Indeed e Catho...' },
  { icon: Brain,        text: 'Avaliando compatibilidade com cada vaga...' },
  { icon: Target,       text: 'Priorizando as oportunidades mais relevantes...' },
  { icon: CheckCircle,  text: 'Quase lá! Finalizando suas recomendações...' },
];

function LoadingScreen() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setStep((s) => (s + 1) % LOADING_STEPS.length);
        setVisible(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const current = LOADING_STEPS[step];
  const Icon = current.icon;

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8 px-6 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'var(--theme-accent)' }} />
        <div className="absolute inset-2 rounded-full animate-pulse opacity-30" style={{ background: 'var(--theme-accent)' }} />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--theme-accent)' }}>
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>

      <div className="space-y-1 min-h-[52px] flex flex-col items-center justify-center">
        <p
          className="text-base font-semibold text-[var(--theme-foreground)] transition-all duration-300"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(6px)' }}
        >
          {current.text}
        </p>
        <p className="text-xs text-[var(--theme-muted-foreground)]">
          Isso pode levar alguns segundos
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {['LinkedIn', 'Indeed', 'Catho', 'Gupy', 'Vagas.com'].map((p, i) => (
          <span
            key={p}
            className="rounded-full px-3 py-1 text-xs font-medium animate-pulse"
            style={{
              background: 'var(--theme-background-secondary)',
              color: 'var(--theme-muted-foreground)',
              animationDelay: `${i * 0.2}s`,
            }}
          >
            {p}
          </span>
        ))}
      </div>

      <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--theme-border)' }}>
        <div
          className="h-full rounded-full transition-all duration-[2200ms] ease-in-out"
          style={{
            background: 'var(--theme-accent)',
            width: `${Math.min(((step + 1) / LOADING_STEPS.length) * 100, 90)}%`,
          }}
        />
      </div>
    </div>
  );
}

interface VagasBuscarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the fetched vagas when search succeeds — use to update local state */
  onSuccess?: () => void;
}

export function VagasBuscarDialog({ open, onOpenChange, onSuccess }: VagasBuscarDialogProps) {
  const { user, userProfile } = useAuth();
  const { setVagasAtivas, setVagasDismissed } = useAppStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleNao = () => {
    setVagasDismissed(true);
    onOpenChange(false);
  };

  const handleSim = async () => {
    setLoading(true);
    try {
      const vagas = await buscarVagasIA({
        cargo: userProfile?.cargo,
        areaAtuacao: userProfile?.areaAtuacao,
        anosExperiencia: userProfile?.anosExperiencia,
        habilidadesAtuais: userProfile?.habilidadesAtuais,
        objetivoCarreira: userProfile?.objetivoCarreira,
        curriculoTexto: userProfile?.curriculoTexto,
      });
      salvarVagas(user!.uid, vagas);
      setVagasAtivas(true);
      onOpenChange(false);
      toast.success('Vagas encontradas! Abrindo sua lista...');
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/vagas-para-mim');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao buscar vagas. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-lg" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Vagas recomendadas para você</DialogTitle>
        </VisuallyHidden>

        {loading ? (
          <LoadingScreen />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b px-6 py-4" style={{ borderColor: 'var(--theme-border)' }}>
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--theme-accent)20' }}>
                <Sparkles className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
              </div>
              <div>
                <p className="font-semibold text-[var(--theme-foreground)]">Vagas recomendadas para você</p>
                <p className="text-xs text-[var(--theme-muted-foreground)]">Análise por IA com base no seu perfil profissional</p>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <p className="text-sm text-[var(--theme-muted-foreground)]">
                Vou analisar seu perfil e encontrar vagas compatíveis nos principais portais do mercado. Deseja continuar?
              </p>

              <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--theme-background-secondary)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-accent)' }}>
                  Seu perfil
                </p>
                {userProfile?.cargo && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Briefcase className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--theme-accent)' }} />
                    <span className="font-medium text-[var(--theme-foreground)]">{userProfile.cargo}</span>
                  </div>
                )}
                {userProfile?.areaAtuacao && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--theme-accent)' }} />
                    <span className="text-[var(--theme-muted-foreground)]">{userProfile.areaAtuacao}</span>
                  </div>
                )}
                {userProfile?.habilidadesAtuais && (
                  <div className="flex items-start gap-2.5 text-sm">
                    <Star className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--theme-accent)' }} />
                    <span className="text-[var(--theme-muted-foreground)]">{userProfile.habilidadesAtuais}</span>
                  </div>
                )}
                {userProfile?.objetivoCarreira && (
                  <div className="flex items-start gap-2.5 text-sm">
                    <BookOpen className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--theme-accent)' }} />
                    <span className="text-[var(--theme-muted-foreground)]">{userProfile.objetivoCarreira}</span>
                  </div>
                )}
                {!userProfile?.cargo && !userProfile?.areaAtuacao && (
                  <p className="text-xs text-[var(--theme-muted-foreground)]">
                    Perfil incompleto — complete o onboarding para recomendações mais precisas.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {['LinkedIn', 'Indeed', 'Catho', 'Gupy', 'Vagas.com'].map((p) => (
                  <span key={p} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: 'var(--theme-background-secondary)', color: 'var(--theme-muted-foreground)' }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t px-6 py-4" style={{ borderColor: 'var(--theme-border)' }}>
              <Button variant="outline" className="flex-1 h-11" onClick={handleNao}>
                Não, obrigado
              </Button>
              <Button
                className="flex-1 h-11 gap-2"
                style={{ background: 'var(--theme-accent)', color: '#fff' }}
                onClick={handleSim}
              >
                <Sparkles className="h-4 w-4" />
                Sim, buscar vagas
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
