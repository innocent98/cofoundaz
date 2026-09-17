'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Download, Loader2, Plus, X, Check } from 'lucide-react';
import { useToast } from '../layout';
import { useBusinessBuilderApi } from '@/hooks/useBusinessBuilderApi';

interface Section {
  id: string;
  title: string;
  items: string[];
}

const DEFAULT_SECTIONS: Section[] = [
  { id: 'problem', title: 'PROBLEM', items: [] },
  { id: 'solution', title: 'SOLUTION', items: [] },
  { id: 'unique_value_proposition', title: 'UNIQUE VALUE PROPOSITION', items: [] },
  { id: 'unfair_advantage', title: 'UNFAIR ADVANTAGE', items: [] },
  { id: 'customer_segments', title: 'CUSTOMER SEGMENTS', items: [] },
  { id: 'key_metrics', title: 'KEY METRICS', items: [] },
  { id: 'channels', title: 'CHANNELS', items: [] },
  { id: 'cost_structure', title: 'COST STRUCTURE', items: [] },
  { id: 'revenue_streams', title: 'REVENUE STREAMS', items: [] },
];

export default function LeanCanvasPage() {
  const { triggerToast } = useToast();
  const { loadCanvas, saveCanvas, aiFillCanvas } = useBusinessBuilderApi();

  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('just now');

  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Hydrate Canvas from Server
  const fetchCanvasData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await loadCanvas('lean');

      const canvasPayload = data as { blocks?: unknown }; if (canvasPayload && canvasPayload.blocks) {
        const blocks = (data as { blocks: Record<string, unknown> }).blocks;
        setSections((prev) =>
          prev.map((sec) => {
            const rawItems = blocks[sec.id] || blocks[sec.id.toLowerCase()] || [];
            const items = Array.isArray(rawItems)
              ? rawItems.map((it) => (typeof it === "string" ? it : ((it as { text?: string } | undefined)?.text || "")))
              : [];
            return {
              ...sec,
              items: items.length > 0 ? items : sec.items,
            };
          })
        );
      }
    } catch {
      triggerToast('Unable to load canvas from cloud. Using local draft.');
    } finally {
      setIsLoading(false);
    }
  }, [loadCanvas, triggerToast]);

  useEffect(() => {
    void (async () => { await fetchCanvasData(); })();
  }, [fetchCanvasData]);

  // 2. Debounced Auto-Save to Backend
  const persistCanvas = useCallback(
    async (currentSections: Section[]) => {
      // status deferred to async timer
      try {
        const blockMap: Record<string, string[]> = {};
        currentSections.forEach((sec) => {
          blockMap[sec.id] = sec.items;
        });

        await saveCanvas('lean', { blocks: blockMap });

        setSaveStatus('saved');
        setLastSavedTime(new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(new Date()));
      } catch {
        setSaveStatus('error');
        triggerToast('Failed to auto-save canvas changes.');
      }
    },
    [saveCanvas, triggerToast]
  );

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isLoading) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // status deferred to async timer
    saveTimeoutRef.current = setTimeout(() => {
      persistCanvas(sections);
    }, 1200);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [sections, isLoading, persistCanvas]);

  // 3. AI Fill Canvas
  const handleDraftAI = async () => {
    try {
      setIsAiGenerating(true);
      const res = await aiFillCanvas('lean', { tone: 'analytical' });

      setShowAiModal(false);
      const gen = res as { blocks?: unknown; data?: { blocks?: unknown } }; const generatedBlocks = (gen?.blocks || gen?.data?.blocks || res) as Record<string, unknown> | undefined;

      if (generatedBlocks && typeof generatedBlocks === 'object') {
        setSections((prev) =>
          prev.map((sec) => {
            const genMap = generatedBlocks as Record<string, unknown>; const raw = genMap?.[sec.id] || genMap?.[sec.id.toLowerCase()];
            if (!raw) return sec;
            const newItems = Array.isArray(raw)
              ? raw.map((it) => (typeof it === "string" ? it : ((it as { text?: string } | undefined)?.text || "")))
              : [String(raw)];
            return {
              ...sec,
              items: Array.from(new Set([...sec.items, ...newItems])),
            };
          })
        );
        triggerToast('? Lean Canvas drafted with AI.');
      } else {
        triggerToast('AI draft received.');
      }
    } catch {
      triggerToast('AI generation timed out or failed. Please try again.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const addItem = (sectionId: string) => {
    const newItem = prompt('Enter new canvas point:');
    if (!newItem || !newItem.trim()) return;

    setSections((prev) =>
      prev.map((sec) =>
        sec.id === sectionId ? { ...sec, items: [...sec.items, newItem.trim()] } : sec
      )
    );
  };

  const removeItem = (sectionId: string, idxToRemove: number) => {
    setSections((prev) =>
      prev.map((sec) =>
        sec.id === sectionId
          ? { ...sec, items: sec.items.filter((_, idx) => idx !== idxToRemove) }
          : sec
      )
    );
  };

  const handleExport = () => {
    const jsonStr = JSON.stringify(sections, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lean-canvas.json';
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Canvas exported.');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
            Lean Canvas
          </h2>
          <div className="flex items-center gap-2 text-xs text-[#556358] mt-1">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-copper-700 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving changes...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-[#183B28] font-medium">
                <Check className="w-3 h-3 text-[#183B28]" /> Saved to cloud
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-600 font-medium">Sync error</span>
            )}
            <span>·</span>
            <span>last synced {lastSavedTime}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 bg-[#F5ECDC] hover:bg-[#EAD5C6] text-[#522F1A] font-bold px-4 py-2 rounded-card text-xs transition-colors border border-[#EAD5C6]"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#8A5330] text-[#8A5330]" />
            <span>Fill with AI</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-white hover:bg-[#F5F5F0] text-[#1E2923] font-semibold px-4 py-2 rounded-card text-xs transition-colors border border-[#EBEBE6] shadow-card"
          >
            <Download className="w-3.5 h-3.5 text-[#556358]" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[300px] w-full items-center justify-center rounded-modal border border-[#EBEBE6] bg-white p-12 shadow-card">
          <div className="flex flex-col items-center gap-3 text-sage-600">
            <Loader2 className="w-8 h-8 animate-spin text-[#183B28]" />
            <p className="text-xs font-semibold">Loading Lean Canvas...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {sections.map((sec) => (
            <div
              key={sec.id}
              className="bg-white rounded-modal p-5 border border-[#EBEBE6] shadow-card flex flex-col gap-4 min-h-[180px] relative group transition-all hover:border-sage-300"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                  {sec.title}
                </h4>
                <button
                  onClick={() => addItem(sec.id)}
                  className="flex items-center gap-1 text-xs text-[#8E9B90] hover:text-[#183B28] transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {sec.items.length === 0 ? (
                  <p className="text-xs text-sage-400 italic py-2">No entries yet. Click Add or Fill with AI.</p>
                ) : (
                  sec.items.map((item, idx) => (
                    <span
                      key={idx}
                      className="group/item inline-flex items-center gap-1.5 bg-[#E6EFEA] text-[#183B28] text-xs font-medium px-3 py-1.5 rounded-input border border-[#D5E3DB]"
                    >
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => {
                          const updated = prompt('Edit item:', item);
                          if (updated && updated.trim()) {
                            setSections((prev) =>
                              prev.map((s) =>
                                s.id === sec.id
                                  ? {
                                      ...s,
                                      items: s.items.map((it, i) =>
                                        i === idx ? updated.trim() : it
                                      ),
                                    }
                                  : s
                              )
                            );
                          }
                        }}
                      >
                        {item}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(sec.id, idx);
                        }}
                        className="text-sage-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E2923]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-modal shadow-raised w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex flex-col gap-4">
              <div className="w-12 h-12 bg-[#F5ECDC] rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#8A5330] fill-[#8A5330]" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-[#1E2923]">
                  Fill with AI
                </h3>
                <p className="text-sm text-[#617065] mt-2 leading-relaxed">
                  I&apos;ll analyze your startup profile and draft recommendations for each canvas block.
                </p>
              </div>
            </div>
            <div className="bg-[#FAFAFA] p-4 flex justify-end gap-3 border-t border-[#EBEBE6]">
              <button
                disabled={isAiGenerating}
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-sm font-bold text-[#617065] hover:text-[#1E2923] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isAiGenerating}
                onClick={handleDraftAI}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#183B28] hover:bg-[#11291C] rounded-card shadow-card transition-colors disabled:opacity-50"
              >
                {isAiGenerating && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                <span>{isAiGenerating ? 'Drafting...' : 'Draft it'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




