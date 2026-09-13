"use client";

import React, { useState } from "react";
import { useSalesApi } from "@/hooks/useSalesApi";
import { useToast } from "../ToastContext";

export default function LeadsPage() {
  const { leads, convertLead, addLead, importLeads } = useSalesApi();
  const { triggerToast } = useToast();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadCompany, setNewLeadCompany] = useState("");

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadCompany) return;
    addLead({
      name: newLeadName,
      company: newLeadCompany,
      source: "Manual",
      status: "New"
    });
    setNewLeadName("");
    setNewLeadCompany("");
    triggerToast(`Added lead: ${newLeadName}`);
  };

  const handleSimulateImport = () => {
    importLeads([
      { name: "John Doe", company: "Acme Corp", source: "Import", status: "New" },
      { name: "Jane Smith", company: "TechFlow", source: "Import", status: "New" }
    ]);
    setIsImportModalOpen(false);
    triggerToast("CSV import successful: 2 added, 1 duplicate skipped.");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Leads</h1>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white hover:bg-sage-50 text-sage-700 font-medium px-4 py-2 rounded-card text-sm border border-sage-300 transition-colors shadow-card"
          >
            Import CSV
          </button>
        </div>
      </div>

      {/* QUICK ADD BAR */}
      <form onSubmit={handleAddLead} className="bg-white rounded-modal border border-sage-200 shadow-card p-4 flex flex-col md:flex-row items-center gap-3">
        <input 
          type="text" 
          placeholder="Lead name" 
          value={newLeadName}
          onChange={(e) => setNewLeadName(e.target.value)}
          className="w-full md:flex-1 bg-sage-50 border border-sage-200 rounded-input px-3 py-2 text-sm focus:outline-none focus:border-sage-400"
        />
        <input 
          type="text" 
          placeholder="Company" 
          value={newLeadCompany}
          onChange={(e) => setNewLeadCompany(e.target.value)}
          className="w-full md:flex-1 bg-sage-50 border border-sage-200 rounded-input px-3 py-2 text-sm focus:outline-none focus:border-sage-400"
        />
        <button
          type="submit"
          className="w-full md:w-auto bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-6 py-2 rounded-input text-sm transition-colors shadow-card shrink-0"
        >
          + Add lead
        </button>
      </form>

      {/* LEADS TABLE */}
      <div className="bg-white rounded-modal border border-sage-200 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-sage-50/70 border-b border-sage-200 text-xs font-bold text-sage-400 uppercase tracking-wider">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Company</th>
                <th className="py-4 px-6">Source</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100 text-sm">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-sage-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-sage-900">{lead.name}</td>
                  <td className="py-4 px-6 text-sage-600">{lead.company}</td>
                  <td className="py-4 px-6 text-sage-600">{lead.source}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      lead.status === 'Qualified' ? 'bg-green-100/70 text-green-800' :
                      lead.status === 'Working' ? 'bg-green-50 text-green-700' :
                      'bg-sage-100 text-sage-700'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      onClick={() => {
                        convertLead(lead.id);
                        triggerToast(`Converted ${lead.name} to deal!`);
                      }}
                      className="text-xs font-bold text-[#1e4836] hover:underline"
                    >
                      Make deal
                    </button>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sage-500">
                    No leads found. Add one above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-modal p-6 md:p-8 w-full max-w-lg shadow-accent space-y-6">
            <div>
              <h2 className="text-xl font-display font-bold text-sage-900">Import Leads from CSV</h2>
              <p className="text-sm text-sage-500 mt-1">Map your columns to our standard fields.</p>
            </div>
            
            <div className="space-y-4 border border-sage-200 rounded-card p-4 bg-sage-50/50">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-sage-700">CSV Column: Name</span>
                <span className="text-sage-500">→ maps to →</span>
                <span className="bg-white border border-sage-200 px-3 py-1 rounded">Name</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-sage-700">CSV Column: Org</span>
                <span className="text-sage-500">→ maps to →</span>
                <span className="bg-white border border-sage-200 px-3 py-1 rounded">Company</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-card text-sm font-medium hover:bg-sage-100 text-sage-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulateImport}
                className="bg-[#1e4836] hover:bg-[#153427] text-white font-semibold px-6 py-2 rounded-card text-sm transition-colors"
              >
                Complete import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
