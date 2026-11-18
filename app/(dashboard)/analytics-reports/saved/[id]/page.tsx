"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Pencil, Play, Share2 } from "lucide-react";
import {
  exportReport,
  getReport,
  getRun,
  listRuns,
  startRun,
  toAnalyticsError,
  type Report,
  type Run,
} from "@/lib/api/analytics";
import { asOfLabel, dateTimeLabel, lockedHubLabels, periodLabel, rangeLabel } from "@/lib/analytics-format";
import { useAnalyticsResource } from "@/hooks/useAnalyticsResource";
import { useToast } from "../../ToastContext";
import { useAnalyticsAccess } from "../../_components/access";
import { ExportMenu } from "../../_components/export-menu";
import { RunResults } from "../../_components/run-view";
import { ShareDialog } from "../../_components/share-dialog";
import { EmptyBlock, ErrorBlock, LockedTile, ResourceGate, SkeletonRows, StatusChip, cardCls, darkBtn, secondaryBtn } from "../../_components/ui";

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const loadReport = useCallback(() => getReport(id), [id]);
  const report = useAnalyticsResource<Report>(id ? loadReport : null);

  return (
    <div className="space-y-6 animate-fadeIn">
      <Link href="/analytics-reports/saved" className="inline-flex items-center gap-1 max-md:min-h-11 text-xs font-bold text-neutral-500 hover:text-neutral-800">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> All reports
      </Link>
      <ResourceGate resource={report} what="report" skeleton={<SkeletonRows rows={3} label="Loading report" />}>
        {(r) => <ReportBody report={r} onShared={() => void report.reload()} />}
      </ResourceGate>
    </div>
  );
}

