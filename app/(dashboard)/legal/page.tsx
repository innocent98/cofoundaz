"use client";

import React, { useCallback, useState } from "react";
import { Check, ChevronDown, Info } from "lucide-react";
import { getFormationChecklist, listJurisdictions, setFormationStep, toLegalError, type FormationChecklist } from "@/lib/api/legal";
import { stepMeta } from "@/lib/legal-format";
import { useLegalResource } from "@/hooks/useLegalResource";
import { useToast } from "./ToastContext";
import { useLegalAccess } from "./_components/useLegalAccess";
import { EmptyBlock, ErrorBlock, ForbiddenBlock, PageHeader, ResourceGate, SkeletonRows, labelCls } from "./_components/ui";

export default function FormationPage() {
  const jurisdictions = useLegalResource(listJurisdictions);
  const [chosen, setChosen] = useState<string | null>(null);
  // Default to the first jurisdiction the API serves until the user picks another.
  const code = chosen ?? jurisdictions.data?.[0]?.code ?? null;
  const setCode = setChosen;

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader title="Get the foundation right" subtitle="A jurisdiction-specific path to a properly formed company." />

      <ResourceGate resource={jurisdictions} skeleton={<SkeletonRows rows={1} label="Loading jurisdictions" />}>
        {(list) =>
          list.length === 0 ? (
            <div className="bg-white rounded-modal border border-neutral-200 shadow-card">
              <EmptyBlock title="No jurisdictions available" body="There is no formation guidance to show yet." />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label htmlFor="jurisdiction" className={labelCls}>
                  Where are you incorporating?
                </label>
                <div className="relative">
                  <select
                    id="jurisdiction"
                    value={code ?? ""}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-card px-4 py-3 max-md:min-h-11 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-rail-deep/20 appearance-none cursor-pointer"
                  >
                    {list.map((j) => (
                      <option key={j.code} value={j.code}>
                        {j.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                </div>
              </div>
              {code && <Checklist key={code} code={code} />}
            </>
          )
        }
      </ResourceGate>
    </div>
  );
}

function Checklist({ code }: { code: string }) {
  const { canWrite } = useLegalAccess();
  const { triggerToast } = useToast();
  const load = useCallback(() => getFormationChecklist(code), [code]);
  const resource = useLegalResource<FormationChecklist>(load);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const toggle = async (key: string, completed: boolean) => {
    if (busyKey) return;
    setBusyKey(key);
    try {
      // The reply is the whole checklist again, so no follow-up GET is needed.
      resource.setData(await setFormationStep(key, code, completed));
    } catch (err) {
      triggerToast(toLegalError(err, "Couldn't update that step. Try again.").message, "error");
    } finally {
      setBusyKey(null);
    }
  };

  if (resource.status === "loading") return <SkeletonRows label="Loading checklist" />;
  if (resource.status === "forbidden") return <ForbiddenBlock />;
  if (resource.status === "error" || !resource.data) {
    return <ErrorBlock message={resource.error ?? "Couldn't load this. Try again."} onRetry={() => void resource.reload()} />;
  }

  const { steps, disclaimer, estimates, jurisdiction } = resource.data;
  const done = steps.filter((s) => s.completed).length;
  const allCompleted = steps.length > 0 && done === steps.length;

  return (
    <div className="space-y-6">
      <p className="text-sm font-medium text-neutral-600" aria-live="polite">
        {done} of {steps.length} steps done
      </p>

      <div className="bg-white rounded-modal border border-neutral-200/90 shadow-card divide-y divide-neutral-100 overflow-hidden">
        {steps.length === 0 && <EmptyBlock title="No steps for this jurisdiction" body="Check back when guidance is added." />}
        {steps.map((step) => {
          const meta = stepMeta(step);
          const body = (
            <>
              <span
                aria-hidden="true"
                className={`w-6 h-6 shrink-0 rounded-input flex items-center justify-center transition-colors border ${
                  step.completed ? "bg-brand-hover border-brand-hover text-white" : "bg-white border-neutral-300 text-transparent"
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
              <span className="text-left min-w-0">
                <span className={`block font-semibold text-sm ${step.completed ? "line-through text-neutral-400" : "text-neutral-900"}`}>
                  {step.title}
                </span>
                {meta && <span className="block text-xs text-neutral-500 mt-0.5">{meta}</span>}
              </span>
            </>
          );
          return canWrite ? (
            <button
              key={step.key}
              type="button"
              role="checkbox"
              aria-checked={step.completed}
              aria-label={step.title}
              disabled={busyKey !== null}
              onClick={() => void toggle(step.key, !step.completed)}
              className="w-full p-5 flex items-center gap-4 max-md:min-h-11 hover:bg-neutral-50/60 transition-colors cursor-pointer select-none disabled:cursor-wait disabled:opacity-70"
            >
              {body}
            </button>
          ) : (
            <div key={step.key} className="p-5 flex items-center gap-4" aria-label={`${step.title}: ${step.completed ? "done" : "not done"}`}>
              {body}
            </div>
          );
        })}
      </div>

      {allCompleted && (
        <div role="status" className="bg-brand-50 border border-brand-200 rounded-modal p-6 text-center shadow-card">
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 stroke-[3]" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-brand-900 mb-1">All formation steps marked done</h2>
          <p className="text-sm text-brand-700 font-medium">
            You have ticked every step for {jurisdiction.name}. Keep your certificates and filings somewhere safe.
          </p>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-card border border-neutral-200 bg-white p-4 text-xs text-neutral-600">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-neutral-500" aria-hidden="true" />
        <div className="space-y-1">
          <p>{disclaimer}</p>
          {estimates && <p className="text-neutral-500">Timings and fees shown are estimates, not verified figures.</p>}
        </div>
      </div>
    </div>
  );
}
