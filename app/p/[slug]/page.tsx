'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import {
  PublicApiError,
  getPublicPage,
  sendPublicEvent,
  submitPublicSignup,
  type PublicPage,
} from '@/lib/api/validation-public';
import { getVisitorId, isValidEmail } from '@/lib/validation-format';

type Phase = 'loading' | 'unavailable' | 'failed' | 'ready';

/**
 * A founder's hosted smoke-test page (D-VAL-1): `/p/{slug}`, no login. Visits and
 * clicks are fire-and-forget; one random id per browser keeps counts honest.
 */
export default function PublicSmokePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;

  const [phase, setPhase] = useState<Phase>('loading');
  const [page, setPage] = useState<PublicPage | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const visitorId = useRef<string>('');
  const visitSent = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const p = await getPublicPage(slug);
        if (!active) return;
        setPage(p);
        setPhase('ready');
        visitorId.current = getVisitorId(slug);
        if (!visitSent.current) {
          visitSent.current = true;
          sendPublicEvent(slug, 'visit', visitorId.current);
        }
      } catch (err) {
        if (!active) return;
        // Draft, ended, deleted and unknown pages are one and the same 404.
        setPhase(err instanceof PublicApiError && err.status === 404 ? 'unavailable' : 'failed');
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const onCta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page || submitting || message) return;
    setError(null);
    if (!visitorId.current) visitorId.current = getVisitorId(slug);

    if (!page.require_email) {
      sendPublicEvent(slug, 'cta_click', visitorId.current);
      setMessage(page.post_signup_message);
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    sendPublicEvent(slug, 'cta_click', visitorId.current);
    setSubmitting(true);
    try {
      setMessage(await submitPublicSignup(slug, email.trim(), visitorId.current));
    } catch (err) {
      if (err instanceof PublicApiError && err.status === 404) setPhase('unavailable');
      else if (err instanceof PublicApiError && err.status === 429) setError('Too many attempts. Please wait a moment and try again.');
      else if (err instanceof PublicApiError && err.status === 422) setError('Enter a valid email address.');
      else setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onPreorder = () => {
    if (!page || message) return;
    if (!visitorId.current) visitorId.current = getVisitorId(slug);
    sendPublicEvent(slug, 'preorder_click', visitorId.current);
    setMessage(page.post_signup_message);
  };

  return (
    <div className="min-h-[100dvh] bg-neutral-100 flex flex-col items-center px-4 py-10 md:py-16">
      <div className="w-full max-w-xl flex-1 flex flex-col">
        {phase === 'loading' && (
          <div className="flex items-center justify-center gap-2 text-neutral-500 py-20">
            <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Loading…</span>
          </div>
        )}

        {(phase === 'unavailable' || phase === 'failed') && (
          <div className="bg-white rounded-modal p-8 border border-neutral-200/70 shadow-card text-center my-auto">
            <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <h1 className="text-lg font-bold text-ink-deep">
              {phase === 'unavailable' ? "This page isn't available" : 'Something went wrong'}
            </h1>
            <p className="text-sm text-neutral-500 mt-1.5">
              {phase === 'unavailable' ? 'The link may be wrong, or the page is not online right now.' : 'Please refresh the page to try again.'}
            </p>
          </div>
        )}

        {phase === 'ready' && page && (
          <main className="bg-white rounded-modal p-6 md:p-10 border border-neutral-200/70 shadow-card text-center space-y-6 my-auto">
            <div className="space-y-3">
              <h1 className="text-2xl md:text-4xl font-display font-bold text-ink-deep break-words">{page.headline}</h1>
              {page.subheadline && <p className="text-sm md:text-base text-neutral-500 break-words">{page.subheadline}</p>}
            </div>

            {message ? (
              <div role="status" className="bg-neutral-xe6efea rounded-card p-5 flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-success" />
                </div>
                <p className="text-sm font-semibold text-ink-deep break-words">{message}</p>
              </div>
            ) : (
              <form onSubmit={onCta} noValidate className="space-y-3 text-left">
                {page.require_email && (
                  <div className="space-y-1.5">
                    <label htmlFor="pp-email" className="text-xs font-bold text-ink-deep">Email address</label>
                    <input
                      id="pp-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null); }}
                      placeholder="you@example.com"
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? 'pp-email-error' : undefined}
                      className={`w-full bg-white border rounded-card px-4 py-3 text-sm text-neutral-900 focus:outline-none ${error ? 'border-danger-600' : 'border-neutral-200 focus:border-brand-hover'}`}
                    />
                    {error && <p id="pp-email-error" role="alert" className="text-xs font-semibold text-danger-600">{error}</p>}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-card text-sm transition-all shadow-card flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {page.cta_text}
                </button>
                {!page.require_email && error && <p role="alert" className="text-xs font-semibold text-danger-600">{error}</p>}
              </form>
            )}

            {page.show_pricing && !message && (
              <section aria-label="Pricing" className="border border-neutral-200 rounded-card p-5 text-left space-y-3 bg-surface-subtle">
                <h2 className="text-base font-bold text-ink-deep">Pricing</h2>
                <p className="text-sm text-neutral-500">Pricing is not final yet. Tell us you would pay and we will keep you posted.</p>
                <button
                  type="button"
                  onClick={onPreorder}
                  className="w-full border border-brand-strong text-brand-strong hover:bg-neutral-xe6efea font-semibold py-3 rounded-card text-sm transition-colors cursor-pointer"
                >
                  I would pay for this
                </button>
              </section>
            )}
          </main>
        )}
      </div>
      <p className="text-center text-xs text-neutral-600 pt-8">{page?.powered_by || 'Powered by Cofoundaz'}</p>
    </div>
  );
}
