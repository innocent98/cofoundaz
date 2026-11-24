"use client";

import React, { useCallback, useDeferredValue, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Plus, Search, Share2, Trash2 } from "lucide-react";
import { deleteReport, duplicateReport, listReports, toAnalyticsError, type ReportSort, type ReportSummary } from "@/lib/api/analytics";
import { dateTimeLabel } from "@/lib/analytics-format";
import { useAnalyticsResource } from "@/hooks/useAnalyticsResource";
import { useToast } from "../ToastContext";
import { useAnalyticsAccess } from "../_components/access";
import { ShareDialog } from "../_components/share-dialog";
import {
  ConfirmDialog,
  EmptyBlock,
  PageHeader,
  ResourceGate,
  SkeletonRows,
  StatusChip,
  cardCls,
  dangerLinkBtn,
  darkBtn,
  inputCls,
  linkBtn,
} from "../_components/ui";

function LastRun({ r }: { r: ReportSummary }) {
  if (!r.last_run) return <span className="text-neutral-400">Never run</span>;
  if (r.last_run.status === "failed") return <StatusChip label="Last run failed" className="bg-danger-50 text-danger-700 border-danger-200" />;
  if (r.last_run.status === "pending") return <span className="text-neutral-500">Running…</span>;
  return <span>{dateTimeLabel(r.last_run.as_of ?? r.last_run.created_at)}</span>;
}

