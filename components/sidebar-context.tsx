'use client';

import { createContext, useContext } from 'react';

type SidebarContextType = {
  openSidebar: () => void;
  closeSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({
  children,
  openSidebar,
  closeSidebar,
}: {
  children: React.ReactNode;
  openSidebar: () => void;
  closeSidebar: () => void;
}) {
  return (
    <SidebarContext.Provider value={{ openSidebar, closeSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error('useSidebar must be used inside SidebarProvider');
  }

  return context;
}