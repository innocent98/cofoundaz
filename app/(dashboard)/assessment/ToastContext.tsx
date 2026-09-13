"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ToastContextType {
  triggerToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });

  const triggerToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ triggerToast }}>
      {children}
      {toast.show && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-[#0e271f] text-white px-5 py-2.5 rounded-card shadow-raised flex items-center gap-3 border border-[#1f4236]">
            <div className="flex items-center justify-center text-green-400 font-bold text-sm">
              ✓
            </div>
            <span className="font-medium text-sm tracking-wide text-sage-100">
              {toast.message}
            </span>
          </div>
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
