'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { calendarErrorMessage } from '@/lib/api/calendar';

type Kind = 'success' | 'error';

interface ToastApi {
  toast: (message: string, kind?: Kind) => void;
  /** Runs an API call; toasts the server's own sentence on failure. Resolves `{ok}` and never throws. */
  run: <T>(fn: () => Promise<T>, success?: string) => Promise<{ ok: true; value: T } | { ok: false; message: string }>;
}

const Ctx = createContext<ToastApi | null>(null);

export function CalendarToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ message: string; kind: Kind } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const toast = useCallback((message: string, kind: Kind = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setState({ message, kind });
    timer.current = setTimeout(() => setState(null), kind === 'error' ? 6000 : 4000);
  }, []);

  const run = useCallback<ToastApi['run']>(
    async (fn, success) => {
      try {
        const value = await fn();
        if (success) toast(success);
        return { ok: true, value };
      } catch (e) {
        const message = calendarErrorMessage(e);
        toast(message, 'error');
        return { ok: false, message };
      }
    },
    [toast],
  );

  return (
    <Ctx.Provider value={{ toast, run }}>
      {children}
      <div aria-live="polite" role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] max-w-[92vw]">
        {state && (
          <div
            className={`px-5 py-3 rounded-modal shadow-raised border text-xs font-semibold ${
              state.kind === 'error' ? 'bg-danger-tint text-danger-bold border-danger-bold' : 'bg-white text-ink border-line'
            }`}
          >
            {state.message}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export function useCalendarToast(): ToastApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCalendarToast must be used inside CalendarToastProvider');
  return ctx;
}
