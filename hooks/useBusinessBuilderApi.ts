'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '@/lib/api/client';
import {
  businessBuilderApi,
  CanvasType,
  BusinessBuilderOverview,
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

  // Canvas PUT is optimistic-concurrency: the FE must echo the version it last
  // read, and the server bumps it on every save (guide §3). We track the current
  // version per canvas type so autosave doesn't 409 after the first save.
  const canvasVersions = useRef<Record<string, number>>({});

  const loadCanvas = useCallback(async (type: CanvasType | string) => {
    try {
      const data = (await businessBuilderApi.getCanvas(type)) as { version?: number } | null;
      if (data && typeof data.version === 'number') canvasVersions.current[String(type)] = data.version;
      return data;
    } catch {
      return null;
    }
  }, []);

  const saveCanvas = useCallback(
    async (type: CanvasType | string, payload: { blocks: Record<string, unknown> }) => {
      const t = String(type);
      const put = async (version: number) =>
        (await businessBuilderApi.saveCanvas(t, { version, blocks: payload.blocks })) as { version?: number };
      try {
        const res = await put(canvasVersions.current[t] ?? 0);
        if (typeof res?.version === 'number') canvasVersions.current[t] = res.version;
        updateLastEdited(t);
        return res;
      } catch (err) {
        // On a 409 version conflict, re-read to get the latest version and retry once.
        if (err instanceof ApiError && err.status === 409) {
          const fresh = (await businessBuilderApi.getCanvas(t)) as { version?: number };
          const res = await put(typeof fresh?.version === 'number' ? fresh.version : 0);
          if (typeof res?.version === 'number') canvasVersions.current[t] = res.version;
          updateLastEdited(t);
          return res;
        }
        throw err;
      }
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


