import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PLAN_OPTIONS,
  LENGTHS,
  PLAN_SECTIONS,
  failureMessage,
  progressPercent,
  readinessNote,
  regenerateMessage,
  stageCaption,
} from './bb-plan';

describe('plan options', () => {
  it('defaults to investors and concise, with plain hyphens in the length labels', () => {
    expect(DEFAULT_PLAN_OPTIONS).toEqual({ audience: 'investors', length: 'concise' });
    expect(LENGTHS.map((l) => l.label)).toEqual(['Concise (10-15 pp)', 'Full (25-40 pp)']);
    for (const l of LENGTHS) expect(l.label).not.toMatch(/[–—]/);
  });

  it('covers the ten regenerable sections', () => {
    expect(PLAN_SECTIONS).toHaveLength(10);
    expect(PLAN_SECTIONS.find((s) => s.key === 'gtm')?.heading).toBe('Go-to-Market');
  });
});

describe('progress', () => {
  it('appends an ellipsis to the stage once', () => {
    expect(stageCaption({ done: 4, total: 10, stage: 'Sizing your market' })).toBe('Sizing your market…');
    expect(stageCaption({ done: 4, total: 10, stage: 'Sizing your market…' })).toBe('Sizing your market…');
    expect(stageCaption({ done: 10, total: 10, stage: 'Done' })).toBe('Done');
    expect(stageCaption(null)).toBe('Starting');
  });

  it('turns done and total into a bounded percent', () => {
    expect(progressPercent({ done: 4, total: 10, stage: 'x' })).toBe(40);
    expect(progressPercent({ done: 12, total: 10, stage: 'x' })).toBe(100);
    expect(progressPercent({ done: 0, total: 0, stage: 'x' })).toBe(0);
    expect(progressPercent(undefined)).toBe(0);
  });
});

describe('failure and regenerate copy', () => {
  it('distinguishes over budget from a failed generation', () => {
    expect(failureMessage('over_budget')).toBe('AI is at its daily limit, try again tomorrow.');
    expect(failureMessage('generation_failed')).toMatch(/Try again/);
    expect(failureMessage(null)).toMatch(/Try again/);
  });

  it('explains each regenerate outcome without dashes', () => {
    expect(regenerateMessage('ready', 'Team')).toEqual({ ok: true, text: 'Rewrote Team' });
    const missing = regenerateMessage('section_missing', 'Team');
    expect(missing.ok).toBe(false);
    expect(missing.text).toMatch(/renamed or removed/);
    expect(regenerateMessage('over_budget', 'Team').text).toMatch(/daily limit/);
    for (const s of ['ready', 'section_missing', 'over_budget', 'gone', undefined]) {
      expect(regenerateMessage(s, 'Team').text).not.toMatch(/[–—]/);
    }
  });

  it('notes partial and missing rows', () => {
    expect(readinessNote({ type: 'swot', label: 'SWOT', status: 'partial', completion_pct: 25 })).toBe('Started, 25% filled');
    expect(readinessNote({ type: 'swot', label: 'SWOT', status: 'missing', completion_pct: 0 })).toBe('Not started');
    expect(readinessNote({ type: 'swot', label: 'SWOT', status: 'ready', completion_pct: 100 })).toBe('Ready');
  });
});
