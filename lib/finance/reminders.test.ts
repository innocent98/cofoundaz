import { describe, expect, it } from 'vitest';
import { hasNonLatin1, reminderView } from './reminders';

const NOW = Date.parse('2026-10-24T12:00:00Z');
const base = { status: 'overdue' as const, auto_remind: false, last_reminded_at: null, reminder_count: 0 };

describe('reminderView', () => {
  it('offers a reminder on an overdue invoice that was never reminded', () => {
    const v = reminderView(base, NOW);
    expect(v.canRemind).toBe(true);
    expect(v.hint).toBe('No reminder sent yet.');
    expect(v.auto).toBe('Automatic reminders are off.');
  });

  it('blocks a manual reminder inside 24 hours', () => {
    const v = reminderView({ ...base, last_reminded_at: '2026-10-24T02:00:00Z', reminder_count: 1 }, NOW);
    expect(v.canRemind).toBe(false);
    expect(v.hint).toContain('after 24 hours');
  });

  it('allows one again after 24 hours', () => {
    expect(reminderView({ ...base, last_reminded_at: '2026-10-22T12:00:00Z', reminder_count: 1 }, NOW).canRemind).toBe(true);
  });

  it('never offers a reminder unless the invoice is overdue', () => {
    expect(reminderView({ ...base, status: 'sent' }, NOW).canRemind).toBe(false);
    expect(reminderView({ ...base, status: 'paid' }, NOW).canRemind).toBe(false);
  });

  it('says automatic reminders are paused after 8', () => {
    expect(reminderView({ ...base, auto_remind: true, reminder_count: 8, last_reminded_at: '2026-10-01T00:00:00Z' }, NOW).auto).toBe(
      'Automatic reminders paused (8 sent).',
    );
  });
});

describe('hasNonLatin1', () => {
  it('flags characters the PDF cannot print', () => {
    expect(hasNonLatin1('Ọlá Stores')).toBe(true);
    expect(hasNonLatin1('Café Ltd')).toBe(false);
  });
});
