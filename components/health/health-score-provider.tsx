'use client';

import React, { createContext, useContext } from 'react';
import { useHealthScore } from '@/hooks/useHealthScore';

type HealthOverview = ReturnType<typeof useHealthScore>;

const HealthOverviewContext = createContext<HealthOverview | null>(null);

/**
 * Loads GET /health-score once for the whole Health section. The layout (Health
 * chip) and every page read it from here, so switching tabs never refetches.
 */
export function HealthScoreProvider({ children }: { children: React.ReactNode }) {
  const value = useHealthScore();
  return <HealthOverviewContext.Provider value={value}>{children}</HealthOverviewContext.Provider>;
}

export function useHealthOverview(): HealthOverview {
  const ctx = useContext(HealthOverviewContext);
  if (!ctx) throw new Error('useHealthOverview must be used inside <HealthScoreProvider>');
  return ctx;
}
