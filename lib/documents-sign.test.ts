import { describe, expect, it } from 'vitest';
import { endOfDayIso, executedUi, linkAuditLine, shareExpiryBounds, signability, signerState } from './documents-sign';
import type { Signer } from '@/lib/api/signatures';

const base: Signer = {
  id: 's', email: 'a@example.com', name: 'Ada', position: 0, status: 'pending', notified_at: '2026-10-25T17:18:02+00:00',
  viewed_at: null, signed_at: null, signed_name: null, signed_ip: null, signed_user_agent: null, link_copies: [],
};

describe('documents-sign', () => {
  it('labels each signer state', () => {
    expect(signerState(base, null).label).toBe('Awaiting');
    expect(signerState({ ...base, status: 'viewed', viewed_at: '2026-10-25T17:20:00+00:00' }, null).label).toBe('Viewed');
    expect(signerState({ ...base, status: 'signed', signed_at: '2026-10-25T17:30:00+00:00' }, null).label).toBe('Signed');
    const waiting = signerState({ ...base, status: 'waiting' }, { ...base, name: 'Bello' });
    expect(waiting.label).toBe('Waiting');
    expect(waiting.detail).toBe('Waiting for Bello to sign');
  });
  it('does not call a signer on a dead request Awaiting', () => {
    expect(signerState(base, null, 'cancelled')).toMatchObject({ label: 'Not signed', detail: 'The request was cancelled' });
    expect(signerState(base, null, 'expired').detail).toBe('The request expired');
    expect(signerState({ ...base, status: 'signed', signed_at: '2026-10-25T17:30:00+00:00' }, null, 'cancelled').label).toBe('Signed');
  });
  it('phrases the link audit', () => {
    expect(linkAuditLine({ at: '2026-10-25T17:42:00+00:00', via: 'copied', name: 'Ada', email: 'x@example.com', user_id: 'u' })).toMatch(/^Link copied by Ada, /);
    expect(linkAuditLine({ at: '2026-10-25T17:42:00+00:00', via: 'created', name: null, email: 'x@example.com', user_id: 'u' })).toMatch(/^Link shown to x@example.com when sent/);
  });
  it('maps the executed copy states', () => {
    expect(executedUi(null)).toEqual({ kind: 'none' });
    expect(executedUi({ state: 'pending', file_id: null, filename: null, size_bytes: null })).toEqual({ kind: 'preparing' });
    expect(executedUi({ state: 'legacy', file_id: null, filename: null, size_bytes: null })).toEqual({ kind: 'legacy' });
    const pending = { state: 'pending', file_id: null, filename: null, size_bytes: null } as const;
    const done = '2026-10-25T17:30:00+00:00';
    const at = (ms: number) => new Date(done).getTime() + ms;
    expect(executedUi(pending, done, at(30_000))).toEqual({ kind: 'preparing' });
    expect(executedUi(pending, done, at(10 * 60_000))).toEqual({ kind: 'delayed' });
    expect(executedUi({ state: 'failed', file_id: null, filename: null, size_bytes: null }, done, at(1000))).toEqual({ kind: 'failed' });
    expect(executedUi({ state: 'ready', file_id: 'f', filename: 'a - signed.pdf', size_bytes: 9, sha256: 'x' }).kind).toBe('ready');
  });
  it('only a clean PDF can be signed', () => {
    expect(signability({ mime: 'application/pdf', scan_status: 'clean' })).toBe('ok');
    expect(signability({ mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', scan_status: 'clean' })).toBe('not_pdf');
    expect(signability({ mime: 'application/pdf', scan_status: 'pending' })).toBe('scan');
  });
  it('share expiry bounds are tomorrow to 364 days ahead', () => {
    expect(shareExpiryBounds(new Date(2026, 9, 25))).toEqual({ min: '2026-10-26', max: '2027-10-24' });
    expect(new Date(endOfDayIso('2026-11-01')).getTime()).toBeGreaterThan(new Date(2026, 10, 1).getTime());
  });
});