export default function SavedReportsPage() {
  const router = useRouter();
  const { triggerToast } = useToast();
  const access = useAnalyticsAccess();
  const [q, setQ] = useState("");
  const query = useDeferredValue(q);
  const [sort, setSort] = useState<ReportSort>("updated");
  const load = useCallback(() => listReports(query, sort), [query, sort]);
  const res = useAnalyticsResource(load);
  const [sharing, setSharing] = useState<ReportSummary | null>(null);
  const [deleting, setDeleting] = useState<ReportSummary | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const readerView = !access.loading && !access.canWrite;

  const duplicate = async (r: ReportSummary) => {
    setBusy(r.id);
    try {
      const copy = await duplicateReport(r.id);
      triggerToast(copy.dropped_blocks ? `Copied. ${copy.dropped_blocks} block(s) you can't see were left out.` : `Copied as “${copy.name}”`);
      await res.reload();
    } catch (err) {
      triggerToast(toAnalyticsError(err, "Couldn't copy the report. Try again.").message, "error");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(deleting.id);
    try {
      await deleteReport(deleting.id);
      triggerToast(`Deleted “${deleting.name}”`);
      setDeleting(null);
      await res.reload();
    } catch (err) {
      triggerToast(toAnalyticsError(err, "Couldn't delete the report. Try again.").message, "error");
    } finally {
      setBusy(null);
    }
  };

  const actions = (r: ReportSummary) => (
    <div className="flex items-center gap-4 flex-wrap">
      <Link href={`/analytics-reports/saved/${r.id}`} className={linkBtn}>
        Open
      </Link>
      {r.can_edit && (
        <Link href={`/analytics-reports/builder/${r.id}`} className={linkBtn}>
          Edit
        </Link>
      )}
      {access.canWrite && (
        <button type="button" className={linkBtn} disabled={busy === r.id} onClick={() => void duplicate(r)} aria-label={`Duplicate ${r.name}`}>
          <Copy className="w-3.5 h-3.5" aria-hidden="true" /> Duplicate
        </button>
      )}
      {r.can_share && (
        <button type="button" className={linkBtn} onClick={() => setSharing(r)} aria-label={`Share ${r.name}`}>
          <Share2 className="w-3.5 h-3.5" aria-hidden="true" /> Share
        </button>
      )}
      {r.can_edit && (
        <button type="button" className={dangerLinkBtn} onClick={() => setDeleting(r)} aria-label={`Delete ${r.name}`}>
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={readerView ? "Reports shared with you" : "Reports"}
        subtitle={
          readerView
            ? "Read-only reports a founder shared with you. You see the hubs your role can open; the rest are locked."
            : "Reports you and your team keep. Run one to freeze its numbers, share it, or export it."
        }
        action={
          access.canWrite ? (
            <button type="button" className={darkBtn} onClick={() => router.push("/analytics-reports/builder/new")}>
              <Plus className="w-4 h-4" aria-hidden="true" /> New report
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-col md:flex-row gap-3">
        <label htmlFor="rep-q" className="relative flex-1">
          <span className="sr-only">Search reports</span>
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input id="rep-q" type="search" className={`${inputCls} pl-9`} placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label htmlFor="rep-sort" className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
          Sort
          <select id="rep-sort" className={`${inputCls} md:w-44`} value={sort} onChange={(e) => setSort(e.target.value as ReportSort)}>
            <option value="updated">Last changed</option>
            <option value="name">Name</option>
            <option value="created">Created</option>
          </select>
        </label>
      </div>

      <ResourceGate resource={res} skeleton={<SkeletonRows rows={4} label="Loading reports" />}>
        {(data) =>
          data.reports.length === 0 ? (
            <div className={cardCls}>
              {query ? (
                <EmptyBlock title="No reports match" body="Try another name." />
              ) : readerView ? (
                <EmptyBlock title="Nothing shared with you yet" body="When a founder shares a report with you, it appears here." />
              ) : (
                <EmptyBlock title="No reports yet" body="Make one from the numbers you care about, or start from a template.">
                  <button type="button" className={darkBtn} onClick={() => router.push("/analytics-reports/builder/new")}>
                    <Plus className="w-4 h-4" aria-hidden="true" /> New report
                  </button>
                </EmptyBlock>
              )}
            </div>
          ) : (
            <>
              {/* Phone: stacked cards. */}
              <ul className="md:hidden space-y-3" aria-label="Reports">
                {data.reports.map((r) => (
                  <li key={r.id} className={`${cardCls} p-4 space-y-2`}>
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/analytics-reports/saved/${r.id}`} className="text-sm font-semibold text-neutral-900 hover:underline">
                        {r.name}
                      </Link>
                      {r.shared_with_me && <StatusChip label="Shared" className="bg-brand-50 text-brand-800 border-brand-200" />}
                    </div>
                    <p className="text-xs text-neutral-500">
                      {r.block_count} blocks · {r.owner.name || "Unnamed"}
                      {r.share_count ? ` · shared with ${r.share_count}` : ""}
                    </p>
                    <p className="text-xs text-neutral-600">
                      Last run: <LastRun r={r} />
                    </p>
                    {actions(r)}
                  </li>
                ))}
              </ul>
              {/* Tablet and up: a table. */}
              <div className={`${cardCls} hidden md:block overflow-x-auto`}>
                <table className="w-full text-sm">
                  <caption className="sr-only">Reports</caption>
                  <thead>
                    <tr className="text-left text-xs text-neutral-500 border-b border-neutral-100">
                      <th scope="col" className="px-5 py-3 font-semibold">Name</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Blocks</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Last run</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Owner</th>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {data.reports.map((r) => (
                      <tr key={r.id}>
                        <td className="px-5 py-3">
                          <Link href={`/analytics-reports/saved/${r.id}`} className="font-semibold text-neutral-900 hover:underline">
                            {r.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            {r.shared_with_me && <StatusChip label="Shared with you" className="bg-brand-50 text-brand-800 border-brand-200" />}
                            {r.share_count ? <span className="text-xs text-neutral-500">Shared with {r.share_count}</span> : null}
                          </div>
                        </td>
                        <td className="px-3 py-3 tabular-nums">{r.block_count}</td>
                        <td className="px-3 py-3 text-neutral-600">
                          <LastRun r={r} />
                        </td>
                        <td className="px-3 py-3 text-neutral-600">{r.owner.name || "Unnamed"}</td>
                        <td className="px-5 py-3">{actions(r)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        }
      </ResourceGate>

      {sharing && (
        <ShareDialog
          reportId={sharing.id}
          reportName={sharing.name}
          onClose={() => setSharing(null)}
          onSaved={() => {
            setSharing(null);
            void res.reload();
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Delete “${deleting.name}”?`}
          body="The report and its sharing go away for everyone. Files already exported stay in Export history until they expire."
          confirmLabel="Delete report"
          danger
          busy={busy === deleting.id}
          onConfirm={() => void remove()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
