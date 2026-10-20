export interface MissionTask {
  id: string;
  title: string;
  reason: string;
  order: number;
  completed: boolean;
  completedAt?: string;
}

export type AIContentStatus = 'empty' | 'generating' | 'ready' | 'restricted';

export interface BriefingAction {
  index: number;
  label: string;
  kind: 'task' | 'navigate';
  href: string | null;
  accepted: boolean;
  missionTaskId: string | null;
}

export interface AIBriefing {
  /** Null until a briefing exists (empty / restricted). Needed to call Do it. */
  id: string | null;
  date: string;
  agentBadge: 'Co-Founder';
  content: string;
  actions: BriefingAction[];
  status?: AIContentStatus;
  error?: boolean;
  errorMessage?: string;
  hasEmptyState?: boolean;
  skipped?: boolean;
  reason?: string;
}

export type KPIStatus = 'ok' | 'no_data' | 'restricted' | 'not_built' | 'not_burning' | 'out_of_cash';

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
  /** Backend status for this tile; drives the empty/restricted/coming-soon states. */
  status?: KPIStatus;
  /** Restricted tiles are dropped from the strip entirely. */
  hidden?: boolean;
  /** Empty-state call to action (no_data). */
  cta?: { label: string; href: string };
  /** Short honest caption under the value, e.g. what the figure averages. */
  hint?: string;
  /** Week-over-week change chip text, e.g. "+₦10.0K vs last week". Null until a 7-day-old snapshot exists. */
  deltaLabel?: string | null;
  /** Direction of the week-over-week change; higher is better for every tile. */
  deltaDirection?: 'up' | 'down' | 'flat';
  /** Daily snapshot values for the sparkline (needs at least two points to draw). */
  series?: number[];
}

export interface RiskItem {
  id: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  /** Null: render the row without a Review link. */
  moduleLink: string | null;
}

export interface OpportunityItem {
  id: string;
  description: string;
  moduleLink: string | null;
}

export interface UpcomingItem {
  id: string;
  title: string;
  /** ISO date (YYYY-MM-DD); null when the milestone has no due date. */
  dueOn: string | null;
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

export type MissionEmptyState = 'weekend_off' | 'all_caught_up' | null;

export interface DashboardMissionState {
  streakDays: number;
  status?: string;
  tasks: MissionTask[];
  /** Why there are no tasks; null when there are some. */
  emptyReason: MissionEmptyState;
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
  /**
   * `restricted` = the viewer's role cannot open Today's Mission (D-MIS-8): hide the card and anything derived
   * from it. `ok` with `mission: null` means the workspace has no roadmap yet.
   */
  missionStatus: 'ok' | 'restricted';
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
  /** Calendar next 7 days (nearest milestones). Empty when none or the section failed. */
  upcoming: UpcomingItem[];
  upcomingError: boolean;
  /** True when the viewer's role must not see the AI briefing cards (hide them, do not show empty copy). */
  briefingRestricted: boolean;
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
