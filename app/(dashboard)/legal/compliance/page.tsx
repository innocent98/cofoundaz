"use client";

import React, { useState } from "react";
import { useLegalApi } from "@/hooks/useLegalApi";
import { useToast } from "../ToastContext";
import { AlertTriangle, UploadCloud } from "lucide-react";

export default function ComplianceCalendarPage() {
  const { complianceItems } = useLegalApi();
  const { triggerToast } = useToast();
  
  const [viewMode, setViewMode] = useState<"List" | "Calendar">("List");

  const overdueCount = complianceItems.filter(i => i.status === "Overdue").length;

  const handleMarkDone = (filing: string) => {
    triggerToast(`Prompting for proof upload to mark ${filing} as Done.`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-neutral-900 mb-1">Compliance calendar</h1>
          <p className="text-sm text-neutral-600">Track and manage mandatory filings and deadlines.</p>
        </div>
        
        <div className="flex bg-white rounded-card border border-neutral-200 overflow-hidden shadow-card">
          <button 
            onClick={() => setViewMode("List")}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${viewMode === "List" ? "bg-neutral-100 text-neutral-900" : "text-neutral-500 hover:bg-neutral-50"}`}
          >
            List
          </button>
          <button 
            onClick={() => {
              setViewMode("Calendar");
              triggerToast("Calendar view is not fully supported in this demo.");
            }}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-l border-neutral-200 ${viewMode === "Calendar" ? "bg-neutral-100 text-neutral-900" : "text-neutral-500 hover:bg-neutral-50"}`}
          >
            Calendar
          </button>
        </div>
      </div>

      {overdueCount > 0 && (
        <div className="bg-neutral-xfff0f0 border border-danger-xffcccc text-danger-600 px-5 py-3.5 rounded-card text-sm font-medium flex items-center gap-3 shadow-card">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{overdueCount} filing overdue. These carry penalties, handle it first.</span>
        </div>
      )}

      {viewMode === "List" ? (
        <div className="bg-white rounded-modal border border-neutral-200/90 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-100 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="py-4 px-6">Filing</th>
                  <th className="py-4 px-6">Authority</th>
                  <th className="py-4 px-6">Due</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                {complianceItems.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-4 px-6 text-neutral-900 font-semibold">{item.filing}</td>
                    <td className="py-4 px-6 text-neutral-600">{item.authority}</td>
                    <td className={`py-4 px-6 font-medium ${item.dueColor || "text-neutral-600"}`}>{item.due}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                        item.status === 'Overdue' ? 'bg-neutral-xfff0f0 text-danger-600 border-danger-xffcccc' :
                        item.status === 'Done' ? 'bg-brand-50 text-brand-700 border-brand-200' :
                        item.statusBg
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {item.status !== "Done" && (
                        <button 
                          onClick={() => handleMarkDone(item.filing)}
                          className="text-brand-x1e3b30 hover:text-black font-semibold text-xs flex items-center justify-end gap-1.5 w-full transition-colors"
                        >
                          <UploadCloud className="w-3.5 h-3.5" /> Mark done
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-modal border border-neutral-200/90 shadow-card p-12 text-center text-neutral-500 font-medium">
          Calendar view rendering placeholder.
        </div>
      )}
    </div>
  );
}
