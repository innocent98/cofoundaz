'use client';

import React, { createContext, useContext, useState } from 'react';

interface AiDrawerContextProps {
  isAiDrawerOpen: boolean;
  openAiDrawer: () => void;
  closeAiDrawer: () => void;
}

const AiDrawerContext = createContext<AiDrawerContextProps | undefined>(undefined);

export function AiDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  const openAiDrawer = () => setIsAiDrawerOpen(true);
  const closeAiDrawer = () => setIsAiDrawerOpen(false);

  return (
    <AiDrawerContext.Provider value={{ isAiDrawerOpen, openAiDrawer, closeAiDrawer }}>
      {children}
    </AiDrawerContext.Provider>
  );
}

export function useAiDrawer() {
  const context = useContext(AiDrawerContext);
  if (!context) {
    throw new Error('useAiDrawer must be used within an AiDrawerProvider');
  }
  return context;
}
