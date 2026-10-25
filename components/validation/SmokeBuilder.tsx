'use client';

import React, { useState } from 'react';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { apiErrorInfo } from '@/lib/api/api-error';
import type { ExperimentDraft } from '@/lib/api/validation';
import type { SmokeTest } from '@/hooks/useSmokeTests';
import { slugify } from '@/lib/validation-format';

const DEFAULT_POST_SIGNUP = "You're on the list, we'll be in touch soon.";

const FIELD =
  'w-full bg-surface-subtle border border-line-soft rounded-input px-4 py-2.5 text-sm outline-none focus:border-brand-strong focus:ring-1 focus:ring-brand-strong';
const LABEL = 'text-xs font-bold text-ink uppercase tracking-wider';

export interface BuilderApi {
  create: (body: { name: string; config: Record<string, unknown>; assumption_ids?: string[] }) => Promise<SmokeTest>;
  publish: (id: string) => Promise<SmokeTest>;
}

/** The slug error to show under the field, from a failed create/patch (422 or 409). */
export function slugErrorFrom(err: unknown): string | null {
  const info = apiErrorInfo(err, '');
  if (info.code === 'SLUG_TAKEN' || info.status === 409) return info.message || 'That page address is taken. Try another.';
  const f = info.fieldErrors.find((x) => x.field.endsWith('slug'));
  return f ? f.message : null;
}

