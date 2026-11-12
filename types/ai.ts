export type AgentKey = 'cofounder' | 'finance' | 'sales' | 'marketing' | 'legal' | 'team' | 'product' | 'funding' | 'operations' | 'compliance' | 'analytics';

export interface AgentBadge {
  key: AgentKey;
  name: string;
  title: string;
  avatarUrl?: string;
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
