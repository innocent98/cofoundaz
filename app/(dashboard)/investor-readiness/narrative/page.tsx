"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { useWorkspace } from "@/components/workspace-context";
import { useNarrative } from "@/hooks/useNarrative";
import type { Finding, NarrativeCheck, Severity } from "@/lib/api/readiness";
import { checkErrorCopy, formatMinor } from "@/lib/readiness-format";
import { formatWhen, LoadFailed, LoadingBlock, ReadOnlyNote } from "../_components/states";

const SEVERITY_STYLE: Record<Severity, { card: string; label: string; icon: React.ReactNode }> = {
  high: { card: "border-danger-200 bg-danger-50/50", label: "Needs fixing", icon: <AlertTriangle className="h-4 w-4 text-danger-600" /> },
  medium: { card: "border-warning-500/40 bg-warning-50", label: "Check this", icon: <AlertTriangle className="h-4 w-4 text-warning" /> },
  info: { card: "border-neutral-200 bg-neutral-50", label: "Could not verify", icon: <Info className="h-4 w-4 text-neutral-500" /> },
  ok: { card: "border-success-500/30 bg-white", label: "Consistent", icon: <CheckCircle2 className="h-4 w-4 text-success" /> },
};

export default function NarrativePage() {
  const { role } = useWorkspace();
  const canWrite = role === "founder";
  const n = useNarrative(canWrite);

  if (n.loading && !n.draft) return <LoadingBlock label="Loading your narrative" />;
  if (n.error && !n.draft) return <LoadFailed error={n.error} onRetry={n.reload} what="your narrative" />;
  if (!n.draft) return null;

  const max = n.draft.max_chars;
  const check = n.check;
  const usesAi = !check || check.stale;
  const inFlight = n.checking || check?.status === "queued" || check?.status === "running";
  const canCheck = n.draft.can_check && !inFlight;

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-5xl mx-auto pt-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-neutral-900">Narrative consistency</h1>
        <p className="text-sm text-neutral-500">Ensure your deck, your model, and your script tell the exact same story.</p>
      </div>

      {!canWrite && <ReadOnlyNote>You can read the narrative and its check. Only the founder can edit it or run a check.</ReadOnlyNote>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-white rounded-modal border border-neutral-200 shadow-card p-6 flex flex-col space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-sm text-neutral-900">The Financial Story Draft</h3>
            {canWrite && <SaveStatus state={n.saveState} updatedAt={n.draft.updated_at} />}
          </div>

          <label htmlFor="narrative-body" className="sr-only">
            Financial story draft
          </label>
          <textarea
            id="narrative-body"
            value={n.body}
            readOnly={!canWrite}
            maxLength={max}
            onChange={(e) => n.edit(e.target.value)}
            onBlur={() => void n.flush()}
            placeholder={canWrite ? "Draft your financial narrative here: your revenue, burn, runway, team and what the money is for." : "The founder has not written a narrative yet."}
            className="w-full min-h-[320px] resize-y bg-neutral-50 border border-neutral-200 rounded-card p-4 text-sm text-neutral-900 focus:outline-none focus:border-brand-hover transition-colors leading-relaxed read-only:opacity-90"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
            <span>
              {n.body.length.toLocaleString()} / {max.toLocaleString()} characters
            </span>
            {n.saveError && (
              <span role="alert" className="text-danger-700">
                {n.saveError}
              </span>
            )}
          </div>

          {canWrite && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
              <p className="text-xs text-neutral-500 max-w-sm">
                We read the numbers out of your latest reviewed deck and this draft, then compare them with your books, model, team and funding round.
              </p>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={() => void n.runCheck()}
                  disabled={!canCheck}
                  className="rounded-card bg-accent-600 px-4 py-2 text-sm font-semibold text-white shadow-card transition-colors hover:bg-accent-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {inFlight && <Loader2 className="h-4 w-4 animate-spin" />}
                  {inFlight ? "Checking…" : "Check my narrative"}
                </button>
                {!inFlight && n.draft.can_check && <span className="text-[11px] text-neutral-500">{usesAi ? "Uses AI" : "No AI used if nothing changed"}</span>}
                {!n.draft.can_check && <span className="text-[11px] text-neutral-500">Write your narrative or have your pitch deck reviewed first.</span>}
              </div>
            </div>
          )}
          {n.checkError && (
            <p role="alert" className="text-sm text-danger-700">
              {n.checkError}
            </p>
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          <Results check={check} inFlight={inFlight} slow={n.slow} reused={n.reusedNote} onResume={n.resumePolling} />
        </div>
      </div>
    </div>
  );
}

function SaveStatus({ state, updatedAt }: { state: string; updatedAt: string | null }) {
  let text = "";
  if (state === "saving") text = "Saving…";
  else if (state === "dirty") text = "Unsaved changes";
  else if (state === "error") text = "Not saved";
  else if (state === "saved") text = "Saved";
  else if (updatedAt) text = `Last saved ${formatWhen(updatedAt)}`;
  return (
    <span role="status" className={`text-xs ${state === "error" ? "text-danger-700" : "text-neutral-500"}`}>
      {text}
    </span>
  );
}

function Results({ check, inFlight, slow, reused, onResume }: { check: NarrativeCheck | null; inFlight: boolean; slow: boolean; reused: boolean; onResume: () => void }) {
  const header = (
    <h3 className="font-semibold text-sm text-neutral-900 px-1 flex items-center gap-2">
      <AlertTriangle className="w-4 h-4 text-warning" />
      Discrepancies
    </h3>
  );

  if (inFlight && (!check || check.status === "queued" || check.status === "running")) {
    return (
      <>
        {header}
        <div role="status" className="rounded-modal border border-neutral-200 bg-white p-6 text-sm text-neutral-700 space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-brand-hover" /> Reading the numbers in your deck and draft…
          </div>
          {slow && (
            <p className="text-xs text-neutral-500">
              This is taking longer than usual.{" "}
              <button onClick={onResume} className="font-semibold underline">
                Check again
              </button>
            </p>
          )}
        </div>
      </>
    );
  }

  if (!check) {
    return (
      <>
        {header}
        <div className="bg-neutral-50 rounded-modal border border-neutral-200/50 p-6 text-center text-neutral-500 text-sm">
          No check yet. Run one to compare your story with your numbers.
        </div>
      </>
    );
  }

  if (check.status === "failed") {
    return (
      <>
        {header}
        <div role="alert" className="rounded-modal border border-danger-200 bg-danger-50/60 p-5 text-sm text-neutral-800">
          {checkErrorCopy(check.error)}
        </div>
      </>
    );
  }

  const aligned = check.counts.high === 0 && check.counts.medium === 0 && check.counts.ok > 0;
  return (
    <>
      {header}
      {check.stale && (
        <div role="status" className="rounded-card border border-warning-500/40 bg-warning-50 px-4 py-2 text-xs text-neutral-800">
          Your narrative changed since this check. Check again.
        </div>
      )}
      {check.error === "deck_unavailable" && (
        <div role="status" className="rounded-card border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-700">
          The reviewed deck&apos;s file was deleted, so only your draft was checked.
        </div>
      )}
      {reused && <p className="text-[11px] text-neutral-500 px-1">No AI used: your text had not changed. Verdicts use today&apos;s numbers.</p>}
      {check.checked_at && <p className="text-[11px] text-neutral-500 px-1">Checked {formatWhen(check.checked_at)}</p>}

      {check.findings.length === 0 && (
        <div className="bg-neutral-50 rounded-modal border border-neutral-200/50 p-6 text-center text-neutral-500 text-sm">
          We found no numbers to compare. Add figures like MRR, burn or your raise to your draft.
        </div>
      )}
      {aligned && <p className="px-1 text-sm font-semibold text-success">Your narrative is consistent with your numbers.</p>}

      {check.findings.map((f, i) => (
        <FindingCard key={`${f.metric}-${f.kind}-${i}`} finding={f} />
      ))}

      {check.use_of_funds.length > 0 && (
        <div className="bg-white rounded-modal border border-neutral-200 shadow-card p-4 space-y-2">
          <h4 className="text-sm font-semibold text-neutral-900">Use of funds we found</h4>
          <ul className="space-y-1.5">
            {check.use_of_funds.map((u, i) => (
              <li key={i} className="text-xs text-neutral-700">
                <span className="font-medium">{u.label}</span>
                {u.percent !== null ? ` · ${u.percent}%` : ""}
                {u.amount_minor !== null ? ` · ${formatMinor(u.amount_minor, "NGN")}` : ""}
                <span className="text-neutral-400"> · from your {u.source}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const s = SEVERITY_STYLE[finding.severity];
  return (
    <div className={`rounded-modal border shadow-card p-4 space-y-2 ${s.card}`}>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
        {s.icon}
        {s.label}
      </div>
      <p className="text-sm font-semibold text-neutral-900 leading-snug">{finding.message}</p>
      {finding.claim?.quote && <p className="text-xs italic text-neutral-500">&quot;{finding.claim.quote}&quot;</p>}
    </div>
  );
}
