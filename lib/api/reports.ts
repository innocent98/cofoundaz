import { apiClient } from './client';

export type ReportItemType = 'ai_message' | 'comment';

export type ReportReason =
  | 'spam'
  | 'abusive'
  | 'harmful'
  | 'inaccurate'
  | 'privacy'
  | 'other';

export const REPORT_REASONS: Record<ReportReason, string> = {
  spam: 'Spam',
  abusive: 'Abusive or harassing',
  harmful: 'Harmful or unsafe',
  inaccurate: 'Wrong or misleading',
  privacy: 'Shares private information',
  other: 'Something else',
};

export interface ReportItemPayload {
  item_type: ReportItemType;
  item_id: string;
  reason: ReportReason | string;
  note?: string;
}

export interface MyReportItem {
  id: string;
  item_type: ReportItemType;
  item_id: string;
  reason: string;
}

/**
 * Submit a content report for an AI Co-Founder reply or teammate comment.
 * POST /reports
 */
export async function reportItem(payload: ReportItemPayload): Promise<void> {
  const body: Record<string, string> = {
    item_type: payload.item_type,
    item_id: payload.item_id,
    reason: payload.reason,
  };
  if (payload.note && payload.note.trim()) {
    body.note = payload.note.trim();
  }

  await apiClient('/reports', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Retrieve the active founder reports that staff haven't yet decided.
 * GET /reports/mine
 */
export async function myReports(): Promise<MyReportItem[]> {
  const res = await apiClient<{ data?: MyReportItem[] } | MyReportItem[]>('/reports/mine');
  if (Array.isArray(res)) {
    return res;
  }
  if (res && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
}
