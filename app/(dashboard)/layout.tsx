'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/sidebar';
import { SidebarProvider } from '@/components/sidebar-context';
import { AiDrawerProvider } from '@/components/ai-drawer-context';
import { AiDrawer } from '@/components/ai-drawer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <SidebarProvider
      openSidebar={() => setIsSidebarOpen(true)}
      closeSidebar={() => setIsSidebarOpen(false)}
    >
      <AiDrawerProvider>
        <div className="min-h-screen bg-[#F4F6F5] flex w-full">
          <Sidebar
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
          />

          <main className="min-h-screen flex-1 w-full min-w-0 lg:ml-64">
            {children}
          </main>
        </div>
        <AiDrawer />
      </AiDrawerProvider>
    </SidebarProvider>
  );
}