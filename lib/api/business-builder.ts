type ApiResponse<T = unknown> = { data?: T } & Record<string, unknown>;
import { apiClient, ApiError } from './client';

/** A business-plan generation run (`GET /business-builder/plan`). */
export interface BusinessPlanRun {
  id: string;
  status: 'generating' | 'complete' | 'failed';
  document_id: string | null;
  created_at?: string;
}

export interface PlanSection {
  id: string;
  heading: string;
  body: string;
}

/** The generated plan Document (`GET /documents/{id}`), kind `business_plan`. */
export interface PlanDocument {
  id: string;
  kind: string;
  title: string;
  status?: string;
  ai_generated?: boolean;
  version?: number;
  sections: PlanSection[];
}

export type CanvasType = 'lean' | 'bmc' | 'value_prop' | 'swot';

export interface CanvasBlockItem {
  id: string;
  text: string;
  created_at?: string;
  is_ai_generated?: boolean;
}

export interface CanvasSavePayload {
  version: number;
  blocks: Record<string, CanvasBlockItem[] | unknown>;
}

export interface BusinessBuilderOverview {
  artifacts: Array<{
    id: string;
    slug: string;
    title: string;
    completion_percentage: number;
    last_edited?: string;
    description?: string;
  }>;
}

export interface Suggestion {
  id: string;
  target_artifact: string;
  target_block?: string;
  suggested_text: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
}

// A stored Business Builder record (persona / competitor / pricing / revenue
// stream). `data` is the kind-specific validated payload; `kind` is the API's
// snake_case value (e.g. `revenue_stream`), NOT the plural URL segment.
export interface BusinessRecord {
  id: string;
  kind: string;
  data: Record<string, unknown>;
  position: number;
}

// FE field descriptor served alongside the list. `choices` is non-null only for
// enum fields (its members' values); `type` is the raw Python annotation string.
export interface RecordField {
  key: string;
  required: boolean;
  type: string;
  choices: string[] | null;
}

export interface RecordListResponse {
  records: BusinessRecord[];
  fields: RecordField[];
}

function getWorkspaceHeaders(workspaceId?: string): HeadersInit {
  const wsId =
    workspaceId ||
    (typeof window !== 'undefined' ? localStorage.getItem('cf_workspace_id') : null) ||
    '';

  return wsId ? { 'X-Workspace-Id': wsId } : {};
}

