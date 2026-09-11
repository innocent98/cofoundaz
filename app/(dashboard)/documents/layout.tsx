'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/sidebar-context';
import { Bell, Menu, Plus } from 'lucide-react';
import { ToastProvider, useToast } from './ToastContext';

function DocumentsHeader() {
  const { openSidebar } = useSidebar();
  const { triggerToast } = useToast();

  return (
    <header className="sticky top-0 z-40 border-b border-sage-200 px-4 md:px-6 py-3 flex items-center justify-between bg-white w-full">
      <div className="flex items-center space-x-2.5">
        <button 
          onClick={openSidebar}
          className="md:hidden w-8 h-8 rounded-card border border-sage-200 bg-white text-[#183B28] hover:bg-sage-50 flex items-center justify-center transition-colors shrink-0 shadow-card"
          aria-label="Toggle Sidebar"
        >
          <Menu size={16} />
        </button>

        <div className="flex items-center space-x-2 text-xs md:text-sm font-medium tracking-tight">
          <span className="text-[#1E2923] font-semibold">Workspace</span>
          <span className="text-sage-400">/</span>
          <span className="text-sage-400 font-normal">Documents</span>
        </div>
      </div>

      <div className="flex items-center space-x-2.5 md:space-x-3">
        <div className="hidden md:flex bg-green-50 text-green-900 px-3 py-1 rounded-full text-xs font-semibold items-center space-x-1.5 border border-green-200">
          <span>Health</span>
          <span className="font-bold">72</span>
          <span className="text-xs">?</span>
        </div>
        
        <button 
          onClick={() => triggerToast('Notifications opened.')}
          className="relative w-8 h-8 rounded-full border border-sage-200 bg-white flex items-center justify-center cursor-pointer hover:bg-sage-50 transition-colors shadow-card shrink-0"
          aria-label="Notifications"
        >
          <Bell className="w-3.5 h-3.5 text-sage-500" />
          <span className="absolute -top-1 -right-1 bg-green-900 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            5
          </span>
        </button>

        <button 
          onClick={() => triggerToast('Invite modal opened.')}
          className="bg-copper-600 hover:bg-copper-700 text-white px-2.5 md:px-4 py-1.5 rounded-input text-xs font-semibold flex items-center space-x-1.5 shadow-card transition-colors h-[34px] shrink-0"
        >
          <Plus size={15} />
          <span className="hidden md:inline font-medium">+ Invite</span>
        </button>
      </div>
    </header>
  );
}

function DocumentsNav() {
  const pathname = usePathname();
  const { triggerToast } = useToast();

  const tabs = [
    { name: 'Library', path: '/documents' },
    { name: 'Templates', path: '/documents/templates' },
    { name: 'Signatures', path: '/documents/signatures' },
    { name: 'Shared', path: '/documents/shared' },
  ];

  return (
    <nav className="w-full bg-sage-50 border-b border-sage-200 px-4 md:px-6 py-2 flex items-center overflow-x-auto no-scrollbar">
      <div className="flex items-center space-x-1.5 whitespace-nowrap">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <Link
              key={tab.name}
              href={tab.path}
              onClick={() => {
                if (tab.name === 'Templates') {
                  triggerToast('Navigated to template page.');
                }
              }}
              className={
                isActive 
                  ? "px-3.5 py-1 rounded-full text-xs font-semibold bg-copper-200 text-[#1E2923] shadow-card transition-colors"
                  : "px-3.5 py-1 rounded-full text-xs font-medium text-sage-600 hover:bg-sage-100 transition-colors"
              }
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-sage-50 text-[#1E2923] font-body antialiased relative selection:bg-copper-200">
        <DocumentsHeader />
        <DocumentsNav />
        {children}
      </div>
    </ToastProvider>
  );
}

