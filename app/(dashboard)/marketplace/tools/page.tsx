"use client";

import React from "react";
import { useMarketplaceApi } from "@/hooks/useMarketplaceApi";
import { useToast } from "../ToastContext";
import { Tag, ExternalLink } from "lucide-react";

export default function ToolsAndDealsPage() {
  const { tools } = useMarketplaceApi();
  const { triggerToast } = useToast();

  const handleGetDeal = (toolName: string) => {
    triggerToast(`Applying for ${toolName} deal...`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-neutral-900">Partner tools & deals</h1>
        <p className="text-sm text-neutral-500">Exclusive discounts on the software you need to scale.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {tools.map((tool) => (
          <div key={tool.id} className="bg-white rounded-modal border border-neutral-200 shadow-card p-6 flex flex-col h-full space-y-6 hover:border-accent-200 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="w-14 h-14 rounded-modal bg-neutral-50 border border-neutral-200 text-brand-hover flex items-center justify-center font-display font-bold text-xl shrink-0 shadow-card">
                {tool.logo}
              </div>
              <span className="bg-neutral-xf5f7f5 border border-neutral-200 text-neutral-600 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {tool.category}
              </span>
            </div>

            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-lg text-neutral-900">{tool.name}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">{tool.oneLiner}</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-2 bg-neutral-xf5efe6 border border-accent-200 px-3 py-2.5 rounded-card">
                <Tag className="w-4 h-4 text-accent-700 shrink-0" />
                <span className="text-sm font-semibold text-accent-900">{tool.discountTag}</span>
              </div>

              <button
                onClick={() => handleGetDeal(tool.name)}
                className="w-full bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 font-semibold py-2.5 px-4 rounded-card text-sm transition-colors shadow-card flex items-center justify-center gap-2"
              >
                <span>Get deal</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
