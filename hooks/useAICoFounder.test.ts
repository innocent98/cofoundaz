import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAICoFounder, POLL_MS, TIMEOUT_MS } from './useAICoFounder';
import { ApiError } from '@/lib/api/client';
import * as chat from '@/lib/api/aiChat';
import type { ChatConversation, ChatMessage } from '@/lib/api/aiChat';

vi.mock('@/lib/api/aiChat', () => ({
  createConversation: vi.fn(),
  getConversation: vi.fn(),
  listConversations: vi.fn(),
  postMessage: vi.fn(),
}));

const msg = (role: 'user' | 'assistant', status: ChatMessage['status'], content = ''): ChatMessage => ({
  id: `${role}-${status}-${content}`, role, status, content, created_at: '2026-10-17T10:00:00Z',
});
const conv = (messages: ChatMessage[]): ChatConversation => ({
  id: 'c1', title: 'Focus', created_at: 't', updated_at: 't', messages,
});

describe('useAICoFounder (chat)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => vi.useRealTimers());

  it('shows the optimistic turns, polls, then renders the ready reply', async () => {
    vi.mocked(chat.createConversation).mockResolvedValue(
      conv([msg('user', 'ready', 'hi'), msg('assistant', 'generating')])
    );
    vi.mocked(chat.getConversation)
      .mockResolvedValueOnce(conv([msg('user', 'ready', 'hi'), msg('assistant', 'generating')]))
      .mockResolvedValueOnce(conv([msg('user', 'ready', 'hi'), msg('assistant', 'ready', 'Do X')]));

    const { result } = renderHook(() => useAICoFounder());
    await act(async () => { await result.current.sendMessage('hi'); });
    expect(result.current.isGenerating).toBe(true);
    expect(result.current.messages.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(result.current.activeConversationId).toBe('c1');

    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS); });
    expect(result.current.isGenerating).toBe(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS); });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.messages[1]).toMatchObject({ status: 'ready', content: 'Do X' });
  });

  it('blocks a second send while the reply is generating', async () => {
    vi.mocked(chat.createConversation).mockResolvedValue(
      conv([msg('user', 'ready', 'hi'), msg('assistant', 'generating')])
    );
    vi.mocked(chat.getConversation).mockResolvedValue(
      conv([msg('user', 'ready', 'hi'), msg('assistant', 'generating')])
    );
    const { result } = renderHook(() => useAICoFounder());
    await act(async () => { await result.current.sendMessage('hi'); });
    let second = true;
    await act(async () => { second = await result.current.sendMessage('again'); });
    expect(second).toBe(false);
    expect(chat.postMessage).not.toHaveBeenCalled();
  });

  it('surfaces a failed assistant turn from the server', async () => {
    vi.mocked(chat.createConversation).mockResolvedValue(
      conv([msg('user', 'ready', 'hi'), msg('assistant', 'generating')])
    );
    vi.mocked(chat.getConversation).mockResolvedValue(
      conv([msg('user', 'ready', 'hi'), msg('assistant', 'failed')])
    );
    const { result } = renderHook(() => useAICoFounder());
    await act(async () => { await result.current.sendMessage('hi'); });
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS); });
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.messages[1].status).toBe('failed');
  });

  it('times out honestly after the bounded poll and re-enables the composer', async () => {
    vi.mocked(chat.createConversation).mockResolvedValue(
      conv([msg('user', 'ready', 'hi'), msg('assistant', 'generating')])
    );
    vi.mocked(chat.getConversation).mockResolvedValue(
      conv([msg('user', 'ready', 'hi'), msg('assistant', 'generating')])
    );
    const { result } = renderHook(() => useAICoFounder());
    await act(async () => { await result.current.sendMessage('hi'); });
    await act(async () => { await vi.advanceTimersByTimeAsync(TIMEOUT_MS + POLL_MS); });
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.messages[1].status).toBe('failed');
  });

  it('continues an existing conversation with postMessage', async () => {
    vi.mocked(chat.getConversation).mockResolvedValue(
      conv([msg('user', 'ready', 'a'), msg('assistant', 'ready', 'b')])
    );
    const { result } = renderHook(() => useAICoFounder());
    await act(async () => { await result.current.selectConversation('c1'); });
    expect(result.current.messages).toHaveLength(2);

    vi.mocked(chat.postMessage).mockResolvedValue(msg('assistant', 'generating'));
    await act(async () => { await result.current.sendMessage('next'); });
    expect(chat.postMessage).toHaveBeenCalledWith('c1', 'next');
    expect(result.current.messages).toHaveLength(4);
  });

  it('rolls back the optimistic turns and reports an error when the send is rejected', async () => {
    vi.mocked(chat.createConversation).mockRejectedValue(new ApiError(403, 'Forbidden', {}));
    const { result } = renderHook(() => useAICoFounder());
    let ok = true;
    await act(async () => { ok = await result.current.sendMessage('hi'); });
    expect(ok).toBe(false);
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toMatch(/founders and team members/);
  });

  it('on 409 re-syncs from the server and resumes waiting on the pending reply', async () => {
    vi.mocked(chat.getConversation)
      .mockResolvedValueOnce(conv([msg('user', 'ready', 'a'), msg('assistant', 'failed')]))
      .mockResolvedValueOnce(conv([msg('user', 'ready', 'a'), msg('assistant', 'generating')]))
      .mockResolvedValueOnce(conv([msg('user', 'ready', 'a'), msg('assistant', 'ready', 'late reply')]));
    const { result } = renderHook(() => useAICoFounder());
    await act(async () => { await result.current.selectConversation('c1'); });

    vi.mocked(chat.postMessage).mockRejectedValue(new ApiError(409, 'Conflict', {}));
    let ok = true;
    await act(async () => { ok = await result.current.sendMessage('again'); });
    expect(ok).toBe(false);
    expect(result.current.error).toMatch(/still replying/);
    expect(result.current.messages.map((m) => m.status)).toEqual(['ready', 'generating']);

    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS); });
    expect(result.current.messages[1]).toMatchObject({ status: 'ready', content: 'late reply' });
  });

  it('resumes a conversation whose last reply is still generating', async () => {
    vi.mocked(chat.getConversation)
      .mockResolvedValueOnce(conv([msg('user', 'ready', 'a'), msg('assistant', 'generating')]))
      .mockResolvedValueOnce(conv([msg('user', 'ready', 'a'), msg('assistant', 'ready', 'done')]));
    const { result } = renderHook(() => useAICoFounder());
    await act(async () => { await result.current.selectConversation('c1'); });
    expect(result.current.isGenerating).toBe(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS); });
    expect(result.current.messages[1]).toMatchObject({ status: 'ready', content: 'done' });
  });
});
