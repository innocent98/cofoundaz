"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import {
  createIpAsset,
  deleteIpAsset,
  listIpAssets,
  toLegalError,
  updateIpAsset,
  type IpAsset,
  type IpStoredStatus,
  type IpType,
} from "@/lib/api/legal";
import { IP_STATUS_CLASS, IP_STATUS_LABEL, IP_TYPE_LABEL, renewalLabel } from "@/lib/legal-format";
import { useLegalResource } from "@/hooks/useLegalResource";
import { useToast } from "../ToastContext";
import { useLegalAccess } from "../_components/useLegalAccess";
import {
  ConfirmDialog,
  Drawer,
  EmptyBlock,
  Field,
  FormError,
  PageHeader,
  ResourceGate,
  SkeletonRows,
  StatusChip,
  dangerLinkBtn,
  inputCls,
  linkBtn,
  primaryBtn,
  secondaryBtn,
  darkBtn,
} from "../_components/ui";

const TYPES: IpType[] = ["trademark", "patent", "copyright", "domain"];
const STATUSES: IpStoredStatus[] = ["drafting", "filed", "registered"];

export default function IPTrackerPage() {
  return (
    <Suspense fallback={<SkeletonRows label="Loading IP assets" />}>
      <IPTracker />
    </Suspense>
  );
}

