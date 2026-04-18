type IconProps = { color?: string; size?: number; className?: string };
const C = '#0D5C7A'; // default brand color

export function IconDashboard({ color = C, size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="1" y="1" width="14" height="14" rx="3.5" fill={color} />
      <rect x="19" y="1" width="14" height="14" rx="3.5" fill={color} opacity="0.3" />
      <rect x="1" y="19" width="14" height="14" rx="3.5" fill={color} opacity="0.3" />
      <rect x="19" y="19" width="14" height="14" rx="3.5" fill={color} opacity="0.65" />
    </svg>
  );
}

export function IconTarefas({ color = C, size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="2" y="1" width="28" height="30" rx="4" fill={color} opacity="0.1" />
      <rect x="2" y="1" width="28" height="30" rx="4" stroke={color} strokeWidth="1.8" />
      <polyline points="8,14 11.5,17.5 19,10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="8" y1="22" x2="24" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <line x1="8" y1="27" x2="20" y2="27" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

export function IconPlanejamento({ color = C, size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="1" y="7" width="36" height="26" rx="5" fill={color} opacity="0.1" />
      <rect x="1" y="7" width="36" height="26" rx="5" stroke={color} strokeWidth="1.8" />
      <rect x="1" y="7" width="36" height="9" rx="5" fill={color} opacity="0.12" />
      <line x1="1" y1="16" x2="37" y2="16" stroke={color} strokeWidth="1" opacity="0.2" />
      <line x1="10" y1="1" x2="10" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="28" y1="1" x2="28" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="10" cy="22" r="2.5" fill={color} />
      <circle cx="19" cy="22" r="2.5" fill={color} opacity="0.35" />
      <circle cx="28" cy="22" r="2.5" fill={color} opacity="0.35" />
      <circle cx="10" cy="30" r="2.5" fill={color} opacity="0.35" />
      <circle cx="19" cy="30" r="2.5" fill={color} />
      <circle cx="28" cy="30" r="2.5" fill={color} opacity="0.35" />
    </svg>
  );
}

export function IconFinancas({ color = C, size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="14" stroke={color} strokeWidth="2.8" />
      <text x="16" y="23" fontFamily="Arial,Helvetica,sans-serif" fontSize="15" fontWeight="900" fill={color} textAnchor="middle">$</text>
    </svg>
  );
}

export function IconCarreira({ color = C, size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="1" y="22" width="9" height="9" rx="2.5" fill={color} opacity="0.28" />
      <rect x="13" y="13" width="9" height="18" rx="2.5" fill={color} opacity="0.6" />
      <rect x="25" y="1" width="9" height="30" rx="2.5" fill={color} />
      <line x1="0" y1="31" x2="34" y2="31" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.22" />
      <line x1="2" y1="28" x2="30" y2="8" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2.5,3" opacity="0.32" />
    </svg>
  );
}

export function IconDesenvolvimento({ color = C, size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="22" cy="10" r="7" stroke={color} strokeWidth="1.8" />
      <rect x="18" y="16" width="8" height="3" rx="1" fill={color} opacity="0.5" />
      <line x1="22" y1="2" x2="22" y2="4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="30" y1="4" x2="29" y2="5.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="33" y1="11" x2="31" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="14" y1="4" x2="15" y2="5.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="11" y1="11" x2="13" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M2 24 Q2 22 5 22 L21 22 L21 41 L4 41 Q2 41 2 39 Z" fill={color} opacity="0.1" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M42 24 Q42 22 39 22 L23 22 L23 41 L40 41 Q42 41 42 39 Z" fill={color} opacity="0.1" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <line x1="22" y1="22" x2="22" y2="41" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M2 39 Q22 44 42 39" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconViagens({ color = C, size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g transform="translate(16,16) rotate(-45)">
        <ellipse cx="0" cy="-5" rx="3.5" ry="12" fill={color} />
        <path d="M-3 -1 L-16 7 L-16 11 L-3 4Z" fill={color} />
        <path d="M3 -1 L16 7 L16 11 L3 4Z" fill={color} />
        <path d="M-2 6 L-8 13 L-8 16 L-2 11Z" fill={color} />
        <path d="M2 6 L8 13 L8 16 L2 11Z" fill={color} />
      </g>
    </svg>
  );
}

export function IconChat({ color = C, size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M2 5 Q2 1 6 1 L26 1 Q30 1 30 5 L30 20 Q30 24 26 24 L14 24 L7 31 L7 24 L6 24 Q2 24 2 20 Z" fill={color} opacity="0.1" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <line x1="7" y1="9" x2="25" y2="9" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
      <line x1="7" y1="15" x2="20" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
      <path d="M24 3C24 3 25.5 7 29 7.5C25.5 7 24 11 24 11C24 11 22.5 7 19 7.5C22.5 7 24 3 24 3Z" fill={color} />
    </svg>
  );
}

export function IconMetas({ color = C, size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="14" stroke={color} strokeWidth="1.2" opacity="0.2" />
      <circle cx="16" cy="16" r="10" stroke={color} strokeWidth="1.8" opacity="0.45" />
      <circle cx="16" cy="16" r="5.5" stroke={color} strokeWidth="2" opacity="0.75" />
      <circle cx="16" cy="16" r="2.5" fill={color} />
    </svg>
  );
}

export function IconXpNivel({ color = C, size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="62 11" strokeDashoffset="22" />
      <path d="M16 8C16 8 19 16 26 18C19 16 16 26 16 26C16 26 13 16 6 18C13 16 16 8 16 8Z" fill={color} />
    </svg>
  );
}

export const BRAND_ICON_MAP: Record<string, (props: IconProps) => JSX.Element> = {
  dashboard: IconDashboard,
  tarefas: IconTarefas,
  planejamento: IconPlanejamento,
  financas: IconFinancas,
  carreira: IconCarreira,
  desenvolvimento: IconDesenvolvimento,
  viagens: IconViagens,
  chat: IconChat,
  'vagas-para-mim': IconMetas,
  xpnivel: IconXpNivel,
};
