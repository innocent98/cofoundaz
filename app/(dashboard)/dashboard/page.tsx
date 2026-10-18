'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { DashboardNavbar } from '@/components/dashboardnavbar';
import { InviteModal } from '@/components/team/invite-modal';
import { useWorkspace } from '@/components/workspace-context';
import { useAiDrawer } from '@/components/ai-drawer-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { KPIStrip } from '@/components/dashboard/kpi-strip';
import { CardError, CardSkeleton } from '@/components/dashboard/card-states';
import { GreetingHeader, GreetingSkeleton } from '@/components/dashboard/greeting-header';
import { CalibrationBanner } from '@/components/dashboard/calibration-banner';
import { HealthCard } from '@/components/dashboard/health-card';
import { MissionCard } from '@/components/dashboard/mission-card';
import { BriefingCard, briefingSeed } from '@/components/dashboard/briefing-card';
import { OpportunitiesCard, RisksCard } from '@/components/dashboard/risks-opportunities';
import { ActivityCard, UpcomingCard } from '@/components/dashboard/activity-upcoming';
import { useActivityFeed, useAIBriefing, useDashboardSummary } from '@/hooks/useDashboardApi';
import { announceMissionChanged } from '@/hooks/useMissionOpenCount';
import { apiClient } from '@/lib/api/client';
import { canSee } from '@/lib/nav-access';

type Toast = { kind: 'ok' | 'error'; text: string };

export default function DashboardPage() {
  const router = useRouter();
  const { workspaceName, role } = useWorkspace();
  const { openAiDrawer } = useAiDrawer();
  const { data, loading, error: summaryError, refetch } = useDashboardSummary();
  const activity = useActivityFeed();
  const { acceptAction } = useAIBriefing();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const completeTask = useCallback(
    async (id: string) => {
      try {
        await apiClient(`/missions/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'complete' }) });
        announceMissionChanged();
        await refetch();
        showToast({ kind: 'ok', text: 'Nice. Mission progress saved.' });
      } catch {
        showToast({ kind: 'error', text: 'Couldn’t save that. Try again.' });
      }
    },
    [refetch, showToast],
  );

  const onBriefingChanged = useCallback(() => {
    announceMissionChanged();
    void refetch();
  }, [refetch]);

  // First paint is skeletons, never placeholder data. A failed summary errors each card on its own.
  const showSkeleton = loading && !data;
  const startupName = data?.startup?.name ?? workspaceName;
  const restricted = data?.briefingRestricted === true;

  return (
    <div className="relative flex min-h-screen w-full min-w-0 flex-col bg-[#F7F8F6] text-[#1C201D] font-body">
      <DashboardNavbar onInvite={() => setInviteOpen(true)} />

      {toast && (
        <div
          role="status"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0F1E16] text-white px-5 py-3 rounded-modal shadow-accent shadow-black/25 inline-flex items-center gap-2.5 border border-[#1E3A29]"
        >
          {toast.kind === 'ok' && <Check className="w-4 h-4 text-[#D4A359] stroke-[3] shrink-0" />}
          <p className="text-sm font-medium text-white">{toast.text}</p>
        </div>
      )}

      <main className="flex-1 w-full min-w-0 max-w-none px-4 md:px-6 lg:px-8 pt-4 pb-12 space-y-6">
        {showSkeleton ? (
          <GreetingSkeleton />
        ) : (
          <GreetingHeader firstName={data?.greeting?.first_name} startupName={startupName} />
        )}

        {!showSkeleton && <CalibrationBanner assessmentComplete={data?.calibration?.assessment_complete} />}

        {/* TOP CARDS ROW */}
        <section className={`grid grid-cols-1 gap-6 ${restricted ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          <ErrorBoundary onRetry={refetch}>
            <HealthCard health={data?.health} loading={showSkeleton} onRetry={refetch} />
          </ErrorBoundary>
          <ErrorBoundary onRetry={refetch}>
            <MissionCard
              mission={data?.mission}
              loading={showSkeleton}
              onRetry={refetch}
              onComplete={completeTask}
              readOnly={!canSee('/mission', role)}
            />
          </ErrorBoundary>
          {!restricted && (
            <ErrorBoundary onRetry={refetch}>
              <BriefingCard
                briefing={data?.briefing}
                loading={showSkeleton}
                onRetry={refetch}
                onChanged={onBriefingChanged}
                onTellMeMore={(b) => openAiDrawer({ seed: briefingSeed(b) })}
                accept={acceptAction}
                navigate={(href) => router.push(href)}
              />
            </ErrorBoundary>
          )}
        </section>

        {/* KPI STRIP */}
        {showSkeleton ? (
          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }, (_, i) => (
              <CardSkeleton key={i} label="Loading KPI" rows={1} className="p-5" />
            ))}
          </section>
        ) : data ? (
          <KPIStrip kpis={data.kpis} onRefetch={refetch} />
        ) : (
          <CardError title="your metrics" onRetry={refetch} />
        )}

        {/* RISKS & OPPORTUNITIES (hidden for roles that cannot see the briefing) */}
        {!restricted && (
          <ErrorBoundary onRetry={refetch}>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RisksCard items={data?.risks ?? []} status={data?.risksStatus} loading={showSkeleton} onRetry={refetch} />
              <OpportunitiesCard
                items={data?.opportunities ?? []}
                status={data?.opportunitiesStatus}
                loading={showSkeleton}
                onRetry={refetch}
              />
            </section>
          </ErrorBoundary>
        )}

        {/* BOTTOM ROW */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ErrorBoundary onRetry={activity.refetch}>
            <ActivityCard
              items={activity.data}
              loading={activity.loading}
              error={activity.error !== null}
              onRetry={activity.refetch}
            />
          </ErrorBoundary>
          <ErrorBoundary onRetry={refetch}>
            {data || showSkeleton ? (
              <UpcomingCard items={data?.upcoming ?? []} loading={showSkeleton} error={data?.upcomingError ?? false} onRetry={refetch} />
            ) : (
              <CardError title="Next 7 days" onRetry={refetch} />
            )}
          </ErrorBoundary>
        </section>

        {summaryError && !data && !loading && (
          <p role="alert" className="sr-only">
            {summaryError.message}
          </p>
        )}
      </main>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} startupName={startupName} />
    </div>
  );
}
