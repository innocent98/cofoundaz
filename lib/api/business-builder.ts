type ApiResponse<T = unknown> = { data?: T } & Record<string, unknown>;
import { apiClient } from './client';

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

  // 3. Generic Entity Endpoints (personas, competitors, swot, pricing, etc.)
  async getEntities(kind: string, workspaceId?: string): Promise<unknown[]> {
    const res = await apiClient<ApiResponse>(`/business-builder/${kind}`, {
      headers: getWorkspaceHeaders(workspaceId),
    });
    const data = (res as ApiResponse)?.data ?? res;
    const parsed = data as { items?: unknown[] } | undefined; return Array.isArray(data) ? data : ((parsed?.items || []) as Suggestion[]);
  },

  async createEntity(kind: string, payload: unknown, workspaceId?: string): Promise<unknown> {
    const res = await apiClient<ApiResponse>(`/business-builder/${kind}`, {
      method: 'POST',
      headers: getWorkspaceHeaders(workspaceId),
      body: JSON.stringify(payload),
    });
    return ((res as ApiResponse)?.data ?? res) as BusinessBuilderOverview;
  },

  async updateEntity(
    kind: string,
    recordId: string,
    payload: unknown,
    workspaceId?: string
  ): Promise<unknown> {
    const res = await apiClient<ApiResponse>(`/business-builder/${kind}/${recordId}`, {
      method: 'PUT',
      headers: getWorkspaceHeaders(workspaceId),
      body: JSON.stringify(payload),
    });
    return ((res as ApiResponse)?.data ?? res) as BusinessBuilderOverview;
  },

  async deleteEntity(
    kind: string,
    recordId: string,
    workspaceId?: string
  ): Promise<unknown> {
    const res = await apiClient<ApiResponse>(`/business-builder/${kind}/${recordId}`, {
      method: 'DELETE',
      headers: getWorkspaceHeaders(workspaceId),
    });
    return ((res as ApiResponse)?.data ?? res) as BusinessBuilderOverview;
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
};






