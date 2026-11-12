import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIConversationList, SEARCH_DEBOUNCE_MS } from './useAIConversationList';
import * as chat from '@/lib/api/aiChat';

vi.mock('@/lib/api/aiChat', () => ({
  listConversations: vi.fn(),
  archiveConversations: vi.fn(),
  unarchiveConversations: vi.fn(),
  deleteConversation: vi.fn(),
}));

const row = (id: string) => ({ id, title: id, created_at: 't', updated_at: 't' });

describe('useAIConversationList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(chat.listConversations).mockResolvedValue([row('a')]);
  });
  afterEach(() => vi.useRealTimers());

  const settle = () => act(async () => { await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS + 10); });

  it('loads the list, then searches server-side after the debounce', async () => {
    const { result } = renderHook(() => useAIConversationList());
    await settle();
    expect(result.current.items).toHaveLength(1);
    act(() => result.current.setSearchInput('nda'));
    await settle();
    expect(chat.listConversations).toHaveBeenLastCalledWith({ query: 'nda', topic: null, archived: false });
  });

  it('a one-character search is no query (the API needs 2 to 100 characters)', async () => {
    const { result } = renderHook(() => useAIConversationList());
    await settle();
    act(() => result.current.setSearchInput('n'));
    await settle();
    expect(chat.listConversations).toHaveBeenLastCalledWith({ query: '', topic: null, archived: false });
  });

  it('searching leaves the Archived view (archived chats are not searchable) and vice versa', async () => {
    const { result } = renderHook(() => useAIConversationList());
    await settle();
    act(() => result.current.setArchived(true));
    await settle();
    expect(result.current.archived).toBe(true);
    act(() => result.current.setSearchInput('nda'));
    expect(result.current.archived).toBe(false);
    act(() => result.current.setArchived(true));
    expect(result.current.searchInput).toBe('');
  });

  it('archive refreshes the list; a failure reports the server message', async () => {
    vi.mocked(chat.archiveConversations).mockResolvedValueOnce(1);
    const { result } = renderHook(() => useAIConversationList());
    await settle();
    let ok = false;
    await act(async () => { ok = await result.current.archive(['a']); });
    expect(ok).toBe(true);
    expect(chat.archiveConversations).toHaveBeenCalledWith(['a']);

    vi.mocked(chat.deleteConversation).mockRejectedValueOnce(new Error('boom'));
    await act(async () => { ok = await result.current.remove('a'); });
    expect(ok).toBe(false);
    expect(result.current.actionError).toBe('boom');
  });
});
