"use client";

import React, { useState } from "react";
import { useToast } from "../ToastContext";
import { Download, ExternalLink } from "lucide-react";

export default function PurchasesPage() {
  const { triggerToast } = useToast();

  const [orders] = useState([
    { 
      id: "ord-1", 
      item: "Terms of Service Drafting", 
      provider: "Alex Okafor", 
      amount: "₦150,000", 
      date: "Sep 15, 2026", 
      status: "Processing" 
    },
    { 
      id: "ord-2", 
      item: "Landing Page Redesign", 
      provider: "Sarah Jenkins", 
      amount: "₦400,000", 
      date: "Aug 01, 2026", 
      status: "Paid" 
    }
  ]);

  const handleDownloadReceipt = (id: string) => {
    triggerToast(`Downloading receipt for order ${id}...`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Purchases</h1>
        <p className="text-sm text-sage-500">View your order history and download receipts.</p>
      </div>

      <div className="bg-white rounded-modal border border-sage-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sage-200/80 text-[11px] font-bold text-sage-400 uppercase tracking-wider bg-sage-50/50">
                <th className="py-4 px-6">Item</th>
                <th className="py-4 px-6">Provider</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-sage-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-sm text-sage-900">{order.item}</td>
                  <td className="py-4 px-6 text-sm text-sage-600">{order.provider}</td>
                  <td className="py-4 px-6 text-sm font-semibold text-sage-900">{order.amount}</td>
                  <td className="py-4 px-6 text-sm text-sage-600">{order.date}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'Paid' 
                        ? 'bg-[#e2ede6] text-[#1e4836] border border-[#d2e2d8]'
                        : 'bg-sage-100 text-sage-600 border border-sage-200'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleDownloadReceipt(order.id)}
                      className="inline-flex items-center justify-center p-2 rounded-full hover:bg-sage-100 text-sage-500 transition-colors"
                      title="Download Receipt"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
