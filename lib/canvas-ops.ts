import type { CanvasBlocks } from '@/lib/api/business-builder';

// Pure edit operations on a canvas's `blocks` object. List blocks are string
// arrays; text blocks (Mission & Vision) are plain strings. Every op returns a
// NEW object (or the same one when nothing changes) so callers can compare.

export function listOf(blocks: CanvasBlocks, key: string): string[] {
  const v = blocks[key];
  return Array.isArray(v) ? v : [];
}

export function textOf(blocks: CanvasBlocks, key: string): string {
  const v = blocks[key];
  return typeof v === 'string' ? v : '';
}

export function addItem(blocks: CanvasBlocks, key: string, text: string): CanvasBlocks {
  const t = text.trim();
  if (!t) return blocks;
  return { ...blocks, [key]: [...listOf(blocks, key), t] };
}

export function removeItem(blocks: CanvasBlocks, key: string, idx: number): CanvasBlocks {
  const list = listOf(blocks, key);
  if (idx < 0 || idx >= list.length) return blocks;
  return { ...blocks, [key]: list.filter((_, i) => i !== idx) };
}

/** Empty text removes the item (an emptied chip is a delete); an unchanged edit is a no-op. */
export function editItem(blocks: CanvasBlocks, key: string, idx: number, text: string): CanvasBlocks {
  const list = listOf(blocks, key);
  if (idx < 0 || idx >= list.length) return blocks;
  const t = text.trim();
  if (t === list[idx]) return blocks;
  return { ...blocks, [key]: t ? list.map((v, i) => (i === idx ? t : v)) : list.filter((_, i) => i !== idx) };
}

export function moveWithin(blocks: CanvasBlocks, key: string, from: number, to: number): CanvasBlocks {
  const list = listOf(blocks, key);
  if (from === to || from < 0 || from >= list.length || to < 0 || to >= list.length) return blocks;
  const next = [...list];
  const [m] = next.splice(from, 1);
  next.splice(to, 0, m);
  return { ...blocks, [key]: next };
}

/**
 * Moves one item from `fromKey[fromIdx]` into `toKey` before index `toIdx`
 * (`toIdx` >= length appends). Within the same block it is a plain reorder.
 */
export function moveAcross(
  blocks: CanvasBlocks,
  fromKey: string,
  fromIdx: number,
  toKey: string,
  toIdx: number
): CanvasBlocks {
  if (fromKey === toKey) {
    const len = listOf(blocks, fromKey).length;
    return moveWithin(blocks, fromKey, fromIdx, Math.min(toIdx, len - 1));
  }
  const src = listOf(blocks, fromKey);
  if (fromIdx < 0 || fromIdx >= src.length) return blocks;
  const dst = [...listOf(blocks, toKey)];
  const item = src[fromIdx];
  const at = Math.max(0, Math.min(toIdx, dst.length));
  dst.splice(at, 0, item);
  return { ...blocks, [fromKey]: src.filter((_, i) => i !== fromIdx), [toKey]: dst };
}

export function blocksEqual(a: CanvasBlocks, b: CanvasBlocks): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const x = a[k];
    const y = b[k];
    if (Array.isArray(x) || Array.isArray(y)) {
      const xl = Array.isArray(x) ? x : [];
      const yl = Array.isArray(y) ? y : [];
      if (xl.length !== yl.length || xl.some((v, i) => v !== yl[i])) return false;
    } else if ((x ?? '') !== (y ?? '')) {
      return false;
    }
  }
  return true;
}

export interface BlockDiff {
  key: string;
  added: string[];
  removed: string[];
  /** For text blocks: the before / after strings. */
  text?: { before: string; after: string };
}

/** Per-block difference between a canvas's current blocks and a suggestion's proposed blocks. */
export function diffBlocks(current: CanvasBlocks | null | undefined, proposed: CanvasBlocks | null | undefined): BlockDiff[] {
  const cur = current ?? {};
  const next = proposed ?? {};
  const out: BlockDiff[] = [];
  for (const key of Object.keys(next)) {
    const before = cur[key];
    const after = next[key];
    if (typeof after === 'string' || typeof before === 'string') {
      const b = typeof before === 'string' ? before : '';
      const a = typeof after === 'string' ? after : '';
      if (a !== b) out.push({ key, added: [], removed: [], text: { before: b, after: a } });
      continue;
    }
    const bl = Array.isArray(before) ? before : [];
    const al = Array.isArray(after) ? after : [];
    const added = al.filter((v) => !bl.includes(v));
    const removed = bl.filter((v) => !al.includes(v));
    if (added.length || removed.length) out.push({ key, added, removed });
  }
  return out;
}

export interface FieldDiff {
  field: string;
  before: string;
  after: string;
}

function show(v: unknown): string {
  if (v === null || v === undefined || v === '') return 'empty';
  if (Array.isArray(v)) return v.length ? v.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(', ') : 'empty';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** Field-level difference between a record's current data and a suggested replacement. */
export function diffRecord(current: Record<string, unknown> | null | undefined, proposed: Record<string, unknown> | null | undefined): FieldDiff[] {
  const cur = current ?? {};
  const next = proposed ?? {};
  const out: FieldDiff[] = [];
  for (const field of Object.keys(next)) {
    const before = show(cur[field]);
    const after = show(next[field]);
    if (before !== after) out.push({ field, before, after });
  }
  return out;
}
