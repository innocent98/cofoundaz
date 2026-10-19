import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

const api = vi.hoisted(() => ({
  listRecords: vi.fn(),
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  deleteRecord: vi.fn(),
  createSuggestion: vi.fn(),
}));
const access = vi.hoisted(() => ({ value: { suggestMode: false, canEdit: true, canWrite: true } }));

vi.mock('@/lib/api/business-builder', () => ({ businessBuilderApi: api }));
vi.mock('@/hooks/useBuilderAccess', () => ({ useBuilderAccess: () => access.value }));

import { useBusinessRecords, writeMessage } from './useBusinessRecords';

beforeEach(() => {
  vi.clearAllMocks();
  api.listRecords.mockResolvedValue({ records: [], fields: [] });
  access.value = { suggestMode: false, canEdit: true, canWrite: true };
});

describe('useBusinessRecords', () => {
  it('writes directly and refreshes the list for a founder', async () => {
    const { result } = renderHook(() => useBusinessRecords('personas'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.create({ name: 'Ada' });
    });
    expect(outcome).toBe('saved');
    expect(api.createRecord).toHaveBeenCalledWith('personas', { name: 'Ada' });
    expect(api.createSuggestion).not.toHaveBeenCalled();
    expect(api.listRecords).toHaveBeenCalledTimes(2);
  });

  it('turns a consultant create into a record_create suggestion with the singular kind', async () => {
    access.value = { suggestMode: true, canEdit: false, canWrite: true };
    const { result } = renderHook(() => useBusinessRecords('revenue-streams'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.create({ name: 'Fees' });
    });
    expect(outcome).toBe('suggested');
    expect(api.createSuggestion).toHaveBeenCalledWith({
      op: 'record_create',
      target: { kind: 'revenue_stream' },
      payload: { data: { name: 'Fees' } },
    });
    expect(api.createRecord).not.toHaveBeenCalled();
    expect(api.listRecords).toHaveBeenCalledTimes(1);
  });

  it('turns consultant update and delete into suggestions that name the record', async () => {
    access.value = { suggestMode: true, canEdit: false, canWrite: true };
    const { result } = renderHook(() => useBusinessRecords('competitors'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.update('r1', { name: 'Paystack', map_x: 0.4 });
      await result.current.remove('r1');
    });
    expect(api.createSuggestion).toHaveBeenNthCalledWith(1, {
      op: 'record_update',
      target: { kind: 'competitor', record_id: 'r1' },
      payload: { data: { name: 'Paystack', map_x: 0.4 } },
    });
    expect(api.createSuggestion).toHaveBeenNthCalledWith(2, {
      op: 'record_delete',
      target: { kind: 'competitor', record_id: 'r1' },
    });
    expect(api.updateRecord).not.toHaveBeenCalled();
    expect(api.deleteRecord).not.toHaveBeenCalled();
  });

  it('words the toast for each outcome without dashes', () => {
    expect(writeMessage('saved', 'Persona added')).toBe('Persona added');
    const s = writeMessage('suggested', 'Persona added');
    expect(s).toBe('Suggestion sent. The founder will review it.');
    expect(s).not.toMatch(/[–—]/);
  });
});
