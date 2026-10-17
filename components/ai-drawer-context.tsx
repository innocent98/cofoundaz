'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/** A message the drawer should start a fresh conversation with (e.g. "Tell me more" on the briefing). */
export interface AiDrawerSeed {
  id: number;
  text: string;
}

interface AiDrawerContextProps {
  isAiDrawerOpen: boolean;
  /** Opens the drawer. With `seed`, starts a new conversation seeded with that text. */
  openAiDrawer: (options?: { seed?: string }) => void;
  closeAiDrawer: () => void;
  seed: AiDrawerSeed | null;
  clearSeed: () => void;
}

const AiDrawerContext = createContext<AiDrawerContextProps | undefined>(undefined);

export function AiDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [seed, setSeed] = useState<AiDrawerSeed | null>(null);

  // `onClick={openAiDrawer}` passes a click event; only a string `seed` counts.
  const openAiDrawer = useCallback((options?: { seed?: string }) => {
    const text = typeof options?.seed === 'string' ? options.seed.trim() : '';
    if (text) setSeed((prev) => ({ id: (prev?.id ?? 0) + 1, text }));
    setIsAiDrawerOpen(true);
  }, []);
  const closeAiDrawer = useCallback(() => setIsAiDrawerOpen(false), []);
  const clearSeed = useCallback(() => setSeed(null), []);

  const value = useMemo(
    () => ({ isAiDrawerOpen, openAiDrawer, closeAiDrawer, seed, clearSeed }),
    [isAiDrawerOpen, openAiDrawer, closeAiDrawer, seed, clearSeed],
  );
  return <AiDrawerContext.Provider value={value}>{children}</AiDrawerContext.Provider>;
}

export function useAiDrawer() {
  const context = useContext(AiDrawerContext);
  if (!context) {
    throw new Error('useAiDrawer must be used within an AiDrawerProvider');
  }
  return context;
}
