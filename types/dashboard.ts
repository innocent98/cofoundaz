export interface MissionTask {
  id: string;
  title: string;
  reason: string;
  order: number;
  completed: boolean;
  completedAt?: string;
}

export interface AIBriefing {
  id: string;
  date: string;
  agentBadge: 'Co-Founder';
  content: string;
  actions: Array<{ index: number; label: string }>;
}

export interface KPISnapshot {
  id: string;
  metric: 'revenue' | 'runway' | 'pipeline' | 'ctr' | 'tasks_completed';
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'flat';
  sparklineData: number[];
  href: string;
  isAlert?: boolean;
}

export interface RiskItem {
  id: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  moduleLink?: string;
}

export interface OpportunityItem {
  id: string;
  type: 'grant' | 'validation' | 'pipeline';
  description: string;
  ctaText: 'Review' | 'See fit';
  moduleLink?: string;
}

export interface DashboardSummaryResponse {
  health: {
    score: number;
    deltaWeekly: number;
  };
  mission: {
    streakDays: number;
    tasks: MissionTask[];
  };
  briefing: AIBriefing;
  kpis: KPISnapshot[];
  risks: RiskItem[];
  opportunities: OpportunityItem[];
}

export interface ActivityLogEntry {
  id: string;
  actor: string;
  verb: string;
  entity: string;
  timestamp: string;
  relativeTime: string;
}

export interface ActivityFeedResponse {
  data: ActivityLogEntry[];
  meta: {
    nextCursor: string | null;
    totalEstimate: number;
  };
}
