"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMarketplaceApi, ExpertCategory } from "@/hooks/useMarketplaceApi";
import { useToast } from "./ToastContext";
import { Sparkles, Star, ShieldCheck, ChevronRight } from "lucide-react";

export default function MarketplaceDirectoryPage() {
  const router = useRouter();
  const { providers } = useMarketplaceApi();
  const { triggerToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<ExpertCategory | 'All'>('All');
  const categories: (ExpertCategory | 'All')[] = ['All', 'Legal', 'Accounting', 'Design', 'Development', 'Marketing'];

  const filteredProviders = selectedCategory === 'All' 
    ? providers 
    : providers.filter(p => p.category === selectedCategory);

  const handleBook = (providerName: string) => {
    triggerToast(`Opening booking drawer for ${providerName}...`);
    // Ideally this would open a side drawer, but routing to bookings for simplicity or just showing toast as per prompt "launch booking drawer"
    setTimeout(() => {
      router.push("/marketplace/bookings");
    }, 1000);
  };

  const handleMessage = (providerName: string) => {
    triggerToast(`Drafting message to ${providerName}...`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Experts directory</h1>
        <p className="text-sm text-sage-500">Find vetted professionals to accelerate your growth.</p>
      </div>

      {/* Top AI Match Banner */}
      <div className="bg-[#f3eee2] border border-[#EAD5C6] rounded-modal p-5 flex items-start md:items-center justify-between gap-4 shadow-card">
        <div className="flex items-start gap-3.5">
          <div className="text-[#8A5330] mt-0.5 md:mt-0 shrink-0">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
          <p className="text-sm font-medium text-[#522F1A] leading-relaxed">
            Based on your roadmap, you could use <span className="font-bold">Design</span> help with <span className="font-bold">Landing Page UI</span>. We found <span className="font-bold">1</span> strong match.
          </p>
        </div>
        <button
          onClick={() => setSelectedCategory('Design')}
          className="shrink-0 bg-white hover:bg-sage-50 text-[#8A5330] font-semibold py-2 px-4 rounded-card text-xs transition-colors border border-[#EAD5C6] shadow-card flex items-center gap-1"
        >
          <span>See match</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter Rail */}
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              selectedCategory === cat
                ? "bg-[#1e4836] text-white border-[#1e4836]"
                : "bg-white text-sage-700 border-sage-200 hover:bg-sage-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Provider Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {filteredProviders.map((provider) => (
          <div key={provider.id} className="bg-white rounded-modal border border-sage-200 shadow-card p-6 flex flex-col h-full space-y-6 hover:border-[#9C5B34] transition-colors group">
            <div className="flex items-start justify-between gap-4">
              <div className="w-12 h-12 rounded-full bg-[#e2ede6] text-[#1e4836] flex items-center justify-center font-display font-bold text-lg shrink-0">
                {provider.avatarUrl}
              </div>
              {provider.isVetted && (
                <div 
                  className="bg-[#f0f3f0] text-sage-600 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0"
                  title="Verified credentials and past client checks by Cofoundaz."
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1e4836]" />
                  <span>VETTED</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-lg text-sage-900 group-hover:text-[#8A5330] transition-colors">{provider.name}</h3>
              <p className="text-sm text-sage-500 font-medium">{provider.specialty}</p>
              
              <div className="flex items-center gap-1.5 pt-2">
                <Star className="w-4 h-4 fill-copper-400 text-copper-400" />
                <span className="text-sm font-bold text-sage-900">{provider.rating}</span>
                <span className="text-xs text-sage-400">({provider.reviewCount} reviews)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-sage-100 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-bold text-sage-400 tracking-wider">Starts at</p>
                <p className="text-sm font-semibold text-sage-900">₦{(provider.startingPriceMinor / 100).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMessage(provider.name)}
                  className="bg-sage-100 hover:bg-sage-200 text-sage-800 font-semibold py-2 px-4 rounded-card text-xs transition-colors"
                >
                  Message
                </button>
                <button
                  onClick={() => handleBook(provider.name)}
                  className="bg-[#1e4836] hover:bg-[#153427] text-white font-semibold py-2 px-4 rounded-card text-xs transition-colors shadow-card"
                >
                  Book
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredProviders.length === 0 && (
          <div className="col-span-full py-12 text-center text-sage-500 text-sm">
            No providers found for this category yet.
          </div>
        )}
      </div>
    </div>
  );
}