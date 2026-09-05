'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/sidebar';
import { SidebarProvider } from '@/components/sidebar-context';

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
      <div className="min-h-screen bg-[#F4F6F5]">
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        <main className="min-h-screen lg:ml-64">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}