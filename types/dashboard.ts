export interface MissionTask {
  id: string;
  title: string;
  reason: string;
  order: number;
  completed: boolean;
  completedAt?: string;
}

export type AIContentStatus = 'empty' | 'generating' | 'ready';

export interface AIBriefing {
  id: string;
  date: string;
  agentBadge: 'Co-Founder';
  content: string;
  actions: Array<{ index: number; label: string }>;
  status?: AIContentStatus;
  error?: boolean;
  errorMessage?: string;
  hasEmptyState?: boolean;
  skipped?: boolean;
  reason?: string;
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
  hasData?: boolean;
  error?: boolean;
}

export interface RiskItem {
  id: string;
  severity: 'high' | 'medium' | 'low' | 'red' | 'amber';
  description: string;
  moduleLink?: string;
}

export interface OpportunityItem {
  id: string;
  type?: 'grant' | 'validation' | 'pipeline' | string;
  description: string;
  ctaText?: 'Review' | 'See fit' | string;
  moduleLink?: string;
}

export interface DashboardHealthState {
  score: number;
  deltaWeekly: number;
  status?: string;
  band?: string;
  summary?: string;
  error?: boolean;
  errorMessage?: string;
}

export interface DashboardMissionState {
  streakDays: number;
  status?: string;
  tasks: MissionTask[];
  error?: boolean;
  errorMessage?: string;
}

export interface DashboardSummaryResponse {
  greeting?: {
    first_name?: string | null;
    startup_name?: string | null;
    salutation?: string | null;
  };
  user?: {
    first_name?: string;
    name?: string;
  };
  startup?: {
    name?: string;
  };
  health: DashboardHealthState;
  mission: DashboardMissionState | null;
  calibration?: {
    assessment_complete?: boolean;
    step?: number | string;
    error?: boolean;
    errorMessage?: string;
    [key: string]: unknown;
  } | null;
  briefing: AIBriefing;
  kpis: KPISnapshot[];
  risks: RiskItem[];
  opportunities: OpportunityItem[];
  risksStatus?: AIContentStatus;
  opportunitiesStatus?: AIContentStatus;
  raw?: unknown;
}

export interface ActivityActorDetails {
  id?: string;
  name: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: string | null;
}

export interface ActivityLogEntry {
  id: string;
  actor: string;
  /** Human-readable sentence from the API (e.g. "Ade rejected 'QA snooze check'"). Preferred for display. */
  summary: string;
  /** Dotted action key, e.g. "mission.task.rejected" (optional metadata). */
  action?: string;
  verb: string;
  entity: string;
  timestamp: string;
  relativeTime: string;
  time?: string;
  actorDetails?: ActivityActorDetails | null;
}

export interface ActivityFeedResponse {
  data: ActivityLogEntry[];
  meta: {
    nextCursor: string | null;
    totalEstimate: number;
  };
}
