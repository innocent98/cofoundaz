import { describe, expect, it } from 'vitest';
import {
  checkoutReference,
  creditsPercentTone,
  formatNaira,
  formatStorage,
  upgradeTarget,
  verifyMessage,
} from './billing-format';

describe('formatNaira', () => {
  it('shows whole naira without kobo', () => {
    expect(formatNaira(2400000)).toBe('₦24,000');
    expect(formatNaira(0)).toBe('₦0');
  });
  it('keeps kobo when present', () => {
    expect(formatNaira(4404929)).toBe('₦44,049.29');
  });
});

describe('formatStorage', () => {
  it('uses GB from 1024 MB', () => {
    expect(formatStorage(5120)).toBe('5 GB');
    expect(formatStorage(1536)).toBe('1.5 GB');
    expect(formatStorage(512)).toBe('512 MB');
  });
});

describe('checkoutReference', () => {
  it('reads reference, falls back to trxref, else null', () => {
    expect(checkoutReference('?tab=billing&reference=cfz_1&trxref=cfz_1')).toBe('cfz_1');
    expect(checkoutReference('?trxref=cfz_2')).toBe('cfz_2');
    expect(checkoutReference('?tab=billing')).toBeNull();
  });
});

describe('verifyMessage', () => {
  const v = (outcome: string, status = 'paid', kind = 'checkout') =>
    ({ reference: 'r', kind, status, outcome }) as Parameters<typeof verifyMessage>[0];
  it('only a paid status is success', () => {
    expect(verifyMessage(v('applied')).tone).toBe('success');
    expect(verifyMessage(v('already_processed')).tone).toBe('success');
    expect(verifyMessage(v('already_processed', 'pending')).tone).toBe('info');
  });
  it('names the add-on and card cases', () => {
    expect(verifyMessage(v('applied', 'paid', 'addon')).text).toMatch(/credits are live/);
    expect(verifyMessage(v('applied', 'paid', 'card')).text).toMatch(/Card saved/);
  });
  it('handles refund, mismatch and abandoned', () => {
    expect(verifyMessage(v('duplicate_payment_refunded')).text).toMatch(/refunded/);
    expect(verifyMessage(v('amount_mismatch')).tone).toBe('error');
    expect(verifyMessage(v('not_successful', 'abandoned')).tone).toBe('info');
  });
});

describe('creditsPercentTone', () => {
  it('flags 90 and 100', () => {
    expect(creditsPercentTone(89)).toBe('ok');
    expect(creditsPercentTone(90)).toBe('warn');
    expect(creditsPercentTone(100)).toBe('full');
  });
});

describe('upgradeTarget', () => {
  it('reads the plan key from the 402 field error', () => {
    expect(upgradeTarget([{ field: 'plan', message: 'growth' }])).toBe('growth');
    expect(upgradeTarget([{ field: 'plan', message: 'weird' }])).toBeNull();
    expect(upgradeTarget([])).toBeNull();
  });
});
