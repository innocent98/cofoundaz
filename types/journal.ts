export type JournalMood = 'rough' | 'meh' | 'okay' | 'good' | 'great';
export type FeMood = 'Rough' | 'Heavy' | 'Steady' | 'Good' | 'Great';

export const FE_TO_API_MOOD: Record<FeMood, JournalMood> = {
  Rough: 'rough',
  Heavy: 'meh',
  Steady: 'okay',
  Good: 'good',
  Great: 'great',
};

export const API_TO_FE_MOOD: Record<JournalMood, FeMood> = {
  rough: 'Rough',
  meh: 'Heavy',
  okay: 'Steady',
  good: 'Good',
  great: 'Great',
};

export interface JournalSettings {
  passcode_enabled: boolean;
  locked_until: string | null;
  daily_prompt_notifications: boolean;
  evening_reminder: boolean;
}

export interface JournalStats {
  entries_this_month: number;
  entries_per_week?: number;
  average_mood?: JournalMood | null;
  previous_month_average_mood?: {
    mood: JournalMood;
    month?: string;
  } | null;
  longest_streak_days?: number;
  longest_streak_ended_on?: string | null;
  current_streak_days?: number;
  total_entries?: number;
}

export interface JournalPrompt {
  id?: string;
  prompt: string;
  theme?: string;
  dismissed?: boolean;
}

export interface JournalEntryListItem {
  id: string;
  date: string;
  mood: JournalMood;
  stress: number;
  first_line: string;
  preview: string;
  word_count: number;
}

export interface JournalEntryDetail {
  id: string;
  date: string;
  mood: JournalMood;
  stress: number;
  content: string;
  word_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface MonthOption {
  month: string; // "YYYY-MM"
  label: string; // e.g. "October 2026 (6)"
  count: number;
}

export interface MoodPoint {
  date: string;
  mood: JournalMood;
  stress: number;
}

export interface MoodAnnotation {
  date: string;
  label: string;
}

export interface MoodData {
  points: MoodPoint[];
  annotations?: MoodAnnotation[];
}

export interface InsightItem {
  id?: string;
  title: string;
  body: string;
  kind: 'weekday_stress' | 'deadline_stress' | 'mood_shift' | 'streak' | 'great_days' | string;
}

export interface SupportiveCard {
  id?: string;
  title: string;
  body: string;
  kicker?: string;
}

export interface JournalInsightsResponse {
  insights: InsightItem[];
  entries_needed: number;
  supportive_card?: SupportiveCard | null;
}

