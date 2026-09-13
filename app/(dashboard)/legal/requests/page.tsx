"use client";

import React, { useState } from "react";
import { useLegalApi } from "@/hooks/useLegalApi";
import { useToast } from "../ToastContext";
import { Plus, X } from "lucide-react";

export default function AdvisorRequestsPage() {
  const { advisorRequests, addAdvisorRequest } = useLegalApi();
  const { triggerToast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      addAdvisorRequest(newTitle, "Custom request · Tayo N.");
      setNewTitle("");
      setIsDialogOpen(false);
      triggerToast("New advisor request opened.");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">Legal advisor requests</h1>
          <p className="text-sm text-sage-600">Collaborate with legal professionals on custom reviews and filings.</p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-4 py-2.5 rounded-card text-sm transition-colors cursor-pointer flex items-center gap-1 shadow-card"
        >
          <Plus className="w-4 h-4" />
          <span>New request</span>
        </button>
      </div>

      <div className="space-y-3">
        {advisorRequests.map((req) => (
          <div key={req.id} className="bg-white rounded-modal border border-sage-200/90 p-5 shadow-card flex items-center justify-between gap-4 transition-colors hover:border-[#1e4836]/30 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-card bg-[#0e271f] text-white flex items-center justify-center font-bold text-sm shrink-0">
                TN
              </div>
              <div>
                <h4 className="font-semibold text-base text-sage-900">{req.title}</h4>
                <p className="text-xs text-sage-500 mt-0.5">{req.subtitle} <span className="mx-1">•</span> <span className="font-medium">1 comment</span></p>
              </div>
            </div>

            <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 border uppercase tracking-wider ${
              req.status === 'Requested' ? 'bg-sage-50 border-sage-200 text-sage-600' :
              req.status === 'In review' ? 'bg-[#f5efe6] border-[#e8d5c4] text-[#8A5330]' :
              'bg-[#e2ede6] border-[#d2e2d8] text-[#1e4836]'
            }`}>
              {req.status}
            </span>
          </div>
        ))}
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-fadeIn">
          <div className="bg-white rounded-modal p-6 w-full max-w-md shadow-accent space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-sage-900">New Advisor Request</h2>
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="p-2 rounded-full hover:bg-sage-100 text-sage-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-sage-500 uppercase tracking-wider">Request Title</label>
                <input 
                  type="text" 
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Review updated terms of service"
                  className="w-full bg-sage-50 border border-sage-200 rounded-input px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e4836] transition-colors"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-sage-500 uppercase tracking-wider">Context / Instructions</label>
                <textarea 
                  rows={4}
                  placeholder="Describe what you need help with..."
                  className="w-full bg-sage-50 border border-sage-200 rounded-input px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e4836] transition-colors resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 px-4 py-2 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-card text-sm font-semibold transition-colors shadow-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-4 py-2 rounded-card text-sm transition-colors shadow-card"
                >
                  Create request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
