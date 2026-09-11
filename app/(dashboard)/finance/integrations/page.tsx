"use client";

import React, { useState } from "react";
import { useFinanceApi } from "@/hooks/useFinanceApi";
import { useToast } from "../ToastContext";
import { AlertTriangle } from "lucide-react";

export default function IntegrationsPage() {
  const { integrations, toggleIntegration } = useFinanceApi();
  const { triggerToast } = useToast();
  
  const [modalState, setModalState] = useState<{isOpen: boolean, targetId: string, targetName: string}>({
    isOpen: false,
    targetId: "",
    targetName: ""
  });

  const requestToggle = (id: string, name: string, status: string) => {
    if (status === "Connected") {
      setModalState({ isOpen: true, targetId: id, targetName: name });
    } else {
      toggleIntegration(id);
      triggerToast(`Connecting to ${name}...`);
    }
  };

  const confirmDisconnect = () => {
    toggleIntegration(modalState.targetId);
    triggerToast(`${modalState.targetName} disconnected successfully.`);
    setModalState({ isOpen: false, targetId: "", targetName: "" });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">Integrations</h1>
        <p className="text-sm text-sage-600">Connect your accounting software and banks for real-time synchronization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item) => {
          const isConnected = item.status === "Connected";
          return (
            <div key={item.id} className="bg-white p-6 rounded-modal border border-sage-200/80 shadow-card flex flex-col justify-between space-y-6">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-card bg-sage-100 flex items-center justify-center font-bold text-sage-800 text-sm border border-sage-200/60 flex-shrink-0">
                  {item.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sage-900 text-base">{item.name}</h3>
                    {isConnected && (
                      <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                    )}
                  </div>
                  <p className="text-xs text-sage-500 mt-0.5 font-medium">{item.description}</p>
                </div>
              </div>

              <button
                onClick={() => requestToggle(item.id, item.name, item.status)}
                className={`w-full py-2.5 px-4 rounded-card text-sm font-medium transition-all cursor-pointer flex items-center justify-center shadow-sm ${
                  isConnected
                    ? "bg-white text-[#B0483B] border border-[#ffcccc] hover:bg-[#fff0f0]"
                    : "bg-[#9C5B34] text-white hover:bg-[#8A5330]"
                }`}
              >
                {isConnected ? "Disconnect" : "Connect"}
              </button>
            </div>
          );
        })}
      </div>

      {modalState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-fadeIn">
          <div className="bg-white rounded-modal p-6 md:p-8 w-full max-w-sm shadow-xl space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#fff0f0] text-[#B0483B] flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-display font-bold text-sage-900">Disconnect {modalState.targetName}?</h2>
              <p className="text-sm text-sage-500">
                You will lose real-time syncing capabilities. You can reconnect at any time.
              </p>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setModalState({ isOpen: false, targetId: "", targetName: "" })}
                className="flex-1 px-4 py-2 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-card text-sm font-semibold transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDisconnect}
                className="flex-1 bg-[#B0483B] hover:bg-[#9a3a2e] text-white font-semibold px-4 py-2 rounded-card text-sm transition-colors shadow-sm"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
