import { describe, expect, it } from 'vitest';
import { daysLeft, diffLines, formatSize, personName, shareChip, sectionsToText } from './documents-format';

describe('documents-format', () => {
  it('labels share state', () => {
    expect(shareChip(0)).toBe('Private');
    expect(shareChip(3)).toBe('Shared · 3');
  });
  it('rounds trash days up and never goes negative', () => {
    const now = Date.parse('2026-10-25T00:00:00Z');
    expect(daysLeft('2026-11-24T00:00:00Z', now)).toBe(30);
    expect(daysLeft('2026-10-20T00:00:00Z', now)).toBe(0);
    expect(daysLeft(null, now)).toBeNull();
  });
  it('formats sizes', () => {
    expect(formatSize(19)).toBe('19 B');
    expect(formatSize(2048)).toBe('2 KB');
    expect(formatSize(15 * 1024 * 1024)).toBe('15.0 MB');
  });
  it('diffs lines', () => {
    expect(diffLines('a\nb\nc', 'a\nx\nc')).toEqual([
      { kind: 'same', text: 'a' },
      { kind: 'remove', text: 'b' },
      { kind: 'add', text: 'x' },
      { kind: 'same', text: 'c' },
    ]);
  });
  it('caps document text for Ask AI', () => {
    const t = sectionsToText([{ heading: 'H', body: 'x'.repeat(100) }], 20);
    expect(t.endsWith('[truncated]')).toBe(true);
  });
});

describe('personName', () => {
  it('never shows "Unknown" for a member without a profile name', () => {
    expect(personName({ name: null })).toBe('A member');
    expect(personName({ name: '  ' })).toBe('A member');
    expect(personName(null)).toBe('A member');
    expect(personName({ name: 'Ada Founder' })).toBe('Ada Founder');
  });
});
