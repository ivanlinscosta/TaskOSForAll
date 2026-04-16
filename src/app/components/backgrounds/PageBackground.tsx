import carreirasvg from '../../../assets/trabalho_gestao_carreira.svg';
import financasvg from '../../../assets/pessoal_gestao_financeira.svg';
import dashboardsvg from '../../../assets/trabalho_dashboard.svg';
import tarefassvg from '../../../assets/trabalho_tarefas.svg';

export type BackgroundVariant = 'career' | 'finance' | 'dashboard' | 'tasks' | 'development';

const VARIANT_CONFIG: Record<
  BackgroundVariant,
  { src: string; positions: { x: string; y: string; size: string; opacity: number; rotate?: number }[] }
> = {
  career: {
    src: carreirasvg,
    positions: [
      { x: '-8%', y: '-15%', size: '45%', opacity: 0.06, rotate: -10 },
      { x: '65%', y: '55%', size: '38%', opacity: 0.04, rotate: 15 },
    ],
  },
  finance: {
    src: financasvg,
    positions: [
      { x: '60%', y: '-20%', size: '50%', opacity: 0.05, rotate: 5 },
      { x: '-10%', y: '55%', size: '35%', opacity: 0.04, rotate: -8 },
    ],
  },
  dashboard: {
    src: dashboardsvg,
    positions: [
      { x: '55%', y: '-10%', size: '48%', opacity: 0.06, rotate: 8 },
      { x: '-5%', y: '50%', size: '32%', opacity: 0.04, rotate: -5 },
    ],
  },
  tasks: {
    src: tarefassvg,
    positions: [
      { x: '-5%', y: '-10%', size: '42%', opacity: 0.05, rotate: -5 },
      { x: '62%', y: '60%', size: '36%', opacity: 0.04, rotate: 10 },
    ],
  },
  development: {
    src: carreirasvg,
    positions: [
      { x: '55%', y: '-15%', size: '48%', opacity: 0.06, rotate: 12 },
      { x: '-8%', y: '60%', size: '38%', opacity: 0.04, rotate: -8 },
    ],
  },
};

interface PageBackgroundProps {
  variant: BackgroundVariant;
  className?: string;
}

export function PageBackground({ variant, className = '' }: PageBackgroundProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <div
      className={`pointer-events-none fixed inset-0 overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {config.positions.map((pos, i) => (
        <img
          key={i}
          src={config.src}
          alt=""
          style={{
            position: 'absolute',
            left: pos.x,
            top: pos.y,
            width: pos.size,
            opacity: pos.opacity,
            transform: `rotate(${pos.rotate ?? 0}deg)`,
            filter: 'blur(1px)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}

// ── Hero Background ─────────────────────────────────────────────────────────
interface HeroBackgroundProps {
  variant: BackgroundVariant;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function HeroBackground({ variant, children, className = '', style }: HeroBackgroundProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {/* Decorative SVG */}
      <img
        src={config.src}
        alt=""
        style={{
          position: 'absolute',
          right: '-5%',
          top: '-20%',
          width: '55%',
          opacity: 0.08,
          transform: 'rotate(10deg)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        aria-hidden="true"
      />
      {/* Gradient overlay for depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, var(--theme-card) 0%, transparent 80%)',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
