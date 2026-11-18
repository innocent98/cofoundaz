"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Download, Loader2, RotateCcw, Table2 } from "lucide-react";
import {
  downloadExport,
  exportDataTables,
  exportReport,
  getCatalog,
  isStaleExportError,
  listExports,
  toAnalyticsError,
  type Catalog,
  type ExportList,
  type ExportRow,
  type RangeSpec,
} from "@/lib/api/analytics";
import { DEFAULT_RANGE, dateTimeLabel, exportStatusView, fileSize, periodLabel } from "@/lib/analytics-format";
import { useAnalyticsResource } from "@/hooks/useAnalyticsResource";
import { useExportWatch } from "@/hooks/useExportWatch";
import { useToast } from "../ToastContext";
import { useAnalyticsAccess } from "../_components/access";
import { RangePicker } from "../_components/metric";
import {
  EmptyBlock,
  ForbiddenBlock,
  FormError,
  PageHeader,
  ResourceGate,
  SkeletonRows,
  StatusChip,
  cardCls,
  darkBtn,
  inputCls,
  labelCls,
  linkBtn,
  scrollToShown,
} from "../_components/ui";

const toneChip = {
  good: "bg-success-50 text-success-700 border-success-100",
  bad: "bg-danger-50 text-danger-700 border-danger-200",
  neutral: "bg-neutral-50 text-neutral-600 border-neutral-200",
  busy: "bg-brand-50 text-brand-800 border-brand-200",
} as const;

type Filter = "all" | "report" | "data_tables";

export default function ExportsPage() {
  return (
    <Suspense fallback={<SkeletonRows rows={4} label="Loading exports" />}>
      <ExportsInner />
    </Suspense>
  );
}

