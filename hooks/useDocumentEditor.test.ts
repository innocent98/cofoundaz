import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/api/client';
import { useDocumentEditor } from './useDocumentEditor';

vi.mock('@/lib/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/client')>('@/lib/api/client');
  return { ...actual, apiClient: vi.fn() };
});

const loaded = {
  id: 'd1',
  title: 'Seed pitch',
  kind: 'custom',
  status: 'final',
  folder: 'Legal',
  version: 3,
  updated_at: '2026-10-25T10:00:00Z',
  sections: [{ id: 's1', heading: 'Problem', body: 'x' }],
};

beforeEach(() => vi.mocked(apiClient).mockReset());

describe('useDocumentEditor save', () => {
  it('echoes status and folder back so a save does not wipe them (PUT is a full replace)', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({ data: loaded }).mockResolvedValueOnce({ data: { ...loaded, version: 4 } });
    const { result } = renderHook(() => useDocumentEditor('d1'));
    await waitFor(() => expect(result.current.doc?.id).toBe('d1'));

    await act(async () => {
      await result.current.save('Seed pitch v2', loaded.sections);
    });

    const [path, init] = vi.mocked(apiClient).mock.calls[1] as [string, { method: string; body: string }];
    expect(path).toBe('/documents/d1');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toMatchObject({ title: 'Seed pitch v2', status: 'final', folder: 'Legal', version: 3 });
  });
});
