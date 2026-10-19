import { describe, expect, it } from 'vitest';
import { coordOf, nudge, pointToCoords } from './map-geometry';

const rect = { left: 100, top: 50, width: 200, height: 100 };

describe('pointToCoords', () => {
  it('maps a point inside the map, flipping y so the top is high', () => {
    expect(pointToCoords(200, 100, rect)).toEqual({ x: 0.5, y: 0.5 });
    expect(pointToCoords(100, 50, rect)).toEqual({ x: 0, y: 1 });
    expect(pointToCoords(300, 150, rect)).toEqual({ x: 1, y: 0 });
  });

  it('clamps points dragged outside the map to the 0..1 range', () => {
    expect(pointToCoords(-50, 999, rect)).toEqual({ x: 0, y: 0 });
    expect(pointToCoords(999, -50, rect)).toEqual({ x: 1, y: 1 });
  });

  it('rounds to 2 decimals', () => {
    expect(pointToCoords(133, 83, rect)).toEqual({ x: 0.17, y: 0.67 });
  });

  it('falls back to the centre for a zero-size rect', () => {
    expect(pointToCoords(1, 1, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ x: 0.5, y: 0.5 });
  });
});

describe('nudge', () => {
  it('moves with the arrow keys, clamped at the edges', () => {
    expect(nudge({ x: 0.5, y: 0.5 }, 'ArrowRight')).toEqual({ x: 0.55, y: 0.5 });
    expect(nudge({ x: 0.5, y: 0.5 }, 'ArrowUp')).toEqual({ x: 0.5, y: 0.55 });
    expect(nudge({ x: 0.5, y: 0.5 }, 'ArrowDown')).toEqual({ x: 0.5, y: 0.45 });
    expect(nudge({ x: 0.98, y: 0.5 }, 'ArrowRight')).toEqual({ x: 1, y: 0.5 });
    expect(nudge({ x: 0.02, y: 0 }, 'ArrowDown')).toEqual({ x: 0.02, y: 0 });
  });

  it('ignores other keys', () => {
    expect(nudge({ x: 0.5, y: 0.5 }, 'a')).toBeNull();
  });
});

describe('coordOf', () => {
  it('reads stored coordinates and treats blank as unplaced', () => {
    expect(coordOf(0.4)).toBe(0.4);
    expect(coordOf('0.25')).toBe(0.25);
    expect(coordOf(null)).toBeNull();
    expect(coordOf('')).toBeNull();
    expect(coordOf(7)).toBe(1);
  });
});
