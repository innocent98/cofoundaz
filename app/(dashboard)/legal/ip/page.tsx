"use client";

import React, { useState } from "react";
import { useLegalApi } from "@/hooks/useLegalApi";
import { useToast } from "../ToastContext";
import { Plus, X } from "lucide-react";

export default function IPTrackerPage() {
  const { ipAssets } = useLegalApi();
  const { triggerToast } = useToast();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleAddAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDrawerOpen(false);
    triggerToast("IP asset added successfully.");
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">IP tracker</h1>
          <p className="text-sm text-sage-600">Protect and monitor your intellectual property portfolio.</p>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-4 py-2.5 rounded-card text-sm transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add asset</span>
        </button>
      </div>

      <div className="bg-white rounded-modal border border-sage-200/90 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-sage-50/50 border-b border-sage-100 text-[11px] font-bold uppercase tracking-wider text-sage-400">
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Jurisdiction</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Renewal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100 text-sm">
              {ipAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-sage-50/60 transition-colors">
                  <td className="py-4 px-6 text-sage-800 font-medium">{asset.type}</td>
                  <td className="py-4 px-6 text-sage-900 font-semibold">{asset.name}</td>
                  <td className="py-4 px-6 text-sage-600">{asset.jurisdiction}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                      asset.status === 'Expired' ? 'bg-[#fff0f0] text-[#B0483B] border-[#ffcccc]' :
                      asset.statusBg
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sage-600 font-medium">
                    {asset.status === 'Expired' ? (
                      <button 
                        onClick={() => triggerToast(`Initiating renewal for ${asset.name}`)}
                        className="text-[#B0483B] hover:underline font-bold text-xs flex items-center gap-1"
                      >
                        {asset.renewal} <span aria-hidden="true">&rarr;</span>
                      </button>
                    ) : (
                      asset.renewal
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ipAssets.length === 0 && (
            <div className="p-8 text-center text-sage-500 font-medium text-sm">
              No IP assets tracked yet.
            </div>
          )}
        </div>
      </div>

      {/* ADD IP ASSET DRAWER */}
      {isDrawerOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] animate-fadeIn"
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[70] border-l border-sage-200 flex flex-col animate-[slideInRight_0.3s_ease-out]">
            <div className="flex items-center justify-between p-6 border-b border-sage-100">
              <h2 className="text-xl font-display font-bold text-sage-900">Add IP Asset</h2>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-sage-100 text-sage-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAssetSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-sage-500 uppercase tracking-wider">Asset Type</label>
                  <select 
                    required
                    className="w-full bg-sage-50 border border-sage-200 rounded-input px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e4836] transition-colors"
                  >
                    <option value="">Select type...</option>
                    <option value="Trademark">Trademark</option>
                    <option value="Patent">Patent</option>
                    <option value="Copyright">Copyright</option>
                    <option value="Domain">Domain</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-sage-500 uppercase tracking-wider">Asset Name / Mark</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Acme Corp Logo"
                    className="w-full bg-sage-50 border border-sage-200 rounded-input px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e4836] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-sage-500 uppercase tracking-wider">Jurisdiction</label>
                  <select 
                    required
                    className="w-full bg-sage-50 border border-sage-200 rounded-input px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e4836] transition-colors"
                  >
                    <option value="Global">Global</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="USA">USA</option>
                    <option value="EU">EU</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-sage-500 uppercase tracking-wider">Status</label>
                  <select 
                    required
                    className="w-full bg-sage-50 border border-sage-200 rounded-input px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e4836] transition-colors"
                  >
                    <option value="Drafting">Drafting</option>
                    <option value="Filed">Filed / Pending</option>
                    <option value="Registered">Registered</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-sage-500 uppercase tracking-wider">Renewal Date (Optional)</label>
                  <input 
                    type="date" 
                    className="w-full bg-sage-50 border border-sage-200 rounded-input px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e4836] transition-colors"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-sage-100 bg-sage-50/50">
                <button
                  type="submit"
                  className="w-full bg-[#1e3b30] hover:bg-[#152a22] text-white font-semibold py-3 px-4 rounded-card transition-colors flex items-center justify-center shadow-sm"
                >
                  Save IP Asset
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
