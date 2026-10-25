import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBlobPreview } from './useBlobPreview';

const reply = (type: string) => ({ ok: true, headers: new Headers({ 'content-type': type }), arrayBuffer: async () => new ArrayBuffer(4) });

beforeEach(() => {
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() }));
});
afterEach(() => vi.unstubAllGlobals());

describe('useBlobPreview', () => {
  it('frames a PDF blob when announced and served as application/pdf', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reply('application/pdf')));
    const { result } = renderHook(() => useBlobPreview('/api/v1/f', 'application/pdf'));
    await waitFor(() => expect(result.current).toBe('blob:x'));
  });
  it('never frames SVG or HTML, even when announced as an image', async () => {
    const f = vi.fn(async () => reply('image/svg+xml'));
    vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useBlobPreview('/api/v1/f', 'image/svg+xml'));
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
  it('drops the preview when the response type disagrees with the announced one', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reply('text/html')));
    const { result } = renderHook(() => useBlobPreview('/api/v1/f', 'application/pdf'));
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current).toBeNull();
  });
});
