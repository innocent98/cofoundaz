"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { AlertTriangle, Check } from 'lucide-react';

export type ToastKind = 'success' | 'error';

interface ToastContextType {
  triggerToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; kind: ToastKind; id: number } | null>(null);

  useEffect(() => {
    if (!toast) return;
    // Errors stay a little longer: they carry the API's reason.
    const timer = setTimeout(() => setToast(null), toast.kind === 'error' ? 7000 : 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const triggerToast = useCallback((message: string, kind: ToastKind = 'success') => {
    setToast({ message, kind, id: Date.now() });
  }, []);

  const value = useMemo(() => ({ triggerToast }), [triggerToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          role={toast.kind === 'error' ? 'alert' : 'status'}
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex max-w-[90vw] items-center gap-2.5 px-5 py-3 rounded-card shadow-raised transition-all duration-300 border animate-fadeIn text-white ${
            toast.kind === 'error' ? 'bg-danger-700 border-danger-800' : 'bg-brand-950 border-neutral-700'
          }`}
        >
          {toast.kind === 'error' ? (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          ) : (
            <Check className="w-4 h-4 text-brand-300 flex-shrink-0" aria-hidden="true" />
          )}
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
