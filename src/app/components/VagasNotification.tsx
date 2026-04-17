import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { VagasBuscarDialog } from './VagasBuscarDialog';

export function VagasNotification() {
  const { vagasAtivas, vagasDismissed, setVagasDismissed } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (vagasDismissed || vagasAtivas) return null;

  return (
    <>
      <div
        className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl px-5 py-3 shadow-xl cursor-pointer transition-all hover:scale-[1.02]"
        style={{ background: 'var(--theme-accent)', color: '#fff', maxWidth: '92vw' }}
        onClick={() => setDialogOpen(true)}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
          <Sparkles className="h-4 w-4" />
        </div>
        <p className="text-sm font-medium leading-tight">
          Clique aqui para receber recomendações de vagas que tenham a ver com o seu perfil
        </p>
        <button
          className="ml-2 flex-shrink-0 rounded-lg p-1 hover:bg-white/20 transition-colors"
          onClick={(e) => { e.stopPropagation(); setVagasDismissed(true); }}
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <VagasBuscarDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
