"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  deleteComplianceItem,
  downloadComplianceProof,
  listComplianceItems,
  toLegalError,
  type ComplianceDerivedStatus,
  type ComplianceItem,
} from "@/lib/api/legal";
import {
  COMPLIANCE_STATUS_CLASS,
  COMPLIANCE_STATUS_LABEL,
  RECURRENCE_LABEL,
  countOverdue,
  dueLabel,
  formatDate,
  formatTimestamp,
  monthGrid,
  monthTitle,
  overdueBanner,
  shiftMonth,
  todayIso,
} from "@/lib/legal-format";
import { useLegalResource } from "@/hooks/useLegalResource";
import { useToast } from "../ToastContext";
import { useLegalAccess } from "../_components/useLegalAccess";
import { FilingDrawer, MarkDoneDialog, ProofDialog } from "../_components/ComplianceForms";
import {
  ConfirmDialog,
  Drawer,
  EmptyBlock,
  PageHeader,
  ResourceGate,
  SkeletonRows,
  StatusChip,
  dangerLinkBtn,
  inputCls,
  linkBtn,
  primaryBtn,
  secondaryBtn,
} from "../_components/ui";

type Filter = "all" | ComplianceDerivedStatus;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "due_soon", label: "Due soon" },
  { key: "upcoming", label: "Upcoming" },
  { key: "done", label: "Done" },
];

export default function CompliancePage() {
  return (
    <Suspense fallback={<SkeletonRows label="Loading filings" />}>
      <Compliance />
    </Suspense>
  );
}

