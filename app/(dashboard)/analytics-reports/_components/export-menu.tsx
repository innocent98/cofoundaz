"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Download, Loader2 } from "lucide-react";
import { downloadExport, isStaleExportError, toAnalyticsError, type ExportRow } from "@/lib/api/analytics";
import { exportStatusView } from "@/lib/analytics-format";
import { useExportWatch } from "@/hooks/useExportWatch";
import { useToast } from "../ToastContext";
import { secondaryBtn } from "./ui";

export interface ExportOption {
  label: string;
  /** Starts the export; resolves with the pending row (202). */
  start: () => Promise<ExportRow>;
}

/**
 * "Export ▾" with a short list of formats. The file is made by a background job: the menu follows
 * the new row (2 s, then 5 s, stop at 2 minutes) and turns into a Download button when it is ready.
 */
export function ExportMenu({
  options,
  disabled,
  disabledReason,
  note,
  label = "Export",
}: {
  options: ExportOption[];
  disabled?: boolean;
  disabledReason?: string;
  /** Shown inside the menu above the options (e.g. the accountant's locked-blocks warning). */
  note?: string;
  label?: string;
}) {
  const { triggerToast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { rows, stale, watch, refresh } = useExportWatch((row) => {
    if (row.status === "ready") triggerToast(`Your export is ready: ${row.name}`);
    else triggerToast(exportStatusView(row).detail, "error");
  });
  const row = current ? rows[current] : null;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = async (opt: ExportOption) => {
    setOpen(false);
    setBusy(true);
    try {
      const created = await opt.start();
      setCurrent(created.id);
      watch(created);
    } catch (err) {
      triggerToast(toAnalyticsError(err, "Couldn't start the export. Try again.").message, "error");
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!row) return;
    try {
      await downloadExport(row);
    } catch (err) {
      const e = toAnalyticsError(err, "Couldn't download the file. Try again.");
      triggerToast(e.message, "error");
      // 410 expired / 409 failed: the row must stop saying "Ready".
      if (isStaleExportError(e.code)) await refresh(row.id);
    }
  };

  return (
    <div className="flex flex-col items-stretch md:items-end gap-1.5" ref={wrapRef}>
      <div className="relative">
        <button
          type="button"
          className={`${secondaryBtn} w-full md:w-auto`}
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={disabled || busy}
          title={disabled ? disabledReason : undefined}
          onClick={() => setOpen((o) => !o)}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Download className="w-4 h-4" aria-hidden="true" />}
          {label}
          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
        {open && (
          <div role="menu" className="absolute right-0 left-0 md:left-auto mt-1 z-30 md:w-64 bg-white border border-neutral-200 rounded-card shadow-raised p-1.5">
            {note && <p className="text-xs text-warning-700 bg-warning-50 rounded-input px-2.5 py-2 mb-1">{note}</p>}
            {options.map((o) => (
              <button
                key={o.label}
                type="button"
                role="menuitem"
                onClick={() => void pick(o)}
                className="w-full text-left px-3 py-2 max-md:min-h-11 rounded-input text-sm font-medium text-neutral-800 hover:bg-neutral-50"
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {disabled && disabledReason && <p className="text-[11px] text-neutral-500 md:text-right">{disabledReason}</p>}
      {row && (
        <div role="status" aria-live="polite" className="text-xs text-neutral-600 flex items-center gap-2 flex-wrap md:justify-end">
          {row.status === "pending" && !stale.has(row.id) && (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Generating {row.format.toUpperCase()}…
            </>
          )}
          {row.status === "pending" && stale.has(row.id) && (
            <span>
              Still working. Check{" "}
              <Link className="font-bold text-brand-800 hover:underline" href={`/analytics-reports/exports?highlight=${row.id}`}>
                Export history
              </Link>
              .
            </span>
          )}
          {row.status === "ready" && (
            <>
              <button type="button" onClick={() => void download()} className="inline-flex items-center gap-1 max-md:min-h-11 font-bold text-brand-800 hover:underline">
                <Download className="w-3.5 h-3.5" aria-hidden="true" /> Download {row.format.toUpperCase()}
              </button>
              <Link className="text-neutral-500 hover:underline max-md:min-h-11 inline-flex items-center" href={`/analytics-reports/exports?highlight=${row.id}`}>
                In Export history
              </Link>
            </>
          )}
          {(row.status === "failed" || row.status === "expired") && <span className="text-danger-700">{exportStatusView(row).detail}</span>}
        </div>
      )}
    </div>
  );
}
