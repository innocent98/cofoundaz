'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useToast } from '../layout';

export default function PricingPage() {
  const [selectedPricingStrategy, setSelectedPricingStrategy] = useState('Freemium');
  
  const pricingStrategies = ['Freemium', 'Flat Subscription', 'Pay-per-use', 'Tiered'];
  
  const pricingTiers = [
    { id: 'free', tier: 'Basic', price: 'Free', included: 'Goal setting, basic nudges, 1 withdrawal/mo' },
    { id: 'pro', tier: 'Pro', price: '₦500 / mo', included: 'Auto round-ups, streak rewards, unlimited withdrawals' },
    { id: 'premium', tier: 'Premium', price: '₦1,200 / mo', included: 'Pro + micro-health insurance + 1% cash back' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
          Pricing strategy
        </h2>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {pricingStrategies.map((strat) => {
          const isActive = selectedPricingStrategy === strat;
          return (
            <button
              key={strat}
              onClick={() => setSelectedPricingStrategy(strat)}
              className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#183B28] text-white'
                  : 'bg-white border border-[#EBEBE6] text-[#617065] hover:border-[#C5CFC7]'
              }`}
            >
              {strat}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#EBEBE6]">
                <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/4">
                  TIER
                </th>
                <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/4">
                  PRICE
                </th>
                <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-2/4">
                  WHAT&apos;S INCLUDED
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0EC]">
              {pricingTiers.map((tier) => (
                <tr key={tier.id} className="hover:bg-[#FAF9F5] transition-colors">
                  <td className="py-4 px-6 text-xs md:text-sm font-bold text-[#1E2923]">
                    {tier.tier}
                  </td>
                  <td className="py-4 px-6 text-xs md:text-sm font-bold text-[#183B28]">
                    {tier.price}
                  </td>
                  <td className="py-4 px-6 text-xs md:text-sm text-[#556358]">
                    {tier.included}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#12261C] text-white p-5 rounded-modal flex items-center gap-3 shadow-card">
        <div className="w-7 h-7 rounded-input bg-[#213C2D] flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 fill-[#D89A6E] text-[#D89A6E]" />
        </div>
        <p className="text-xs md:text-sm font-medium leading-relaxed">
          Willingness-to-pay signal from your survey suggests <span className="font-bold">₦500 to ₦800 per month</span> is the sweet spot for gig workers.
        </p>
      </div>
    </div>
  );
}
