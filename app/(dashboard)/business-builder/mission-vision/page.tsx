'use client';

import React from 'react';
import { AiDraftButton } from '@/components/business-builder/ai-draft-button';
import { useCanvasEditor } from '@/hooks/useCanvasEditor';
import { CanvasFrame } from '@/components/business-builder/canvas-frame';
import { MissionOptions } from '@/components/business-builder/mission-options';

export default function MissionVisionPage() {
  const editor = useCanvasEditor('mission_vision');
  const { blockDefs, loading, textOf, setText, reload, flush } = editor;
  const { canWrite } = editor.access;

  // mission_vision has exactly two text blocks: mission, vision (from block_defs).
  const blocks = blockDefs.length ? blockDefs : [
    { key: 'mission', label: 'Mission', kind: 'text' as const },
    { key: 'vision', label: 'Vision', kind: 'text' as const },
  ];

  return (
    <CanvasFrame
      type="mission_vision"
      title="Mission & Vision"
      editor={editor}
      actions={<AiDraftButton canvasType="mission_vision" label="Draft with AI" onFilled={reload} />}
    >
      {(tools) =>
        loading ? (
          <div className="flex flex-col gap-6 max-w-4xl">
            <div className="bg-white rounded-modal h-40 border border-line-soft shadow-card animate-pulse" />
            <div className="bg-white rounded-modal h-40 border border-line-soft shadow-card animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-col gap-6 max-w-4xl">
            {blocks.map((b) => {
              const field = b.key === 'mission' ? 'mission' : 'vision';
              return (
                <div key={b.key} className="bg-white rounded-modal p-6 border border-line-soft shadow-card flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-ink">{b.label}</h3>
                      <p className="text-xs text-ink-soft">
                        {b.key === 'mission' ? 'Why you exist, one sentence, no jargon.' : 'The world if you win.'}
                      </p>
                    </div>
                    {tools(b.key, b.label, { ai: textOf(b.key) === '' })}
                  </div>
                  <textarea
                    rows={3}
                    value={textOf(b.key)}
                    readOnly={!canWrite}
                    onChange={(e) => setText(b.key, e.target.value)}
                    aria-label={b.label}
                    placeholder={b.key === 'mission' ? 'We help…' : 'A world where…'}
                    className="w-full bg-surface-ghost border border-neutral-xe0e0db rounded-card p-4 text-xs md:text-sm text-ink focus:outline-hidden focus:border-brand-strong focus:bg-white transition-all resize-y font-normal leading-relaxed"
                  />
                  <MissionOptions field={field} flush={flush} onUse={(text) => setText(b.key, text)} />
                </div>
              );
            })}
          </div>
        )
      }
    </CanvasFrame>
  );
}
