import { useAppStore } from '../../stores/useAppStore';

/**
 * Color schemes per workspace context mode.
 * Each mode maps to [primary gradient start, primary gradient end, accent gradient start, accent gradient end].
 */
const modeColors: Record<string, [string, string, string, string]> = {
  fiap:    ['#8B2FCF', '#7C22BD', '#C084FC', '#D8B4FE'],  // purple
  itau:    ['#EC7000', '#D96700', '#FDBA74', '#FED7AA'],  // orange
  pessoal: ['#0D5C7A', '#0A4A62', '#2AABCF', '#7DD3E8'],  // TaskAll Blue
  admin:   ['#6366F1', '#4F46E5', '#A5B4FC', '#C7D2FE'],  // indigo
};

const defaultColors: [string, string, string, string] = ['#0D5C7A', '#0A4A62', '#2AABCF', '#7DD3E8'];

export function TaskOSRadarIcon({ size = 36 }: { size?: number; collapsed?: boolean }) {
  const { contextMode } = useAppStore();
  const [bgStart, bgEnd, accentStart, accentEnd] = modeColors[contextMode] ?? defaultColors;

  // Unique IDs per instance to avoid SVG gradient conflicts
  const uid = `tl-${size}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      style={{ flexShrink: 0, transition: 'all 0.3s ease' }}
      aria-label="TaskAll"
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bgStart} />
          <stop offset="100%" stopColor={bgEnd} />
        </linearGradient>
        <linearGradient id={`${uid}-ac`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accentStart} />
          <stop offset="100%" stopColor={accentEnd} />
        </linearGradient>
      </defs>
      {/* Rounded square background */}
      <rect width="32" height="32" rx="7" fill={`url(#${uid}-bg)`} />
      {/* Top bar of T */}
      <rect x="6" y="7" width="20" height="4.5" rx="2.25" fill="white" opacity={0.95} />
      {/* Vertical stem of T */}
      <rect x="13" y="7" width="6" height="18" rx="3" fill="white" opacity={0.95} />
      {/* Checkmark accent */}
      <polyline
        points="17,21 20,24 26,17"
        fill="none"
        stroke={`url(#${uid}-ac)`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