function ExportsInner() {
  const access = useAnalyticsAccess();
  const highlight = useSearchParams()?.get("highlight") ?? null;
  const { triggerToast } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const load = useCallback(() => listExports(filter === "all" ? undefined : filter), [filter]);
  const res = useAnalyticsResource<ExportList>(access.canExport ? load : null);
  const { rows: live, stale, watch, refresh } = useExportWatch((row) => {
    if (row.status === "ready") triggerToast(`Your export is ready: ${row.name}`);
    else triggerToast(exportStatusView(row).detail, "error");
  });

  // "Load more" pages, tied to the list they extend: a reload or a filter change drops them.
  const [more, setMore] = useState<{ base: ExportList; rows: ExportRow[] } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const extra = more && more.base === res.data ? more.rows : [];

  // Follow every pending row on screen (useExportWatch skips rows that already hit the 2-minute cap).
  useEffect(() => {
    for (const r of res.data?.exports ?? []) if (r.status === "pending") watch(r);
  }, [res.data, watch]);

  const loadMore = async () => {
    if (!res.data) return;
    const base = res.data;
    setLoadingMore(true);
    try {
      const page = await listExports(filter === "all" ? undefined : filter, base.exports.length + extra.length);
      setMore({ base, rows: [...extra, ...page.exports] });
      for (const r of page.exports) if (r.status === "pending") watch(r);
    } catch (err) {
      triggerToast(toAnalyticsError(err, "Couldn't load more exports. Try again.").message, "error");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!highlight || res.status !== "ready") return;
    queueMicrotask(() => scrollToShown([`exp-m-${highlight}`, `exp-t-${highlight}`]));
  }, [highlight, res.status]);

  if (!access.loading && !access.canExport) {
    return <ForbiddenBlock body="Exports are for founders, team members and accountants. Mentors and business consultants read shared reports on screen." />;
  }

  const started = (row: ExportRow) => {
    watch(row);
    void res.reload();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Exports"
        subtitle={`Files you${access.isFounder ? " and your team" : ""} made from reports and data tables. Each file is kept ${res.data?.retention_days ?? 30} days.`}
      />

      <DataTablesPanel onStarted={started} />

      <section aria-labelledby="hist-h" className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 id="hist-h" className="text-lg font-display font-semibold text-neutral-900">
            Export history
          </h2>
          <label htmlFor="exp-filter" className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
            Show
            <select id="exp-filter" className={`${inputCls} md:w-44`} value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
              <option value="all">Everything</option>
              <option value="report">Reports</option>
              <option value="data_tables">Data tables</option>
            </select>
          </label>
        </div>
        <ResourceGate resource={res} skeleton={<SkeletonRows rows={4} label="Loading exports" />}>
          {(data) => {
            const rows = [...data.exports, ...extra].map((r) => live[r.id] ?? r);
            const hasMore = rows.length < data.total;
            if (rows.length === 0) {
              return (
                <div className={cardCls}>
                  <EmptyBlock title="No exports yet" body="Export a report as PDF or XLSX from Reports, or make data tables above." />
                </div>
              );
            }
            return (
              <>
                <ul className="md:hidden space-y-3" aria-label="Exports">
                  {rows.map((r) => (
                    <li key={r.id} id={`exp-m-${r.id}`} className={`${cardCls} p-4 space-y-2 ${highlight === r.id ? "ring-2 ring-accent-600" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-neutral-900 break-words">{r.name}</p>
                        <StatusCell row={r} stale={stale.has(r.id)} />
                      </div>
                      <p className="text-xs text-neutral-500">
                        {r.format.toUpperCase()} · {r.period ? periodLabel(r.period) : ""} · {dateTimeLabel(r.created_at)} · {r.created_by?.name || "Someone"}
                      </p>
                      <p className="text-xs text-neutral-600">{exportStatusView(r).detail}</p>
                      <RowActions row={r} onStarted={started} onRefresh={refresh} canRegenerate={access.canStartRun} />
                    </li>
                  ))}
                </ul>
                <div className={`${cardCls} hidden md:block overflow-x-auto`}>
                  <table className="w-full text-sm">
                    <caption className="sr-only">Export history</caption>
                    <thead>
                      <tr className="text-left text-xs text-neutral-500 border-b border-neutral-100">
                        <th scope="col" className="px-5 py-3 font-semibold">File</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Format</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Generated</th>
                        <th scope="col" className="px-3 py-3 font-semibold">By</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                        <th scope="col" className="px-5 py-3 font-semibold"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {rows.map((r) => (
                        <tr key={r.id} id={`exp-t-${r.id}`} className={highlight === r.id ? "bg-accent-100/40" : ""}>
                          <td className="px-5 py-3">
                            <p className="font-semibold text-neutral-900">{r.name}</p>
                            <p className="text-xs text-neutral-500">
                              {r.artifact_type === "report" ? "Report" : "Data tables"}
                              {r.period ? ` · ${periodLabel(r.period)}` : ""}
                              {r.size_bytes ? ` · ${fileSize(r.size_bytes)}` : ""}
                            </p>
                          </td>
                          <td className="px-3 py-3">{r.format.toUpperCase()}</td>
                          <td className="px-3 py-3 text-neutral-600">{dateTimeLabel(r.created_at)}</td>
                          <td className="px-3 py-3 text-neutral-600">{r.created_by?.name || "Someone"}</td>
                          <td className="px-3 py-3">
                            <StatusCell row={r} stale={stale.has(r.id)} />
                            <p className="text-xs text-neutral-500 mt-1 max-w-56">{exportStatusView(r).detail}</p>
                          </td>
                          <td className="px-5 py-3">
                            <RowActions row={r} onStarted={started} onRefresh={refresh} canRegenerate={access.canStartRun} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {hasMore && (
                  <div className="flex flex-col items-center gap-1">
                    <button type="button" className={darkBtn} disabled={loadingMore} onClick={() => void loadMore()}>
                      {loadingMore ? "Loading" : "Load more"}
                    </button>
                    <p className="text-xs text-neutral-500">
                      Showing {rows.length} of {data.total}
                    </p>
                  </div>
                )}
              </>
            );
          }}
        </ResourceGate>
      </section>
    </div>
  );
}

function StatusCell({ row, stale }: { row: ExportRow; stale: boolean }) {
  const v = exportStatusView(row);
  return (
    <span className="inline-flex items-center gap-1.5">
      {row.status === "pending" && !stale && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-800" aria-hidden="true" />}
      <StatusChip label={row.status === "pending" && stale ? "Still working" : v.label} className={toneChip[v.tone]} />
    </span>
  );
}

function RowActions({
  row,
  onStarted,
  onRefresh,
  canRegenerate,
}: {
  row: ExportRow;
  onStarted: (r: ExportRow) => void;
  onRefresh: (id: string) => Promise<ExportRow | null>;
  canRegenerate: boolean;
}) {
  const { triggerToast } = useToast();
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      await downloadExport(row);
    } catch (err) {
      const e = toAnalyticsError(err, "Couldn't download the file. Try again.");
      triggerToast(e.message, "error");
      // 410 expired / 409 failed: reload the row so it says "Expired. Generate it again." instead of "Ready".
      if (isStaleExportError(e.code)) await onRefresh(row.id);
    } finally {
      setBusy(false);
    }
  };

  /** "Generate again": a report export re-runs the report; data tables re-ask the same metrics and days. */
  const again = async () => {
    setBusy(true);
    try {
      let next: ExportRow;
      if (row.artifact_type === "report" && row.report_id) {
        next = await exportReport(row.report_id, row.format === "xlsx" ? "xlsx" : "pdf");
      } else {
        const range: RangeSpec = row.period ? { range: "custom", from: row.period.from, to: row.period.to, compare: "previous" } : DEFAULT_RANGE;
        next = await exportDataTables({ metrics: row.metrics ?? [], range, format: row.format === "csv" ? "csv" : "xlsx", include_metadata: true });
      }
      triggerToast("Generating it again");
      onStarted(next);
    } catch (err) {
      triggerToast(toAnalyticsError(err, "Couldn't generate it again. Try again.").message, "error");
    } finally {
      setBusy(false);
    }
  };

  if (row.status === "ready") {
    return (
      <button type="button" className={linkBtn} disabled={busy} onClick={() => void download()} aria-label={`Download ${row.filename ?? row.name}`}>
        <Download className="w-3.5 h-3.5" aria-hidden="true" /> Download
      </button>
    );
  }
  if (row.status === "failed" || row.status === "expired") {
    // A report export re-runs the report, which only founders and team members may do; an accountant
    // exports a finished run from the report page instead.
    const canAgain = row.artifact_type === "data_tables" ? (row.metrics?.length ?? 0) > 0 : canRegenerate && !!row.report_id;
    if (!canAgain) {
      return row.report_id ? (
        <Link href={`/analytics-reports/saved/${row.report_id}`} className={linkBtn}>
          Open the report
        </Link>
      ) : null;
    }
    return (
      <button type="button" className={linkBtn} disabled={busy} onClick={() => void again()}>
        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Generate again
      </button>
    );
  }
  return null;
}

/** "Data tables" (replaces the mock's Export tab): catalog metrics + a range, as CSV (one table) or XLSX. */
function DataTablesPanel({ onStarted }: { onStarted: (r: ExportRow) => void }) {
  const { triggerToast } = useToast();
  const load = useCallback(() => getCatalog(), []);
  const catalog = useAnalyticsResource<Catalog>(load);
  const [picked, setPicked] = useState<string[]>([]);
  const [range, setRange] = useState<RangeSpec>(DEFAULT_RANGE);
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");
  const [meta, setMeta] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = useMemo(() => catalog.data?.hubs.filter((h) => !h.locked && h.metrics.length > 0) ?? [], [catalog.data]);

  const toggle = (key: string) => setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : p.length >= 24 ? p : [...p, key]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (picked.length === 0) {
      setError("Pick at least one metric.");
      return;
    }
    if (range.range === "custom" && (!range.from || !range.to)) {
      setError("Pick both dates.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const row = await exportDataTables({ metrics: picked, range, format, include_metadata: meta });
      triggerToast(`Generating ${format.toUpperCase()}…`);
      onStarted(row);
    } catch (err) {
      setError(toAnalyticsError(err, "Couldn't start the export. Try again.").message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="dt-h" className={`${cardCls} p-5 md:p-6 space-y-4`}>
      <div className="flex items-start gap-3">
        <Table2 className="w-5 h-5 text-brand-800 mt-0.5" aria-hidden="true" />
        <div>
          <h2 id="dt-h" className="text-lg font-display font-semibold text-neutral-900">
            Data tables
          </h2>
          <p className="text-sm text-neutral-500">Pick metrics and a period. CSV gives one summary table; XLSX adds a sheet per metric. Money in files is in naira, not kobo.</p>
        </div>
      </div>
      <ResourceGate resource={catalog} skeleton={<SkeletonRows rows={2} label="Loading metrics" />}>
        {() => (
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <FormError message={error} />
            <fieldset className="space-y-3">
              <legend className={labelCls}>Metrics ({picked.length} of up to 24)</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {open.map((h) => (
                  <div key={h.hub}>
                    <p className="text-xs font-bold text-neutral-600 mb-1">{h.hub === "custom" ? "Entered by you" : h.label}</p>
                    <ul className="space-y-0.5">
                      {h.metrics.map((m) => {
                        const id = `dt-${m.key}`;
                        return (
                          <li key={m.key}>
                            <label htmlFor={id} className="flex items-center gap-2 text-sm text-neutral-800 cursor-pointer max-md:min-h-11">
                              <input id={id} type="checkbox" className="w-4 h-4 accent-brand-900" checked={picked.includes(m.key)} onChange={() => toggle(m.key)} />
                              {m.label}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </fieldset>
            <div>
              <p className={`${labelCls} mb-2`}>Period</p>
              <RangePicker value={range} onChange={setRange} idPrefix="dt" label="Data tables period" />
            </div>
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <label htmlFor="dt-format" className="flex flex-col gap-1 text-xs font-semibold text-neutral-500">
                Format
                <select id="dt-format" className={`${inputCls} md:w-48`} value={format} onChange={(e) => setFormat(e.target.value as "xlsx" | "csv")}>
                  <option value="xlsx">Spreadsheet (XLSX)</option>
                  <option value="csv">CSV</option>
                </select>
              </label>
              <label htmlFor="dt-meta" className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer max-md:min-h-11">
                <input id="dt-meta" type="checkbox" className="w-4 h-4 accent-brand-900" checked={meta} onChange={(e) => setMeta(e.target.checked)} />
                Include a header with the period and &ldquo;as of&rdquo; time
              </label>
              <button type="submit" className={`${darkBtn} md:ml-auto`} disabled={busy}>
                {busy ? "Starting" : "Make data tables"}
              </button>
            </div>
          </form>
        )}
      </ResourceGate>
    </section>
  );
}
