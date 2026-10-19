import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

const api = vi.hoisted(() => ({ getCanvas: vi.fn(), saveCanvas: vi.fn(), createSuggestion: vi.fn() }));
const access = vi.hoisted(() => ({ value: { suggestMode: false, canEdit: true, canWrite: true } }));

vi.mock('@/lib/api/business-builder', () => ({ businessBuilderApi: api }));
vi.mock('@/hooks/useBuilderAccess', () => ({ useBuilderAccess: () => access.value }));

import { useCanvasEditor } from './useCanvasEditor';

const canvas = (version: number, blocks: Record<string, string[]>) => ({
  id: 'c1',
  type: 'swot',
  version,
  blocks,
  block_defs: [{ key: 'strengths', label: 'Strengths', kind: 'list' }],
  updated_at: '2026-10-19T11:00:00Z',
  updated_by: { id: 'u1', name: 'Ada' },
});

beforeEach(() => {
  vi.clearAllMocks();
  access.value = { suggestMode: false, canEdit: true, canWrite: true };
  api.getCanvas.mockResolvedValue(canvas(3, { strengths: ['a'] }));
});

describe('useCanvasEditor', () => {
  it('loads the canvas with its id, last editor and blocks', async () => {
    const { result } = renderHook(() => useCanvasEditor('swot'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.canvasId).toBe('c1');
    expect(result.current.updatedBy).toEqual({ id: 'u1', name: 'Ada' });
    expect(result.current.listOf('strengths')).toEqual(['a']);
    expect(result.current.getVersion()).toBe(3);
  });

  it('autosaves the FULL blocks with the last read version, then flush saves immediately', async () => {
    api.saveCanvas.mockResolvedValue({ ...canvas(4, { strengths: ['a', 'b'] }) });
    const { result } = renderHook(() => useCanvasEditor('swot'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.addItem('strengths', 'b'));
    await act(async () => {
      await result.current.flush();
    });
    expect(api.saveCanvas).toHaveBeenCalledWith('swot', { version: 3, blocks: { strengths: ['a', 'b'] } });
    expect(result.current.getVersion()).toBe(4);
  });

  it('keeps a consultant edit local, then sends one canvas_update suggestion and reloads', async () => {
    access.value = { suggestMode: true, canEdit: false, canWrite: true };
    api.createSuggestion.mockResolvedValue({});
    const { result } = renderHook(() => useCanvasEditor('swot'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.addItem('strengths', 'b'));
    expect(result.current.dirty).toBe(true);
    expect(api.saveCanvas).not.toHaveBeenCalled();
    let res: { ok: boolean } | undefined;
    await act(async () => {
      res = await result.current.sendSuggestion('  because  ');
    });
    expect(res?.ok).toBe(true);
    expect(api.createSuggestion).toHaveBeenCalledWith({
      op: 'canvas_update',
      target: { canvas_type: 'swot' },
      payload: { blocks: { strengths: ['a', 'b'] } },
      note: 'because',
    });
    expect(api.getCanvas).toHaveBeenCalledTimes(2);
    expect(result.current.dirty).toBe(false);
  });

  it('ignores edits for read-only roles', async () => {
    access.value = { suggestMode: false, canEdit: false, canWrite: false };
    const { result } = renderHook(() => useCanvasEditor('swot'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.addItem('strengths', 'b'));
    expect(result.current.listOf('strengths')).toEqual(['a']);
    expect(result.current.dirty).toBe(false);
  });
});
