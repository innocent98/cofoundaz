'use client';

import React, { useEffect, useState } from 'react';
import { useRoadmapApi } from '@/hooks/useRoadmapApi';
import { useRoadmapReplan, ReplanPreview, ReplanApplyResult } from '@/hooks/useRoadmapReplan';
import { AlertTriangle, Sparkles, Check, CheckCircle2, ChevronDown } from 'lucide-react';
import { DateDiff, dayDelta } from '@/components/roadmap/date-diff';

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function ReplanPage() {
  const { slippedCount, refetch: refetchTree } = useRoadmapApi();
  const { history, previewReplan, applyReplan, loadHistory } = useRoadmapReplan();

  const [proposal, setProposal] = useState<ReplanPreview | null>(null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<ReplanApplyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());

  const toggleHistory = (id: string) =>
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    setApplyResult(null);
    try {
      const p = await previewReplan();
      setProposal(p);
      setAccepted(new Set(p.changes.map((c) => c.change_id))); // default: accept all
    } catch {
      setError('Could not generate a re-plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const toggle = (id: string) =>
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const apply = async () => {
    if (!proposal || accepted.size === 0) return;
    setApplying(true);
    setError(null);
    try {
      const res = await applyReplan([...accepted]);
      setApplyResult(res);
      setProposal(null);
      setAccepted(new Set());
      await refetchTree();
      await loadHistory();
    } catch {
      setError('Could not apply the re-plan. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const changes = proposal?.changes ?? [];

  // Honest, computed summary of the proposal's magnitude (no invented numbers).
  const deltas = changes.map((c) => dayDelta(c.old_due, c.new_due)).filter((d): d is number => d !== null);
  const laterCount = deltas.filter((d) => d > 0).length;
  const maxLater = deltas.length ? Math.max(0, ...deltas) : 0;
  const proposalSummary =
    changes.length === 0
      ? ''
      : `${changes.length} milestone${changes.length === 1 ? '' : 's'} adjusting` +
        (laterCount > 0 ? `, up to +${maxLater} day${maxLater === 1 ? '' : 's'} later` : '');

  return (
    <div className="flex flex-col gap-8 h-full pb-12">
      <div>
        <h2 className="text-3xl font-display font-medium text-ink tracking-tight">AI Re-Plan</h2>
        <p className="text-xs text-ink-muted mt-1.5">Review adjustments to your roadmap before applying them.</p>
      </div>

      {error && (
        <div className="bg-danger-tint border border-danger-xfad7d7 rounded-card p-3 text-xs font-semibold text-danger-600">{error}</div>
      )}

      {applyResult && (
        <div className="bg-brand-tint border border-brand-xcde1d3 rounded-modal p-4 flex items-start gap-3 shadow-card">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <div className="text-sm text-brand-mid">
            <p className="font-bold">{applyResult.summary || 'Nothing to apply'}</p>
            <p className="text-xs mt-0.5">
              {applyResult.applied.length} applied
              {applyResult.skipped.length > 0 && ` · ${applyResult.skipped.length} skipped (no longer needed)`}
            </p>
          </div>
        </div>
      )}

      {/* Drift banner — offer the flow when milestones have slipped (guide §9) */}
      {slippedCount > 0 ? (
        <div className="bg-danger-tint border border-danger-xfad7d7 rounded-modal p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white rounded-full shrink-0 shadow-card border border-danger-xfad7d7">
              <AlertTriangle className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-danger-x993a2e">
                {slippedCount} milestone{slippedCount === 1 ? '' : 's'} {slippedCount === 1 ? 'has' : 'have'} slipped. Want me to re-plan?
              </h3>
              <p className="text-xs text-danger-600 mt-1 leading-relaxed">
                Some target dates are now in the past. Let me propose a realistic shift, you choose what to accept.
              </p>
            </div>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="bg-danger-600 hover:bg-danger-x993a2e disabled:opacity-60 text-white text-xs font-bold py-2.5 px-5 rounded-card transition-colors shadow-card shrink-0 whitespace-nowrap"
          >
            {generating ? 'Generating…' : 'Generate Re-plan'}
          </button>
        </div>
      ) : (
        <div className="bg-brand-tint border border-brand-xcde1d3 rounded-modal p-6 flex items-center justify-between gap-4 shadow-card">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <p className="text-sm font-bold text-success">You&apos;re on track, no milestones have slipped.</p>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="bg-white hover:bg-surface-muted border border-brand-xcde1d3 text-brand-mid text-xs font-bold py-2 px-4 rounded-card transition-colors shrink-0 disabled:opacity-60"
          >
            {generating ? 'Checking…' : 'Check for adjustments'}
          </button>
        </div>
      )}

      {/* Proposal — only after Generate, only if there are changes */}
      {proposal && changes.length > 0 && (
        <div className="bg-white rounded-modal border border-line-soft shadow-card flex flex-col">
          <div className="p-6 border-b border-line-soft flex items-center gap-3">
            <div className="p-1.5 bg-accent-xf7eedc rounded-[6px]">
              <Sparkles className="w-5 h-5 fill-accent-700 text-accent-700" />
            </div>
            <div>
              <h3 className="font-bold text-ink">Proposed Adjustments</h3>
              <p className="text-xs text-ink-soft">
                {proposalSummary}. Review carefully, rejected items keep their current dates.
              </p>
            </div>
          </div>

          <div className="flex flex-col divide-y divide-line-soft">
            {changes.map((c) => {
              const isAccepted = accepted.has(c.change_id);
              return (
                <div key={c.change_id} className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors ${isAccepted ? 'bg-white' : 'bg-surface-ghost'}`}>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <span className="text-sm font-bold text-ink">{c.title}</span>
                    <span className="text-xs text-accent-600 font-semibold">{c.reason}</span>
                  </div>

                  <div className="flex items-center flex-1">
                    <DateDiff oldDue={c.old_due} newDue={c.new_due} />
                  </div>

                  <div className="shrink-0 flex items-center justify-end">
                    <button type="button" onClick={() => toggle(c.change_id)} className="flex items-center gap-2 cursor-pointer group">
                      <span className={`text-xs font-bold ${isAccepted ? 'text-brand-mid' : 'text-ink-soft'}`}>
                        {isAccepted ? 'Accepted' : 'Rejected'}
                      </span>
                      <div className={`relative w-12 h-6 rounded-full transition-colors ${isAccepted ? 'bg-brand-strong' : 'bg-neutral-xdce6e1'}`}>
                        <div className={`absolute top-1 bottom-1 w-4 bg-white rounded-full transition-all shadow-card ${isAccepted ? 'left-7' : 'left-1'}`} />
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 bg-surface-subtle rounded-b-modal border-t border-line-soft flex justify-end">
            <button
              onClick={apply}
              disabled={accepted.size === 0 || applying}
              className={`py-2.5 px-6 rounded-card font-bold text-xs transition-all shadow-card flex items-center gap-2 ${
                accepted.size > 0 && !applying ? 'bg-brand-strong hover:bg-brand-rail text-white' : 'bg-line-soft text-neutral-xa3b1a6 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              {applying ? 'Applying…' : `Apply ${accepted.size} change${accepted.size === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      )}

      {proposal && changes.length === 0 && (
        <div className="bg-white rounded-modal border border-line-soft shadow-card p-8 text-center">
          <p className="text-sm font-bold text-ink">No adjustments needed</p>
          <p className="text-xs text-ink-soft mt-1">Your milestone dates are all still realistic.</p>
        </div>
      )}

      {/* Re-plan history — real audit trail */}
      <div className="flex flex-col gap-4 mt-2">
        <h3 className="text-sm font-bold text-ink">Re-plan History</h3>
        {history.length === 0 ? (
          <div className="bg-white rounded-card border border-line-soft p-5 shadow-card">
            <p className="text-xs text-ink-soft italic">No re-plans applied yet.</p>
          </div>
        ) : (
          history.map((h) => {
            const open = expandedHistory.has(h.id);
            return (
              <div key={h.id} className="bg-white rounded-card border border-line-soft shadow-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleHistory(h.id)}
                  aria-expanded={open}
                  aria-controls={`replan-history-${h.id}`}
                  className="w-full p-5 flex items-center justify-between gap-4 text-left hover:bg-surface-faint transition-colors"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-xs font-bold text-ink">
                      {h.summary} · {fmtDateTime(h.created_at)}
                    </span>
                    <span className="text-[11px] text-ink-soft truncate">
                      {h.applied_by?.name ? `By ${h.applied_by.name}` : 'Applied'},{' '}
                      {h.changes.map((c) => c.title).join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="bg-surface-muted px-2 py-1 rounded text-[10px] font-bold text-ink-muted">
                      {h.change_count} change{h.change_count === 1 ? '' : 's'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-ink-subtle transition-transform ${open ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {open && (
                  <div id={`replan-history-${h.id}`} className="border-t border-line-soft divide-y divide-neutral-xf2f2ee">
                    {h.changes.map((c, i) => (
                      <div key={`${h.id}-${c.milestone_id}-${i}`} className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <span className="text-xs font-bold text-ink">{c.title}</span>
                          {c.reason && <span className="text-[11px] text-accent-600 font-semibold">{c.reason}</span>}
                        </div>
                        <DateDiff oldDue={c.old_due} newDue={c.new_due} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
