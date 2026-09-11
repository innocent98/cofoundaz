"use client";

import React, { useState } from "react";
import { Plus, Download, Send, Check } from "lucide-react";
import { useFinanceApi, formatCurrency } from "@/hooks/useFinanceApi";
import { useToast } from "../ToastContext";

export default function InvoicesPage() {
  const { invoices, markInvoicePaid, toggleInvoiceAutoRemind } = useFinanceApi();
  const { triggerToast } = useToast();
  
  const [filter, setFilter] = useState("All");
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderState, setBuilderState] = useState({
    client: "",
    lineItems: [{ desc: "", qty: 1, price: 0 }],
    taxPercent: 5,
    terms: "Net 30"
  });

  const subtotal = builderState.lineItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
  const tax = subtotal * (builderState.taxPercent / 100);
  const total = subtotal + tax;

  const filteredInvoices = filter === "All" ? invoices : invoices.filter(i => i.status === filter.toLowerCase());

  const handleSendInvoice = () => {
    setIsBuilderOpen(false);
    triggerToast("Invoice sent successfully to " + builderState.client);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {!isBuilderOpen ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">Invoices</h1>
              <p className="text-sm text-sage-600">Manage client billings, payments, and receivables.</p>
            </div>
            <button 
              onClick={() => setIsBuilderOpen(true)}
              className="bg-[#9C5B34] text-white px-4 py-2 rounded-card text-sm font-medium flex items-center gap-1.5 hover:bg-[#8A5330] transition-colors shadow-sm w-fit"
            >
              <Plus className="w-4 h-4" /> Create Invoice
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {["All", "Draft", "Sent", "Paid", "Overdue"].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  filter === f ? 'bg-[#1e3b30] text-white' : 'bg-white border border-sage-200 text-sage-600 hover:bg-sage-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-modal border border-sage-200 overflow-hidden shadow-card">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-sage-50/50 border-b border-sage-100 text-xs text-sage-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Invoice ID</th>
                  <th className="py-4 px-4">Client</th>
                  <th className="py-4 px-4">Due Date</th>
                  <th className="py-4 px-4 text-right">Amount</th>
                  <th className="py-4 px-4 text-center">Auto-remind</th>
                  <th className="py-4 px-6">Status / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100 text-sm">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-sage-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-sage-900">{inv.number}</td>
                    <td className="py-4 px-4 text-sage-600 font-medium">{inv.clientName}</td>
                    <td className="py-4 px-4 text-sage-500 font-medium">{inv.dueOn}</td>
                    <td className="py-4 px-4 font-bold text-sage-900 text-right">{formatCurrency(inv.totalMinor)}</td>
                    <td className="py-4 px-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={inv.autoRemind} 
                        onChange={() => toggleInvoiceAutoRemind(inv.id)}
                        className="accent-[#1e3b30] cursor-pointer"
                        title="Auto-remind every 7 days"
                      />
                    </td>
                    <td className="py-4 px-6 flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                        inv.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                        inv.status === 'overdue' ? 'bg-[#fff0f0] text-[#B0483B] border-[#ffcccc]' :
                        'bg-sage-100 text-sage-600 border-sage-200'
                      }`}>
                        {inv.status}
                      </span>
                      {inv.status !== 'paid' && (
                        <button 
                          onClick={() => {
                            markInvoicePaid(inv.id);
                            triggerToast(`Invoice ${inv.number} marked as Paid.`);
                          }}
                          className="text-xs font-bold text-[#1e3b30] hover:underline"
                        >
                          Mark paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredInvoices.length === 0 && (
              <div className="p-8 text-center text-sage-500 font-medium text-sm">
                No invoices found.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* INVOICE BUILDER */}
          <div className="bg-white rounded-modal border border-sage-200 p-6 shadow-card space-y-6">
            <div className="flex items-center justify-between border-b border-sage-100 pb-4">
              <h2 className="text-xl font-display font-bold text-sage-900">Invoice Builder</h2>
              <button 
                onClick={() => setIsBuilderOpen(false)}
                className="text-xs font-semibold text-sage-500 hover:text-sage-700 transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-sage-500 uppercase">Client</label>
                <select 
                  className="w-full bg-sage-50 border border-sage-200 rounded-input px-3 py-2 text-sm focus:outline-none focus:border-[#9c5b34]"
                  value={builderState.client}
                  onChange={(e) => setBuilderState({...builderState, client: e.target.value})}
                >
                  <option value="">Select a client...</option>
                  <option value="Acme Corp">Acme Corp</option>
                  <option value="Globex">Globex</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-sage-500 uppercase">Line Items</label>
                  <button 
                    onClick={() => setBuilderState({...builderState, lineItems: [...builderState.lineItems, {desc: "", qty: 1, price: 0}]})}
                    className="text-xs font-bold text-[#9c5b34] hover:underline"
                  >
                    + Add Item
                  </button>
                </div>
                {builderState.lineItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      type="text" placeholder="Description" 
                      value={item.desc} onChange={(e) => {
                        const newItems = [...builderState.lineItems];
                        newItems[idx].desc = e.target.value;
                        setBuilderState({...builderState, lineItems: newItems});
                      }}
                      className="flex-1 bg-sage-50 border border-sage-200 rounded-input px-3 py-2 text-sm focus:outline-none focus:border-[#9c5b34]" 
                    />
                    <input 
                      type="number" placeholder="Qty" 
                      value={item.qty || ""} onChange={(e) => {
                        const newItems = [...builderState.lineItems];
                        newItems[idx].qty = Number(e.target.value);
                        setBuilderState({...builderState, lineItems: newItems});
                      }}
                      className="w-20 bg-sage-50 border border-sage-200 rounded-input px-3 py-2 text-sm focus:outline-none focus:border-[#9c5b34]" 
                    />
                    <input 
                      type="number" placeholder="Price" 
                      value={item.price || ""} onChange={(e) => {
                        const newItems = [...builderState.lineItems];
                        newItems[idx].price = Number(e.target.value);
                        setBuilderState({...builderState, lineItems: newItems});
                      }}
                      className="w-24 bg-sage-50 border border-sage-200 rounded-input px-3 py-2 text-sm focus:outline-none focus:border-[#9c5b34]" 
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-bold text-sage-500 uppercase">Tax %</label>
                  <input 
                    type="number" 
                    value={builderState.taxPercent}
                    onChange={(e) => setBuilderState({...builderState, taxPercent: Number(e.target.value)})}
                    className="w-full bg-sage-50 border border-sage-200 rounded-input px-3 py-2 text-sm focus:outline-none focus:border-[#9c5b34]" 
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-bold text-sage-500 uppercase">Terms</label>
                  <select 
                    className="w-full bg-sage-50 border border-sage-200 rounded-input px-3 py-2 text-sm focus:outline-none focus:border-[#9c5b34]"
                    value={builderState.terms}
                    onChange={(e) => setBuilderState({...builderState, terms: e.target.value})}
                  >
                    <option>Net 15</option>
                    <option>Net 30</option>
                    <option>Due on Receipt</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pt-4 border-t border-sage-100">
              <button 
                onClick={handleSendInvoice}
                className="flex-1 bg-[#1e3b30] hover:bg-[#152a22] text-white font-semibold px-4 py-2.5 rounded-card text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" /> Send Invoice
              </button>
              <button 
                onClick={() => triggerToast("Invoice PDF downloaded.")}
                className="flex-1 bg-white hover:bg-sage-50 border border-sage-200 text-sage-700 font-semibold px-4 py-2.5 rounded-card text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>

          {/* INVOICE PREVIEW */}
          <div className="bg-[#f7f9f8] rounded-modal border border-sage-200 p-8 shadow-inner flex flex-col justify-between">
            <div className="bg-white border border-sage-200 shadow-sm p-8 rounded min-h-[400px] flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-sage-900">INVOICE</h1>
                  <p className="text-xs text-sage-500 font-medium">INV-DRAFT</p>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-sage-900">{builderState.client || "Client Name"}</h3>
                  <p className="text-xs text-sage-500 font-medium">{builderState.terms}</p>
                </div>
              </div>
              
              <div className="flex-1 border-y border-sage-100 py-4 mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-sage-400 border-b border-sage-50">
                      <th className="pb-2">Description</th>
                      <th className="pb-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {builderState.lineItems.map((item, idx) => item.desc ? (
                      <tr key={idx}>
                        <td className="py-2 text-sage-800 font-medium">{item.desc} (x{item.qty})</td>
                        <td className="py-2 text-right font-bold text-sage-900">₦{(item.qty * item.price).toLocaleString()}</td>
                      </tr>
                    ) : null)}
                  </tbody>
                </table>
              </div>
              
              <div className="w-full flex flex-col items-end text-sm space-y-1">
                <div className="w-1/2 flex justify-between font-medium text-sage-600">
                  <span>Subtotal</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="w-1/2 flex justify-between font-medium text-sage-600">
                  <span>Tax ({builderState.taxPercent}%)</span>
                  <span>₦{tax.toLocaleString()}</span>
                </div>
                <div className="w-1/2 flex justify-between font-bold text-lg text-sage-900 pt-2 border-t border-sage-100">
                  <span>Total</span>
                  <span>₦{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Watermark paid stamp mockup */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 opacity-0 flex items-center justify-center border-4 border-green-500 text-green-500 rounded-lg px-8 py-2 text-4xl font-black tracking-widest pointer-events-none">
                PAID
              </div>
            </div>
            
            <p className="text-center text-[10px] text-sage-400 font-bold uppercase tracking-widest mt-6">Preview Only</p>
          </div>
        </div>
      )}
    </div>
  );
}
