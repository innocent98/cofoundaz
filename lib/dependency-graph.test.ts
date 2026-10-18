import { describe, expect, it } from 'vitest';
import { layoutGraph } from './dependency-graph';

const t = (id: string, dependsOn: string[] = []) => ({ id, title: `Task ${id}`, status: 'todo', dependsOn });

describe('layoutGraph', () => {
  it('draws nothing when there are no edges', () => {
    const g = layoutGraph([t('a'), t('b')]);
    expect(g.nodes).toEqual([]);
    expect(g.layers).toBe(0);
  });

  it('puts prerequisites left of what they block and chains deepen the layer', () => {
    // c depends on b, b depends on a; d depends on a.
    const g = layoutGraph([t('a'), t('b', ['a']), t('c', ['b']), t('d', ['a']), t('lonely')]);
    const layer = Object.fromEntries(g.nodes.map((n) => [n.id, n.layer]));
    expect(layer).toEqual({ a: 0, b: 1, c: 2, d: 1 });
    expect(g.edges).toContainEqual({ from: 'a', to: 'b' });
    expect(g.layers).toBe(3);
    expect(g.nodes.find((n) => n.id === 'lonely')).toBeUndefined();
  });

  it('gives tasks in the same layer different rows', () => {
    const g = layoutGraph([t('a'), t('b', ['a']), t('c', ['a'])]);
    const rows = g.nodes.filter((n) => n.layer === 1).map((n) => n.row);
    expect(new Set(rows).size).toBe(2);
  });

  it('ignores edges to tasks that no longer exist and survives a cycle', () => {
    expect(layoutGraph([t('a', ['ghost'])]).edges).toEqual([]);
    expect(() => layoutGraph([t('a', ['b']), t('b', ['a'])])).not.toThrow();
  });
});
