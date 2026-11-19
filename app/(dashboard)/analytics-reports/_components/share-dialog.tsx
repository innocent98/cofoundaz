"use client";

import React, { useCallback, useState } from "react";
import { getShares, putShares, toAnalyticsError, type ShareMember } from "@/lib/api/analytics";
import { ROLE_LABEL, hubLabel } from "@/lib/analytics-format";
import { useAnalyticsResource } from "@/hooks/useAnalyticsResource";
import { useToast } from "../ToastContext";
import { Drawer, EmptyBlock, FormError, ResourceGate, SkeletonRows, darkBtn, secondaryBtn } from "./ui";

/**
 * Founder only. Picks which workspace members (team member, accountant, mentor, business consultant)
 * may read this report. `locked_hubs` says, per person, which blocks they will see as locks, so the
 * founder knows before sharing. PUT replaces the whole list; removing someone makes it a 404 for them.
 */
export function ShareDialog({ reportId, reportName, onClose, onSaved }: { reportId: string; reportName: string; onClose: () => void; onSaved: (count: number) => void }) {
  const { triggerToast } = useToast();
  const load = useCallback(() => getShares(reportId), [reportId]);
  const res = useAnalyticsResource(load);
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = picked ?? new Set(res.data?.shares.map((s) => s.user_id) ?? []);
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const out = await putShares(reportId, [...selected]);
      triggerToast(out.shares.length ? `Shared with ${out.shares.length} ${out.shares.length === 1 ? "person" : "people"}` : "Not shared with anyone");
      onSaved(out.shares.length);
    } catch (err) {
      setError(toAnalyticsError(err, "Couldn't save the sharing. Try again.").message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      title={`Share “${reportName}”`}
      onClose={onClose}
      footer={
        <div className="flex gap-3 justify-end">
          <button type="button" className={secondaryBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={darkBtn} disabled={busy || res.status !== "ready"} onClick={() => void save()}>
            {busy ? "Saving" : "Save sharing"}
          </button>
        </div>
      }
    >
      <p className="text-sm text-neutral-600">
        People you pick can open this report and its runs, read only. Each sees only the hubs their role can open; the rest show as locked
        blocks with no numbers.
      </p>
      <FormError message={error} />
      <ResourceGate resource={res} skeleton={<SkeletonRows rows={3} label="Loading members" />}>
        {(data) => {
          const people: ShareMember[] = [...data.shares, ...data.candidates].sort((a, b) => (a.role + (a.name ?? "")).localeCompare(b.role + (b.name ?? "")));
          if (people.length === 0) {
            return <EmptyBlock title="No one to share with yet" body="Invite a team member, accountant, mentor or business consultant from Team first." />;
          }
          return (
            <fieldset className="space-y-2">
              <legend className="sr-only">Members who can read this report</legend>
              {people.map((p) => {
                const id = `share-${p.user_id}`;
                return (
                  <label
                    key={p.user_id}
                    htmlFor={id}
                    className="flex items-start gap-3 p-3 rounded-card border border-neutral-200 hover:bg-neutral-50 cursor-pointer max-md:min-h-11"
                  >
                    <input id={id} type="checkbox" className="mt-1 w-4 h-4 accent-brand-900" checked={selected.has(p.user_id)} onChange={() => toggle(p.user_id)} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-neutral-900">{p.name || "Unnamed member"}</span>
                      <span className="block text-xs text-neutral-500">{ROLE_LABEL[p.role] ?? p.role}</span>
                      {p.locked_hubs.length > 0 && (
                        <span className="block text-xs text-warning-700 mt-0.5">
                          Will see locked blocks: {p.locked_hubs.map(hubLabel).join(", ")}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </fieldset>
          );
        }}
      </ResourceGate>
    </Drawer>
  );
}
