'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useToast } from '../layout';

export default function MissionVisionPage() {
  const { triggerToast } = useToast();
  const [missionText, setMissionText] = useState(
    'We help gig workers save automatically, without a bank or willpower.'
  );
  const [visionText, setVisionText] = useState(
    'A generation of informal workers who retire with dignity.'
  );

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
          Mission & Vision
        </h2>
      </div>

      <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1E2923]">Mission</h3>
            <p className="text-xs text-[#768478]">
              Why you exist, one sentence, no jargon.
            </p>
          </div>

          <button
            onClick={() => triggerToast('✦ 3 Mission suggestions generated!')}
            className="flex items-center gap-1 text-xs font-bold text-[#183B28] hover:text-[#2D5A3F] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#183B28]" />
            <span>Give me 3 options</span>
          </button>
        </div>

        <div className="mt-1">
          <textarea
            rows={3}
            value={missionText}
            onChange={(e) => {
              setMissionText(e.target.value);
              triggerToast('Saved');
            }}
            className="w-full bg-[#FAFAFA] border border-[#E0E0DB] rounded-card p-4 text-xs md:text-sm text-[#1E2923] focus:outline-hidden focus:border-[#183B28] focus:bg-white transition-all resize-y font-normal leading-relaxed"
          />
        </div>
      </div>

      <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1E2923]">Vision</h3>
            <p className="text-xs text-[#768478]">The world if you win.</p>
          </div>

          <button
            onClick={() => triggerToast('✦ 3 Vision suggestions generated!')}
            className="flex items-center gap-1 text-xs font-bold text-[#183B28] hover:text-[#2D5A3F] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#183B28]" />
            <span>Give me 3 options</span>
          </button>
        </div>

        <div className="mt-1">
          <textarea
            rows={3}
            value={visionText}
            onChange={(e) => {
              setVisionText(e.target.value);
              triggerToast('Saved');
            }}
            className="w-full bg-[#FAFAFA] border border-[#E0E0DB] rounded-card p-4 text-xs md:text-sm text-[#1E2923] focus:outline-hidden focus:border-[#183B28] focus:bg-white transition-all resize-y font-normal leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
