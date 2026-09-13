"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Check } from 'lucide-react';

interface ToastContextType {
  triggerToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const triggerToast = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
  };

  return (
    <ToastContext.Provider value={{ triggerToast }}>
      {children}
      {showNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0e271f] text-white px-5 py-3 rounded-modal shadow-raised flex items-center gap-3 border border-[#23483b] animate-bounce">
          <div className="w-5 h-5 rounded-full bg-[#1e4836] flex items-center justify-center text-white">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span className="text-sm font-medium">{notificationMessage}</span>
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
