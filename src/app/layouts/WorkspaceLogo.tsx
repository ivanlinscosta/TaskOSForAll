import taskOsIconSrc from '../../assets/task-os-icon.png';
import { useAppStore } from '../../stores/useAppStore';

/**
 * CSS hue-rotate values to shift the base blue/cyan icon (~200° hue)
 * to each workspace accent color.
 */
const modeFilter: Record<string, string> = {
  fiap:    'hue-rotate(80deg)  saturate(1.3) brightness(0.95)', // purple  #8B2FCF
  itau:    'hue-rotate(195deg) saturate(3.0) brightness(1.05)', // orange  #EC7000
  pessoal: 'hue-rotate(-45deg) saturate(1.4) brightness(0.9)', // green   #059669
  admin:   'hue-rotate(40deg)  saturate(1.1) brightness(0.95)', // indigo  #6366F1
};

export function TaskOSRadarIcon({ size = 36 }: { size?: number }) {
  const { contextMode } = useAppStore();
  const filter = modeFilter[contextMode] ?? 'none';

  return (
    <img
      src={taskOsIconSrc}
      alt="TaskOS"
      width={size}
      height={size}
      style={{
        filter,
        borderRadius: '50%',
        transition: 'filter 0.3s ease',
        flexShrink: 0,
      }}
    />
  );
}
