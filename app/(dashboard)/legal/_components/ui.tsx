"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { ModalDialog } from "@/components/modal-dialog";
import type { LegalResource } from "@/hooks/useLegalResource";

// Shared building blocks for the Legal pages: the data states, the drawer and
// dialog shells, and the form control classes, so every page renders loading,
// empty and error the same way.

export const inputCls =
  "w-full bg-neutral-50 border border-neutral-200 rounded-input px-3 py-2.5 max-md:min-h-11 text-sm text-neutral-900 focus:outline-none focus:border-accent-600";
export const labelCls = "text-xs font-bold text-neutral-500 uppercase tracking-wider";
export const primaryBtn =
  "bg-accent-600 text-white px-4 py-2 max-md:min-h-11 rounded-card text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-accent-700 transition-colors shadow-card disabled:opacity-60 disabled:cursor-not-allowed";
export const darkBtn =
  "bg-brand-900 text-white px-4 py-2 max-md:min-h-11 rounded-card text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-brand-800 transition-colors shadow-card disabled:opacity-60 disabled:cursor-not-allowed";
export const secondaryBtn =
  "bg-white text-neutral-700 border border-neutral-200 px-4 py-2 max-md:min-h-11 rounded-card text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-neutral-50 transition-colors shadow-card disabled:opacity-60 disabled:cursor-not-allowed";
export const dangerBtn =
  "bg-danger-600 text-white px-4 py-2 max-md:min-h-11 rounded-card text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-danger-700 transition-colors shadow-card disabled:opacity-60 disabled:cursor-not-allowed";
export const linkBtn =
  "inline-flex items-center gap-1 max-md:min-h-11 text-xs font-bold text-brand-800 hover:underline disabled:opacity-50";
export const dangerLinkBtn =
  "inline-flex items-center gap-1 max-md:min-h-11 text-xs font-bold text-danger-600 hover:underline disabled:opacity-50";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-display font-semibold text-neutral-900 mb-1">{title}</h1>
        <p className="text-sm text-neutral-600">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

/** Skeleton rows while a list loads. */
export function SkeletonRows({ rows = 4, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="bg-white rounded-modal border border-neutral-200 shadow-card divide-y divide-neutral-100 overflow-hidden"
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="p-5 flex items-center gap-4 animate-pulse">
          <div className="w-6 h-6 rounded-input bg-neutral-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 rounded bg-neutral-100" />
            <div className="h-3 w-1/4 rounded bg-neutral-100" />
          </div>
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="bg-danger-50 border border-danger-200 rounded-modal p-6 flex flex-col items-center text-center gap-3">
      <AlertTriangle className="w-6 h-6 text-danger-600" aria-hidden="true" />
      <p className="text-sm font-semibold text-danger-700">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={secondaryBtn}>
          Retry
        </button>
      )}
    </div>
  );
}

export function ForbiddenBlock() {
  return (
    <div role="alert" className="bg-white rounded-modal border border-neutral-200 shadow-card p-12 text-center">
      <h2 className="text-xl font-display font-bold text-neutral-900 mb-2">Not available for your role</h2>
      <p className="text-sm text-neutral-500 max-w-sm mx-auto">
        Legal is open to founders, team members and legal advisors. Ask a founder in this workspace to change your role if you
        need access.
      </p>
    </div>
  );
}

export function EmptyBlock({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="p-10 flex flex-col items-center justify-center text-center">
      <h3 className="text-lg font-display font-bold text-neutral-900 mb-1">{title}</h3>
      <p className="text-sm text-neutral-500 mb-4 max-w-md">{body}</p>
      {children && <div className="flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

/** Renders skeleton / forbidden / error + Retry for a resource that is not ready; `children` gets the data. */
export function ResourceGate<T>({
  resource,
  skeleton,
  children,
}: {
  resource: LegalResource<T>;
  skeleton?: React.ReactNode;
  children: (data: T) => React.ReactNode;
}) {
  if (resource.status === "loading") return <>{skeleton ?? <SkeletonRows />}</>;
  if (resource.status === "forbidden") return <ForbiddenBlock />;
  if (resource.status === "error" || resource.data === null) {
    return <ErrorBlock message={resource.error ?? "Couldn't load this. Try again."} onRetry={() => void resource.reload()} />;
  }
  return <>{children(resource.data)}</>;
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm font-medium text-danger-600 bg-danger-50 border border-danger-200 rounded-input px-3 py-2">
      {message}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-neutral-500">{hint}</p>}
      {error && <p className="text-xs font-medium text-danger-600">{error}</p>}
    </div>
  );
}

/** Right-hand drawer, full width at phone size. Mount it only while open. */
export function Drawer({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <ModalDialog
      label={title}
      onClose={onClose}
      overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[80] animate-fadeIn flex justify-end"
      className="w-full md:max-w-md h-full bg-white shadow-accent border-l border-neutral-200 flex flex-col outline-none"
    >
      <div className="flex items-center justify-between p-5 md:p-6 border-b border-neutral-100">
        <h2 className="text-xl font-display font-bold text-neutral-900">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex items-center justify-center p-2 max-md:min-h-11 max-md:min-w-11 rounded-full hover:bg-neutral-100 text-neutral-500"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">{children}</div>
      {footer && <div className="p-5 md:p-6 border-t border-neutral-100 bg-neutral-50/50">{footer}</div>}
    </ModalDialog>
  );
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger = false,
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalDialog
      label={title}
      onClose={onCancel}
      overlayClassName="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
      className="bg-white rounded-modal p-6 w-full max-w-md shadow-accent space-y-5 outline-none"
    >
      <h2 className="text-xl font-display font-bold text-neutral-900">{title}</h2>
      <p className="text-sm text-neutral-600">{body}</p>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className={secondaryBtn} disabled={busy}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} className={danger ? dangerBtn : darkBtn} disabled={busy}>
          {busy ? "Working" : confirmLabel}
        </button>
      </div>
    </ModalDialog>
  );
}

export function StatusChip({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${className}`}>
      {label}
    </span>
  );
}
