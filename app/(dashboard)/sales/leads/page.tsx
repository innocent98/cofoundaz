"use client";

import React, { Suspense, useCallback, useId, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PAGE_SIZE, useLeadList, useLoader, useMembers } from "@/hooks/useSalesCrm";
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  convertLead,
  createLead,
  deleteLead,
  getLead,
  importSummary,
  isUuid,
  leadTitle,
  salesErrorMessage,
  salesFieldErrors,
  updateLead,
  type Lead,
  type LeadSource,
  type LeadStatus,
} from "@/lib/api/sales";
import { useToast } from "../ToastContext";
import { LeadImportModal } from "@/components/sales/lead-import";
import { EnrollDialog } from "@/components/sales/enroll-dialog";
import {
  BTN_ACCENT,
  BTN_SECONDARY,
  CARD,
  ConfirmDialog,
  EmptyState,
  Field,
  INPUT,
  SalesGate,
} from "@/components/sales/shared";

const STATUS_STYLE: Record<LeadStatus, string> = {
  new: "bg-neutral-100 text-neutral-700",
  working: "bg-brand-50 text-brand-700",
  qualified: "bg-brand-100/70 text-brand-800",
  disqualified: "bg-danger-50 text-danger-700",
  converted: "bg-accent-100 text-accent-800",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function LeadsInner() {
  const { triggerToast, runAction } = useToast();
  const params = useSearchParams();
  const focusParam = params.get("lead");
  const focusId = isUuid(focusParam) ? focusParam : null;

  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [offset, setOffset] = useState(0);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const leads = useLeadList({ q, status, offset });
  const { nameOf } = useMembers();
  const focused = useLoader<Lead>(React.useMemo(() => (focusId ? () => getLead(focusId) : null), [focusId]));

  const [importing, setImporting] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [converted, setConverted] = useState<{ dealId: string; label: string } | null>(null);
  const [toDelete, setToDelete] = useState<Lead | null>(null);
  const [toEnroll, setToEnroll] = useState<Lead | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const ids = { name: useId(), company: useId(), email: useId(), search: useId(), status: useId() };

  const items = leads.data?.items ?? [];
  const total = leads.data?.total ?? 0;
  const filtered = q !== "" || status !== "";

  const onSearch = (value: string) => {
    setQInput(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setQ(value.trim());
      setOffset(0);
    }, 300);
  };

  const refresh = useCallback(() => {
    void leads.reload();
    void focused.reload();
  }, [leads, focused]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !company.trim()) {
      setErrors({ name: "Add a name or a company." });
      return;
    }
    setAdding(true);
    try {
      const lead = await createLead({
        name: name.trim() || null,
        company: company.trim() || null,
        email: email.trim() || null,
        source: "manual",
      });
      setErrors({});
      setName("");
      setCompany("");
      setEmail("");
      triggerToast(`Added lead: ${leadTitle(lead)}`);
      setOffset(0);
      void leads.reload();
    } catch (err) {
      const fe = salesFieldErrors(err);
      setErrors(fe);
      if (Object.keys(fe).length === 0) triggerToast(salesErrorMessage(err), "error");
    } finally {
      setAdding(false);
    }
  };

  const handleConvert = async (lead: Lead) => {
    setBusyId(lead.id);
    const res = await runAction(() => convertLead(lead.id));
    setBusyId(null);
    if (res.ok) {
      triggerToast(`Made ${leadTitle(lead)} a deal`);
      setConverted({ dealId: res.value.deal.id, label: res.value.deal.name });
      refresh();
    }
  };

  const handleStatus = async (lead: Lead, next: LeadStatus) => {
    if (next === lead.status || next === "converted") return;
    setBusyId(lead.id);
    const res = await runAction(() => updateLead(lead.id, { status: next }), "Status updated");
    setBusyId(null);
    if (res.ok) refresh();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const lead = toDelete;
    setBusyId(lead.id);
    const res = await runAction(() => deleteLead(lead.id), "Lead deleted");
    setBusyId(null);
    setToDelete(null);
    if (res.ok) {
      if (items.length === 1 && offset > 0) setOffset(Math.max(0, offset - PAGE_SIZE));
      refresh();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-semibold text-neutral-900">Leads</h1>
        <button type="button" onClick={() => setImporting(true)} className={BTN_SECONDARY}>
          Import CSV
        </button>
      </div>

      {/* QUICK ADD */}
      <form onSubmit={handleAdd} noValidate aria-label="Add a lead" className={`${CARD} p-4 flex flex-col md:flex-row md:items-start gap-3`}>
        <div className="md:flex-1">
          <Field label="Lead name" htmlFor={ids.name} error={errors.name}>
            <input id={ids.name} className={INPUT} placeholder="Lead name" value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
          </Field>
        </div>
        <div className="md:flex-1">
          <Field label="Company" htmlFor={ids.company} error={errors.company}>
            <input id={ids.company} className={INPUT} placeholder="Company" value={company} maxLength={200} onChange={(e) => setCompany(e.target.value)} />
          </Field>
        </div>
        <div className="md:flex-1">
          <Field label="Email" htmlFor={ids.email} error={errors.email}>
            <input id={ids.email} type="email" className={INPUT} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>
        <button type="submit" disabled={adding} className={`${BTN_ACCENT} md:mt-[22px] shrink-0`}>
          {adding ? "Adding..." : "+ Add lead"}
        </button>
      </form>

      {converted && (
        <p role="status" className="text-sm text-brand-900 bg-brand-100 border border-brand-200 rounded-card px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <span>Created the deal &ldquo;{converted.label}&rdquo; in your first stage.</span>
          <Link href={`/sales?deal=${converted.dealId}`} className="font-bold underline">
            Open the deal
          </Link>
        </p>
      )}

      {/* DEEP LINK: /sales/leads?lead=<id> (a search hit) */}
      {focusId && focused.status === "ready" && focused.data && (
        <div className={`${CARD} p-4 flex flex-wrap items-center justify-between gap-3 border-accent-200`}>
          <div className="text-sm">
            <p className="font-semibold text-neutral-900">{leadTitle(focused.data)}</p>
            <p className="text-neutral-500">
              {[focused.data.company, focused.data.email, LEAD_STATUS_LABELS[focused.data.status]].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex gap-3">
            {focused.data.status !== "converted" && (
              <button type="button" className={BTN_SECONDARY} onClick={() => setToEnroll(focused.data as Lead)}>
                Enrol in sequence
              </button>
            )}
            {focused.data.status !== "converted" && (
              <button type="button" className={BTN_ACCENT} disabled={busyId === focused.data.id} onClick={() => void handleConvert(focused.data as Lead)}>
                Make it a deal
              </button>
            )}
            <button type="button" className={BTN_SECONDARY} onClick={() => window.history.replaceState(null, "", "/sales/leads")}>
              Show all leads
            </button>
          </div>
        </div>
      )}
      {focusId && focused.status === "error" && (
        <p role="alert" className="text-sm text-neutral-700 bg-white border border-neutral-200 rounded-card px-4 py-3">
          That lead was not found. It may have been deleted.
        </p>
      )}

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="md:flex-1">
          <label htmlFor={ids.search} className="sr-only">
            Search leads
          </label>
          <input id={ids.search} type="search" className={INPUT} placeholder="Search by name, company or email" value={qInput} onChange={(e) => onSearch(e.target.value)} />
        </div>
        <div>
          <label htmlFor={ids.status} className="sr-only">
            Filter by status
          </label>
          <select
            id={ids.status}
            className={INPUT}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as LeadStatus | "");
              setOffset(0);
            }}
          >
            <option value="">All statuses</option>
            {[...LEAD_STATUSES, "converted" as const].map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <SalesGate status={leads.status} error={leads.error} onRetry={() => void leads.reload()} loadingLabel="Loading leads">
        {items.length === 0 ? (
          <EmptyState
            title={filtered ? "No leads match" : "No leads yet"}
            body={filtered ? "Try a different search or status." : "Add a lead above or import a CSV to get your pipeline started."}
          />
        ) : (
          <div className={`${CARD} overflow-hidden`}>
            <div className="relative overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[860px]">
                <thead>
                  <tr className="bg-neutral-50/70 border-b border-neutral-200 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    <th scope="col" className="py-4 px-6">Name</th>
                    <th scope="col" className="py-4 px-6">Company</th>
                    <th scope="col" className="py-4 px-6">Source</th>
                    <th scope="col" className="py-4 px-6">Status</th>
                    <th scope="col" className="py-4 px-6">Owner</th>
                    <th scope="col" className="py-4 px-6">Created</th>
                    <th scope="col" className="py-4 px-6 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {items.map((lead) => (
                    <tr key={lead.id} className={`transition-colors ${lead.id === focusId ? "bg-accent-100/50" : "hover:bg-neutral-50/50"}`}>
                      <td className="py-4 px-6 font-semibold text-neutral-900">
                        {leadTitle(lead)}
                        {lead.email && <span className="block text-xs font-normal text-neutral-500">{lead.email}</span>}
                      </td>
                      <td className="py-4 px-6 text-neutral-600">{lead.company ?? "-"}</td>
                      <td className="py-4 px-6 text-neutral-600">{LEAD_SOURCE_LABELS[lead.source as LeadSource] ?? lead.source}</td>
                      <td className="py-4 px-6">
                        {lead.status === "converted" ? (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE.converted}`}>
                            Converted
                          </span>
                        ) : (
                          <select
                            aria-label={`Status for ${leadTitle(lead)}`}
                            value={lead.status}
                            disabled={busyId === lead.id}
                            onChange={(e) => void handleStatus(lead, e.target.value as LeadStatus)}
                            className={`rounded-full border-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide cursor-pointer ${STATUS_STYLE[lead.status]}`}
                          >
                            {LEAD_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {LEAD_STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-4 px-6 text-neutral-600">{nameOf(lead.owner_id)}</td>
                      <td className="py-4 px-6 text-neutral-600 whitespace-nowrap">{formatDate(lead.created_at)}</td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        {lead.status === "converted" ? (
                          lead.converted_deal_id && (
                            <Link href={`/sales?deal=${lead.converted_deal_id}`} className="text-xs font-bold text-brand-hover hover:underline">
                              View deal
                            </Link>
                          )
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setToEnroll(lead)}
                              aria-label={`Enrol ${leadTitle(lead)} in a sequence`}
                              className="mr-4 text-xs font-bold text-brand-hover hover:underline cursor-pointer"
                            >
                              Enrol
                            </button>
                            <button
                              type="button"
                              disabled={busyId === lead.id}
                              onClick={() => void handleConvert(lead)}
                              aria-label={`Make ${leadTitle(lead)} a deal`}
                              className="text-xs font-bold text-brand-hover hover:underline cursor-pointer disabled:opacity-50"
                            >
                              Make it a deal
                            </button>
                            <button
                              type="button"
                              onClick={() => setToDelete(lead)}
                              aria-label={`Delete lead ${leadTitle(lead)}`}
                              className="ml-4 text-xs text-neutral-500 hover:text-danger-700 cursor-pointer"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-neutral-100 text-xs text-neutral-500">
              <span>
                {offset + 1} to {offset + items.length} of {total}
              </span>
              <div className="flex gap-2">
                <button type="button" className={BTN_SECONDARY} disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
                  Previous
                </button>
                <button type="button" className={BTN_SECONDARY} disabled={offset + items.length >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </SalesGate>

      {importing && (
        <LeadImportModal
          onClose={() => setImporting(false)}
          onImported={(result) => {
            triggerToast(importSummary(result));
            setOffset(0);
            void leads.reload();
          }}
        />
      )}

      {toEnroll && (
        <EnrollDialog targets={{ label: leadTitle(toEnroll), lead_ids: [toEnroll.id] }} onClose={() => setToEnroll(null)} />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete this lead?"
          body={`${leadTitle(toDelete)} is removed from your leads. This cannot be undone.`}
          confirmLabel="Delete lead"
          danger
          busy={busyId === toDelete.id}
          onConfirm={() => void handleDelete()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={null}>
      <LeadsInner />
    </Suspense>
  );
}