function Compliance() {
  const { canWrite } = useLegalAccess();
  const { triggerToast } = useToast();
  const highlightId = useSearchParams().get("item");
  const resource = useLegalResource(listComplianceItems);

  const [view, setView] = useState<"list" | "calendar">("list");
  const [filter, setFilter] = useState<Filter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [editing, setEditing] = useState<ComplianceItem | "new" | null>(null);
  const [markingDone, setMarkingDone] = useState<ComplianceItem | null>(null);
  const [proofFor, setProofFor] = useState<ComplianceItem | null>(null);
  const [deleting, setDeleting] = useState<ComplianceItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!highlightId || resource.status !== "ready") return;
    document.getElementById(`filing-${highlightId}`)?.scrollIntoView({ block: "center" });
  }, [highlightId, resource.status]);

  const items = useMemo(() => resource.data ?? [], [resource.data]);
  const overdue = countOverdue(items);

  const visible = useMemo(
    () =>
      items.filter(
        (i) => (filter === "all" || i.derived_status === filter) && (!from || i.due_on >= from) && (!to || i.due_on <= to),
      ),
    [items, filter, from, to],
  );

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: items.length, overdue: 0, due_soon: 0, upcoming: 0, done: 0 };
    for (const i of items) c[i.derived_status] += 1;
    return c;
  }, [items]);

  const saved = async (message: string) => {
    setEditing(null);
    setProofFor(null);
    triggerToast(message);
    await resource.reload();
  };

  const onMarkedDone = async (item: ComplianceItem) => {
    setMarkingDone(null);
    // Marking a repeating filing done creates the next one; nothing in the reply says so, so refetch.
    try {
      const next = await listComplianceItems();
      resource.setData(next);
      const successor = next.find((n) => n.previous_item_id === item.id);
      triggerToast(successor ? `Marked done. Next ${successor.title} is due ${formatDate(successor.due_on)}.` : "Marked done.");
    } catch {
      triggerToast("Marked done.");
      await resource.reload();
    }
  };

  const download = async (item: ComplianceItem) => {
    setDownloadingId(item.id);
    try {
      await downloadComplianceProof(item.id);
    } catch (err) {
      const le = toLegalError(err, "Couldn't download the proof. Try again.");
      triggerToast(le.notFound ? "Proof not available." : le.message, "error");
      if (le.notFound) await resource.reload();
    } finally {
      setDownloadingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteComplianceItem(deleting.id);
      triggerToast("Filing deleted.");
      setDeleting(null);
      setDetailId(null);
      await resource.reload();
    } catch (err) {
      const le = toLegalError(err, "Couldn't delete that filing. Try again.");
      triggerToast(le.notFound ? "That filing no longer exists." : le.message, "error");
      if (le.notFound) {
        setDeleting(null);
        setDetailId(null);
        await resource.reload();
      }
    } finally {
      setDeleteBusy(false);
    }
  };

  const actions = { canWrite, downloadingId, onDone: setMarkingDone, onProof: setProofFor, onEdit: setEditing, onDelete: setDeleting, onDownload: download };
  const detail = detailId ? items.find((i) => i.id === detailId) ?? null : null;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <PageHeader
        title="Compliance calendar"
        subtitle="Track and manage mandatory filings and deadlines."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div role="group" aria-label="View" className="flex bg-white rounded-card border border-neutral-200 overflow-hidden shadow-card">
              {(["list", "calendar"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 max-md:min-h-11 text-sm font-semibold transition-colors ${v === "calendar" ? "border-l border-neutral-200" : ""} ${
                    view === v ? "bg-neutral-100 text-neutral-900" : "text-neutral-500 hover:bg-neutral-50"
                  }`}
                >
                  {v === "list" ? "List" : "Calendar"}
                </button>
              ))}
            </div>
            {canWrite && (
              <button type="button" onClick={() => setEditing("new")} className={primaryBtn}>
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add filing</span>
              </button>
            )}
          </div>
        }
      />

      {overdue > 0 && (
        <div role="alert" className="bg-danger-50 border border-danger-200 text-danger-700 px-5 py-3.5 rounded-card text-sm font-medium flex items-center gap-3 shadow-card">
          <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{overdueBanner(overdue)}</span>
        </div>
      )}

      <ResourceGate resource={resource} skeleton={<SkeletonRows label="Loading filings" />}>
        {() => (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <div role="group" aria-label="Filter by status" className="flex gap-2 overflow-x-auto scrollbar-none max-w-full">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={filter === f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-3.5 py-2 max-md:min-h-11 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                      filter === f.key ? "bg-accent-200 border-accent-200 text-ink" : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    {f.label} ({counts[f.key]})
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <div className="space-y-1">
                  <label htmlFor="due-from" className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Due from
                  </label>
                  <input id="due-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={`${inputCls} !w-auto`} />
                </div>
                <div className="space-y-1">
                  <label htmlFor="due-to" className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Due to
                  </label>
                  <input id="due-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={`${inputCls} !w-auto`} />
                </div>
                {(from || to) && (
                  <button type="button" className={secondaryBtn} onClick={() => { setFrom(""); setTo(""); }}>
                    Clear dates
                  </button>
                )}
              </div>
            </div>

            {view === "list" ? (
              <div className="bg-white rounded-modal border border-neutral-200/90 shadow-card overflow-hidden">
                {visible.length === 0 ? (
                  items.length === 0 ? (
                    <EmptyBlock title="No filings yet" body="Add the filings your company has to make, like VAT or annual returns, and we will remind you before they are due.">
                      {canWrite && (
                        <button type="button" onClick={() => setEditing("new")} className={primaryBtn}>
                          <Plus className="w-4 h-4" aria-hidden="true" />
                          Add filing
                        </button>
                      )}
                    </EmptyBlock>
                  ) : (
                    <EmptyBlock title="No filings match these filters" body="Change the status or date range to see more." />
                  )
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[860px]">
                      <thead>
                        <tr className="bg-neutral-50/50 border-b border-neutral-100 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          <th className="py-4 px-6">Filing</th>
                          <th className="py-4 px-6">Authority</th>
                          <th className="py-4 px-6">Due</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-sm">
                        {visible.map((item) => (
                          <tr
                            key={item.id}
                            id={`filing-${item.id}`}
                            className={`transition-colors ${item.id === highlightId ? "bg-accent-100 ring-1 ring-inset ring-accent-200" : "hover:bg-neutral-50/60"}`}
                          >
                            <td className="py-4 px-6">
                              <div className="text-neutral-900 font-semibold">{item.title}</div>
                              {item.recurrence !== "none" && <div className="text-xs text-neutral-500">Repeats {RECURRENCE_LABEL[item.recurrence].toLowerCase()}</div>}
                            </td>
                            <td className="py-4 px-6 text-neutral-600">{item.authority ?? "Not specified"}</td>
                            <td className="py-4 px-6">
                              <div className={`font-medium ${item.derived_status === "overdue" ? "text-danger-600" : "text-neutral-700"}`}>{formatDate(item.due_on)}</div>
                              <div className="text-xs text-neutral-500">
                                {item.status === "done" && item.done_at ? `Done ${formatTimestamp(item.done_at)}` : dueLabel(item.due_on)}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <StatusChip label={COMPLIANCE_STATUS_LABEL[item.derived_status]} className={COMPLIANCE_STATUS_CLASS[item.derived_status]} />
                            </td>
                            <td className="py-4 px-6 text-right">
                              <ItemActions item={item} {...actions} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <CalendarView items={visible} onOpen={setDetailId} />
            )}
          </>
        )}
      </ResourceGate>

      {editing && <FilingDrawer item={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={saved} />}
      {markingDone && <MarkDoneDialog item={markingDone} onClose={() => setMarkingDone(null)} onDone={onMarkedDone} />}
      {proofFor && <ProofDialog item={proofFor} onClose={() => setProofFor(null)} onUploaded={() => saved("Proof uploaded.")} />}
      {deleting && (
        <ConfirmDialog
          title="Delete this filing?"
          body={`${deleting.title}, due ${formatDate(deleting.due_on)}, will be removed${deleting.proof_url ? " together with its proof file" : ""}. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          busy={deleteBusy}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
      {detail && !editing && !markingDone && !proofFor && !deleting && (
        <Drawer title={detail.title} onClose={() => setDetailId(null)}>
          <dl className="space-y-3 text-sm">
            <Row label="Status">
              <StatusChip label={COMPLIANCE_STATUS_LABEL[detail.derived_status]} className={COMPLIANCE_STATUS_CLASS[detail.derived_status]} />
            </Row>
            <Row label="Authority">{detail.authority ?? "Not specified"}</Row>
            <Row label="Due">
              {formatDate(detail.due_on)}
              {detail.status === "open" && <span className="text-neutral-500">{` (${dueLabel(detail.due_on)})`}</span>}
            </Row>
            <Row label="Repeats">{RECURRENCE_LABEL[detail.recurrence]}</Row>
            {detail.done_at && <Row label="Done on">{formatTimestamp(detail.done_at)}</Row>}
            <Row label="Proof">{detail.proof_url ? "Attached" : "None attached"}</Row>
          </dl>
          <div className="pt-2">
            <ItemActions item={detail} {...actions} wrap />
          </div>
        </Drawer>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-neutral-900 font-medium text-right">{children}</dd>
    </div>
  );
}

function ItemActions({
  item,
  canWrite,
  downloadingId,
  onDone,
  onProof,
  onEdit,
  onDelete,
  onDownload,
  wrap = false,
}: {
  item: ComplianceItem;
  canWrite: boolean;
  downloadingId: string | null;
  onDone: (i: ComplianceItem) => void;
  onProof: (i: ComplianceItem) => void;
  onEdit: (i: ComplianceItem) => void;
  onDelete: (i: ComplianceItem) => void;
  onDownload: (i: ComplianceItem) => void;
  wrap?: boolean;
}) {
  const none = !canWrite && !item.proof_url;
  if (none) return <span className="text-xs text-neutral-400">No actions</span>;
  return (
    <div className={`flex items-center gap-x-4 ${wrap ? "flex-wrap gap-y-1" : "justify-end"}`}>
      {item.proof_url && (
        <button type="button" className={linkBtn} disabled={downloadingId === item.id} onClick={() => onDownload(item)} aria-label={`Download proof for ${item.title}`}>
          {downloadingId === item.id ? "Downloading" : "Download proof"}
        </button>
      )}
      {canWrite && (
        <>
          {item.status === "open" && (
            <button type="button" className={linkBtn} onClick={() => onDone(item)} aria-label={`Mark ${item.title} done`}>
              Mark done
            </button>
          )}
          <button type="button" className={linkBtn} onClick={() => onProof(item)} aria-label={`${item.proof_url ? "Replace" : "Attach"} proof for ${item.title}`}>
            {item.proof_url ? "Replace proof" : "Attach proof"}
          </button>
          <button type="button" className={linkBtn} onClick={() => onEdit(item)} aria-label={`Edit ${item.title}`}>
            Edit
          </button>
          <button type="button" className={dangerLinkBtn} onClick={() => onDelete(item)} aria-label={`Delete ${item.title}`}>
            Delete
          </button>
        </>
      )}
    </div>
  );
}

function CalendarView({ items, onOpen }: { items: ComplianceItem[]; onOpen: (id: string) => void }) {
  const today = todayIso();
  const [ym, setYm] = useState(() => ({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) }));
  const weeks = useMemo(() => monthGrid(ym.year, ym.month), [ym]);
  const byDay = useMemo(() => {
    const m = new Map<string, ComplianceItem[]>();
    for (const i of items) m.set(i.due_on, [...(m.get(i.due_on) ?? []), i]);
    return m;
  }, [items]);
  const move = (d: number) => setYm((c) => shiftMonth(c.year, c.month, d));

  return (
    <div className="bg-white rounded-modal border border-neutral-200/90 shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-neutral-100">
        <h2 className="text-base font-display font-bold text-neutral-900" aria-live="polite">
          {monthTitle(ym.year, ym.month)}
        </h2>
        <div className="flex gap-2">
          <button type="button" aria-label="Previous month" onClick={() => move(-1)} className={`${secondaryBtn} !px-2.5`}>
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setYm({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) })} className={secondaryBtn}>
            Today
          </button>
          <button type="button" aria-label="Next month" onClick={() => move(1)} className={`${secondaryBtn} !px-2.5`}>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-7 text-[11px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="px-3 py-2">
                {d}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-neutral-100 last:border-b-0">
              {week.map((cell) => {
                const dayItems = byDay.get(cell.iso) ?? [];
                return (
                  <div key={cell.iso} className={`min-h-24 p-2 border-l border-neutral-100 first:border-l-0 ${cell.inMonth ? "" : "bg-neutral-50/60"}`}>
                    <div className={`text-xs mb-1 ${cell.iso === today ? "font-bold text-accent-700" : cell.inMonth ? "text-neutral-600" : "text-neutral-300"}`}>
                      {Number(cell.iso.slice(8, 10))}
                    </div>
                    <div className="space-y-1">
                      {dayItems.map((i) => (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => onOpen(i.id)}
                          aria-label={`${i.title}, ${COMPLIANCE_STATUS_LABEL[i.derived_status]}, due ${formatDate(i.due_on)}`}
                          className={`block w-full truncate text-left text-[11px] font-semibold px-1.5 py-1 rounded border ${COMPLIANCE_STATUS_CLASS[i.derived_status]}`}
                        >
                          {i.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
