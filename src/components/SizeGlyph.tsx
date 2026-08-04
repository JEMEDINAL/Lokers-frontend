import type { LockerSize } from '../types/locker';

const ORDER: LockerSize[] = ['S', 'M', 'L'];
const HEIGHTS: Record<LockerSize, number> = { S: 6, M: 11, L: 16 };

export function SizeGlyph({ size }: { size: LockerSize }) {
  return (
    <span className="size-glyph" role="img" aria-label={`Tamaño ${size}`} title={`Tamaño ${size}`}>
      {ORDER.map((s) => (
        <span key={s} data-active={s === size} style={{ height: HEIGHTS[s] }} />
      ))}
    </span>
  );
}
