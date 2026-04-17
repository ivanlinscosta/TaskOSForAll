interface Props {
  total: number;
  current: number;
  accentColor: string;
  onJump?: (index: number) => void;
}

export function GuidedTourProgress({ total, current, accentColor, onJump }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onJump?.(i)}
          className="rounded-full transition-all duration-300 focus:outline-none"
          style={{
            width: i === current ? 22 : 7,
            height: 7,
            background: i === current ? accentColor : `${accentColor}33`,
            cursor: onJump ? 'pointer' : 'default',
          }}
          aria-label={`Ir para o passo ${i + 1}`}
          aria-current={i === current ? 'step' : undefined}
        />
      ))}
    </div>
  );
}
