'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  businessBuilderApi,
  CanvasType,
  CanvasSavePayload,
  BusinessBuilderOverview,
  Suggestion,
} from '@/lib/api/business-builder';

export type UserRole = 'F' | 'BC';

export interface ArtifactMeta {
  id: string;
  slug: string;
  title: string;
  completionPercentage: number;
  lastEdited: string;
  description: string;
}

const DEFAULT_ARTIFACTS: ArtifactMeta[] = [
  { id: 'a1', slug: 'business-model-canvas', title: 'Business Model Canvas', completionPercentage: 0, lastEdited: 'Never', description: 'The 9 building blocks of how you create and capture value.' },
  { id: 'a2', slug: 'lean-canvas', title: 'Lean Canvas', completionPercentage: 0, lastEdited: 'Never', description: 'Actionable and entrepreneur-focused business plan.' },
  { id: 'a3', slug: 'mission-vision', title: 'Mission & Vision', completionPercentage: 0, lastEdited: 'Never', description: 'Why you exist and the world if you win.' },
  { id: 'a4', slug: 'value-proposition', title: 'Value Proposition', completionPercentage: 0, lastEdited: 'Never', description: 'Map customer pains to your exact solutions.' },
  { id: 'a5', slug: 'personas', title: 'Customer Personas', completionPercentage: 0, lastEdited: 'Never', description: 'Who you are selling to.' },
  { id: 'a6', slug: 'pricing', title: 'Pricing Strategy', completionPercentage: 0, lastEdited: 'Never', description: 'How much you charge and on what terms.' },
  { id: 'a7', slug: 'revenue-model', title: 'Revenue Model', completionPercentage: 0, lastEdited: 'Never', description: 'How your business makes money over time.' },
  { id: 'a8', slug: 'competitive-analysis', title: 'Competitive Analysis', completionPercentage: 0, lastEdited: 'Never', description: 'Who else is doing this and why you are better.' },
  { id: 'a9', slug: 'swot', title: 'SWOT Analysis', completionPercentage: 0, lastEdited: 'Never', description: 'Strengths, Weaknesses, Opportunities, Threats.' },
  { id: 'a10', slug: 'plan', title: 'Business Plan', completionPercentage: 0, lastEdited: 'Never', description: 'Generate a full narrative plan from your artifacts.' }
];

export function useBusinessBuilderApi() {
  const [userRole, setUserRole] = useState<UserRole>('F');
  const [artifacts, setArtifacts] = useState<ArtifactMeta[]>(DEFAULT_ARTIFACTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data: BusinessBuilderOverview = await businessBuilderApi.getOverview();
      if (data?.artifacts && Array.isArray(data.artifacts)) {
        setArtifacts(
          data.artifacts.map((art) => ({
            id: art.id,
            slug: art.slug,
            title: art.title,
            completionPercentage: art.completion_percentage ?? 0,
            lastEdited: art.last_edited || 'Recently',
            description: art.description || '',
          }))
        );
      }
    } catch (err: unknown) {
      // Retain defaults if workspace is fresh or server returned non-200
      setError(((err as { message?: string })?.message) || 'Failed to fetch business builder overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => { await fetchOverview(); })();
  }, [fetchOverview]);

  const updateLastEdited = (slug: string) => {
    setArtifacts((prev) =>
      prev.map((a) =>
        a.slug === slug ? { ...a, lastEdited: 'Just now' } : a
      )
    );
  };

  const loadCanvas = useCallback(async (type: CanvasType | string) => {
    try {
      return await businessBuilderApi.getCanvas(type);
    } catch (err: unknown) {
      return null;
    }
  }, []);

  const saveCanvas = useCallback(
    async (type: CanvasType | string, payload: CanvasSavePayload) => {
      const res = await businessBuilderApi.saveCanvas(type, payload);
      updateLastEdited(type);
      return res;
    },
    []
  );

  const aiFillCanvas = useCallback(
    async (type: CanvasType | string, promptParams?: Record<string, unknown>) => {
      return await businessBuilderApi.aiFillCanvas(type, promptParams);
    },
    []
  );

  return {
    userRole,
    setUserRole,
    artifacts,
    loading,
    error,
    refetch: fetchOverview,
    updateLastEdited,
    loadCanvas,
    saveCanvas,
    aiFillCanvas,
  };
}


