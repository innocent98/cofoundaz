'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, Download, FileText, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { useBlobPreview } from '@/hooks/useBlobPreview';
import { fetchSignerExecuted, getSignView, sign as signRequest, type SignResult, type SignView } from '@/lib/api/signatures';
import { apiErrorInfo } from '@/lib/api/api-error';
import BrandLogo from '@/components/brand/BrandLogo';

// Public signing view (no auth). See cofoundaz-api/docs/fe-integration-guide-documents-esign-v2.md section 5.
// Opening the link marks the signer Viewed. Every dead token is the same 404, shown as one page.

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const POLL_MS = 3000;
const POLL_LIMIT_MS = 60_000;

/** After the last signature: the signer's own executed copy, ready in a few seconds. */
function ExecutedCopy({ token }: { token: string }) {
  const [state, setState] = useState<'preparing' | 'ready' | 'slow' | 'gone'>('preparing');
  const [file, setFile] = useState<{ blob: Blob; filename: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();
    const tick = async () => {
      while (!cancelled) {
        const r = await fetchSignerExecuted(token);
        if (cancelled) return;
        if (r.state === 'ready') {
          setFile({ blob: r.blob, filename: r.filename });
          setState('ready');
          return;
        }
        if (r.state === 'gone') {
          setState('gone');
          return;
        }
        if (Date.now() - started > POLL_LIMIT_MS) {
          setState('slow');
          return;
        }
        await new Promise((res) => setTimeout(res, POLL_MS));
      }
    };
    void tick();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const save = () => {
    if (!file) return;
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (state === 'gone') return null;
  if (state === 'ready') {
    return (
      <button type="button" onClick={save} className="inline-flex items-center justify-center gap-1.5 min-h-11 px-5 rounded-card bg-brand-strong hover:bg-brand-rail text-white text-sm font-bold shadow-card transition-colors">
        <Download className="w-4 h-4" /> Download the signed PDF
      </button>
    );
  }
  return (
    <p role="status" className="flex items-start gap-2 text-xs text-ink-muted max-w-sm">
      <Loader2 className={`w-4 h-4 shrink-0 ${state === 'slow' ? '' : 'animate-spin'}`} aria-hidden />
      {state === 'slow' ? 'The signed copy is taking longer than usual. It will be emailed to you when it is ready.' : 'Preparing the signed copy…'}
    </p>
  );
}

export default function PublicSignerPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token as string;

  const [view, setView] = useState<SignView | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SignResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const d = await getSignView(token);
      setView(d);
      if (d?.signer?.name) setTypedName(d.signer.name);
    } catch (err) {
      // Uniform 404 = unknown, used, expired, cancelled or not-your-turn link: one page for all of them.
      void err;
      setInvalid(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      await load();
    })();
  }, [token, load]);

  const previewSrc = useBlobPreview(view?.file.download_url ?? null, view?.file.content_type ?? '');

  const sign = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = typedName.trim();
    if (!name) {
      setError('Please type your full name to sign.');
      return;
    }
    if (!consented) {
      setError('Please confirm your consent to sign electronically.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      setResult(await signRequest(token, name));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('This link has already been used or is no longer valid.');
      } else {
        const info = apiErrorInfo(err, 'Could not record your signature. Please try again.');
        setError(info.status === 429 ? 'Too many attempts. Wait a minute and try again.' : info.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-xf6f7f4 font-body text-ink">
      <header className="bg-white border-b border-line px-6 py-4 flex items-center justify-between">
        <BrandLogo height={26} eager />
        <div className="text-sm font-medium text-ink-muted">Review &amp; Sign</div>
      </header>

      <main className="max-w-2xl mx-auto py-10 px-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-ink-muted py-24">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading document…
          </div>
        )}

        {!loading && invalid && (
          <div className="bg-white rounded-modal shadow-card border border-line p-10 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-danger-wash text-danger-600 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-display font-bold">This link is no longer valid</h1>
            <p className="text-sm text-ink-muted max-w-sm">
              It may have already been signed, been cancelled, or expired. Ask the sender for a fresh link.
            </p>
          </div>
        )}

        {!loading && !invalid && result && (
          <div className="bg-white rounded-modal shadow-card border border-line p-10 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-success-50 text-success flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-display font-bold">Signed, thank you</h1>
            <p className="text-sm text-ink-muted">
              {result.status === 'complete'
                ? result.total === 1
                  ? 'The signature is in, this document is complete.'
                  : `All ${result.total} signatures are in, this document is complete.`
                : `${result.signed_count} of ${result.total} signed. The remaining signers have their own links.`}
            </p>
            {result.status === 'complete' && result.executed_url && <ExecutedCopy token={token} />}
            <p className="text-xs text-ink-subtle">You can safely close this tab.</p>
          </div>
        )}

        {!loading && !invalid && !result && view && (
          <div className="bg-white rounded-modal shadow-card border border-line overflow-hidden">
            <div className="border-b border-line px-6 py-4 bg-surface-faint">
              <h2 className="text-lg font-semibold">{view.request.title}</h2>
              <p className="text-sm text-ink-muted">Hi {view.signer.name || view.signer.email}, please review and sign below.</p>
              {view.request.sent_by && <p className="text-xs text-ink-subtle mt-1">Sent by {view.request.sent_by}{view.request.expires_at ? `. This link expires ${new Date(view.request.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.` : '.'}</p>}
            </div>

            <div className="p-6 flex flex-col gap-6">
              {view.request.message && (
                <div className="rounded-card border border-line bg-surface-faint p-4">
                  <span className="block text-[10px] font-bold text-ink-subtle uppercase tracking-wider mb-1">Message from {view.request.sent_by || 'the sender'}</span>
                  <p className="text-sm text-ink whitespace-pre-wrap">{view.request.message}</p>
                </div>
              )}
              <div className="flex items-center gap-3 bg-surface-subtle border border-line rounded-card p-4">
                <div className="w-10 h-10 rounded-input bg-white border border-line flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-ink-muted" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold truncate">{view.file.filename}</span>
                  <span className="text-xs text-ink-subtle">{fmtSize(view.file.size_bytes)}</span>
                </div>
                {/^https?:\/\//.test(view.file.download_url) && (
                  <a
                    href={view.file.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 min-h-11 px-2 text-xs font-semibold text-brand-strong hover:text-brand-rail"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open
                  </a>
                )}
              </div>

              {/* Inline preview so the signer can read the document without leaving
                  the page. Only for previewable types over an absolute URL; other
                  files fall back to the "Open" link above. */}
              {previewSrc &&
                (view.file.content_type?.split(';')[0].trim().toLowerCase() === 'application/pdf' ? (
                  <iframe src={previewSrc} title={view.file.filename} className="w-full h-80 rounded-card border border-line bg-surface-subtle" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt={view.file.filename} className="w-full max-h-80 object-contain rounded-card border border-line bg-surface-subtle" />
                ))}

              <form onSubmit={sign} className="flex flex-col gap-4">
                <label className="text-xs font-bold text-neutral-x55625a uppercase tracking-wider" htmlFor="typed-name">
                  Type your full name to sign
                </label>
                <input
                  id="typed-name"
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full min-h-11 border border-line-strong rounded-input px-3 py-2.5 text-sm focus:outline-none focus:border-line-focus focus:ring-1 focus:ring-line-focus"
                />

                {/* Adopt-your-signature: render the typed name in a script face so
                    the signer sees their signature before committing. What we
                    submit is still the typed name, the API records typed_name only. */}
                <div className="rounded-card border border-dashed border-line-strong bg-surface-faint px-4 py-3">
                  <span className="block text-[10px] font-bold text-ink-subtle uppercase tracking-wider mb-1">
                    Your signature
                  </span>
                  <span
                    className="block text-2xl text-ink leading-tight min-h-[2rem]"
                    style={{ fontFamily: "'Snell Roundhand', 'Segoe Script', 'Brush Script MT', cursive", fontStyle: 'italic' }}
                  >
                    {typedName.trim() || <span className="text-neutral-xc3cbc4">Your signature appears here</span>}
                  </span>
                </div>

                <label className="flex items-start gap-2 min-h-11 text-[11px] text-ink-muted leading-relaxed cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consented}
                    onChange={(e) => setConsented(e.target.checked)}
                    className="mt-0.5 accent-brand-strong w-5 h-5 shrink-0"
                  />
                  <span>
                    I agree that typing my name above is my electronic signature, and I consent to sign this
                    document electronically.
                  </span>
                </label>

                <p className="text-[11px] text-ink-subtle leading-relaxed">{view.legal_caveat}</p>
                {error && <p role="alert" className="text-xs font-semibold text-danger-600">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting || !consented || !typedName.trim()}
                  className="mt-1 min-h-11 bg-brand-strong hover:bg-brand-rail disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-card text-sm transition-colors shadow-card"
                >
                  {submitting ? 'Signing…' : 'Sign document'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
