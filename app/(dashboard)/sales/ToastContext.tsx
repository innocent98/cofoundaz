"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { salesErrorMessage } from "@/lib/api/sales";

type ToastKind = "success" | "error";

interface ToastState {
  show: boolean;
  message: string;
  kind: ToastKind;
}

export type ActionResult<T> = { ok: true; value: T } | { ok: false; message: string };

interface ToastContextType {
  triggerToast: (message: string, kind?: ToastKind) => void;
  /**
   * Run a real API action. On success toasts `successMessage` (when given) and
   * resolves ok; on failure toasts the API's own message and resolves not-ok.
   * It never throws.
   */
  runAction: <T>(fn: () => Promise<T>, successMessage?: string) => Promise<ActionResult<T>>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ show: false, message: "", kind: "success" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const triggerToast = useCallback((message: string, kind: ToastKind = "success") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ show: true, message, kind });
    timer.current = setTimeout(
      () => setToast({ show: false, message: "", kind }),
      kind === "error" ? 6000 : 4000
    );
  }, []);

  const runAction = useCallback(
    async <T,>(fn: () => Promise<T>, successMessage?: string): Promise<ActionResult<T>> => {
      try {
        const value = await fn();
        if (successMessage) triggerToast(successMessage);
        return { ok: true, value };
      } catch (err) {
        const message = salesErrorMessage(err);
        triggerToast(message, "error");
        return { ok: false, message };
      }
    },
    [triggerToast]
  );

  return (
    <ToastContext.Provider value={{ triggerToast, runAction }}>
      {children}
      <div aria-live="polite" role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] max-w-[92vw]">
        {toast.show && (
          <div
            className={`px-5 py-3 rounded-modal shadow-raised flex items-center gap-3 border ${
              toast.kind === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-[#0e271f] border-[#1f4236] text-sage-100"
            }`}
          >
            <span
              className={`font-bold text-sm ${toast.kind === "error" ? "text-red-600" : "text-green-400"}`}
              aria-hidden="true"
            >
              {toast.kind === "error" ? "!" : "✓"}
            </span>
            <span className="font-medium text-sm tracking-wide">{toast.message}</span>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
