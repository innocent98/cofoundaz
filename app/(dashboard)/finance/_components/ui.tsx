"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, Loader2, Lock, X } from "lucide-react";
import type { FinanceResource } from "@/hooks/useFinanceResource";

// Shared building blocks for the Finance Hub pages: the four data states, the
// dialog shell and the form control classes. Kept here so every page renders
// loading, empty, error and "not available for your role" the same way.

export const inputCls =
  "w-full bg-neutral-50 border border-neutral-200 rounded-input px-3 py-2 max-md:min-h-11 text-sm text-neutral-900 focus:outline-none focus:border-accent-600";
export const labelCls = "text-xs font-bold text-neutral-500 uppercase";
export const primaryBtn =
  "bg-accent-600 text-white px-4 py-2 max-md:min-h-11 rounded-card text-sm font-medium inline-flex items-center justify-center gap-1.5 hover:bg-accent-700 transition-colors shadow-card disabled:opacity-60 disabled:cursor-not-allowed";
export const darkBtn =
  "bg-brand-900 text-white px-4 py-2 max-md:min-h-11 rounded-card text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-brand-800 transition-colors shadow-card disabled:opacity-60 disabled:cursor-not-allowed";
export const secondaryBtn =
  "bg-white text-neutral-700 border border-neutral-200 px-4 py-2 max-md:min-h-11 rounded-card text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-neutral-50 transition-colors shadow-card disabled:opacity-60 disabled:cursor-not-allowed";
export const dangerBtn =
  "bg-danger-600 text-white px-4 py-2 max-md:min-h-11 rounded-card text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-danger-700 transition-colors shadow-card disabled:opacity-60 disabled:cursor-not-allowed";
export const linkBtn = "inline-flex items-center max-md:min-h-11 text-xs font-bold text-brand-800 hover:underline disabled:opacity-50";
export const dangerLinkBtn = "inline-flex items-center max-md:min-h-11 text-xs font-bold text-danger-600 hover:underline disabled:opacity-50";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
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

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-white rounded-modal border border-neutral-200 shadow-card p-12 flex items-center justify-center gap-3 text-sm text-neutral-500"
    >
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
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
          Try again
        </button>
      )}
    </div>
  );
}

export function ForbiddenBlock() {
  return (
    <div className="bg-white rounded-modal border border-neutral-200 shadow-card p-12 flex flex-col items-center text-center">
      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-neutral-500" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-display font-bold text-neutral-900 mb-2">Not available for your role</h2>
      <p className="text-sm text-neutral-500 max-w-sm">
        Finance is open to founders, team members and accountants. Ask a founder in this workspace to change your
        role if you need access.
      </p>
    </div>
  );
}

export function EmptyBlock({
  icon,
  title,
  body,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-modal border border-neutral-200 shadow-card p-12 flex flex-col items-center justify-center text-center">
      {icon && <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-neutral-500">{icon}</div>}
      <h3 className="text-xl font-display font-bold text-neutral-900 mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 mb-6 max-w-md">{body}</p>
      {children && <div className="flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

/** Renders the right block for a resource that is not ready; `children` gets the data. */
export function ResourceGate<T>({
  resource,
  loadingLabel,
  children,
}: {
  resource: FinanceResource<T>;
  loadingLabel?: string;
  children: (data: T) => React.ReactNode;
}) {
  if (resource.status === "loading") return <LoadingBlock label={loadingLabel} />;
  if (resource.status === "forbidden") return <ForbiddenBlock />;
  if (resource.status === "error" || resource.data === null) {
    return <ErrorBlock message={resource.error ?? "Couldn't load this."} onRetry={() => void resource.reload()} />;
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

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Move focus into the dialog once, so keyboard users land inside it.
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("input, select, textarea, button:not([aria-label='Close'])")?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-white rounded-modal p-6 w-full ${wide ? "max-w-2xl" : "max-w-md"} shadow-accent space-y-5 my-auto`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-neutral-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="inline-flex items-center justify-center max-md:min-h-11 max-md:min-w-11 text-neutral-500 hover:text-neutral-800">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
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
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-neutral-600">{body}</p>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className={secondaryBtn} disabled={busy}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} className={danger ? dangerBtn : darkBtn} disabled={busy}>
          {busy ? "Working" : confirmLabel}
        </button>
      </div>
    </Modal>
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
