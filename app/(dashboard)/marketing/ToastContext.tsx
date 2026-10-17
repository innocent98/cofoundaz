'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { marketingErrorMessage } from '@/lib/api/marketing';

type ToastKind = 'success' | 'error';

interface ToastState {
  show: boolean;
  message: string;
  kind: ToastKind;
}

export type ActionResult<T> = { ok: true; value: T } | { ok: false; message: string };

interface ToastContextType {
  toast: ToastState;
  triggerToast: (msg: string, kind?: ToastKind) => void;
  /**
   * Run a real API action. On success toasts `successMessage` and resolves ok;
   * on failure toasts the API's own message and resolves not-ok (never throws).
   */
  runAction: <T>(fn: () => Promise<T>, successMessage?: string) => Promise<ActionResult<T>>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', kind: 'success' });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const triggerToast = useCallback((message: string, kind: ToastKind = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ show: true, message, kind });
    timer.current = setTimeout(
      () => setToast({ show: false, message: '', kind }),
      kind === 'error' ? 6000 : 3500
    );
  }, []);

  const runAction = useCallback(
    async <T,>(fn: () => Promise<T>, successMessage?: string): Promise<ActionResult<T>> => {
      try {
        const value = await fn();
        if (successMessage) triggerToast(successMessage);
        return { ok: true, value };
      } catch (err) {
        const message = marketingErrorMessage(err);
        triggerToast(message, 'error');
        return { ok: false, message };
      }
    },
    [triggerToast]
  );

  return (
    <ToastContext.Provider value={{ toast, triggerToast, runAction }}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
