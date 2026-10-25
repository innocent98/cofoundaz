export interface Point {
  x: number;
  y: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Pointer position to map coordinates in 0..1. The map's origin is bottom-left
 * (low price / low quality), so y is flipped against the screen. Rounded to 2 dp,
 * which is plenty of precision for a positioning map and keeps stored values tidy.
 */
export function pointToCoords(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number }
): Point {
  if (rect.width <= 0 || rect.height <= 0) return { x: 0.5, y: 0.5 };
  return {
    x: round2(clamp01((clientX - rect.left) / rect.width)),
    y: round2(clamp01(1 - (clientY - rect.top) / rect.height)),
  };
}

/** Keyboard nudge: arrow keys move a dot by `step` (right / up are positive), clamped to the map. */
export function nudge(p: Point, key: string, step = 0.05): Point | null {
  switch (key) {
    case 'ArrowRight':
      return { x: round2(clamp01(p.x + step)), y: p.y };
    case 'ArrowLeft':
      return { x: round2(clamp01(p.x - step)), y: p.y };
    case 'ArrowUp':
      return { x: p.x, y: round2(clamp01(p.y + step)) };
    case 'ArrowDown':
      return { x: p.x, y: round2(clamp01(p.y - step)) };
    default:
      return null;
  }
}

/** A stored coordinate (number or numeric string) as 0..1, or null when it is not set. */
export function coordOf(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? clamp01(n) : null;
}
