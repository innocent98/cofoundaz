import { apiClient } from './client';

export interface EnrichmentFailure {
  type: string;
  failed_at: string | null;
}

export interface AiStatusData {
  tokens_used_today: number;
  daily_budget: number | null;
  over_budget: boolean;
  resets_at: string;
  recent_enrichment_failures: EnrichmentFailure[];
}

export interface ApiResponseEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export type AiStatusResponse = ApiResponseEnvelope<AiStatusData>;

/**
 * Fetches the current AI system status, token budget, and degradation info.
 * Calls GET /api/v1/ai/status via apiClient.
 */
export async function getAiStatus(): Promise<AiStatusResponse> {
  return apiClient<AiStatusResponse>('/ai/status');
}

export const aiApi = {
  getStatus: getAiStatus,
};
