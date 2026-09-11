"use client";

import React, { useRef } from "react";
import { Plus, UploadCloud, FileText } from "lucide-react";
import { useFinanceApi, formatCurrency } from "@/hooks/useFinanceApi";
import { useToast } from "../ToastContext";

export default function ExpensesPage() {
  const { expenses } = useFinanceApi();
  const { triggerToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      triggerToast(`Receipt attached: ${e.target.files[0].name}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">Expenses</h1>
          <p className="text-sm text-sage-600">Track corporate card transactions and operational spend.</p>
        </div>
        <button 
          onClick={() => triggerToast("Add manual expense dialog would open here.")}
          className="bg-[#9C5B34] text-white px-4 py-2 rounded-card text-sm font-medium flex items-center gap-1.5 hover:bg-[#8A5330] transition-colors shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* CATEGORY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-modal border border-sage-200 shadow-card flex flex-col justify-center space-y-4">
          <h3 className="font-bold text-sage-900 border-b border-sage-100 pb-2">Category Breakdown (Feb 2026)</h3>
          
          <div className="flex items-center gap-4 py-2">
            <div className="relative w-24 h-24 rounded-full border-[10px] border-[#1e3b30] flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[10px] border-transparent border-t-[#9C5B34] border-r-[#9C5B34] rotate-12"></div>
            </div>
            <div className="space-y-2 text-xs font-medium text-sage-700 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1e3b30]"></span>
                  <span>Software & IT</span>
                </div>
                <span className="font-bold">60%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#9C5B34]"></span>
                  <span>Rent & Office</span>
                </div>
                <span className="font-bold">40%</span>
              </div>
            </div>
          </div>
        </div>

        {/* EXPENSES TABLE */}
        <div className="lg:col-span-2 bg-white rounded-modal border border-sage-200 overflow-hidden shadow-card flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-sage-50/50 border-b border-sage-100 text-[11px] text-sage-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Vendor / Date</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4 text-center">Recurring</th>
                  <th className="py-4 px-4 text-center">Receipt</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100 text-sm">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-sage-50/50 transition-colors">
                    <td className="py-3 px-6">
                      <p className="font-semibold text-sage-900">{exp.vendor}</p>
                      <p className="text-xs text-sage-500 font-medium">{exp.date}</p>
                    </td>
                    <td className="py-3 px-4 text-sage-600 font-medium">{exp.category}</td>
                    <td className="py-3 px-4 text-center">
                      <input 
                        type="checkbox" 
                        defaultChecked={exp.recurring} 
                        className="accent-[#9c5b34] cursor-pointer"
                        onChange={() => triggerToast(`Toggled recurring for ${exp.vendor}`)}
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      {exp.receiptAttached ? (
                        <button 
                          className="text-[#1e3b30] hover:text-[#152a22] transition-colors"
                          onClick={() => triggerToast("Downloading receipt...")}
                        >
                          <FileText className="w-4 h-4 mx-auto" />
                        </button>
                      ) : (
                        <button 
                          className="text-[#9c5b34] hover:text-[#8a5330] transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <UploadCloud className="w-4 h-4 mx-auto" />
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-6 font-bold text-sage-900 text-right">
                      {formatCurrency(exp.amountMinor, exp.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Hidden file input for receipt uploads */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept="image/*,.pdf"
      />
    </div>
  );
}
