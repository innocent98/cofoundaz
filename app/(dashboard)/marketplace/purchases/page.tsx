"use client";

import React, { useState } from "react";
import { useToast } from "../ToastContext";
import { Download } from "lucide-react";

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
        <h1 className="text-3xl font-display font-semibold text-neutral-900">Purchases</h1>
        <p className="text-sm text-neutral-500">View your order history and download receipts.</p>
      </div>

      <div className="bg-white rounded-modal border border-neutral-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200/80 text-[11px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50/50">
                <th className="py-4 px-6">Item</th>
                <th className="py-4 px-6">Provider</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-sm text-neutral-900">{order.item}</td>
                  <td className="py-4 px-6 text-sm text-neutral-600">{order.provider}</td>
                  <td className="py-4 px-6 text-sm font-semibold text-neutral-900">{order.amount}</td>
                  <td className="py-4 px-6 text-sm text-neutral-600">{order.date}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'Paid' 
                        ? 'bg-neutral-xe2ede6 text-brand-hover border border-brand-xd2e2d8'
                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleDownloadReceipt(order.id)}
                      className="inline-flex items-center justify-center p-2 rounded-full hover:bg-neutral-100 text-neutral-500 transition-colors"
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
