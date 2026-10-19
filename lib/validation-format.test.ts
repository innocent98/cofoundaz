import { describe, expect, it } from 'vitest';
import {
  deleteWarning,
  getVisitorId,
  isValidEmail,
  nudgeCopy,
  publicPageUrl,
  signalBanner,
  signupsToCsv,
  slugify,
} from './validation-format';

const base = { conversion: 12.5, target_conversion: 10, visits: 120, sample_needed: 100 };

describe('validation format', () => {
  it('nudge copy matches the PRD', () => {
    expect(nudgeCopy('Traders will pay')).toBe("Your riskiest untested assumption: 'Traders will pay'. Want an experiment for it?");
  });

  it('shows the server verdict and never computes its own', () => {
    expect(signalBanner({ ...base, verdict: 'validated' })).toEqual({
      kind: 'verdict',
      verdict: 'validated',
      text: 'Signal: 12.5% conversion against your 10% bar → looks validated.',
    });
    // Conversion is under the bar, yet the server said validated: we echo the server.
    expect(signalBanner({ ...base, conversion: 1, verdict: 'validated' })).toMatchObject({ verdict: 'validated' });
    expect(signalBanner({ ...base, conversion: 2, verdict: 'weak' }).text).toContain('looks weak');
  });

  it('says how far the sample is while the verdict is null, even above the bar', () => {
    expect(signalBanner({ conversion: 50, target_conversion: 10, visits: 3, sample_needed: 100, verdict: null })).toEqual({
      kind: 'collecting',
      text: '3 of 100 visitors so far',
    });
  });

  it('builds the public url without a double slash', () => {
    expect(publicPageUrl('https://app.cofoundaz.com/', 'novapay')).toBe('https://app.cofoundaz.com/p/novapay');
  });

  it('suggests a slug', () => {
    expect(slugify('Same-Day Settlement: Paid Pilot!')).toBe('same-day-settlement-paid-pilot');
    expect(slugify('  --x--  ')).toBe('x');
    expect(slugify('a'.repeat(80))).toHaveLength(60);
  });

  it('validates emails client-side', () => {
    expect(isValidEmail('funke@example.com')).toBe(true);
    expect(isValidEmail(' funke@example.com ')).toBe(true);
    expect(isValidEmail('funke')).toBe(false);
    expect(isValidEmail('funke@')).toBe(false);
    expect(isValidEmail('a b@c.com')).toBe(false);
  });

  it('exports the waitlist as CSV and defuses spreadsheet formulas', () => {
    const csv = signupsToCsv([
      { email: 'a@example.com', signed_up_at: '2026-10-19T10:00:00+00:00' },
      { email: '=cmd@example.com', signed_up_at: '2026-10-19T11:00:00+00:00' },
    ]);
    expect(csv).toBe("email,signed_up_at\na@example.com,2026-10-19T10:00:00+00:00\n'=cmd@example.com,2026-10-19T11:00:00+00:00\n");
    expect(signupsToCsv([])).toBe('email,signed_up_at\n');
  });

  it('keeps one visitor id per browser per page', () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    const first = getVisitorId('novapay', storage);
    expect(first.length).toBeGreaterThanOrEqual(8);
    expect(first.length).toBeLessThanOrEqual(64);
    expect(getVisitorId('novapay', storage)).toBe(first);
    expect(getVisitorId('other', storage)).not.toBe(first);
  });

  it('still returns an id when storage throws', () => {
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(getVisitorId('novapay', broken).length).toBeGreaterThanOrEqual(8);
  });

  it('warns that deleting a test removes its waitlist', () => {
    expect(deleteWarning('experiment', { signups: 3 })).toContain('waitlist of 3 emails');
    expect(deleteWarning('experiment', { signups: 1 })).toContain('1 email.');
    expect(deleteWarning('survey')).toContain('responses');
  });
});
