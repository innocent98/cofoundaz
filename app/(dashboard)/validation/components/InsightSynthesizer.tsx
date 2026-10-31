'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { replaceUrl } from '@/lib/replace-url';
import { History, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { ModalDialog } from '@/components/modal-dialog';
import { ConfirmDelete } from '@/components/validation/ConfirmDelete';
import { InsightReport } from '@/components/validation/InsightReport';
import { useInsights } from '@/hooks/useInsights';
import { apiErrorInfo } from '@/lib/api/api-error';
import type { InsightSource, RawInsight } from '@/lib/api/validation';
import { insightInputsLine } from '@/lib/validation-format';
import { useToast } from '../layout';

type Panel =
  | { view: 'loading'; label: string }
  | { view: 'empty'; message: string }
  | { view: 'error'; message: string }
  | { view: 'report'; insight: RawInsight }
  | { view: 'history'; items: RawInsight[] };

const SOURCE_LABEL: Record<InsightSource, string> = { interviews: 'Interviews', surveys: 'Surveys', feedback: 'Feedback', all: 'All sources' };

/**
 * "Synthesize insights" on Interviews (source=interviews) and Surveys (source=surveys).
 * Starts the job, polls it, shows the stored report with per-suggestion Apply, and keeps a
 * history. `?insight={id}` (the "New pattern detected" notification) opens that report.
 */
export function InsightSynthesizer({ source }: { source: InsightSource }) {
  return (
    <Suspense fallback={null}>
      <Inner source={source} />
    </Suspense>
  );
}

function Inner({ source }: { source: InsightSource }) {
  const { triggerToast } = useToast();
  const pathname = usePathname();
  const search = useSearchParams();
  const { synthesizing, synthesize, history, read, remove, apply } = useInsights(source);

  const [panel, setPanel] = useState<Panel | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [goneIds, setGoneIds] = useState<ReadonlySet<string>>(new Set());
  const [toDelete, setToDelete] = useState<RawInsight | null>(null);

  const close = useCallback(() => {
    setPanel(null);
    if (search.get('insight')) replaceUrl(pathname);
  }, [pathname, search]);

  const openReport = useCallback(
    async (id: string) => {
      setPanel({ view: 'loading', label: 'Loading the report…' });
      try {
        setPanel({ view: 'report', insight: await read(id) });
      } catch (err) {
        const info = apiErrorInfo(err, 'Could not load that report.');
        setPanel({ view: 'error', message: info.status === 404 ? 'That report no longer exists.' : info.message });
      }
    },
    [read]
  );

  const openHistory = useCallback(async () => {
    setPanel({ view: 'loading', label: 'Loading past reports…' });
    try {
      setPanel({ view: 'history', items: await history() });
    } catch (err) {
      setPanel({ view: 'error', message: apiErrorInfo(err, 'Could not load past reports.').message });
    }
  }, [history]);

  // Deep link from the notification: ?insight={insight_id}.
  const linked = search.get('insight');
  useEffect(() => {
    if (!linked) return;
    queueMicrotask(() => {
      void openReport(linked);
    });
  }, [linked, openReport]);

  const onSynthesize = async () => {
    setPanel({ view: 'loading', label: 'Synthesizing your customer evidence…' });
    const out = await synthesize();
    if (out.ok) {
      await openReport(out.insightId);
    } else if (out.kind === 'empty') {
      setPanel({ view: 'empty', message: out.message });
    } else {
      setPanel({ view: 'error', message: out.message });
    }
  };

  const onApply = async (insight: RawInsight, suggestionId: string) => {
    setApplyingId(suggestionId);
    const out = await apply(insight.id, suggestionId);
    setApplyingId(null);
    if (out.ok) {
      setPanel({ view: 'report', insight: out.insight });
      triggerToast(`Assumption moved to ${out.assumption.status}.`);
    } else if (out.kind === 'already') {
      triggerToast(out.message);
      await openReport(insight.id);
    } else if (out.kind === 'gone') {
      setGoneIds((prev) => new Set(prev).add(suggestionId));
    } else {
      triggerToast(out.message);
    }
  };

  const deleteReport = async (insight: RawInsight) => {
    await remove(insight.id);
    triggerToast('Report deleted');
    await openHistory();
  };

  const btn =
    'px-4 py-2.5 rounded-card font-bold text-sm transition-colors flex items-center gap-2 shadow-card cursor-pointer disabled:opacity-60';

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onSynthesize}
          disabled={synthesizing}
          className={`${btn} bg-accent-xfdf4e3 hover:bg-accent-xf5ecdc text-accent-700 border border-accent-200`}
        >
          {synthesizing ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Sparkles className="w-4 h-4 fill-accent-700" aria-hidden="true" />}
          <span>{synthesizing ? 'Synthesizing…' : 'Synthesize insights'}</span>
        </button>
        <button type="button" onClick={openHistory} className={`${btn} bg-white hover:bg-neutral-50 text-ink-muted border border-line-soft`}>
          <History className="w-4 h-4" aria-hidden="true" />
          <span>Past reports</span>
        </button>
      </div>

      {panel && (
        <ModalDialog
          label="AI insights"
          // Escape in the delete confirm must not also close the drawer behind it.
          onClose={() => {
            if (!toDelete) close();
          }}
          overlayClassName="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-sm"
          className="w-full max-w-md bg-white h-full shadow-accent flex flex-col outline-none"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-line-soft bg-surface-subtle">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-700 fill-accent-700" aria-hidden="true" />
              <h2 className="text-lg font-display font-bold text-ink">
                {panel.view === 'history' ? 'Past reports' : 'AI insights'}
              </h2>
            </div>
            <button type="button" onClick={close} className="text-sm font-bold text-ink-muted hover:text-ink cursor-pointer">
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {panel.view === 'loading' && (
              <div role="status" className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-12 h-12 rounded-full border-4 border-accent-xfdf4e3 border-t-[var(--color-accent-500)] animate-spin" />
                <div>
                  <h3 className="font-bold text-ink">{panel.label}</h3>
                  <p className="text-sm text-ink-muted mt-1">This can take up to a minute.</p>
                </div>
              </div>
            )}

            {panel.view === 'empty' && (
              <div data-testid="insight-empty" className="border border-dashed border-line-soft rounded-card p-6 text-center">
                <p className="text-sm text-ink-muted">{panel.message}</p>
              </div>
            )}

            {panel.view === 'error' && (
              <p role="alert" className="text-sm font-semibold text-danger-deep">
                {panel.message}
              </p>
            )}

            {panel.view === 'report' && (
              <InsightReport
                insight={panel.insight}
                applyingId={applyingId}
                goneIds={goneIds}
                onApply={(sid) => onApply(panel.insight, sid)}
                onDelete={() => setToDelete(panel.insight)}
              />
            )}

            {panel.view === 'history' &&
              (panel.items.length === 0 ? (
                <p className="text-sm text-ink-muted">No reports yet. Run “Synthesize insights” to create one.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {panel.items.map((it) => (
                    <li key={it.id} className="border border-line-soft rounded-card p-3 flex items-center justify-between gap-3">
                      <button type="button" onClick={() => openReport(it.id)} className="text-left min-w-0 flex-1 cursor-pointer">
                        <span className="block text-sm font-bold text-ink truncate">
                          {SOURCE_LABEL[it.source] ?? it.source} · {new Date(it.created_at).toLocaleDateString()}
                        </span>
                        <span className="block text-xs text-ink-muted">
                          {insightInputsLine(it.inputs)} · {it.patterns.length} {it.patterns.length === 1 ? 'pattern' : 'patterns'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setToDelete(it)}
                        aria-label={`Delete report from ${new Date(it.created_at).toLocaleDateString()}`}
                        className="p-1.5 rounded-input text-neutral-400 hover:text-danger-600 hover:bg-neutral-100 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
          </div>
        </ModalDialog>
      )}

      {toDelete && (
        <ConfirmDelete
          title="Delete this report?"
          warning="The report is removed. Assumptions you already changed stay as they are."
          onConfirm={() => deleteReport(toDelete)}
          onClose={() => setToDelete(null)}
        />
      )}
    </>
  );
}
