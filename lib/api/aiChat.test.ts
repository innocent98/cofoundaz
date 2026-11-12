import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createConversation, listConversations, getConversation, postMessage, cancelReply, regenerateReply,
  sendFeedback, actOnAction, archiveConversations, unarchiveConversations, deleteConversation,
  listSuggestions, actOnSuggestion, listAgents,
} from './aiChat';
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

  it('createConversation pins a specialist with agent_key', async () => {
    apiClient.mockResolvedValueOnce({ data: {} });
    await createConversation('Hi', 'finance');
    expect(apiClient).toHaveBeenCalledWith('/ai/conversations', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hi', agent_key: 'finance' }),
    });
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

  it('listConversations sends query, topic and archived only when set', async () => {
    apiClient.mockResolvedValue({ data: [] });
    await listConversations({ query: '  nda ', topic: 'legal', archived: false });
    expect(apiClient).toHaveBeenLastCalledWith('/ai/conversations?query=nda&topic=legal');
    await listConversations({ archived: true });
    expect(apiClient).toHaveBeenLastCalledWith('/ai/conversations?archived=true');
    await listConversations({ query: '   ' });
    expect(apiClient).toHaveBeenLastCalledWith('/ai/conversations');
  });

  it('cancel and regenerate POST to the message routes', async () => {
    apiClient.mockResolvedValue({ data: { id: 'm1' } });
    await cancelReply('c1', 'm1');
    expect(apiClient).toHaveBeenLastCalledWith('/ai/conversations/c1/messages/m1/cancel', { method: 'POST' });
    await regenerateReply('c1', 'm1');
    expect(apiClient).toHaveBeenLastCalledWith('/ai/conversations/c1/messages/m1/regenerate', { method: 'POST' });
  });

  it('feedback sends the rating (null clears) and actions hit confirm/undo/dismiss', async () => {
    apiClient.mockResolvedValue({ data: {} });
    await sendFeedback('m1', null);
    expect(apiClient).toHaveBeenLastCalledWith('/ai/messages/m1/feedback', { method: 'POST', body: '{"rating":null}' });
    await actOnAction('m1', 'a1', 'confirm');
    expect(apiClient).toHaveBeenLastCalledWith('/ai/messages/m1/actions/a1/confirm', { method: 'POST' });
  });

  it('archive, unarchive and delete use the bulk and delete routes and unwrap counts', async () => {
    apiClient.mockResolvedValueOnce({ data: { archived: 2 } });
    expect(await archiveConversations(['a', 'b'])).toBe(2);
    expect(apiClient).toHaveBeenLastCalledWith('/ai/conversations/archive', { method: 'POST', body: '{"ids":["a","b"]}' });
    apiClient.mockResolvedValueOnce({ data: { unarchived: 1 } });
    expect(await unarchiveConversations(['a'])).toBe(1);
    apiClient.mockResolvedValueOnce({ data: { deleted: true } });
    await deleteConversation('a');
    expect(apiClient).toHaveBeenLastCalledWith('/ai/conversations/a', { method: 'DELETE' });
  });

  it('suggestions list, snooze days default to 7, bench lists agents', async () => {
    apiClient.mockResolvedValueOnce({ data: { enabled: true, items: [] } });
    expect((await listSuggestions()).enabled).toBe(true);
    apiClient.mockResolvedValueOnce({ data: {} });
    await actOnSuggestion('s1', 'snooze');
    expect(apiClient).toHaveBeenLastCalledWith('/ai/suggestions/s1/snooze', { method: 'POST', body: '{"days":7}' });
    apiClient.mockResolvedValueOnce({ data: {} });
    await actOnSuggestion('s1', 'accept');
    expect(apiClient).toHaveBeenLastCalledWith('/ai/suggestions/s1/accept', { method: 'POST' });
    apiClient.mockResolvedValueOnce({ data: [{ key: 'finance' }] });
    expect(await listAgents()).toHaveLength(1);
  });
});
