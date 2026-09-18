'use client';

import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { AiDraftButton } from '@/components/business-builder/ai-draft-button';
import { useCanvasEditor } from '@/hooks/useCanvasEditor';

export default function MissionVisionPage() {
  const { blockDefs, loading, saveStatus, textOf, setText } = useCanvasEditor('mission_vision');

  // mission_vision has exactly two text blocks: mission, vision (from block_defs).
  const blocks = blockDefs.length ? blockDefs : [
    { key: 'mission', label: 'Mission', kind: 'text' as const },
    { key: 'vision', label: 'Vision', kind: 'text' as const },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">Mission &amp; Vision</h2>
          <div className="flex items-center gap-1.5 text-xs text-[#556358] mt-1">
            {saveStatus === 'saving' && <span className="flex items-center gap-1 text-copper-700 font-medium"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>}
            {saveStatus === 'saved' && <span className="flex items-center gap-1 text-[#183B28] font-medium"><Check className="w-3 h-3" /> Saved to cloud</span>}
            {saveStatus === 'error' && <span className="text-[#B0483B] font-medium">Sync error — retrying</span>}
          </div>
        </div>
        <AiDraftButton canvasType="mission_vision" label="Draft with AI" />
      </div>

      {loading ? (
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-modal h-40 border border-[#EBEBE6] shadow-card animate-pulse" />
          <div className="bg-white rounded-modal h-40 border border-[#EBEBE6] shadow-card animate-pulse" />
        </div>
      ) : (
        blocks.map((b) => (
          <div key={b.key} className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#1E2923]">{b.label}</h3>
              <p className="text-xs text-[#768478]">
                {b.key === 'mission' ? 'Why you exist, one sentence, no jargon.' : 'The world if you win.'}
              </p>
            </div>
            <textarea
              rows={3}
              value={textOf(b.key)}
              onChange={(e) => setText(b.key, e.target.value)}
              placeholder={b.key === 'mission' ? 'We help…' : 'A world where…'}
              className="w-full bg-[#FAFAFA] border border-[#E0E0DB] rounded-card p-4 text-xs md:text-sm text-[#1E2923] focus:outline-hidden focus:border-[#183B28] focus:bg-white transition-all resize-y font-normal leading-relaxed"
            />
          </div>
        ))
      )}
    </div>
  );
}
