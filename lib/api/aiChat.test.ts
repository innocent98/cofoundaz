import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createConversation, listConversations, getConversation, postMessage } from './aiChat';
import * as clientModule from './client';

vi.mock('./client', () => ({ apiClient: vi.fn() }));

const apiClient = vi.mocked(clientModule.apiClient);

describe('AI chat SDK (lib/api/aiChat.ts)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('createConversation POSTs the first message and unwraps data', async () => {
    const conv = { id: 'c1', title: 'Hi', created_at: 't', updated_at: 't', messages: [] };
    apiClient.mockResolvedValueOnce({ data: conv, meta: null });
    const res = await createConversation('Hi');
    expect(apiClient).toHaveBeenCalledWith('/ai/conversations', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hi' }),
    });
    expect(res).toEqual(conv);
  });

  it('createConversation with no message sends an empty body', async () => {
    apiClient.mockResolvedValueOnce({ data: {} });
    await createConversation();
    expect(apiClient).toHaveBeenCalledWith('/ai/conversations', { method: 'POST', body: '{}' });
  });

  it('listConversations GETs the caller-only list', async () => {
    apiClient.mockResolvedValueOnce({ data: [{ id: 'c1', title: null, created_at: 't', updated_at: 't' }] });
    const res = await listConversations();
    expect(apiClient).toHaveBeenCalledWith('/ai/conversations');
    expect(res[0].title).toBeNull();
  });

  it('getConversation GETs the thread by id', async () => {
    apiClient.mockResolvedValueOnce({ data: { id: 'c1', messages: [] } });
    await getConversation('c1');
    expect(apiClient).toHaveBeenCalledWith('/ai/conversations/c1');
  });

  it('postMessage POSTs content and returns the generating assistant turn', async () => {
    const turn = { id: 'm1', role: 'assistant', status: 'generating', content: '', created_at: 't' };
    apiClient.mockResolvedValueOnce({ data: turn });
    const res = await postMessage('c1', 'hello');
    expect(apiClient).toHaveBeenCalledWith('/ai/conversations/c1/messages', {
      method: 'POST',
      body: JSON.stringify({ content: 'hello' }),
    });
    expect(res.status).toBe('generating');
  });
});