function IPTracker() {
  const { canWrite } = useLegalAccess();
  const { triggerToast } = useToast();
  const params = useSearchParams();
  const highlightId = params.get("asset");

  const [typeFilter, setTypeFilter] = useState<IpType | "">("");
  const [statusFilter, setStatusFilter] = useState<IpStoredStatus | "">("");
  const load = useCallback(() => listIpAssets({ type: typeFilter, status: statusFilter }), [typeFilter, statusFilter]);
  const resource = useLegalResource(load);

  const [editing, setEditing] = useState<IpAsset | "new" | null>(null);
  const [deleting, setDeleting] = useState<IpAsset | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // A notification link lands on its row: scroll it into view once the list is there.
  useEffect(() => {
    if (!highlightId || resource.status !== "ready") return;
    document.getElementById(`ip-${highlightId}`)?.scrollIntoView({ block: "center" });
  }, [highlightId, resource.status]);

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteIpAsset(deleting.id);
      triggerToast("IP asset deleted.");
      setDeleting(null);
      await resource.reload();
    } catch (err) {
      const le = toLegalError(err, "Couldn't delete that asset. Try again.");
      triggerToast(le.notFound ? "That asset no longer exists." : le.message, "error");
      if (le.notFound) {
        setDeleting(null);
        await resource.reload();
      }
    } finally {
      setDeleteBusy(false);
    }
  };

  const filtered = typeFilter !== "" || statusFilter !== "";

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <PageHeader
        title="IP tracker"
        subtitle="Protect and monitor your intellectual property portfolio."
        action={
          canWrite ? (
            <button type="button" onClick={() => setEditing("new")} className={primaryBtn}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add asset</span>
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <label htmlFor="ip-type-filter" className="sr-only">
            Filter by type
          </label>
          <select
            id="ip-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as IpType | "")}
            className={`${inputCls} !w-auto`}
          >
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {IP_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="ip-status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="ip-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as IpStoredStatus | "")}
            className={`${inputCls} !w-auto`}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {IP_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ResourceGate resource={resource} skeleton={<SkeletonRows label="Loading IP assets" />}>
        {(assets) => (
          <div className="bg-white rounded-modal border border-neutral-200/90 shadow-card overflow-hidden">
            {assets.length === 0 ? (
              filtered ? (
                <EmptyBlock title="No assets match these filters" body="Clear a filter to see the rest of your portfolio." />
              ) : (
                <EmptyBlock title="No IP assets tracked yet" body="Add a trademark, patent, copyright or domain to track its status and renewal date.">
                  {canWrite && (
                    <button type="button" onClick={() => setEditing("new")} className={primaryBtn}>
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      Add asset
                    </button>
                  )}
                </EmptyBlock>
              )
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-neutral-50/50 border-b border-neutral-100 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      <th className="py-4 px-6">Type</th>
                      <th className="py-4 px-6">Name</th>
                      <th className="py-4 px-6">Jurisdiction</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Renewal</th>
                      {canWrite && <th className="py-4 px-6 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-sm">
                    {assets.map((a) => (
                      <tr
                        key={a.id}
                        id={`ip-${a.id}`}
                        className={`transition-colors ${a.id === highlightId ? "bg-accent-100 ring-1 ring-inset ring-accent-200" : "hover:bg-neutral-50/60"}`}
                      >
                        <td className="py-4 px-6 text-neutral-800 font-medium">{IP_TYPE_LABEL[a.type]}</td>
                        <td className="py-4 px-6 text-neutral-900 font-semibold">{a.name}</td>
                        <td className="py-4 px-6 text-neutral-600">{a.jurisdiction}</td>
                        <td className="py-4 px-6">
                          <StatusChip label={IP_STATUS_LABEL[a.derived_status]} className={IP_STATUS_CLASS[a.derived_status]} />
                        </td>
                        <td className={`py-4 px-6 font-medium ${a.derived_status === "expired" ? "text-danger-600" : "text-neutral-600"}`}>
                          {renewalLabel(a.renewal_on, a.derived_status)}
                        </td>
                        {canWrite && (
                          <td className="py-4 px-6 text-right whitespace-nowrap space-x-3">
                            <button type="button" className={linkBtn} onClick={() => setEditing(a)} aria-label={`${a.derived_status === "expired" ? "Update renewal for" : "Edit"} ${a.name}`}>
                              {a.derived_status === "expired" ? "Update renewal" : "Edit"}
                            </button>
                            <button type="button" className={dangerLinkBtn} onClick={() => setDeleting(a)} aria-label={`Delete ${a.name}`}>
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </ResourceGate>

      {editing && (
        <AssetDrawer
          asset={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async (message) => {
            setEditing(null);
            triggerToast(message);
            await resource.reload();
          }}
          onGone={async () => {
            // Deleted elsewhere (a 404): close, say so and drop the stale row, like the delete flow.
            setEditing(null);
            triggerToast("That asset no longer exists.", "error");
            await resource.reload();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this asset?"
          body={`${deleting.name} will be removed from your IP register and its renewal reminders will stop. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          busy={deleteBusy}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function AssetDrawer({
  asset,
  onClose,
  onSaved,
  onGone,
}: {
  asset: IpAsset | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
  onGone: () => Promise<void>;
}) {
  const isEdit = asset !== null;
  const [type, setType] = useState<IpType>(asset?.type ?? "trademark");
  const [name, setName] = useState(asset?.name ?? "");
  const [jurisdiction, setJurisdiction] = useState(asset?.jurisdiction ?? "Global");
  const [status, setStatus] = useState<IpStoredStatus>(asset?.status ?? "drafting");
  const [renewalOn, setRenewalOn] = useState(asset?.renewal_on ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // A new asset can be drafting or filed; registering happens later, from an edit. An edit keeps its own status choices.
  const statusChoices: IpStoredStatus[] = isEdit ? STATUSES : ["drafting", "filed"];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!name.trim()) return setFieldErrors({ name: "Enter a name." });
    if (!jurisdiction.trim()) return setFieldErrors({ jurisdiction: "Enter a jurisdiction." });
    setBusy(true);
    setError(null);
    setFieldErrors({});
    const input = { type, name: name.trim(), jurisdiction: jurisdiction.trim(), status, renewal_on: renewalOn || null };
    try {
      if (asset) await updateIpAsset(asset.id, input);
      else await createIpAsset(input);
      await onSaved(asset ? "IP asset updated." : "IP asset added.");
    } catch (err) {
      const le = toLegalError(err, "Couldn't save this asset. Try again.");
      if (le.notFound) return void onGone();
      setFieldErrors(le.fieldErrors);
      setError(le.message);
      setBusy(false);
    }
  };

  return (
    <Drawer
      title={isEdit ? "Edit IP asset" : "Add IP asset"}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className={`${secondaryBtn} flex-1`} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="ip-form" className={`${darkBtn} flex-1`} disabled={busy}>
            {busy ? "Saving" : isEdit ? "Save changes" : "Save IP asset"}
          </button>
        </div>
      }
    >
      <form id="ip-form" onSubmit={(e) => void submit(e)} className="space-y-5" noValidate>
        <FormError message={error} />
        <Field label="Asset type" htmlFor="ip-type">
          <select id="ip-type" value={type} onChange={(e) => setType(e.target.value as IpType)} className={inputCls}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {IP_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Asset name or mark" htmlFor="ip-name" error={fieldErrors.name}>
          <input id="ip-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Corp logo" className={inputCls} />
        </Field>
        <Field label="Jurisdiction" htmlFor="ip-jurisdiction" error={fieldErrors.jurisdiction} hint="Free text, for example Global, Nigeria, USA or EU.">
          <input
            id="ip-jurisdiction"
            list="ip-jurisdictions"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            className={inputCls}
          />
          <datalist id="ip-jurisdictions">
            <option value="Global" />
            <option value="Nigeria" />
            <option value="USA" />
            <option value="EU" />
          </datalist>
        </Field>
        <Field label="Status" htmlFor="ip-status">
          <select id="ip-status" value={status} onChange={(e) => setStatus(e.target.value as IpStoredStatus)} className={inputCls}>
            {statusChoices.map((s) => (
              <option key={s} value={s}>
                {IP_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Renewal date (optional)"
          htmlFor="ip-renewal"
          error={fieldErrors.renewal_on}
          hint={isEdit && asset?.derived_status === "expired" ? "This asset shows as expired because its renewal date has passed. Set a new date once renewed." : "You get reminders at 14, 7 and 1 days before."}
        >
          <input id="ip-renewal" type="date" value={renewalOn} onChange={(e) => setRenewalOn(e.target.value)} className={inputCls} />
        </Field>
      </form>
    </Drawer>
  );
}
