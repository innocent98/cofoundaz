'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { useSmokeTests, type SmokeTest } from '@/hooks/useSmokeTests';
import { useValidationShell } from '../layout';
import { SmokeBuilder } from '@/components/validation/SmokeBuilder';
import { SmokeResults } from '@/components/validation/SmokeResults';
import { ConfirmDelete } from '@/components/validation/ConfirmDelete';
import { deleteWarning } from '@/lib/validation-format';

const STATUS_LABEL: Record<string, string> = { draft: 'Draft', live: 'Live', ended: 'Ended' };

/** Real waitlist emails only: stats.signups also counts hand-entered numbers, which are not emails. */
function waitlistSize(test: SmokeTest, statSignups: number | undefined): number {
  if (!test.slug || statSignups === undefined) return 0;
  return Math.max(0, statSignups - test.manualSignups);
}

export default function SmokeTestsPage() {
  return (
    <Suspense fallback={null}>
      <SmokeTestsView />
    </Suspense>
  );
}

function SmokeTestsView() {
  const router = useRouter();
  const search = useSearchParams();
  const { tests, statsById, loading, error, refetch, create, setStatus, remove, updateMetrics, getStats, getSignups } = useSmokeTests();
  const { triggerToast, pendingDraft, setPendingDraft } = useValidationShell();

  const [mode, setMode] = useState<'list' | 'builder' | 'results'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<SmokeTest | null>(null);
  // The AI draft we are building from. Taken from the shell once, then ours.
  const [draft, setDraft] = useState(pendingDraft);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    queueMicrotask(() => setOrigin(window.location.origin));
  }, []);

  // A draft from "Design experiment" opens the builder pre-filled.
  useEffect(() => {
    if (!pendingDraft) return;
    queueMicrotask(() => {
      setDraft(pendingDraft);
      setPendingDraft(null);
      setMode('builder');
    });
  }, [pendingDraft, setPendingDraft]);

  // Deep link: ?test={experiment_id} (the signup-milestone notification).
  const testParam = search.get('test');
  useEffect(() => {
    if (!testParam) return;
    queueMicrotask(() => {
      setSelectedId(testParam);
      setMode('results');
    });
  }, [testParam]);

  const selected = tests.find((t) => t.id === selectedId) ?? null;
  const builderApi = useMemo(
    () => ({
      create,
      publish: (id: string) => setStatus(id, 'live'),
    }),
    [create, setStatus]
  );
  const resultsApi = useMemo(
    () => ({ getStats, getSignups, updateMetrics, setStatus: (id: string, s: 'live' | 'ended') => setStatus(id, s) }),
    [getStats, getSignups, updateMetrics, setStatus]
  );

  const toList = () => {
    setMode('list');
    setSelectedId(null);
    setDraft(null);
    if (testParam) router.replace('/validation/smoke-tests');
  };

  const deleteDialog = toDelete && (
    <ConfirmDelete
      title={`Delete "${toDelete.name}"?`}
      warning={deleteWarning('experiment', { signups: waitlistSize(toDelete, statsById[toDelete.id]?.signups) })}
      onConfirm={async () => {
        await remove(toDelete.id);
        triggerToast('Smoke test deleted');
        toList();
      }}
      onClose={() => setToDelete(null)}
    />
  );

  if (mode === 'builder') {
    return (
      <SmokeBuilder
        draft={draft}
        origin={origin}
        api={builderApi}
        notify={triggerToast}
        onCancel={toList}
        onDone={(t, published) => {
          triggerToast(published ? 'Published. Your page is live.' : 'Saved as a draft.');
          setDraft(null);
          setSelectedId(t.id);
          setMode('results');
        }}
      />
    );
  }

  if (mode === 'results') {
    if (!selected) {
      return loading ? (
        <div className="flex items-center justify-center gap-2 text-neutral-500 py-16">
          <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Loading…</span>
        </div>
      ) : (
        <div className="bg-white rounded-modal p-10 border border-dashed border-neutral-200 text-center space-y-3">
          <p className="text-sm text-neutral-500">That smoke test is no longer available.</p>
          <button onClick={toList} className="text-sm font-bold text-brand-strong underline cursor-pointer">Back to smoke tests</button>
        </div>
      );
    }
    return (
      <>
        <SmokeResults test={selected} origin={origin} api={resultsApi} notify={triggerToast} onBack={toList} onDelete={() => setToDelete(selected)} />
        {deleteDialog}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-ink tracking-tight">Smoke tests</h2>
          <p className="text-sm text-ink-muted mt-1.5">Validate demand with simple landing pages.</p>
        </div>
        <button
          onClick={() => { setDraft(null); setMode('builder'); }}
          className="bg-brand-strong hover:bg-brand-rail text-white px-5 py-2.5 rounded-card font-bold text-sm flex items-center justify-center gap-2 shadow-card cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> <span>New smoke test</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 bg-danger-xfbeae7 border border-danger-xf0c9c2 rounded-card px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-danger-deep"><AlertTriangle className="w-4 h-4 shrink-0" /> {error}</span>
          <button onClick={() => { void refetch(); }} className="text-xs font-semibold text-danger-deep underline cursor-pointer">Retry</button>
        </div>
      )}

      {loading && tests.length === 0 ? (
        <div className="flex items-center justify-center gap-2 text-neutral-500 py-16"><Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Loading smoke tests…</span></div>
      ) : tests.length === 0 ? (
        <div className="bg-white rounded-modal p-10 border border-dashed border-neutral-200 text-center">
          <p className="text-sm text-neutral-500">No smoke tests yet. Create one to put a landing page online and track its conversion.</p>
        </div>
      ) : (
        <div className="bg-white rounded-modal border border-line-soft shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-surface-ghost border-b border-line-soft">
                  <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-ink-soft uppercase w-1/3">Test name</th>
                  <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-ink-soft uppercase">Status</th>
                  <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-ink-soft uppercase text-right">Visits</th>
                  <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-ink-soft uppercase text-right">Conversion</th>
                  <th className="py-3.5 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-faint">
                {tests.map((test) => {
                  const isLive = test.status === 'live';
                  const st = statsById[test.id];
                  return (
                    <tr
                      key={test.id}
                      tabIndex={0}
                      onClick={() => { setSelectedId(test.id); setMode('results'); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedId(test.id); setMode('results'); } }}
                      className="hover:bg-neutral-xfaf9f5 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6 text-sm font-bold text-ink">
                        {test.name}
                        {test.slug && <div className="text-xs font-medium text-ink-muted mt-0.5">/p/{test.slug}</div>}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${isLive ? 'bg-success-100 text-success-800' : test.status === 'ended' ? 'bg-line-faint text-ink-muted' : 'bg-warning-100 text-warning-800'}`}>
                          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-brand-x2e7a56 mr-1.5 animate-pulse" />}
                          {STATUS_LABEL[test.status] ?? test.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-ink text-right">{st ? st.visits : '-'}</td>
                      <td className="py-4 px-6 text-sm text-right">
                        <span className="font-bold text-ink">{st ? `${st.conversion}%` : '-'}</span>
                        <span className="text-ink-subtle text-xs ml-1">/ {test.targetConversion}%</span>
                      </td>
                      <td className="py-4 px-6 text-right"><ChevronRight className="w-5 h-5 text-info-xa0aaba group-hover:text-brand-strong inline-block" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