export function SmokeBuilder({
  draft,
  origin,
  api,
  onCancel,
  onDone,
  notify,
}: {
  /** AI draft to pre-fill from. Nothing is saved until Save or Publish. */
  draft: ExperimentDraft | null;
  origin: string;
  api: BuilderApi;
  onCancel: () => void;
  onDone: (test: SmokeTest, published: boolean) => void;
  notify: (msg: string) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(draft?.name ?? '');
  const [headline, setHeadline] = useState(draft?.headline ?? '');
  const [subheadline, setSubheadline] = useState(draft?.subheadline ?? '');
  const [cta, setCta] = useState(draft?.cta_text ?? 'Get Early Access');
  const [requireEmail, setRequireEmail] = useState(true);
  const [showPricing, setShowPricing] = useState(false);
  const [postSignupMsg, setPostSignupMsg] = useState(DEFAULT_POST_SIGNUP);
  const [metricType, setMetricType] = useState(draft?.metric_type ?? 'email_signup');
  const [targetConversion, setTargetConversion] = useState(String(draft?.target_conversion ?? 5));
  const targetNum = Number(targetConversion);
  const targetInvalid = targetConversion.trim() === '' || !Number.isFinite(targetNum) || targetNum < 1 || targetNum > 50;
  const [slug, setSlug] = useState(draft?.slug_suggestion ?? '');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'draft' | 'publish' | null>(null);

  const submit = async (publish: boolean) => {
    if (busy) return;
    setSlugError(null);
    const testName = name.trim() || headline.trim() || slug.trim();
    if (!testName) {
      notify('Add a test name or headline first.');
      setStep(1);
      return;
    }
    if (publish && !slug.trim()) {
      setSlugError('Choose a page address to publish.');
      return;
    }
    setBusy(publish ? 'publish' : 'draft');
    const config: Record<string, unknown> = {
      headline: headline.trim(),
      subheadline: subheadline.trim(),
      cta_text: cta.trim(),
      require_email: requireEmail,
      show_pricing: showPricing,
      post_signup_message: postSignupMsg.trim(),
      metric_type: metricType,
      target_conversion: Math.min(50, Math.max(1, Math.round(Number(targetConversion) || 5))),
    };
    if (slug.trim()) config.slug = slug.trim();

    let created: SmokeTest;
    try {
      created = await api.create({ name: testName, config, assumption_ids: draft?.assumption_ids });
    } catch (err) {
      setBusy(null);
      const se = slugErrorFrom(err);
      if (se) setSlugError(se);
      else notify(apiErrorInfo(err, 'Could not save the smoke test.').message);
      return;
    }
    if (!publish) {
      setBusy(null);
      onDone(created, false);
      return;
    }
    try {
      const live = await api.publish(created.id);
      setBusy(null);
      onDone(live, true);
    } catch (err) {
      setBusy(null);
      const se = slugErrorFrom(err);
      if (se) {
        setSlugError(se);
        notify('Saved as a draft. Fix the page address, then publish.');
      } else {
        notify('Saved as a draft, but it did not go live. Open it to publish.');
      }
      onDone(created, false);
    }
  };

  const slugHost = `${origin.replace(/^https?:\/\//, '')}/p/`;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="text-sm font-bold text-ink-muted hover:text-ink cursor-pointer">← Back</button>
        <h2 className="text-2xl font-display font-bold text-ink">{draft ? 'Review your drafted test' : 'New smoke test'}</h2>
      </div>

      {draft?.rationale && (
        <div className="flex items-start gap-3 bg-accent-xfdf4e3 border border-accent-200 rounded-modal px-4 py-3">
          <Sparkles className="w-4 h-4 text-accent-700 mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-sm text-accent-x5c3a22">
            <span className="font-bold">Why this test: </span>
            {draft.rationale}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`flex-1 h-2 rounded-full ${step >= n ? 'bg-brand-strong' : 'bg-line-soft'}`} />
        ))}
      </div>

      <div className="bg-white rounded-modal border border-line-soft shadow-card p-5 md:p-8 flex flex-col gap-6">
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-bold text-ink">Step 1: Page design</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sb-name" className={LABEL}>Test name</label>
                <input id="sb-name" value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="e.g. Same-day settlement" className={FIELD} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sb-headline" className={LABEL}>Hero headline</label>
                <input id="sb-headline" value={headline} onChange={(e) => setHeadline(e.target.value)} type="text" placeholder="e.g. Save every day on WhatsApp" className={FIELD} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sb-sub" className={LABEL}>Subheadline</label>
                <textarea id="sb-sub" value={subheadline} onChange={(e) => setSubheadline(e.target.value)} placeholder="e.g. Automated daily savings for gig workers" className={`${FIELD} h-20 resize-none`} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sb-cta" className={LABEL}>CTA button text</label>
                <input id="sb-cta" value={cta} onChange={(e) => setCta(e.target.value)} type="text" placeholder="e.g. Get Early Access" className={FIELD} />
              </div>
              <div className="flex flex-col gap-3 pt-4 border-t border-line-soft">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={requireEmail} onChange={(e) => setRequireEmail(e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm font-medium text-ink">Require email capture</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={showPricing} onChange={(e) => setShowPricing(e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm font-medium text-ink">Show fake-door pricing section</span>
                </label>
              </div>
              <div className="flex flex-col gap-1.5 pt-2">
                <label htmlFor="sb-msg" className={LABEL}>Post-signup message</label>
                <input id="sb-msg" value={postSignupMsg} onChange={(e) => setPostSignupMsg(e.target.value)} type="text" className={FIELD} />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setStep(2)} className="bg-brand-strong hover:bg-brand-rail text-white px-6 py-2.5 rounded-card font-bold text-sm flex items-center gap-2 cursor-pointer">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-bold text-ink">Step 2: Goal &amp; metrics</h3>
            <div className="flex flex-col gap-4">
              <span className={LABEL}>Success metric</span>
              <div className="flex flex-col gap-3" role="radiogroup" aria-label="Success metric">
                {[
                  { v: 'email_signup', label: 'Email signup' },
                  { v: 'cta_click', label: 'CTA click (no email)' },
                  { v: 'preorder_click', label: 'Preorder click (pricing page)' },
                ].map((m) => (
                  <label key={m.v} className={`flex items-center gap-3 p-4 border rounded-card cursor-pointer transition-colors ${metricType === m.v ? 'bg-neutral-xe6efea border-brand-strong' : 'border-line-soft hover:bg-surface-ghost'}`}>
                    <input type="radio" name="metric" checked={metricType === m.v} onChange={() => setMetricType(m.v)} className="w-4 h-4" />
                    <span className="text-sm font-bold text-ink">{m.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-1.5 pt-4">
                <label htmlFor="sb-target" className={LABEL}>Target conversion rate (%)</label>
                <input id="sb-target" value={targetConversion} onChange={(e) => setTargetConversion(e.target.value)} type="number" min={1} max={50} aria-invalid={targetInvalid} aria-describedby="sb-target-msg" className={FIELD} />
                {targetInvalid ? (
                  <span id="sb-target-msg" role="alert" className="text-xs font-semibold text-danger-600">Between 1 and 50.</span>
                ) : (
                  <span id="sb-target-msg" className="text-xs text-ink-muted">Between 1 and 50. Typical validation bar: 5 to 10% on cold traffic.</span>
                )}
              </div>
            </div>
            <div className="flex justify-between pt-4 border-t border-line-soft">
              <button onClick={() => setStep(1)} className="text-sm font-bold text-ink-muted hover:text-ink cursor-pointer">Back</button>
              <button onClick={() => setStep(3)} disabled={targetInvalid} className="bg-brand-strong hover:bg-brand-rail disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-card font-bold text-sm flex items-center gap-2 cursor-pointer">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-bold text-ink">Step 3: Page address &amp; publish</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sb-slug" className={LABEL}>Page address</label>
                <div className="flex items-stretch min-w-0">
                  <span className="bg-line-faint border border-r-0 border-line-soft px-3 py-2.5 text-sm text-ink-muted rounded-l-input truncate max-w-[55%] md:max-w-none">{slugHost}</span>
                  <input
                    id="sb-slug"
                    type="text"
                    placeholder="my-cool-idea"
                    value={slug}
                    onChange={(e) => { setSlug(e.target.value.toLowerCase()); setSlugError(null); }}
                    aria-invalid={slugError ? true : undefined}
                    aria-describedby={slugError ? 'sb-slug-error' : undefined}
                    className={`flex-1 min-w-0 bg-surface-subtle border px-4 py-2.5 text-sm outline-none rounded-r-input ${slugError ? 'border-danger-600' : 'border-line-soft focus:border-brand-strong'}`}
                  />
                </div>
                {slugError ? (
                  <span id="sb-slug-error" role="alert" className="text-xs font-semibold text-danger-600">{slugError}</span>
                ) : (
                  <span className="text-xs text-ink-muted">
                    3 to 60 lowercase letters, numbers and dashes.{' '}
                    {name.trim() && !slug && (
                      <button type="button" className="underline font-semibold text-brand-strong cursor-pointer" onClick={() => setSlug(slugify(name))}>
                        Use &quot;{slugify(name)}&quot;
                      </button>
                    )}
                  </span>
                )}
              </div>
              <div className="mt-2 border border-line-soft rounded-modal bg-surface-subtle p-6 flex flex-col items-center justify-center gap-3 text-center">
                <h4 className="text-xl font-bold text-ink break-words max-w-full">{headline || 'Hero headline preview'}</h4>
                {subheadline && <p className="text-ink-muted text-sm break-words max-w-full">{subheadline}</p>}
                <button className="bg-accent-600 text-white px-6 py-2 rounded-card font-bold mt-1" type="button" disabled>{cta || 'Get Early Access'}</button>
              </div>
            </div>
            <div className="flex flex-col-reverse md:flex-row md:justify-between gap-3 pt-4 border-t border-line-soft">
              <button onClick={() => setStep(2)} className="text-sm font-bold text-ink-muted hover:text-ink cursor-pointer self-start">Back</button>
              <div className="flex flex-col md:flex-row gap-2">
                <button onClick={() => submit(false)} disabled={busy !== null} className="border border-brand-strong text-brand-strong hover:bg-neutral-xe6efea disabled:opacity-60 px-5 py-2.5 rounded-card font-bold text-sm flex items-center justify-center gap-2 cursor-pointer">
                  {busy === 'draft' && <Loader2 className="w-4 h-4 animate-spin" />} Save as draft
                </button>
                <button onClick={() => submit(true)} disabled={busy !== null} className="bg-accent-600 hover:bg-accent-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-card font-bold text-sm flex items-center justify-center gap-2 cursor-pointer">
                  {busy === 'publish' && <Loader2 className="w-4 h-4 animate-spin" />} Publish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
