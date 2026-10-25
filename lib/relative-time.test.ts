import { describe, expect, it } from 'vitest';
import { lastEditedLabel, relativeTime } from './relative-time';

const NOW = new Date('2026-10-19T12:00:00Z').getTime();
const ago = (s: number) => new Date(NOW - s * 1000).toISOString();

describe('relativeTime', () => {
  it('formats recent times', () => {
    expect(relativeTime(ago(10), NOW)).toBe('just now');
    expect(relativeTime(ago(60), NOW)).toBe('1 minute ago');
    expect(relativeTime(ago(5 * 60), NOW)).toBe('5 minutes ago');
    expect(relativeTime(ago(2 * 3600), NOW)).toBe('2 hours ago');
    expect(relativeTime(ago(30 * 3600), NOW)).toBe('yesterday');
    expect(relativeTime(ago(3 * 86400), NOW)).toBe('3 days ago');
  });

  it('falls back to a plain date after a week, with the year when it is not this year', () => {
    expect(relativeTime('2026-10-01T09:00:00Z', NOW)).toBe('1 Oct');
    expect(relativeTime('2025-03-02T09:00:00Z', NOW)).toBe('2 Mar 2025');
  });

  it('is empty for missing or invalid input', () => {
    expect(relativeTime(null, NOW)).toBe('');
    expect(relativeTime('nope', NOW)).toBe('');
  });
});

describe('lastEditedLabel', () => {
  it('names the editor and the time, with no dashes', () => {
    const label = lastEditedLabel(ago(300), { name: 'Ada Founder' }, NOW);
    expect(label).toBe('Last edited by Ada Founder, 5 minutes ago');
    expect(label).not.toMatch(/[–—]/);
  });

  it('says AI when the editor is null (an AI fill)', () => {
    expect(lastEditedLabel(ago(300), null, NOW)).toBe('Last edited by AI, 5 minutes ago');
  });

  it('is empty when never edited', () => {
    expect(lastEditedLabel(null, null, NOW)).toBe('');
  });
});
