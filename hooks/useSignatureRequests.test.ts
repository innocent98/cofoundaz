import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, ApiError } from '@/lib/api/client';
import { useSignatureRequests } from './useSignatureRequests';

vi.mock('@/lib/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/client')>('@/lib/api/client');
  return { ...actual, apiClient: vi.fn() };
});

const forbidden = new ApiError(403, 'Forbidden', { error: { code: 'FORBIDDEN', message: "You don't have permission to do that." } });

beforeEach(() => {
  vi.mocked(apiClient).mockReset();
});

describe('useSignatureRequests (gap 26: no false success)', () => {
  it('cancelRequest reports the API refusal instead of pretending it worked', async () => {
    vi.mocked(apiClient).mockImplementation(async (url: string) => {
      if (url.endsWith('/cancel')) throw forbidden;
      return { data: { requests: [] } };
    });
    const { result } = renderHook(() => useSignatureRequests());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let res!: { ok: boolean; error?: string };
    await act(async () => {
      res = await result.current.cancelRequest('r1');
    });
    expect(res).toEqual({ ok: false, error: "You don't have permission to do that." });
  });

  it('remindRequest reports the API refusal', async () => {
    vi.mocked(apiClient).mockImplementation(async (url: string) => {
      if (url.endsWith('/remind')) throw forbidden;
      return { data: { requests: [] } };
    });
    const { result } = renderHook(() => useSignatureRequests());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let res!: { ok: boolean; error?: string };
    await act(async () => {
      res = await result.current.remindRequest('r1');
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("You don't have permission to do that.");
  });

  it('a successful cancel is ok', async () => {
    vi.mocked(apiClient).mockResolvedValue({ data: { requests: [] } });
    const { result } = renderHook(() => useSignatureRequests());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let res!: { ok: boolean };
    await act(async () => {
      res = await result.current.cancelRequest('r1');
    });
    expect(res.ok).toBe(true);
  });
});
