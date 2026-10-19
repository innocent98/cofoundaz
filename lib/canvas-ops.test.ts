import { describe, expect, it } from 'vitest';
import { addItem, blocksEqual, diffBlocks, diffRecord, editItem, moveAcross, moveWithin, removeItem } from './canvas-ops';

const base = { a: ['one', 'two', 'three'], b: ['x'], c: [] as string[], t: 'hello' };

describe('canvas-ops', () => {
  it('adds, trims and ignores blank items', () => {
    expect(addItem(base, 'c', '  hi ').c).toEqual(['hi']);
    expect(addItem(base, 'c', '   ')).toBe(base);
  });

  it('removes by index and ignores out-of-range', () => {
    expect(removeItem(base, 'a', 1).a).toEqual(['one', 'three']);
    expect(removeItem(base, 'a', 9)).toBe(base);
  });

  it('edits in place; an empty edit deletes; unchanged is a no-op', () => {
    expect(editItem(base, 'a', 0, ' uno ').a).toEqual(['uno', 'two', 'three']);
    expect(editItem(base, 'a', 0, '').a).toEqual(['two', 'three']);
    expect(editItem(base, 'a', 0, 'one')).toBe(base);
  });

  it('reorders within a block', () => {
    expect(moveWithin(base, 'a', 0, 2).a).toEqual(['two', 'three', 'one']);
    expect(moveWithin(base, 'a', 1, 1)).toBe(base);
  });

  it('moves an item between blocks, before the target index', () => {
    const next = moveAcross(base, 'a', 1, 'b', 0);
    expect(next.a).toEqual(['one', 'three']);
    expect(next.b).toEqual(['two', 'x']);
  });

  it('appends when dropped past the end or on an empty block', () => {
    expect(moveAcross(base, 'a', 0, 'c', 99).c).toEqual(['one']);
    expect(moveAcross(base, 'a', 0, 'b', 99).b).toEqual(['x', 'one']);
  });

  it('treats a same-block cross move as a reorder and keeps other blocks intact', () => {
    const next = moveAcross(base, 'a', 0, 'a', 99);
    expect(next.a).toEqual(['two', 'three', 'one']);
    expect(next.b).toBe(base.b);
  });

  it('compares blocks structurally, treating missing as empty', () => {
    expect(blocksEqual(base, { ...base })).toBe(true);
    expect(blocksEqual(base, { ...base, a: ['one', 'two'] })).toBe(false);
    expect(blocksEqual({ t: '' }, {})).toBe(true);
    expect(blocksEqual({ t: 'x' }, { t: 'y' })).toBe(false);
  });

  it('diffs list and text blocks for a suggestion', () => {
    const d = diffBlocks(
      { strengths: ['a', 'b'], mission: 'old' },
      { strengths: ['a', 'c'], mission: 'new', threats: [] }
    );
    expect(d).toEqual([
      { key: 'strengths', added: ['c'], removed: ['b'] },
      { key: 'mission', added: [], removed: [], text: { before: 'old', after: 'new' } },
    ]);
  });

  it('diff is empty when nothing changed or there is no current', () => {
    expect(diffBlocks({ a: ['x'] }, { a: ['x'] })).toEqual([]);
    expect(diffBlocks(null, { a: ['x'] })).toEqual([{ key: 'a', added: ['x'], removed: [] }]);
  });

  it('diffs record fields, showing empty for unset values', () => {
    expect(diffRecord({ name: 'A', goals: ['x'] }, { name: 'B', goals: ['x'], quote: 'hi' })).toEqual([
      { field: 'name', before: 'A', after: 'B' },
      { field: 'quote', before: 'empty', after: 'hi' },
    ]);
    expect(diffRecord(null, { name: 'A' })).toEqual([{ field: 'name', before: 'empty', after: 'A' }]);
  });
});