export const businessBuilderApi = {
  // 1. Overview
  async getOverview(workspaceId?: string): Promise<BusinessBuilderOverview> {
    const res = await apiClient<ApiResponse>('/business-builder/overview', {
      headers: getWorkspaceHeaders(workspaceId),
    });
    return ((res as ApiResponse)?.data ?? res) as BusinessBuilderOverview;
  },

  // 2. Canvases
  async getCanvas(type: CanvasType | string, workspaceId?: string): Promise<unknown> {
    const res = await apiClient<ApiResponse>(`/business-builder/canvases/${type}`, {
      headers: getWorkspaceHeaders(workspaceId),
    });
    return ((res as ApiResponse)?.data ?? res) as BusinessBuilderOverview;
  },

  async saveCanvas(
    type: CanvasType | string,
    payload: CanvasSavePayload,
    workspaceId?: string
  ): Promise<unknown> {
    const res = await apiClient<ApiResponse>(`/business-builder/canvases/${type}`, {
      method: 'PUT',
      headers: getWorkspaceHeaders(workspaceId),
      body: JSON.stringify(payload),
    });
    return ((res as ApiResponse)?.data ?? res) as BusinessBuilderOverview;
  },

  async aiFillCanvas(
    type: CanvasType | string,
    promptParams?: Record<string, unknown>,
    workspaceId?: string
  ): Promise<unknown> {
    const res = await apiClient<ApiResponse>(`/business-builder/canvases/${type}/ai-fill`, {
      method: 'POST',
      headers: getWorkspaceHeaders(workspaceId),
      body: JSON.stringify(promptParams || {}),
    });
    return ((res as ApiResponse)?.data ?? res) as BusinessBuilderOverview;
  },

  // 3. Records (personas / competitors / pricing / revenue-streams).
  // NOTE: `kind` here is the PLURAL, hyphenated URL segment the API routes on
  // (`personas`, `competitors`, `pricing`, `revenue-streams`) — not the enum
  // value. The list endpoint returns both the records and their field schema;
  // create/update wrap the payload in `{ data }`.
  async listRecords(kind: string, workspaceId?: string): Promise<RecordListResponse> {
    const res = await apiClient<ApiResponse>(`/business-builder/${kind}`, {
      headers: getWorkspaceHeaders(workspaceId),
    });
    const data = ((res as ApiResponse)?.data ?? res) as Partial<RecordListResponse>;
    return {
      records: Array.isArray(data?.records) ? data.records : [],
      fields: Array.isArray(data?.fields) ? data.fields : [],
    };
  },

  async createRecord(
    kind: string,
    data: Record<string, unknown>,
    workspaceId?: string
  ): Promise<BusinessRecord> {
    const res = await apiClient<ApiResponse>(`/business-builder/${kind}`, {
      method: 'POST',
      headers: getWorkspaceHeaders(workspaceId),
      body: JSON.stringify({ data }),
    });
    return ((res as ApiResponse)?.data ?? res) as BusinessRecord;
  },

  async updateRecord(
    kind: string,
    recordId: string,
    data: Record<string, unknown>,
    workspaceId?: string
  ): Promise<BusinessRecord> {
    const res = await apiClient<ApiResponse>(`/business-builder/${kind}/${recordId}`, {
      method: 'PUT',
      headers: getWorkspaceHeaders(workspaceId),
      body: JSON.stringify({ data }),
    });
    return ((res as ApiResponse)?.data ?? res) as BusinessRecord;
  },

  async deleteRecord(kind: string, recordId: string, workspaceId?: string): Promise<void> {
    await apiClient<ApiResponse>(`/business-builder/${kind}/${recordId}`, {
      method: 'DELETE',
      headers: getWorkspaceHeaders(workspaceId),
    });
  },

  // 4. Suggestions
  async getSuggestions(workspaceId?: string): Promise<Suggestion[]> {
    const res = await apiClient<ApiResponse>('/business-builder/suggestions', {
      headers: getWorkspaceHeaders(workspaceId),
    });
    const data = (res as ApiResponse)?.data ?? res;
    const parsed = data as { items?: unknown[] } | undefined; return Array.isArray(data) ? data : ((parsed?.items || []) as Suggestion[]);
  },

  async approveSuggestion(suggestionId: string, workspaceId?: string): Promise<unknown> {
    const res = await apiClient<ApiResponse>(
      `/business-builder/suggestions/${suggestionId}/approve`,
      {
        method: 'POST',
        headers: getWorkspaceHeaders(workspaceId),
      }
    );
    return ((res as ApiResponse)?.data ?? res) as BusinessBuilderOverview;
  },

  async rejectSuggestion(suggestionId: string, workspaceId?: string): Promise<unknown> {
    const res = await apiClient<ApiResponse>(
      `/business-builder/suggestions/${suggestionId}/reject`,
      {
        method: 'POST',
        headers: getWorkspaceHeaders(workspaceId),
      }
    );
    return ((res as ApiResponse)?.data ?? res) as BusinessBuilderOverview;
  },

  // 5. Positioning Map
  async getPositioningMap(workspaceId?: string): Promise<unknown> {
    const res = await apiClient<ApiResponse>('/business-builder/positioning-map', {
      headers: getWorkspaceHeaders(workspaceId),
    });
    return ((res as ApiResponse)?.data ?? res) as BusinessBuilderOverview;
  },

  async savePositioningMap(payload: unknown, workspaceId?: string): Promise<unknown> {
    const res = await apiClient<ApiResponse>('/business-builder/positioning-map', {
      method: 'PUT',
      headers: getWorkspaceHeaders(workspaceId),
      body: JSON.stringify(payload),
    });
    return ((res as ApiResponse)?.data ?? res) as BusinessBuilderOverview;
  },

  // 4. AI business-plan generator (async: POST starts, GET polls, document holds content).
  // `POST /plan/generate` → 202 { plan_id, status }. Founder/editor only (403 otherwise).
  async generatePlan(workspaceId?: string): Promise<{ plan_id: string; status: string }> {
    const res = await apiClient<ApiResponse>('/business-builder/plan/generate', {
      method: 'POST',
      headers: getWorkspaceHeaders(workspaceId),
    });
    return ((res as ApiResponse)?.data ?? res) as { plan_id: string; status: string };
  },

  // `GET /plan` → the LATEST run (not a list). 404 when none has ever been generated → null.
  async getPlan(workspaceId?: string): Promise<BusinessPlanRun | null> {
    try {
      const res = await apiClient<ApiResponse>('/business-builder/plan', {
        headers: getWorkspaceHeaders(workspaceId),
      });
      return ((res as ApiResponse)?.data ?? res) as BusinessPlanRun;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  // The plan's content lives in a normal Document (`GET /documents/{id}`); only fetch
  // once `GET /plan` reports `complete` and `document_id` is set.
  async getPlanDocument(documentId: string, workspaceId?: string): Promise<PlanDocument> {
    const res = await apiClient<ApiResponse>(`/documents/${documentId}`, {
      headers: getWorkspaceHeaders(workspaceId),
    });
    return ((res as ApiResponse)?.data ?? res) as PlanDocument;
  },
};






