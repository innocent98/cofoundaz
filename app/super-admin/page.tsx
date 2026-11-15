'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/brand/BrandLogo';
import {
  LayoutDashboard,
  Flag,
  CreditCard,
  Users,
  Shield,
  FileText,
  Lock,
  Menu,
  X,
} from 'lucide-react';
import { getAdminMe, AdminMeResponse } from '@/lib/api/admin';
import { SuperAdminOverviewView } from '@/components/super-admin/super-admin-overview-view';
import { SuperAdminFlagsView } from '@/components/super-admin/super-admin-flags-view';
import { SuperAdminBillingView } from '@/components/super-admin/super-admin-billing-view';
import { SuperAdminStaffView } from '@/components/super-admin/super-admin-staff-view';
import { SuperAdminAuditView } from '@/components/super-admin/super-admin-audit-view';
import { SuperAdminSecurityView } from '@/components/super-admin/super-admin-security-view';

type SuperAdminTab =
  | 'Overview'
  | 'Feature flags'
  | 'Billing overrides'
  | 'Staff access'
  | 'Audit log'
  | 'Security';

export default function SuperAdminPortal(): React.JSX.Element | null {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('Overview');
  const [currentStaff, setCurrentStaff] = useState<AdminMeResponse | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Authentication & Access Control:
  // On entry call GET /admin/me.
  // 200 with role: "super_admin": show console.
  // 200 with role: "admin" or 404: send to /dashboard with no message (never show "access denied").
  useEffect(() => {
    let isMounted = true;

    queueMicrotask(() => {
      void (async () => {
        try {
          const me = await getAdminMe();
          if (!isMounted) return;

          if (me?.role === 'super_admin') {
            setCurrentStaff(me);
            setIsAuthorized(true);
          } else {
            router.replace('/dashboard');
          }
        } catch {
          if (!isMounted) return;
          router.replace('/dashboard');
        } finally {
          if (isMounted) {
            setIsLoadingAuth(false);
          }
        }
      })();
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  // If loading or unauthorized, do not flash content or show access denied
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center font-body text-xs text-subtle">
        Loading console...
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center font-body text-xs text-subtle">
        404 - Not Found
      </div>
    );
  }

  const navItems: Array<{ tab: SuperAdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { tab: 'Overview', label: 'Overview', icon: LayoutDashboard },
    { tab: 'Feature flags', label: 'Feature flags', icon: Flag },
    { tab: 'Billing overrides', label: 'Billing overrides', icon: CreditCard },
    { tab: 'Staff access', label: 'Staff access', icon: Users },
    { tab: 'Audit log', label: 'Audit log', icon: FileText },
    { tab: 'Security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-surface-base flex flex-col font-body">
      {/* Persistent Console Banner across every tab */}
      <div className="bg-neutral-900 text-surface px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 tracking-wide">
        <Lock className="w-3.5 h-3.5 text-brand flex-shrink-0" />
        <span>All actions on this console are permanently logged.</span>
      </div>

      {/* Top Header Bar */}
      <header className="bg-surface border-b border-neutral-subtle sticky top-0 z-30 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-card">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen((prev) => !prev)}
            className="md:hidden p-1.5 text-subtle hover:text-main rounded-input hover:bg-surface-raised transition-colors"
            aria-label="Toggle navigation"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo & Portal Title */}
          <div className="flex items-center gap-3">
            <BrandLogo />
            <div className="h-4 w-px bg-neutral-subtle hidden md:block" />
            <span className="text-xs font-bold font-display uppercase tracking-wider text-brand hidden md:inline">
              Super Admin Console
            </span>
          </div>
        </div>

        {/* User Info & Role Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-xs font-semibold text-main">
              {currentStaff?.full_name || currentStaff?.email || 'Super Admin'}
            </div>
            <div className="text-[11px] text-subtle">{currentStaff?.email}</div>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 rounded-pill uppercase tracking-wider">
            Super admin
          </span>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Desktop Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-surface border-r border-neutral-subtle p-4 hidden md:block flex-shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => setActiveTab(item.tab)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-input transition-colors ${
                    isActive
                      ? 'bg-brand text-surface shadow-card'
                      : 'text-subtle hover:text-main hover:bg-surface-raised'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileNavOpen && (
          <div className="md:hidden bg-surface border-b border-neutral-subtle p-3 space-y-1 shadow-card animate-in fade-in duration-150">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.tab);
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-input transition-colors ${
                    isActive
                      ? 'bg-brand text-surface'
                      : 'text-subtle hover:text-main hover:bg-surface-raised'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'Overview' && <SuperAdminOverviewView />}
          {activeTab === 'Feature flags' && <SuperAdminFlagsView />}
          {activeTab === 'Billing overrides' && <SuperAdminBillingView />}
          {activeTab === 'Staff access' && <SuperAdminStaffView currentStaff={currentStaff} />}
          {activeTab === 'Audit log' && <SuperAdminAuditView />}
          {activeTab === 'Security' && <SuperAdminSecurityView />}
        </main>
      </div>
    </div>
  );
}
