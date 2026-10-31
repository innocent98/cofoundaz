'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { replaceUrl } from '@/lib/replace-url';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/components/sidebar-context';
import { useWorkspace } from '@/components/workspace-context';
import { ProfileTab } from '@/components/settings/profile-tab';
import { SecurityTab } from '@/components/settings/security-tab';
import { WorkspaceTab } from '@/components/settings/workspace-tab';
import { AiPreferencesTab, NotificationsTab } from '@/components/settings/link-tabs';
import { BillingTab } from '@/components/settings/billing/billing-tab';
import { Banner, Button } from '@/components/settings/ui';
import { apiErrorInfo } from '@/lib/api/api-error';
import { getSubscription, type Subscription } from '@/lib/api/billing';
import { formatDate } from '@/lib/billing-format';

const TABS = ['profile', 'security', 'workspace', 'notifications', 'ai', 'billing'] as const;
type Tab = (typeof TABS)[number];
const LABELS: Record<Tab, string> = {
  profile: 'Profile', security: 'Security', workspace: 'Workspace', notifications: 'Notifications', ai: 'AI preferences', billing: 'Billing',
};

function SettingsHub(): React.JSX.Element {
  const { openSidebar } = useSidebar();
  const { role, loading: roleLoading } = useWorkspace();
  const pathname = usePathname();
  const params = useSearchParams();

  const isFounder = role === 'founder';
  // The AI Co-Founder is a core-role feature (nav-access); everyone else has no AI preferences to set.
  const visible = TABS.filter((t) => t !== 'ai' || role === 'founder' || role === 'team_member');
  const requested = params.get('tab');
  const tab: Tab = visible.includes(requested as Tab) ? (requested as Tab) : 'profile';

  const [sub, setSub] = useState<Subscription | null>(null);
  const [subError, setSubError] = useState<string | null>(null);
  const reloadSub = useCallback(async () => {
    try {
      setSub(await getSubscription());
      setSubError(null);
    } catch (e) {
      setSubError(apiErrorInfo(e, "We couldn't load your billing.").message);
    }
  }, []);
  useEffect(() => {
    if (isFounder) {
      void (async () => {
        await reloadSub();
      })();
    }
  }, [isFounder, reloadSub]);

  const select = (t: Tab) => replaceUrl(`${pathname}?tab=${t}`);
  const pi = isFounder ? sub?.payment_issue : null;

  return (
    <div className="min-h-screen bg-surface-faint text-ink font-body antialiased">
      <header className="sticky top-0 z-40 border-b border-line px-4 md:px-8 py-3.5 flex items-center justify-between bg-white w-full">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={openSidebar}
            className="lg:hidden w-9 h-9 rounded-modal border border-line-stone bg-white text-brand-strong hover:bg-neutral-50 flex items-center justify-center shrink-0 shadow-card cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>
          <h1 className="text-sm md:text-base font-semibold tracking-tight truncate">
            <span className="text-ink-muted font-normal">Settings</span>
            <span className="text-ink-subtle font-normal"> / </span>
            {LABELS[tab]}
          </h1>
        </div>
        {isFounder && sub && (
          <button
            type="button"
            onClick={() => replaceUrl(`${pathname}?tab=billing&view=plans`)}
            className="bg-brand-tint text-brand-strong border border-brand-xd5e6dc px-4 py-1.5 rounded-full text-xs font-semibold shadow-accent cursor-pointer shrink-0"
          >
            {sub.plan.name} plan
          </button>
        )}
      </header>

      <nav aria-label="Settings sections" className="w-full bg-surface-subtle border-b border-line px-4 md:px-8 py-3">
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
          {visible.map((t) => (
            <button
              key={t}
              type="button"
              aria-current={tab === t ? 'page' : undefined}
              onClick={() => select(t)}
              className={`px-4 py-1.5 rounded-full text-xs shrink-0 cursor-pointer border ${
                tab === t
                  ? 'font-semibold bg-accent-200 text-ink border-accent-xdfc4b2 shadow-card'
                  : 'font-medium text-ink-muted border-transparent hover:bg-neutral-xefefee'
              }`}
            >
              {LABELS[t]}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {pi && tab !== 'billing' && (
          <Banner
            tone="error"
            title="Your last payment failed"
            action={<Button variant="danger" onClick={() => replaceUrl(`${pathname}?tab=billing&view=payment`)}>Fix payment</Button>}
          >
            Update your payment method to keep your workspace active, {pi.grace_days_left} {pi.grace_days_left === 1 ? 'day' : 'days'} left in
            the grace period (until {formatDate(pi.grace_ends_at)}).
          </Banner>
        )}
        {roleLoading ? null : (
          <>
            {tab === 'profile' && <ProfileTab />}
            {tab === 'security' && <SecurityTab />}
            {tab === 'workspace' && <WorkspaceTab />}
            {tab === 'notifications' && <NotificationsTab />}
            {tab === 'ai' && <AiPreferencesTab />}
            {tab === 'billing' && <BillingTab isFounder={isFounder} sub={sub} subError={subError} reloadSub={reloadSub} />}
          </>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <SettingsHub />
    </Suspense>
  );
}
