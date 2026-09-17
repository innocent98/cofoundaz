'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useToast } from '../layout';

export default function PersonasPage() {
  const { triggerToast } = useToast();
  
  const [personas, setPersonas] = useState([
    {
      id: 'chidi',
      initials: 'CO',
      name: 'Chidi',
      role: 'okada rider',
      age: 28,
      location: 'Lagos',
      incomeType: 'daily cash income',
      quote: '“I earn every day but somehow it is gone by the weekend.”',
      goals: 'Save for a second bike; cover slow weeks.',
      frustrations: 'No discipline; banks feel far and unfriendly.',
    },
    {
      id: 'funke',
      initials: 'FT',
      name: 'Funke',
      role: 'market trader',
      age: 41,
      location: 'Ibadan',
      incomeType: 'weekly cash flow',
      quote: '“I keep my savings in a box. It is not safe.”',
      goals: "Grow stock; children's school fees.",
      frustrations: 'Cash is risky; ajo collectors are unreliable.',
    },
    {
      id: 'yaw',
      initials: 'YS',
      name: 'Yaw',
      role: 'delivery gig',
      age: 24,
      location: 'Accra',
      incomeType: 'app-based income',
      quote: '“I want to invest but I do not know where to start.”',
      goals: 'Build an emergency fund; try investing.',
      frustrations: 'Income swings; too many confusing apps.',
    },
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
          Customer personas
        </h2>

        <button
          onClick={() => triggerToast('✦ Personas updated from validation notes!')}
          className="flex items-center gap-1.5 bg-[#F5ECDC] hover:bg-[#EAD5C6] text-[#522F1A] font-bold px-4 py-2.5 rounded-card text-xs transition-colors border border-[#EAD5C6] self-start md:self-auto shadow-card"
        >
          <Sparkles className="w-3.5 h-3.5 fill-[#8A5330] text-[#8A5330]" />
          <span>Generate from validation notes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {personas.map((persona) => (
          <div
            key={persona.id}
            className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col justify-between gap-6"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#183B28] text-[#EAD5C6] font-bold text-base flex items-center justify-center shrink-0">
                  {persona.initials}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-[#1E2923]">
                    {persona.name}, {persona.role}
                  </h3>
                  <p className="text-[11px] text-[#768478]">
                    Age {persona.age} · {persona.location} · {persona.incomeType}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#556358] italic leading-relaxed pt-1">
                {persona.quote}
              </p>

              <div className="flex flex-col gap-1 pt-2">
                <span className="text-[10px] font-bold tracking-wider text-[#8A5330] uppercase">
                  GOALS
                </span>
                <p className="text-xs text-[#1E2923] leading-normal">
                  {persona.goals}
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold tracking-wider text-[#A34B4B] uppercase">
                  FRUSTRATIONS
                </span>
                <p className="text-xs text-[#1E2923] leading-normal">
                  {persona.frustrations}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
