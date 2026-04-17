import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { GuidedTourIllustration } from './GuidedTourIllustration';
import { GuidedTourProgress } from './GuidedTourProgress';
import type { GuidedTourCampaign } from '../../../services/guided-tour-service';

interface Props {
  campaign: GuidedTourCampaign;
  initialStep?: number;
  onComplete: () => void;
  onDismiss: () => void;
  onStepChange?: (step: number) => void;
}

const THEME_BADGE: Record<string, string> = {
  default: 'Tour guiado',
  launch: '🚀 Lançamento',
  update: '✨ Novidade',
  feature: '⚡ Nova funcionalidade',
};

export function GuidedTourModal({
  campaign,
  initialStep = 0,
  onComplete,
  onDismiss,
  onStepChange,
}: Props) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [fading, setFading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const steps = campaign.steps;
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;
  const accentColor = step?.accentColor || 'var(--theme-accent)';

  // Entry animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const transitionTo = useCallback(
    (nextIndex: number) => {
      if (fading) return;
      setFading(true);
      setTimeout(() => {
        setCurrentStep(nextIndex);
        onStepChange?.(nextIndex);
        setFading(false);
      }, 180);
    },
    [fading, onStepChange],
  );

  const handleNext = () => (isLast ? onComplete() : transitionTo(currentStep + 1));
  const handlePrev = () => { if (!isFirst) transitionTo(currentStep - 1); };

  const handleDismiss = () => {
    setMounted(false);
    setTimeout(onDismiss, 280);
  };

  const handleComplete = () => {
    setMounted(false);
    setTimeout(onComplete, 280);
  };

  if (!step) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={campaign.title}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,0.50)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.28s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && campaign.dismissible) handleDismiss();
      }}
    >
      <div
        className="relative w-full overflow-hidden rounded-3xl shadow-2xl"
        style={{
          maxWidth: 520,
          background: 'var(--theme-card)',
          transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(20px)',
          transition: 'transform 0.34s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease',
          opacity: mounted ? 1 : 0,
        }}
      >
        {/* Dismiss button */}
        {campaign.dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
            style={{ background: 'rgba(0,0,0,0.18)', color: '#fff' }}
            aria-label="Fechar tour"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Illustration */}
        <div
          className="relative"
          style={{
            height: 228,
            opacity: fading ? 0 : 1,
            transition: 'opacity 0.18s ease',
          }}
        >
          <GuidedTourIllustration
            asset={step.imageAsset}
            accentColor={accentColor}
            className="absolute inset-0 h-full w-full"
          />

          {/* Theme badge */}
          <div
            className="absolute bottom-3 left-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: 'rgba(0,0,0,0.32)',
              color: '#fff',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <Sparkles className="h-3 w-3" />
            {THEME_BADGE[campaign.themeVariant] ?? THEME_BADGE.default}
          </div>

          {/* Step counter badge */}
          <div
            className="absolute right-4 bottom-3 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: 'rgba(0,0,0,0.32)', color: '#fff', backdropFilter: 'blur(8px)' }}
          >
            {currentStep + 1} / {steps.length}
          </div>
        </div>

        {/* Content */}
        <div
          className="px-7 pb-7 pt-5"
          style={{
            opacity: fading ? 0 : 1,
            transform: fading ? 'translateY(6px)' : 'translateY(0)',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
          }}
        >
          {/* Campaign subtitle */}
          {campaign.subtitle && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: accentColor }}>
              {campaign.subtitle}
            </p>
          )}

          <h2 className="text-xl font-bold leading-snug text-[var(--theme-foreground)]">
            {step.title}
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-[var(--theme-muted-foreground)]">
            {step.description}
          </p>

          {/* Footer row */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <GuidedTourProgress
              total={steps.length}
              current={currentStep}
              accentColor={accentColor}
            />

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={fading}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border transition-all hover:bg-[var(--theme-hover)] disabled:opacity-40"
                  style={{ borderColor: 'var(--theme-border)' }}
                  aria-label="Passo anterior"
                >
                  <ArrowLeft className="h-4 w-4 text-[var(--theme-foreground)]" />
                </button>
              )}

              <button
                type="button"
                onClick={isLast ? handleComplete : handleNext}
                disabled={fading}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                style={{ background: accentColor }}
              >
                {isLast ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    {step.ctaLabel || 'Concluir'}
                  </>
                ) : (
                  <>
                    {step.ctaLabel || 'Próximo'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Skip all */}
          {campaign.dismissible && !isLast && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-xs text-[var(--theme-muted-foreground)] transition-colors hover:text-[var(--theme-foreground)]"
              >
                Pular tour
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