function ReportBody({ report, onShared }: { report: Report; onShared: () => void }) {
  const { triggerToast } = useToast();
  const access = useAnalyticsAccess();
  const loadRuns = useCallback(() => listRuns(report.id), [report.id]);
  const runs = useAnalyticsResource<Run[]>(loadRuns);
  const [selected, setSelected] = useState<string | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [runState, setRunState] = useState<"idle" | "loading" | "error">("idle");
  const [starting, setStarting] = useState(false);
  const [retry, setRetry] = useState(0);
  const [allRuns, setAllRuns] = useState(false);
  const [sharing, setSharing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const readyRuns = (runs.data ?? []).filter((r) => r.status === "ready");
  const runId = selected ?? readyRuns[0]?.id ?? null;
  const locked = lockedHubLabels(report.blocks);

  // Load the chosen run's frozen snapshot.
  useEffect(() => {
    if (!runId) return;
    let live = true;
    queueMicrotask(() => {
      if (!live) return;
      setRunState("loading");
      getRun(report.id, runId)
        .then((r) => {
          if (!live) return;
          setRun(r);
          setRunState("idle");
        })
        .catch(() => live && setRunState("error"));
    });
    return () => {
      live = false;
    };
  }, [report.id, runId, retry]);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  /** Guide: poll the run row every 1-2 s until ready or failed; never the job. */
  const follow = (newId: string, started: number) => {
    pollRef.current = setTimeout(async () => {
      try {
        const r = await getRun(report.id, newId);
        // Left the page while the request was in flight: no reschedule, no toast elsewhere.
        if (!mountedRef.current) return;
        if (r.status === "pending" && Date.now() - started < 120_000) return follow(newId, started);
        setStarting(false);
        await runs.reload();
        if (r.status === "ready") {
          setSelected(r.id);
          triggerToast("Report run. The numbers are frozen as of now.");
        } else if (r.status === "failed") {
          triggerToast(r.error || "The run failed. Try again.", "error");
        } else {
          triggerToast("Still running. Check back in a minute.", "error");
        }
      } catch (err) {
        if (!mountedRef.current) return;
        setStarting(false);
        triggerToast(toAnalyticsError(err, "Couldn't check the run. Reload the page.").message, "error");
      }
    }, 1500);
  };

  const runNow = async () => {
    setStarting(true);
    try {
      const s = await startRun(report.id);
      follow(s.run_id, Date.now());
    } catch (err) {
      setStarting(false);
      triggerToast(toAnalyticsError(err, "Couldn't run the report. Try again.").message, "error");
    }
  };

  const exportOptions = access.canStartRun
    ? [
        { label: "PDF (runs it now)", start: () => exportReport(report.id, "pdf") },
        { label: "Spreadsheet, XLSX (runs it now)", start: () => exportReport(report.id, "xlsx") },
      ]
    : runId
      ? [
          { label: "PDF of the selected run", start: () => exportReport(report.id, "pdf", runId) },
          { label: "Spreadsheet (XLSX) of the selected run", start: () => exportReport(report.id, "xlsx", runId) },
        ]
      : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-3xl font-display font-semibold text-neutral-900 break-words">{report.name}</h1>
            {report.shared_with_me && <StatusChip label="Shared with you" className="bg-brand-50 text-brand-800 border-brand-200" />}
          </div>
          {report.description && <p className="text-sm text-neutral-600">{report.description}</p>}
          <p className="text-xs text-neutral-500 mt-1">
            By {report.owner.name || "Unnamed"} · {report.block_count} blocks · default period {rangeLabel(report.default_range.range)}
            {report.share_count ? ` · shared with ${report.share_count}` : ""}
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-start gap-2">
          {report.can_edit && (
            <Link href={`/analytics-reports/builder/${report.id}`} className={secondaryBtn}>
              <Pencil className="w-4 h-4" aria-hidden="true" /> Edit
            </Link>
          )}
          {report.can_share && (
            <button type="button" className={secondaryBtn} onClick={() => setSharing(true)}>
              <Share2 className="w-4 h-4" aria-hidden="true" /> Share
            </button>
          )}
          {access.canStartRun && (
            <button type="button" className={darkBtn} disabled={starting} onClick={() => void runNow()}>
              {starting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
              {starting ? "Running" : "Run now"}
            </button>
          )}
          {access.canExport && (
            <ExportMenu
              options={exportOptions}
              disabled={exportOptions.length === 0}
              disabledReason={exportOptions.length === 0 ? "Exports need a finished run. Ask the founder to run this report." : undefined}
              note={!access.canStartRun && locked.length > 0 ? `Blocks outside your hubs (${locked.join(", ")}) will be locked in the file.` : undefined}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-6">
        <section aria-labelledby="runs-h" className={`${cardCls} p-4 space-y-3 self-start`}>
          <h2 id="runs-h" className="text-sm font-bold text-neutral-700">
            Runs
          </h2>
          {runs.status === "loading" && <SkeletonRows rows={2} label="Loading runs" />}
          {runs.status === "error" && <ErrorBlock message={runs.error ?? "Couldn't load runs."} onRetry={() => void runs.reload()} />}
          {runs.status === "ready" && (runs.data?.length ?? 0) === 0 && <p className="text-xs text-neutral-500">Not run yet.</p>}
          {runs.status === "ready" && (runs.data?.length ?? 0) > 0 && (
            <ul className="space-y-1.5">
              {(allRuns ? runs.data! : runs.data!.slice(0, 5)).map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={r.status !== "ready"}
                    aria-current={r.id === runId ? "true" : undefined}
                    onClick={() => setSelected(r.id)}
                    className={`w-full text-left rounded-input px-3 py-2 max-md:min-h-11 text-xs border transition-colors ${
                      r.id === runId ? "bg-accent-100 border-accent-200 text-ink" : "bg-white border-neutral-200 hover:bg-neutral-50"
                    } disabled:cursor-default`}
                  >
                    <span className="block font-semibold">{dateTimeLabel(r.as_of ?? r.created_at)}</span>
                    <span className="block text-neutral-500">
                      {r.status === "ready" ? `${r.run_by?.name || "Someone"} · ${periodLabel(r.period)}` : r.status === "failed" ? r.error || "Failed" : "Running…"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {runs.status === "ready" && (runs.data?.length ?? 0) > 5 && (
            <button type="button" className="text-xs font-bold text-brand-800 hover:underline max-md:min-h-11" aria-expanded={allRuns} onClick={() => setAllRuns((v) => !v)}>
              {allRuns ? "Show fewer runs" : `Show all ${runs.data!.length} runs`}
            </button>
          )}
          <p className="text-[11px] text-neutral-500">Runs are kept 90 days. A run&apos;s numbers never change.</p>
        </section>

        <section aria-labelledby="snap-h" className="space-y-4 min-w-0">
          {!runId ? (
            <div className={`${cardCls}`}>
              <EmptyBlock
                title="No numbers frozen yet"
                body={
                  access.canStartRun
                    ? "Run the report to freeze its numbers. You can then export or share that run."
                    : "No one has run this report yet. Ask the founder to run it."
                }
              >
                {access.canStartRun && (
                  <button type="button" className={darkBtn} disabled={starting} onClick={() => void runNow()}>
                    <Play className="w-4 h-4" aria-hidden="true" /> Run now
                  </button>
                )}
              </EmptyBlock>
              {locked.length > 0 && (
                <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {report.blocks.filter((b) => b.locked).map((b) => (b.locked ? <LockedTile key={b.id} needsLabel={b.needs_label} compact /> : null))}
                </div>
              )}
            </div>
          ) : runState === "loading" || !run || run.id !== runId ? (
            runState === "error" ? (
              <ErrorBlock message="Couldn't load this run. Try again." onRetry={() => setRetry((n) => n + 1)} />
            ) : (
              <SkeletonRows rows={3} label="Loading run" />
            )
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 id="snap-h" className="text-lg font-display font-semibold text-neutral-900">
                  {periodLabel(run.period)}
                </h2>
                <p className="text-xs text-neutral-500">
                  Numbers {asOfLabel(run.as_of)}, run by {run.run_by?.name || "someone"}
                </p>
              </div>
              <RunResults results={run.snapshot?.results ?? []} />
            </>
          )}
        </section>
      </div>

      {sharing && (
        <ShareDialog
          reportId={report.id}
          reportName={report.name}
          onClose={() => setSharing(false)}
          onSaved={() => {
            setSharing(false);
            onShared();
          }}
        />
      )}
    </div>
  );
}
