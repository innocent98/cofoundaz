import { describe, expect, it } from 'vitest';
import { isSafeInternalPath, safeNextPath } from './safe-next';

describe('isSafeInternalPath', () => {
  it.each(['/dashboard', '/invite/abc?x=1#y', '/dashboard/mission'])('accepts %j', (p) => {
    expect(isSafeInternalPath(p)).toBe(true);
  });
  it.each([
    '/\\evil.com',
    '/%5Cevil.com',
    '/%5cevil.com',
    '/\t/evil.com',
    '/%09/evil.com',
    '//evil.com',
    '/%2F/evil.com',
    'https://evil.com',
    'javascript:alert(1)',
    '/a b',
    '/a\nb',
    '/%',
    '',
    null,
    undefined,
  ])('rejects %j', (p) => {
    expect(isSafeInternalPath(p as string | null | undefined)).toBe(false);
  });
});

describe('safeNextPath', () => {
  it('reads ?next and rejects the backslash form', () => {
    window.history.replaceState(null, '', '/login?next=%2F%5Cevil.com');
    expect(safeNextPath()).toBeNull();
    window.history.replaceState(null, '', '/login?next=%2Fdashboard');
    expect(safeNextPath()).toBe('/dashboard');
    window.history.replaceState(null, '', '/login?next=%2Flogin');
    expect(safeNextPath()).toBeNull();
  });
});
