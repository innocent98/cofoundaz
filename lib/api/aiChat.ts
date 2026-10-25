import { apiClient } from './client';

// AI Co-Founder chat (BE module 03). Pattern B: POST a message -> 202 with a
// `generating` assistant turn, then poll GET /ai/conversations/{id} until the
// last assistant turn is `ready` or `failed`. Shapes copied from the live-captured
// guide (cofoundaz-api/docs/fe-integration-guide-ai-cofounder-chat.md).

export type ChatRole = 'user' | 'assistant';
export type ChatMessageStatus = 'ready' | 'generating' | 'failed';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  status: ChatMessageStatus;
  content: string;
  created_at: string;
}

/** List row: no messages. `title` is null for a conversation created empty. */
export interface ChatConversationSummary {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatConversation extends ChatConversationSummary {
  messages: ChatMessage[];
}

interface Envelope<T> {
  data: T;
  meta?: Record<string, unknown> | null;
}

/** POST /ai/conversations (201). With a message it starts the first turn. */
export async function createConversation(message?: string): Promise<ChatConversation> {
  const res = await apiClient<Envelope<ChatConversation>>('/ai/conversations', {
    method: 'POST',
    body: JSON.stringify(message === undefined ? {} : { message }),
  });
  return res.data;
}

/** GET /ai/conversations: only the caller's own, newest activity first. */
export async function listConversations(): Promise<ChatConversationSummary[]> {
  const res = await apiClient<Envelope<ChatConversationSummary[]>>('/ai/conversations');
  return res.data;
}

/** GET /ai/conversations/{id}: the full thread (what the poll reads). */
export async function getConversation(id: string): Promise<ChatConversation> {
  const res = await apiClient<Envelope<ChatConversation>>(
    `/ai/conversations/${encodeURIComponent(id)}`,
  );
  return res.data;
}

/** POST /ai/conversations/{id}/messages (202): returns the `generating` assistant turn. */
export async function postMessage(id: string, content: string): Promise<ChatMessage> {
  const res = await apiClient<Envelope<ChatMessage>>(
    `/ai/conversations/${encodeURIComponent(id)}/messages`,
    { method: 'POST', body: JSON.stringify({ content }) },
  );
  return res.data;
}

export const aiChatApi = {
  createConversation,
  listConversations,
  getConversation,
  postMessage,
};
