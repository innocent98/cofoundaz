"use client";

import React, { useCallback, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  createCustomMetric,
  deleteCustomMetric,
  listCustomMetrics,
  putCustomMetricPoints,
  toAnalyticsError,
  type CustomMetric,
} from "@/lib/api/analytics";
import { formatValue } from "@/lib/analytics-format";
import { toMinor } from "@/lib/finance/format";
import { useAnalyticsResource } from "@/hooks/useAnalyticsResource";
import { useToast } from "../ToastContext";
import {
  ConfirmDialog,
  Drawer,
  EmptyBlock,
  Field,
  FormError,
  ResourceGate,
  SkeletonRows,
  cardCls,
  dangerLinkBtn,
  darkBtn,
  inputCls,
  linkBtn,
  secondaryBtn,
} from "./ui";

const UNIT_LABEL: Record<CustomMetric["unit"], string> = { count: "Count", money: "Money (₦)", percent: "Percent" };

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(period: string): string {
  return new Date(`${period.slice(0, 7)}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

/**
 * "Entered by you" (D-ANA-2 b): numbers the platform cannot see, such as users or MRR, entered per
 * month. Founder and team member only; the API caps 20 metrics and 36 points per call.
 */
export function CustomMetricsPanel({ onChanged }: { onChanged: () => void }) {
  const { triggerToast } = useToast();
  const load = useCallback(() => listCustomMetrics(), []);
  const res = useAnalyticsResource(load);
  const [adding, setAdding] = useState(false);
  const [entering, setEntering] = useState<CustomMetric | null>(null);
  const [deleting, setDeleting] = useState<CustomMetric | null>(null);
  const [busy, setBusy] = useState(false);

  const changed = async () => {
    await res.reload();
    onChanged();
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteCustomMetric(deleting.id);
      triggerToast(`Deleted ${deleting.label}`);
      setDeleting(null);
      await changed();
    } catch (err) {
      triggerToast(toAnalyticsError(err, "Couldn't delete it. Try again.").message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="custom-h" className={`${cardCls} p-5 md:p-6 space-y-4`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 id="custom-h" className="text-lg font-display font-semibold text-neutral-900">
            Entered by you
          </h2>
          <p className="text-sm text-neutral-500">Numbers the platform can&apos;t see, like active users or MRR. Enter one value per month.</p>
        </div>
        <button type="button" className={secondaryBtn} onClick={() => setAdding(true)}>
          <Plus className="w-4 h-4" aria-hidden="true" /> Add a metric
        </button>
      </div>
      <ResourceGate resource={res} skeleton={<SkeletonRows rows={2} label="Loading your metrics" />}>
        {(metrics) =>
          metrics.length === 0 ? (
            <EmptyBlock title="No metrics of your own yet" body="Add one to track something the hubs don't record. It appears in reports labelled “Entered by you”." />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {metrics.map((m) => {
                const last = m.points[m.points.length - 1];
                return (
                  <li key={m.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">{m.label}</p>
                      <p className="text-xs text-neutral-500">
                        {UNIT_LABEL[m.unit]} ·{" "}
                        {last ? `${formatValue(last.value, m.unit, m.currency)} in ${monthLabel(last.period)}` : "No values yet"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button type="button" className={linkBtn} onClick={() => setEntering(m)}>
                        Enter a value
                      </button>
                      <button type="button" className={dangerLinkBtn} onClick={() => setDeleting(m)} aria-label={`Delete ${m.label}`}>
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        }
      </ResourceGate>
      {adding && (
        <AddMetricDrawer
          onClose={() => setAdding(false)}
          onSaved={async (m) => {
            setAdding(false);
            triggerToast(`Added ${m.label}`);
            await changed();
            setEntering(m);
          }}
        />
      )}
      {entering && (
        <EnterValueDrawer
          metric={entering}
          onClose={() => setEntering(null)}
          onSaved={async () => {
            setEntering(null);
            triggerToast("Value saved");
            await changed();
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.label}?`}
          body="Its values are deleted too. Reports that used it will say “Metric no longer available”."
          confirmLabel="Delete"
          danger
          busy={busy}
          onConfirm={() => void remove()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </section>
  );
}

function AddMetricDrawer({ onClose, onSaved }: { onClose: () => void; onSaved: (m: CustomMetric) => void }) {
  const [label, setLabel] = useState("");
  const [unit, setUnit] = useState<CustomMetric["unit"]>("count");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError("Give the metric a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onSaved(await createCustomMetric(label.trim(), unit));
    } catch (err) {
      setError(toAnalyticsError(err, "Couldn't add the metric. Try again.").message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      title="Add a metric"
      onClose={onClose}
      footer={
        <div className="flex gap-3 justify-end">
          <button type="button" className={secondaryBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="add-metric" className={darkBtn} disabled={busy}>
            {busy ? "Adding" : "Add metric"}
          </button>
        </div>
      }
    >
      <form id="add-metric" onSubmit={(e) => void save(e)} className="space-y-4">
        <FormError message={error} />
        <Field label="Name" htmlFor="cm-label" hint="For example: Active users, MRR, Churn">
          <input id="cm-label" className={inputCls} value={label} maxLength={80} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Field label="Unit" htmlFor="cm-unit">
          <select id="cm-unit" className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value as CustomMetric["unit"])}>
            {Object.entries(UNIT_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
      </form>
    </Drawer>
  );
}

function EnterValueDrawer({ metric, onClose, onSaved }: { metric: CustomMetric; onClose: () => void; onSaved: () => void }) {
  const [month, setMonth] = useState(currentMonth());
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    let num: number | null;
    if (metric.unit === "money") num = toMinor(value);
    else if (metric.unit === "count") num = /^\d+$/.test(value.trim().replace(/,/g, "")) ? Number(value.trim().replace(/,/g, "")) : null;
    else num = value.trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
    if (num === null) {
      setError(metric.unit === "percent" ? "Enter a number." : "Enter a whole, non-negative number.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await putCustomMetricPoints(metric.id, [{ period: month, value: num }]);
      onSaved();
    } catch (err) {
      setError(toAnalyticsError(err, "Couldn't save the value. Try again.").message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      title={`Enter ${metric.label}`}
      onClose={onClose}
      footer={
        <div className="flex gap-3 justify-end">
          <button type="button" className={secondaryBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="enter-value" className={darkBtn} disabled={busy}>
            {busy ? "Saving" : "Save value"}
          </button>
        </div>
      }
    >
      <form id="enter-value" onSubmit={(e) => void save(e)} className="space-y-4">
        <FormError message={error} />
        <Field label="Month" htmlFor="cv-month" hint="Saving a month that already has a value replaces it.">
          <input id="cv-month" type="month" className={inputCls} value={month} max={currentMonth()} onChange={(e) => setMonth(e.target.value)} />
        </Field>
        <Field label={metric.unit === "money" ? "Value (₦)" : metric.unit === "percent" ? "Value (%)" : "Value"} htmlFor="cv-value">
          <input id="cv-value" inputMode="decimal" className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} />
        </Field>
        {metric.points.length > 0 && (
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Recent values</p>
            <ul className="text-sm divide-y divide-neutral-100">
              {metric.points
                .slice(-6)
                .reverse()
                .map((p) => (
                  <li key={p.period} className="py-1.5 flex justify-between">
                    <span className="text-neutral-600">{monthLabel(p.period)}</span>
                    <span className="tabular-nums font-medium">{formatValue(p.value, metric.unit, metric.currency)}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </form>
    </Drawer>
  );
}
