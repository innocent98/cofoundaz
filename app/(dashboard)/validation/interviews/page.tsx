'use client';

import React, { useState } from 'react';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { useInterviews, InterviewVerdict } from '@/hooks/useInterviews';
import { useToast } from '../layout';
import { InsightSynthesizer } from '../components/InsightSynthesizer';
import { ConfirmDelete } from '@/components/validation/ConfirmDelete';
import { deleteWarning } from '@/lib/validation-format';

type Stance = 'Supports' | 'Contradicts' | 'Neutral';

const verdictLabel = (v: InterviewVerdict): Stance =>
  v === 'supports' ? 'Supports' : v === 'contradicts' ? 'Contradicts' : 'Neutral';

export default function InterviewsPage() {
  const { interviews, loading, error, addInterview, remove, refetch } = useInterviews();
  const [toDelete, setToDelete] = useState<{ id: string; interviewee: string } | null>(null);
  const { triggerToast } = useToast();

  const [intervieweeInput, setIntervieweeInput] = useState('');
  const [segmentTagInput, setSegmentTagInput] = useState('');
  const [quoteInput, setQuoteInput] = useState('');
  const [selectedStance, setSelectedStance] = useState<Stance>('Supports');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const name = intervieweeInput.trim();
    const quote = quoteInput.trim();
    if (!name || !quote || saving) return;
    setSaving(true);
    addInterview({
      interviewee: name,
      held_on: new Date().toISOString().slice(0, 10),
      verdict: selectedStance.toLowerCase() as InterviewVerdict,
      segment: segmentTagInput.trim() || undefined,
      notes: quote,
      key_quotes: [quote],
    })
      .then(() => {
        setIntervieweeInput('');
        setSegmentTagInput('');
        setQuoteInput('');
        setSelectedStance('Supports');
        triggerToast('Interview note saved.');
      })
      .catch(() => triggerToast('Could not save the note. Try again.'))
      .finally(() => setSaving(false));
  };

  const stanceBtn = (stance: Stance, activeClass: string) => (
    <button
      type="button"
      onClick={() => setSelectedStance(stance)}
      className={`py-2 px-3 rounded-card text-xs font-semibold transition-all border cursor-pointer ${
        selectedStance === stance ? activeClass : 'bg-white text-sage-600 border-sage-200 hover:bg-sage-50'
      }`}
    >
      {stance}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-display font-semibold text-sage-900 tracking-tight">
          Interview notes
        </h1>
        <InsightSynthesizer source="interviews" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* New note */}
        <div className="lg:col-span-5 bg-white rounded-modal p-6 border border-sage-200/80 space-y-4 shadow-card">
          <h3 className="font-bold text-sage-900 text-sm">New note</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Interviewee"
              value={intervieweeInput}
              onChange={(e) => setIntervieweeInput(e.target.value)}
              className="w-full bg-white border border-sage-200 rounded-card px-4 py-2.5 text-sm text-sage-900 focus:outline-none focus:border-[#1e4836]"
            />
            <input
              type="text"
              placeholder="Segment tag"
              value={segmentTagInput}
              onChange={(e) => setSegmentTagInput(e.target.value)}
              className="w-full bg-white border border-sage-200 rounded-card px-4 py-2.5 text-sm text-sage-900 focus:outline-none focus:border-[#1e4836]"
            />
            <textarea
              rows={4}
              placeholder="A key quote from the interview…"
              value={quoteInput}
              onChange={(e) => setQuoteInput(e.target.value)}
              className="w-full bg-white border border-sage-200 rounded-card px-4 py-2.5 text-sm text-sage-900 focus:outline-none focus:border-[#1e4836] resize-none"
            />
            <div className="grid grid-cols-3 gap-2 pt-1">
              {stanceBtn('Supports', 'bg-white text-green-800 border-green-800 shadow-card')}
              {stanceBtn('Contradicts', 'bg-white text-red-800 border-red-800 shadow-card')}
              {stanceBtn('Neutral', 'bg-white text-sage-900 border-sage-900 shadow-card')}
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !intervieweeInput.trim() || !quoteInput.trim()}
              className="w-full bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold py-3 rounded-card text-sm transition-all cursor-pointer shadow-card mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Saving…' : 'Save note'}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-7 space-y-4">
          {error && (
            <div className="flex items-center justify-between gap-3 bg-[#FBEAE7] border border-[#F0C9C2] rounded-card px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-[#8A2E22]">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </span>
              <button onClick={() => refetch()} className="text-xs font-semibold text-[#8A2E22] underline cursor-pointer">
                Retry
              </button>
            </div>
          )}

          {loading && interviews.length === 0 ? (
            <div className="flex items-center justify-center gap-2 text-sage-500 py-16">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading interview notes…</span>
            </div>
          ) : interviews.length === 0 ? (
            <div className="bg-white rounded-modal p-8 border border-dashed border-sage-200 text-center">
              <p className="text-sm text-sage-500">No interview notes yet. Add your first one on the left.</p>
            </div>
          ) : (
            interviews.map((item) => {
              const stance = verdictLabel(item.verdict);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-modal p-5 border border-sage-200/80 space-y-3 shadow-card hover:border-sage-300 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sage-900 text-sm truncate">
                      {item.interviewee}
                      {item.segment ? ` · ${item.segment}` : ''}
                    </h4>
                    <span className="shrink-0 flex items-center gap-2">
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-medium ${
                        stance === 'Supports'
                          ? 'bg-green-100 text-green-800'
                          : stance === 'Contradicts'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-sage-100 text-sage-700'
                      }`}
                    >
                      {stance}
                    </span>
                    <button
                      type="button"
                      onClick={() => setToDelete({ id: item.id, interviewee: item.interviewee })}
                      aria-label={`Delete interview with ${item.interviewee}`}
                      className="p-1 rounded-input text-sage-400 hover:text-[#B0483B] hover:bg-sage-100 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    </span>
                  </div>
                  {item.quote && (
                    <p className="text-sage-600 text-sm italic font-display leading-relaxed">“{item.quote}”</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {toDelete && (
        <ConfirmDelete
          title={`Delete the interview with ${toDelete.interviewee}?`}
          warning={deleteWarning('interview')}
          onConfirm={async () => {
            await remove(toDelete.id);
            triggerToast('Interview deleted');
          }}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
