"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Check, AlertTriangle } from "lucide-react";

interface ToastContextType {
  triggerToast: (msg: string, kind?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastKind, setToastKind] = useState<'success' | 'error'>('success');

  // One timer: a newer toast must not be cut short by an older toast's timeout.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const triggerToast = useCallback((msg: string, kind: 'success' | 'error' = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToastKind(kind);
    setToastMessage(msg);
    timer.current = setTimeout(() => {
      setToastMessage(null);
    }, kind === 'error' ? 6000 : 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ triggerToast }}>
      {children}
      {toastMessage && (
        <div
          role={toastKind === 'error' ? 'alert' : 'status'}
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] max-w-[calc(100vw-2rem)] text-white px-5 py-3 rounded-modal shadow-raised flex items-center gap-3 border ${
            toastKind === 'error' ? 'bg-danger-bold border-danger-deep' : 'bg-brand-rail-deep border-brand-x23483b'
          }`}
        >
          <div className="w-5 h-5 shrink-0 rounded-full bg-white/20 flex items-center justify-center text-white">
            {toastKind === 'error' ? <AlertTriangle className="w-3 h-3" /> : <Check className="w-3 h-3 stroke-[3]" />}
          </div>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
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
