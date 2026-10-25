'use client';

import React, { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useFeedback } from '@/hooks/useFeedback';
import { FeedbackInbox } from '@/components/validation/FeedbackInbox';
import { FeedbackThemes } from '@/components/validation/FeedbackThemes';
import { useToast } from '../layout';
import { InsightSynthesizer } from '../components/InsightSynthesizer';

export default function MvpFeedbackPage() {
  const fb = useFeedback();
  const { triggerToast } = useToast();
  const [themeMessage, setThemeMessage] = useState<string | null>(null);

  const total = fb.counts.interview + fb.counts.survey + fb.counts.in_app + fb.counts.email;

  const onFindThemes = async () => {
    setThemeMessage(null);
    const out = await fb.findThemes();
    if (out.ok) triggerToast('Themes updated');
    else setThemeMessage(out.message);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-display font-semibold text-neutral-900 tracking-tight">MVP feedback</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onFindThemes}
            disabled={fb.clustering || total === 0}
            className="px-4 py-2.5 rounded-card font-bold text-sm transition-colors flex items-center gap-2 shadow-card cursor-pointer disabled:opacity-60 bg-accent-xfdf4e3 hover:bg-accent-xf5ecdc text-accent-700 border border-accent-200"
          >
            {fb.clustering ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Sparkles className="w-4 h-4 fill-accent-700" aria-hidden="true" />}
            <span>{fb.clustering ? 'Finding themes…' : 'Find themes'}</span>
          </button>
          <InsightSynthesizer source="all" />
        </div>
      </div>

      <FeedbackThemes
        set={fb.themes}
        clustering={fb.clustering}
        message={themeMessage}
        loadMilestones={fb.milestones}
        onSend={fb.sendToRoadmap}
      />

      <FeedbackInbox
        items={fb.items}
        counts={fb.counts}
        loading={fb.loading}
        error={fb.error}
        showDismissed={fb.showDismissed}
        onShowDismissed={fb.setShowDismissed}
        onRetry={fb.refetch}
        onAdd={fb.add}
        onEdit={fb.edit}
        onRemove={fb.remove}
        onRestore={fb.restore}
        notify={triggerToast}
      />
    </div>
  );
}
