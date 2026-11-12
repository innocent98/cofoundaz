'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/sidebar';
import { SidebarProvider } from '@/components/sidebar-context';
import { AiDrawerProvider } from '@/components/ai-drawer-context';
import { AiDrawer } from '@/components/ai-drawer';
import { WorkspaceProvider } from '@/components/workspace-context';
import { RealtimeProvider } from '@/components/realtime-context';
import { NotificationsProvider } from '@/hooks/useNotifications';
import { SearchProvider } from '@/components/search/search-context';
import { MobileTabBar } from '@/components/mobile-tab-bar';
import { RouteGuard } from '@/components/route-guard';

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
      <WorkspaceProvider>
        <RealtimeProvider>
          <NotificationsProvider>
            <AiDrawerProvider>
              <SearchProvider>
                <div className="min-h-screen bg-neutral-100 flex w-full">
                  <Sidebar
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                  />

                  {/* pb-16 clears the mobile bottom tab bar (md:hidden) */}
                  <main className="min-h-screen flex-1 w-full min-w-0 lg:ml-64 pb-16 md:pb-0">
                    <RouteGuard>{children}</RouteGuard>
                  </main>
                </div>
                <MobileTabBar />
                <AiDrawer />
              </SearchProvider>
            </AiDrawerProvider>
          </NotificationsProvider>
        </RealtimeProvider>
      </WorkspaceProvider>
    </SidebarProvider>
  );
}
