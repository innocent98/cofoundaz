import { apiClient } from './client';

// AI Co-Founder chat (BE module 03). Pattern B: POST a message -> 202 with a
// `generating` assistant turn, then poll GET /ai/conversations/{id} until the
// last assistant turn is `ready` or `failed`. Shapes copied from the live-captured
// guide (cofoundaz-api/docs/fe-integration-guide-ai-cofounder-chat.md).

export type ChatRole = 'user' | 'assistant';
export type ChatMessageStatus = 'ready' | 'generating' | 'failed' | 'cancelled';
export type ChatTopic = 'strategy' | 'finance' | 'legal' | 'mentoring';
export type AgentKey = 'strategist' | 'finance' | 'legal' | 'mentor';

export const TOPICS: { key: ChatTopic; label: string }[] = [
  { key: 'strategy', label: 'Strategy' },
  { key: 'finance', label: 'Finance' },
  { key: 'legal', label: 'Legal' },
  { key: 'mentoring', label: 'Mentoring' },
];

export type ActionKind = 'add_task' | 'update_roadmap' | 'draft_document';
export type ActionStatus = 'proposed' | 'executed' | 'dismissed' | 'undone' | 'failed';

export interface ChatAction {
  id: string;
  kind: ActionKind;
  label: string;
  status: ActionStatus;
  undoable: boolean;
  params?: Record<string, unknown>;
  href: string | null;
  result_label: string | null;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  status: ChatMessageStatus;
  content: string;
  created_at: string;
  // Present on every message from the API (null on user turns / while generating);
  // optional here so the optimistic local turns need not fill them.
  removed_by_moderation?: boolean;
  agent?: { key: string; name: string } | null;
  reasoning_summary?: string | null;
  sources?: { key: string; label: string }[] | null;
  disclaimer?: string | null;
  actions?: ChatAction[];
  feedback?: 'up' | 'down' | null;
}

/** List row: no messages. `title` is null for a conversation created empty. */
export interface ChatConversationSummary {
  id: string;
  title: string | null;
  topic?: ChatTopic | null;
  archived_at?: string | null;
  pinned_agent_key?: string | null;
  created_at: string;
  updated_at: string;
  /** Only when the list was fetched with `query`. */
  match_snippet?: string;
}

export interface ChatConversation extends ChatConversationSummary {
  messages: ChatMessage[];
}

export interface ListConversationsParams {
  query?: string;
  topic?: ChatTopic | null;
  archived?: boolean;
}

export interface AISuggestionCard {
  id: string;
  source: string;
  title: string;
  body: string;
  href: string;
  status: 'new' | 'accepted' | 'dismissed' | 'snoozed';
  created_at: string;
}

export interface AISuggestionsData {
  enabled: boolean;
  items: AISuggestionCard[];
}

export interface AIAgentEntry {
  key: string;
  name: string;
  category: string;
  description: string;
  topic: ChatTopic | null;
  available: boolean;
  status: 'available' | 'coming_soon';
}

interface Envelope<T> {
  data: T;
  meta?: Record<string, unknown> | null;
}

const enc = encodeURIComponent;
const post = <T>(path: string, body?: unknown) =>
  apiClient<Envelope<T>>(path, {
    method: 'POST',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }).then((r) => r.data);

/** POST /ai/conversations (201). The first message is required; `agent_key` pins a specialist. */
export async function createConversation(message: string, agentKey?: string): Promise<ChatConversation> {
  return post<ChatConversation>('/ai/conversations', agentKey ? { message, agent_key: agentKey } : { message });
}

/** GET /ai/conversations: only the caller's own, newest activity first. */
export async function listConversations(params: ListConversationsParams = {}): Promise<ChatConversationSummary[]> {
  const qs = new URLSearchParams();
  const q = params.query?.trim();
  if (q) qs.set('query', q);
  if (params.topic) qs.set('topic', params.topic);
  if (params.archived) qs.set('archived', 'true');
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await apiClient<Envelope<ChatConversationSummary[]>>(`/ai/conversations${suffix}`);
  return res.data;
}

/** GET /ai/conversations/{id}: the full thread (what the poll reads). */
export async function getConversation(id: string): Promise<ChatConversation> {
  const res = await apiClient<Envelope<ChatConversation>>(`/ai/conversations/${enc(id)}`);
  return res.data;
}

/** POST /ai/conversations/{id}/messages (202): returns the `generating` assistant turn. */
export async function postMessage(id: string, content: string): Promise<ChatMessage> {
  return post<ChatMessage>(`/ai/conversations/${enc(id)}/messages`, { content });
}

/** POST .../messages/{messageId}/cancel: messageId is the assistant turn. */
export async function cancelReply(id: string, messageId: string): Promise<ChatMessage> {
  return post<ChatMessage>(`/ai/conversations/${enc(id)}/messages/${enc(messageId)}/cancel`);
}

/** POST .../messages/{messageId}/regenerate (202): answers the latest reply again (also Retry). */
export async function regenerateReply(id: string, messageId: string): Promise<ChatMessage> {
  return post<ChatMessage>(`/ai/conversations/${enc(id)}/messages/${enc(messageId)}/regenerate`);
}

/** POST /ai/messages/{id}/feedback: `rating: null` clears it. */
export async function sendFeedback(messageId: string, rating: 'up' | 'down' | null): Promise<ChatMessage> {
  return post<ChatMessage>(`/ai/messages/${enc(messageId)}/feedback`, { rating });
}

export type ActionVerb = 'confirm' | 'undo' | 'dismiss';
export async function actOnAction(messageId: string, actionId: string, verb: ActionVerb): Promise<ChatAction> {
  return post<ChatAction>(`/ai/messages/${enc(messageId)}/actions/${enc(actionId)}/${verb}`);
}

export async function archiveConversations(ids: string[]): Promise<number> {
  return (await post<{ archived: number }>('/ai/conversations/archive', { ids })).archived;
}

export async function unarchiveConversations(ids: string[]): Promise<number> {
  return (await post<{ unarchived: number }>('/ai/conversations/unarchive', { ids })).unarchived;
}

/** DELETE /ai/conversations/{id}: "Delete forever", no undo. */
export async function deleteConversation(id: string): Promise<void> {
  await apiClient(`/ai/conversations/${enc(id)}`, { method: 'DELETE' });
}

export async function listSuggestions(): Promise<AISuggestionsData> {
  const res = await apiClient<Envelope<AISuggestionsData>>('/ai/suggestions');
  return res.data;
}

export type SuggestionVerb = 'accept' | 'dismiss' | 'snooze';
export async function actOnSuggestion(id: string, verb: SuggestionVerb, days?: number): Promise<AISuggestionCard> {
  return post<AISuggestionCard>(`/ai/suggestions/${enc(id)}/${verb}`, verb === 'snooze' ? { days: days ?? 7 } : undefined);
}

export async function listAgents(): Promise<AIAgentEntry[]> {
  const res = await apiClient<Envelope<AIAgentEntry[]>>('/ai/agents');
  return res.data;
}

export const aiChatApi = {
  createConversation,
  listConversations,
  getConversation,
  postMessage,
  cancelReply,
  regenerateReply,
  sendFeedback,
  actOnAction,
  archiveConversations,
  unarchiveConversations,
  deleteConversation,
  listSuggestions,
  actOnSuggestion,
  listAgents,
};
