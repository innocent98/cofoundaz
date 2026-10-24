'use client';

import React, { useState } from 'react';
import { useAIMemory } from '../../../../hooks/useAICoFounder';
import { AiUsageDisplay } from '@/components/ai/ai-usage-display';

export default function SettingsPage() {
  const [proactiveSuggestions, setProactiveSuggestions] = useState(true);
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [selectedTone, setSelectedTone] = useState<'straight' | 'encouraging'>('encouraging');
  
  const { memory, loading, forgetMemoryFact, clearAllMemory } = useAIMemory();

  const handleClearAllMemory = () => {
    if (confirm('Clear AI memory? I\'ll forget everything I\'ve learned about your startup outside your actual data.')) {
      clearAllMemory();
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-ink tracking-tight mb-1">
          AI settings
        </h2>
        <p className="text-xs text-ink-muted">
          Tune how your Co-Founder works and what it remembers.
        </p>
      </div>

      {/* AI Usage, Quota, and Over-Budget Banner */}
      <AiUsageDisplay />

      <div className="bg-white rounded-modal border border-line-soft p-6 shadow-card flex flex-col divide-y divide-line-faint">
        <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
          <div>
            <h3 className="font-bold text-sm text-ink">
              Proactive suggestions
            </h3>
            <p className="text-xs text-ink-muted">
              Let me surface moves before you ask.
            </p>
          </div>
          <button
            onClick={() => setProactiveSuggestions(!proactiveSuggestions)}
            className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
              proactiveSuggestions ? 'bg-brand-strong' : 'bg-neutral-xd0d0c8'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-card transform transition-transform ${
                proactiveSuggestions ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between pt-4 pb-2">
          <div>
            <h3 className="font-bold text-sm text-ink">
              Daily briefing
            </h3>
            <p className="text-xs text-ink-muted">
              A morning digest of what needs you.
            </p>
          </div>
          <button
            onClick={() => setDailyBriefing(!dailyBriefing)}
            className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
              dailyBriefing ? 'bg-brand-strong' : 'bg-neutral-xd0d0c8'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-card transform transition-transform ${
                dailyBriefing ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-modal border border-line-soft p-6 shadow-card">
        <h3 className="font-bold text-sm text-ink mb-4">Tone</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setSelectedTone('straight')}
            className={`p-4 rounded-card border cursor-pointer transition-all ${
              selectedTone === 'straight'
                ? 'bg-brand-tint border-brand-strong'
                : 'bg-white border-line-soft hover:border-neutral-xd0d0c8'
            }`}
          >
            <h4 className="font-bold text-sm text-ink">Straight shooter</h4>
            <p className="text-xs text-ink-muted mt-1">Direct, no hedging.</p>
          </div>

          <div
            onClick={() => setSelectedTone('encouraging')}
            className={`p-4 rounded-card border cursor-pointer transition-all ${
              selectedTone === 'encouraging'
                ? 'bg-brand-tint border-brand-strong'
                : 'bg-white border-line-soft hover:border-neutral-xd0d0c8'
            }`}
          >
            <h4 className="font-bold text-sm text-ink">Encouraging</h4>
            <p className="text-xs text-ink-muted mt-1">Warm, still honest.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-modal border border-line-soft p-6 shadow-card">
        <div className="flex items-center justify-between pb-4 border-b border-line-faint">
          <h3 className="font-bold text-sm text-ink">What I remember</h3>
          {memory.length > 0 && (
            <button
              onClick={handleClearAllMemory}
              className="text-xs font-semibold text-danger-xb84233 hover:underline transition-colors cursor-pointer"
            >
              Clear all memory
            </button>
          )}
        </div>

        <div className="divide-y divide-line-faint">
          {loading ? (
            <p className="text-xs text-ink-subtle py-6 text-center">Loading...</p>
          ) : memory.length === 0 ? (
            <p className="text-xs text-ink-subtle py-6 text-center">No memories saved.</p>
          ) : (
            memory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3.5 text-xs text-neutral-x334139"
              >
                <span>{item.fact}</span>
                <button
                  onClick={() => forgetMemoryFact(item.id)}
                  className="text-xs font-semibold text-ink-muted hover:text-ink transition-colors ml-4 shrink-0 cursor-pointer"
                >
                  Forget this
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
