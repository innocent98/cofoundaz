export type AgentKey = 'cofounder' | 'finance' | 'sales' | 'marketing' | 'legal' | 'team' | 'product' | 'funding' | 'operations' | 'compliance' | 'analytics';

export interface AgentBadge {
  key: AgentKey;
  name: string;
  title: string;
  avatarUrl?: string;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  agentKey?: AgentKey;
  agentBadge?: string;
  content: string;
  reasoningSummary?: string;
  sources?: Array<{ id: string; label: string; url: string }>;
  actionChips?: Array<{ id: string; label: string; action: string; artifactTitle?: string }>;
  createdAt: string;
}

export interface AIConversation {
  id: string;
  title: string;
  topic?: string;
  lastMessageAt: string;
  agentsInvolved: AgentKey[];
  messages?: AIMessage[];
}

export interface AISuggestion {
  id: string;
  agentKey: AgentKey;
  suggestion: string;
  rationale: string;
  createdAt: string;
}

export interface AIMemoryFact {
  id: string;
  fact: string;
  sourceRef?: string;
  createdAt: string;
}
