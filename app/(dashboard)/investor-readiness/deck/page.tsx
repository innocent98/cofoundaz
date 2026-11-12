"use client";

import React, { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UploadCloud, CheckCircle2, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { useWorkspace } from "@/components/workspace-context";
import { useDeckReviews } from "@/hooks/useDeckReviews";
import { resolveApiUrl } from "@/lib/api/client";
import type { DeckReview, DeckReviewSummary } from "@/lib/api/readiness";
import { deckErrorCopy } from "@/lib/readiness-format";
import { formatWhen, LoadFailed, LoadingBlock, ReadOnlyNote } from "../_components/states";

const READING_COPY = "Reading your deck like a partner on a Monday morning…";

export default function PitchDeckReviewPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading your deck review" />}>
      <DeckReviewContent />
    </Suspense>
  );
}

function DeckReviewContent() {
  const { role } = useWorkspace();
  const canUpload = role === "founder";
  const preferred = useSearchParams().get("review");
  const d = useDeckReviews(preferred);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = () => fileRef.current?.click();
  const onFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (f) void d.upload(f);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Only the founder gets a file input at all (a team member could otherwise reach it by keyboard).
  const input = !canUpload ? null : (
    <input
      ref={fileRef}
      type="file"
      accept="application/pdf,.pdf"
      className="sr-only"
      aria-label="Choose a pitch deck PDF"
      data-testid="deck-file-input"
      onChange={(e) => onFiles(e.target.files)}
    />
  );

  if (d.loading && !d.reviews) return <LoadingBlock label="Loading your deck review" />;
  if (d.error && !d.reviews) return <LoadFailed error={d.error} onRetry={d.reload} what="your deck reviews" />;

  const reviews = d.reviews ?? [];

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20 animate-fadeIn">
        {input}
        <div
          onDragOver={(e) => {
            if (!canUpload) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            if (!canUpload) return;
            e.preventDefault();
            setDragging(false);
            onFiles(e.dataTransfer.files);
          }}
          className={`flex w-full max-w-md flex-col items-center gap-3 rounded-modal border-2 border-dashed px-6 py-10 text-center ${
            dragging ? "border-brand-hover bg-neutral-xe2ede6" : "border-neutral-200 bg-white"
          }`}
        >
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400">
            {d.uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <UploadCloud className="w-8 h-8" />}
          </div>
          <h2 className="text-xl font-display font-semibold text-neutral-900">Your deck gets one first impression. Rehearse it here.</h2>
          {canUpload ? (
            <>
              <p className="text-neutral-500 text-sm max-w-sm">
                Drop your deck as a PDF (up to 15 MB). We review the story, the numbers and the layout. One review uses part of today&apos;s AI allowance.
              </p>
              <button
                onClick={pick}
                disabled={d.uploading}
                className="mt-2 bg-brand-hover hover:bg-brand-x153427 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-card transition-colors shadow-card"
              >
                {d.uploading ? "Uploading…" : "Select PDF File"}
              </button>
            </>
          ) : (
            <p className="text-neutral-500 text-sm max-w-sm">No deck has been reviewed yet. The founder can upload one.</p>
          )}
        </div>
        {d.actionError && (
          <p role="alert" className="text-sm text-danger-700 max-w-md text-center">
            {d.actionError}
          </p>
        )}
      </div>
    );
  }

  const selected = reviews.find((r) => r.id === d.selectedId) ?? reviews[0];
  const detail = d.detail;
  const inFlight = selected.status === "queued" || selected.status === "running" || detail?.status === "queued" || detail?.status === "running";

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {input}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-neutral-900 mb-1">Pitch deck review</h1>
          <p className="text-sm text-neutral-500">
            Version {selected.version} · {selected.filename}
            {selected.reviewed_at ? ` · Reviewed ${formatWhen(selected.reviewed_at)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {reviews.length > 1 && (
            <label className="flex items-center gap-2 text-xs font-medium text-neutral-600">
              Version
              <select
                value={selected.id}
                onChange={(e) => void d.select(e.target.value)}
                className="rounded-card border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-900"
              >
                {reviews.map((r) => (
                  <option key={r.id} value={r.id}>
                    v{r.version} {r.status === "ready" && r.scores ? `· ${r.scores.overall}/10` : `· ${r.status}`}
                  </option>
                ))}
              </select>
            </label>
          )}
          {canUpload && (
            <button
              onClick={pick}
              disabled={d.uploading || inFlight}
              className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 font-semibold py-2 px-4 rounded-card text-sm transition-colors shadow-card disabled:opacity-60"
            >
              {d.uploading ? "Uploading…" : "Re-review new version"}
            </button>
          )}
        </div>
      </div>

      {!canUpload && <ReadOnlyNote>You can read the deck review. Only the founder can upload a new version.</ReadOnlyNote>}
      {d.actionError && (
        <p role="alert" className="text-sm text-danger-700">
          {d.actionError}
        </p>
      )}
      {d.notice && (
        <p role="status" className="rounded-card border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700">
          {d.notice}
        </p>
      )}
      {d.error && (
        <p role="alert" className="text-sm text-danger-700">
          {d.error.message}
        </p>
      )}

      <VersionTrend reviews={reviews} />

      {inFlight && !d.slow && (
        <div role="status" className="flex items-center gap-3 rounded-modal border border-neutral-200 bg-white p-5 shadow-card">
          <Loader2 className="h-5 w-5 animate-spin text-brand-hover" />
          <span className="text-sm font-medium text-neutral-800">{READING_COPY}</span>
        </div>
      )}
      {inFlight && d.slow && (
        <div role="status" className="rounded-modal border border-warning-500/40 bg-warning-50 p-5 text-sm text-neutral-800 space-y-2">
          <p>This is taking longer than usual. Your review is still queued and will appear here when it finishes.</p>
          <button onClick={d.resumePolling} className="text-xs font-semibold underline">
            Check again
          </button>
        </div>
      )}

      {detail && detail.status === "failed" && <FailedReview review={detail} canUpload={canUpload} onPick={pick} />}
      {detail && detail.status === "ready" && <ReadyReview review={detail} onExpired={d.refreshLinks} />}
    </div>
  );
}

function VersionTrend({ reviews }: { reviews: DeckReviewSummary[] }) {
  const scored = reviews.filter((r) => r.status === "ready" && r.scores).sort((a, b) => a.version - b.version);
  if (scored.length < 2) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600" aria-label="Overall score by version">
      <span className="font-semibold text-neutral-800">Overall by version:</span>
      {scored.map((r, i) => (
        <span key={r.id} className="inline-flex items-center gap-1">
          {i > 0 && <span className="text-neutral-300">→</span>}
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium">
            v{r.version} · {r.scores?.overall}/10
          </span>
        </span>
      ))}
    </div>
  );
}

function FailedReview({ review, canUpload, onPick }: { review: DeckReview; canUpload: boolean; onPick: () => void }) {
  return (
    <div role="alert" className="rounded-modal border border-danger-200 bg-danger-50/60 p-6 space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-danger-600" />
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-neutral-900">This review did not finish</h3>
          <p className="text-sm text-neutral-700">{deckErrorCopy(review.error)}</p>
        </div>
      </div>
      {canUpload && (
        <button onClick={onPick} className="rounded-card bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800">
          Upload the deck again
        </button>
      )}
    </div>
  );
}

function ScoreTile({ label, value, hint, tone }: { label: string; value: number; hint?: string; tone: string }) {
  return (
    <div className="bg-white rounded-modal border border-neutral-200 shadow-card p-5 flex flex-col items-center justify-center text-center space-y-2">
      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</span>
      <div className={`text-4xl font-display font-bold ${tone}`}>
        {value}
        <span className="text-neutral-500 text-2xl">/10</span>
      </div>
      {hint && <span className="text-[11px] text-neutral-500">{hint}</span>}
    </div>
  );
}

const tileTone = (n: number) => (n >= 7 ? "text-brand-hover" : n >= 5 ? "text-warning" : "text-danger-600");

function ReadyReview({ review, onExpired }: { review: DeckReview; onExpired: () => Promise<void> }) {
  const s = review.scores;
  const refreshed = useRef(false);
  if (!s) return null;

  const imgFailed = () => {
    // A 404 on a signed link means it expired: refetch the review once for fresh links.
    if (refreshed.current) return;
    refreshed.current = true;
    void onExpired().finally(() => {
      refreshed.current = false;
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreTile label="Narrative" value={s.narrative} tone={tileTone(s.narrative)} />
        <ScoreTile label="Layout check" value={s.design} hint="Checks slide count, words and images. Not a visual review." tone={tileTone(s.design)} />
        <ScoreTile label="Data clarity" value={s.data_clarity} tone={tileTone(s.data_clarity)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-white rounded-modal border border-neutral-200 shadow-card p-6 space-y-4">
          <h3 className="font-semibold text-sm text-neutral-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Top fixes
          </h3>
          <ul className="space-y-3">
            {review.top_fixes.map((fix, idx) => (
              <li key={idx} className="text-sm text-neutral-700 flex items-start gap-2">
                <span className="text-neutral-500 font-bold mt-0.5">{idx + 1}.</span>
                <span>{fix}</span>
              </li>
            ))}
          </ul>
          {review.top_fixes.length === 0 && <p className="text-sm text-neutral-500">No fixes were suggested.</p>}
        </div>

        <div className="lg:col-span-8 bg-white rounded-modal border border-neutral-200 shadow-card p-6 space-y-4">
          <h3 className="font-semibold text-sm text-neutral-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            Slide-by-slide breakdown
          </h3>
          {review.slide_count !== null && review.slide_count > review.slides.length && (
            <p className="text-xs text-neutral-500">
              Showing the first {review.slides.length} of {review.slide_count} slides.
            </p>
          )}
          <div className="space-y-4 divide-y divide-neutral-100">
            {review.slides.map((slide) => (
              <div key={slide.n} className="pt-4 first:pt-0 flex items-start gap-4">
                <div className="relative w-28 h-16 bg-neutral-100 border border-neutral-200 rounded shrink-0 flex items-center justify-center overflow-hidden">
                  {slide.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveApiUrl(slide.thumbnail_url)}
                      alt={`Slide ${slide.n}`}
                      loading="lazy"
                      onError={imgFailed}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FileText className="w-5 h-5 text-neutral-300" aria-label="No preview" />
                  )}
                </div>
                <div className="space-y-1 min-w-0">
                  <h4 className="font-semibold text-sm text-neutral-900">
                    Slide {slide.n}: {slide.title}
                  </h4>
                  {slide.notes ? <p className="text-sm text-neutral-600">{slide.notes}</p> : <p className="text-sm text-neutral-400">No notes for this slide.</p>}
                  <p className="text-[11px] text-neutral-400">
                    {slide.words} words · {slide.images} {slide.images === 1 ? "image" : "images"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
