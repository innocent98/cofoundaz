'use client';

import React, { useState } from 'react';
import { useToast } from '../layout';

export default function ValuePropositionPage() {
  const { triggerToast } = useToast();
  
  const [customerProfile, setCustomerProfile] = useState([
    { id: 'jobs', title: 'JOBS', items: ['Set money aside', 'Handle emergencies'] },
    { id: 'pains', title: 'PAINS', items: ['No willpower', 'Fees eat savings'] },
    { id: 'gains', title: 'GAINS', items: ['Peace of mind', 'A visible goal'] },
  ]);

  const [valueMap, setValueMap] = useState([
    { id: 'products', title: 'PRODUCTS', items: ['Auto round-ups', 'Goal wallets'] },
    { id: 'pain-relievers', title: 'PAIN RELIEVERS', items: ['No manual effort', 'Zero fees to save'] },
    { id: 'gain-creators', title: 'GAIN CREATORS', items: ['Streaks & nudges', 'Interest on balance'] },
  ]);

  const handleEditItem = (stateUpdater: any, secId: string, itemIdx: number, oldItem: string) => {
    const updated = prompt('Edit item:', oldItem);
    if (updated) {
      stateUpdater((prev: any) => prev.map((sec: any) => 
        sec.id === secId 
          ? { ...sec, items: sec.items.map((i: string, ix: number) => ix === itemIdx ? updated : i) }
          : sec
      ));
      triggerToast('Saved');
    }
  };

  const handleAddItem = (stateUpdater: any, secId: string) => {
    const newItem = prompt('Enter new item:');
    if (newItem) {
      stateUpdater((prev: any) => prev.map((sec: any) =>
        sec.id === secId ? { ...sec, items: [...sec.items, newItem] } : sec
      ));
      triggerToast('Saved');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
          Value Proposition
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-6">
          <h3 className="text-sm font-bold text-[#1E2923]">
            Customer profile
          </h3>

          <div className="flex flex-col gap-5">
            {customerProfile.map((sec) => (
              <div key={sec.id} className="flex flex-col gap-2 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                    {sec.title}
                  </span>
                  <button 
                    onClick={() => handleAddItem(setCustomerProfile, sec.id)}
                    className="text-xs text-[#8E9B90] hover:text-[#183B28] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sec.items.map((item, idx) => (
                    <span
                      key={idx}
                      onClick={() => handleEditItem(setCustomerProfile, sec.id, idx, item)}
                      className="bg-[#F5F2E9] text-[#522F1A] text-xs font-medium px-3.5 py-2 rounded-card border border-[#EAE3D2] cursor-pointer"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-6">
          <h3 className="text-sm font-bold text-[#1E2923]">
            Value map
          </h3>

          <div className="flex flex-col gap-5">
            {valueMap.map((sec) => (
              <div key={sec.id} className="flex flex-col gap-2 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                    {sec.title}
                  </span>
                  <button 
                    onClick={() => handleAddItem(setValueMap, sec.id)}
                    className="text-xs text-[#8E9B90] hover:text-[#183B28] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sec.items.map((item, idx) => (
                    <span
                      key={idx}
                      onClick={() => handleEditItem(setValueMap, sec.id, idx, item)}
                      className="bg-[#E6EFEA] text-[#183B28] text-xs font-medium px-3.5 py-2 rounded-card border border-[#D5E3DB] cursor-pointer"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
