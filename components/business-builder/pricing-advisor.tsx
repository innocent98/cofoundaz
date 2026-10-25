'use client';

import React, { useState } from 'react';
import { Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { businessBuilderApi, type PricingAdvice } from '@/lib/api/business-builder';
import { apiErrorInfo } from '@/lib/api/api-error';
import { waitForJob } from '@/lib/api/bb-jobs';
import { OVER_BUDGET_MESSAGE } from '@/hooks/useBusinessAiFill';
import { useBuilderAccess } from '@/hooks/useBuilderAccess';
import { useAiStatus } from '@/hooks/useAiStatus';
import { AiConfirmModal } from '@/components/business-builder/ai-confirm-modal';
import { cleanPriceRows, modelLabel, type CompetitorPriceRow } from '@/lib/bb-records';

interface AdvisorResult {
  status?: 'ready' | 'over_budget' | 'gone';
  advice?: PricingAdvice;
}

const inputClass =
  'w-full border border-line-strong rounded-input px-3 py-2 text-xs focus:outline-none focus:border-line-focus focus:ring-1 focus:ring-line-focus placeholder:text-neutral-x6f7d72';

interface Props {
  /** Competitor prices read from the Competitive Analysis records, to prefill the inputs. */
  initialPrices: CompetitorPriceRow[];
  /** True when a pricing model already exists, so Apply replaces it. */
  hasPricing: boolean;
  onApply: (advice: PricingAdvice) => Promise<void>;
}

/**
 * The AI pricing advisor: competitor prices (prefilled) plus willingness-to-pay
 * notes in, a starting-point recommendation out. Nothing is saved until "Apply".
 */
export function PricingAdvisor({ initialPrices, hasPricing, onApply }: Props) {
  const { canEdit } = useBuilderAccess();
  const { isOverBudget, formattedResetsAt } = useAiStatus();
  const [prices, setPrices] = useState<CompetitorPriceRow[]>(initialPrices);
  const [wtp, setWtp] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [advice, setAdvice] = useState<PricingAdvice | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyConfirm, setApplyConfirm] = useState(false);

  if (!canEdit) return null;

  const run = async () => {
    setConfirming(false);
    setBusy(true);
    setNote(null);
    setAdvice(null);
    try {
      const job = await businessBuilderApi.pricingAdvisor({
        competitor_prices: cleanPriceRows(prices),
        willingness_to_pay: wtp.trim().slice(0, 2000),
      });
      const out = await waitForJob<AdvisorResult>(job.job_id, { timeoutMs: 120000 });
      if (out.state === 'timeout') return setNote('Taking longer than usual. Try again shortly.');
      if (out.state === 'failed') return setNote('AI drafting failed. Try again.');
      const status = out.result?.status;
      if (status === 'over_budget') return setNote(OVER_BUDGET_MESSAGE);
      if (status === 'gone') return setNote('Your workspace is no longer available.');
      if (!out.result?.advice) return setNote('No advice came back. Try again.');
      setAdvice(out.result.advice);
    } catch (err) {
      setNote(apiErrorInfo(err, 'Could not request advice.').message);
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!advice) return;
    setApplying(true);
    try {
      await onApply(advice);
      setAdvice(null);
      setApplyConfirm(false);
    } catch (err) {
      setNote(apiErrorInfo(err, 'Could not apply the advice.').message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <section aria-labelledby="advisor-title" className="bg-white rounded-modal border border-line-soft shadow-card p-6 flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-full bg-accent-xf5ecdc flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-accent-700" />
        </span>
        <div>
          <h3 id="advisor-title" className="text-sm font-bold text-ink">Pricing advisor</h3>
          <p className="text-xs text-ink-soft">Tell it what competitors charge and what customers say they would pay. You get starting points to test, not final prices.</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold tracking-wider text-ink-soft uppercase">Competitor prices</p>
        {prices.length === 0 && <p className="text-xs text-ink-soft">None yet. Add a price on a competitor in Competitive analysis, or type one here.</p>}
        {prices.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <input aria-label={`Competitor ${i + 1} name`} value={p.name} maxLength={120} onChange={(e) => setPrices((prev) => prev.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)))} placeholder="Competitor" className={inputClass} />
            <input aria-label={`Competitor ${i + 1} price`} value={p.price} maxLength={120} onChange={(e) => setPrices((prev) => prev.map((r, idx) => (idx === i ? { ...r, price: e.target.value } : r)))} placeholder="₦1,500/month" className={inputClass} />
            <button type="button" onClick={() => setPrices((prev) => prev.filter((_, idx) => idx !== i))} className="p-2 rounded-input text-ink-soft hover:text-danger-text hover:bg-danger-wash" aria-label={`Remove competitor ${i + 1}`}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {prices.length < 20 && (
          <button type="button" onClick={() => setPrices((prev) => [...prev, { name: '', price: '' }])} className="flex items-center gap-1 text-xs font-semibold text-brand-strong self-start">
            <Plus className="w-3.5 h-3.5" /> Add competitor price
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="wtp" className="text-[11px] font-bold tracking-wider text-ink-soft uppercase">Willingness to pay notes</label>
        <textarea id="wtp" value={wtp} maxLength={2000} rows={3} onChange={(e) => setWtp(e.target.value)} placeholder="What customers told you they would pay, and what they pay now." className={`${inputClass} resize-y`} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={busy || isOverBudget}
          title={isOverBudget ? `AI is paused until ${formattedResetsAt}` : undefined}
          className="flex items-center gap-1.5 bg-accent-xf5ecdc hover:bg-accent-200 text-accent-900 font-bold px-4 py-2.5 rounded-card text-xs transition-colors border border-accent-200 disabled:opacity-60 shadow-card"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 fill-accent-700 text-accent-700" />}
          {busy ? 'Working it out' : 'Get pricing advice'}
        </button>
        {note && <span role="status" className="text-[11px] font-semibold text-danger-600">{note}</span>}
      </div>

      {advice && (
        <div className="border-t border-line-soft pt-5 flex flex-col gap-4" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-body">Suggested model</span>
            <span className="bg-brand-strong text-white px-3 py-1 rounded-full text-xs font-semibold">{modelLabel(advice.recommended_model)}</span>
          </div>
          <p className="text-xs text-ink leading-relaxed">{advice.rationale}</p>
          <p className="text-[11px] font-semibold text-accent-700">These prices are starting points to test with customers, not final answers.</p>

          {advice.tiers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[420px]">
                <thead>
                  <tr className="border-b border-line-soft">
                    <th className="py-2 pr-4 text-[11px] font-bold tracking-wider text-ink-soft uppercase">Tier</th>
                    <th className="py-2 pr-4 text-[11px] font-bold tracking-wider text-ink-soft uppercase">Price</th>
                    <th className="py-2 text-[11px] font-bold tracking-wider text-ink-soft uppercase">Included</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-faint">
                  {advice.tiers.map((t, i) => (
                    <tr key={i} className="align-top">
                      <td className="py-2 pr-4 text-xs font-bold text-ink">{t.name}</td>
                      <td className="py-2 pr-4 text-xs font-bold text-brand-strong">{t.price}</td>
                      <td className="py-2 text-xs text-ink-body">{t.features.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {advice.wtp_questions.length > 0 && (
            <div>
              <p className="text-[11px] font-bold tracking-wider text-ink-soft uppercase">Ask customers</p>
              <ul className="mt-1 list-disc list-inside text-xs text-ink space-y-1">
                {advice.wtp_questions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {applyConfirm ? (
              <>
                <span className="text-xs text-ink-body">Apply replaces the tiers in your pricing model.</span>
                <button type="button" onClick={apply} disabled={applying} className="px-4 py-2 bg-brand-strong hover:bg-brand-rail-ink disabled:opacity-60 text-white rounded-card text-xs font-bold">{applying ? 'Applying' : 'Yes, apply'}</button>
                <button type="button" onClick={() => setApplyConfirm(false)} className="px-4 py-2 bg-white border border-neutral-xdcdcd6 rounded-card text-xs font-bold">Cancel</button>
              </>
            ) : (
              <button type="button" onClick={() => (hasPricing ? setApplyConfirm(true) : void apply())} disabled={applying} className="px-4 py-2 bg-brand-strong hover:bg-brand-rail-ink disabled:opacity-60 text-white rounded-card text-xs font-bold">
                {applying ? 'Applying' : 'Apply'}
              </button>
            )}
          </div>
        </div>
      )}

      <AiConfirmModal
        open={confirming}
        detail="Your competitor prices and notes are used. Nothing is saved until you press Apply."
        onConfirm={run}
        onCancel={() => setConfirming(false)}
      />
    </section>
  );
}
