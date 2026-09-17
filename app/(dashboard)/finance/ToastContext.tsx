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
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 bg-[#0e271f] text-white px-5 py-3 rounded-card shadow-raised transition-all duration-300 border border-sage-700 animate-fadeIn">
          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
          <p className="text-sm font-medium">{notificationMessage}</p>
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
