import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHealthDimension, useHealthRecommendations } from './useHealthDetails';
import { apiClient } from '@/lib/api/client';

vi.mock('@/lib/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/client')>('@/lib/api/client');
  return { ...actual, apiClient: vi.fn() };
});

// The API's hrefs are meant to be in-app routes. Anything that would leave the
// app (protocol-relative, absolute, javascript:) must never reach a Link or router.push.
const UNSAFE = ['//evil.example', 'https://evil.example', 'javascript:alert(1)'];

const rec = (href: string) => ({
  id: 'r1', dimension: 'money', key: 'k', title: 't', body: 'b', estimated_lift: 5,
  effort: 'low', status: 'pending', priority: 1, href,
});

const isInternal = (h: string) => h.startsWith('/') && !h.startsWith('//');

beforeEach(() => vi.clearAllMocks());

describe('useHealthRecommendations', () => {
  it('keeps safe internal hrefs as they are', async () => {
    vi.mocked(apiClient).mockResolvedValue({ data: [rec('/finance?tab=transactions')] });
    const { result } = renderHook(() => useHealthRecommendations('pending'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.recs[0].href).toBe('/finance?tab=transactions');
  });

  it.each(UNSAFE)('replaces the off-site href %s with an internal route', async (href) => {
    vi.mocked(apiClient).mockResolvedValue({ data: [rec(href)] });
    const { result } = renderHook(() => useHealthRecommendations('pending'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.recs[0].href).not.toBe(href);
    expect(isInternal(result.current.recs[0].href)).toBe(true);
  });
});

describe('useHealthDimension', () => {
  it.each(UNSAFE)('sanitises signal and recommendation hrefs (%s)', async (href) => {
    vi.mocked(apiClient).mockResolvedValue({
      data: {
        key: 'money', label: 'Financial', score: 40, band: 'needs_work', trend: [],
        signals: [{ key: 's', label: 'S', value: 1, unit: 'count', target: 2, contribution: 1, source: 'live', href, source_ref: 'x' }],
        recommendations: [rec(href)],
      },
    });
    const { result } = renderHook(() => useHealthDimension('financial'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(isInternal(result.current.detail!.signals[0].href)).toBe(true);
    expect(isInternal(result.current.detail!.recommendations[0].href)).toBe(true);
  });
});
