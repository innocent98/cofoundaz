"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, ChevronDown, RefreshCw, Lock } from "lucide-react";
import { useWorkspace } from "@/components/workspace-context";
import { useReadinessScore, useMarketInputs } from "@/hooks/useReadinessScore";
import { safeInternalHref } from "@/lib/safe-href";
import { readinessError, type Dimension, type Gap, type MarketInputs, type ReadinessScore } from "@/lib/api/readiness";
import { isMarketSizeGap, majorInputToMinor, minorToMajorInput, scoreTone, signalProgress, stepLabel } from "@/lib/readiness-format";
import { formatWhen, LoadFailed, LoadingBlock, ReadOnlyNote } from "./_components/states";

const TONE_TEXT = { success: "text-success", warning: "text-warning", danger: "text-danger-600" } as const;
const TONE_BAR = { success: "bg-success-500", warning: "bg-warning-500", danger: "bg-danger-600" } as const;

export default function ReadinessScorePage() {
  const router = useRouter();
  const { role } = useWorkspace();
  const isFounder = role === "founder";
  const { score, loading, error, reload, recompute, recomputing, recomputeError, coolingDown } = useReadinessScore();
  const market = useMarketInputs();

  if (loading && !score) return <LoadingBlock label="Loading your readiness score" />;
  if (error && !score) return <LoadFailed error={error} onRetry={reload} what="your readiness score" />;
  if (!score) return null;

  const tone = scoreTone(score.score);
  const unmet = score.must_haves.filter((m) => !m.met);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="text-center space-y-4">
        <div className="inline-flex flex-col items-center justify-center space-y-2 py-4">
          <span className="text-sm font-bold uppercase tracking-widest text-neutral-500">Readiness Score</span>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36" role="img" aria-label={`Readiness score ${score.score} out of 100`}>
              <path
                className="text-neutral-200"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={TONE_TEXT[tone]}
                strokeWidth="3"
                strokeDasharray={`${score.score}, 100`}
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="font-display font-bold text-5xl text-neutral-900 tracking-tight">{score.score}</span>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-display font-semibold text-neutral-900">{score.verdict}</h2>

        {score.ready && (
          <button
            onClick={() => router.push("/funding")}
            className="mt-2 bg-accent-600 hover:bg-accent-700 text-white font-semibold py-3 px-6 rounded-card transition-colors shadow-card inline-flex items-center gap-2"
          >
            <span>Open Funding Hub</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-neutral-500">
          <span>Updated {formatWhen(score.computed_at)}</span>
          {isFounder && (
            <button
              onClick={recompute}
              disabled={recomputing || coolingDown}
              className="inline-flex items-center gap-1.5 rounded-card border border-neutral-200 bg-white px-3 py-1.5 font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${recomputing ? "animate-spin" : ""}`} />
              {recomputing ? "Recalculating…" : coolingDown ? "Recalculated" : "Recalculate"}
            </button>
          )}
        </div>
        {recomputeError && (
          <p role="alert" className="text-xs text-danger-700">
            {recomputeError.message}
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs text-danger-700">
            The latest refresh failed, so this may be out of date.{" "}
            <button onClick={reload} className="underline">
              Try again
            </button>
          </p>
        )}
      </div>

      {unmet.length > 0 && <MustHaves score={score} unmet={unmet} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-white rounded-modal border border-neutral-200/95 shadow-card p-6 space-y-6">
          <h3 className="font-semibold text-sm text-neutral-900">Dimensions</h3>
          <div className="space-y-5">
            {score.dimensions.map((dim) => (
              <DimensionRow key={dim.key} dim={dim} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-neutral-900 px-1">Priority gaps to close</h3>
          {score.gaps.map((gap) => (
            <GapCard key={gap.signal_key} gap={gap} score={score} canFix={isFounder} />
          ))}
          {score.gaps.length === 0 && (
            <div className="bg-neutral-50 rounded-modal border border-neutral-200/50 p-6 text-center text-neutral-500 text-sm">
              No critical gaps detected.
            </div>
          )}
        </div>
      </div>

      <MarketSizeCard market={market} isFounder={isFounder} onSaved={reload} />
    </div>
  );
}

function MustHaves({ score, unmet }: { score: ReadinessScore; unmet: ReadinessScore["must_haves"] }) {
  return (
    <section
      aria-label="What is holding the score at 69"
      className="mx-auto max-w-2xl rounded-modal border border-warning-500/40 bg-warning-50 p-5 space-y-3"
    >
      <div className="flex items-start gap-2.5">
        <Lock className="mt-0.5 h-4 w-4 text-warning" />
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">
            {score.capped ? `Capped at 69 (your raw score is ${score.raw_score})` : "You cannot pass 69 until these are done"}
          </h3>
          <p className="text-xs text-neutral-600 mt-0.5">Investors ask for all three before a first call.</p>
        </div>
      </div>
      <ul className="space-y-2">
        {unmet.map((m) => {
          const href = safeInternalHref(m.href);
          return (
            <li key={m.key} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-neutral-800">
                <span className="font-semibold">{score.capped ? `Capped at 69: ${m.label}` : m.label}.</span> {m.reason}
              </span>
              {href && (
                <Link href={href} className="text-xs font-semibold text-accent-700 hover:underline whitespace-nowrap">
                  Do this
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function DimensionRow({ dim }: { dim: Dimension }) {
  const [open, setOpen] = useState(false);
  const hasScore = dim.score !== null;
  const tone = hasScore ? scoreTone(dim.score as number) : "danger";
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full space-y-2 text-left"
      >
        <div className="flex justify-between items-center text-xs font-medium text-neutral-700">
          <span className="inline-flex items-center gap-1">
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            {dim.label} <span className="text-neutral-400">· weight {dim.weight}</span>
          </span>
          <span className="font-bold text-neutral-900">{hasScore ? `${dim.score}/100` : "Not enough data yet"}</span>
        </div>
        <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
          {hasScore && <div className={`h-full rounded-full ${TONE_BAR[tone]}`} style={{ width: `${dim.score}%` }} />}
        </div>
      </button>
      {open && (
        <ul className="space-y-2 rounded-card bg-neutral-50 p-3">
          {dim.signals.length === 0 && <li className="text-xs text-neutral-500">Nothing to judge here yet.</li>}
          {dim.signals.map((s) => {
            const progress = signalProgress(s);
            const href = safeInternalHref(s.href);
            return (
              <li key={s.key} className="text-xs text-neutral-700 space-y-0.5">
                <div className="flex justify-between gap-3">
                  <span className="font-medium text-neutral-900">{s.label}</span>
                  <span className="whitespace-nowrap text-neutral-500">{progress ?? stepLabel(s.score)}</span>
                </div>
                {s.note && (
                  <p className="text-neutral-600">
                    {s.note}{" "}
                    {href && (
                      <Link href={href} className="font-semibold text-accent-700 hover:underline">
                        Open
                      </Link>
                    )}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function GapCard({ gap, score, canFix }: { gap: Gap; score: ReadinessScore; canFix: boolean }) {
  const router = useRouter();
  const label = score.dimensions.find((d) => d.key === gap.dimension)?.label ?? gap.dimension;
  const marketForm = isMarketSizeGap(gap.signal_key);
  const href = safeInternalHref(gap.href);
  // The market-size fix is the form on this page; a team member cannot edit it.
  const showFix = marketForm ? canFix : href !== null;

  const fix = () => {
    if (marketForm) {
      document.getElementById("market-size")?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("market-size-tam")?.focus({ preventScroll: true });
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <div className="bg-white rounded-modal border border-neutral-200/95 shadow-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-accent-700">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-neutral-900">{label}</h4>
          <p className="text-sm text-neutral-600 mt-1">{gap.note}</p>
          <p className="text-[11px] text-neutral-400 mt-1">Worth about {gap.lift} points</p>
        </div>
      </div>
      {showFix && (
        <div className="flex justify-end">
          <button
            onClick={fix}
            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold py-2 px-4 text-xs rounded-card transition-colors inline-flex items-center gap-1.5"
          >
            <span>Fix this</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

type MarketHook = ReturnType<typeof useMarketInputs>;

function MarketSizeCard({ market, isFounder, onSaved }: { market: MarketHook; isFounder: boolean; onSaved: () => void }) {
  const { inputs, loading, error } = market;
  const [saved, setSaved] = useState(false);
  if (loading && !inputs) return null;
  if (error && !inputs) {
    if (error.forbidden) return null;
    return (
      <p role="alert" className="text-xs text-danger-700 text-center">
        We could not load the market size. Reload the page to try again.
      </p>
    );
  }
  if (!inputs) return null;
  // Keyed on the stored values, so the form starts from what is saved and resets after a save.
  // The "saved" note lives here so it survives that remount.
  return (
    <MarketSizeForm
      key={JSON.stringify(inputs)}
      inputs={inputs}
      save={market.save}
      isFounder={isFounder}
      saved={saved}
      onSubmitStart={() => setSaved(false)}
      onSaved={() => {
        setSaved(true);
        onSaved();
      }}
    />
  );
}

function MarketSizeForm({
  inputs,
  save,
  isFounder,
  saved,
  onSubmitStart,
  onSaved,
}: {
  inputs: MarketInputs;
  save: MarketHook["save"];
  isFounder: boolean;
  saved: boolean;
  onSubmitStart: () => void;
  onSaved: () => void;
}) {
  const [tam, setTam] = useState(minorToMajorInput(inputs.tam_minor));
  const [sam, setSam] = useState(minorToMajorInput(inputs.sam_minor));
  const [som, setSom] = useState(minorToMajorInput(inputs.som_minor));
  const [currency, setCurrency] = useState<MarketInputs["currency"]>(inputs.currency);
  const [source, setSource] = useState(inputs.source_url ?? "");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const empty = inputs.tam_minor === null && inputs.sam_minor === null && inputs.som_minor === null && !inputs.source_url;
  // A team member only reads: nothing to show until the founder has entered a size.
  if (!isFounder && empty) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    onSubmitStart();
    const t = majorInputToMinor(tam);
    const sa = majorInputToMinor(sam);
    const so = majorInputToMinor(som);
    if ([t, sa, so].some((v) => v !== null && Number.isNaN(v))) {
      setFormError("Enter market sizes as positive numbers.");
      return;
    }
    setSaving(true);
    try {
      await save({
        tam_minor: t,
        sam_minor: sa,
        som_minor: so,
        currency,
        source_url: source.trim() === "" ? null : source.trim(),
      });
      onSaved();
    } catch (err) {
      const re = readinessError(err, "We could not save the market size. Try again.");
      setFieldErrors(re.fieldErrors);
      // Request-level rules (SAM larger than TAM) come back with an empty field name.
      setFormError(re.fieldErrors[""] ? re.fieldErrors[""].replace(/^Value error, /, "") : re.status === 422 ? "Please check the highlighted fields." : re.message);
    } finally {
      setSaving(false);
    }
  };

  const field = (id: string, label: string, value: string, set: (v: string) => void, apiField: string) => (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
        {label}
      </label>
      <input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => set(e.target.value)}
        disabled={!isFounder}
        placeholder="e.g. 50,000,000"
        className="w-full rounded-card border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:border-brand-hover focus:outline-none disabled:opacity-70"
      />
      {fieldErrors[apiField] && <p className="text-xs text-danger-700">{fieldErrors[apiField]}</p>}
    </div>
  );

  return (
    <section id="market-size" className="bg-white rounded-modal border border-neutral-200/95 shadow-card p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-sm text-neutral-900">Market size</h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          This is your own claim, so it only counts once you add a source link, and it can never be more than 40% of the Market score.
        </p>
      </div>
      {!isFounder && <ReadOnlyNote>Only the founder can edit the market size.</ReadOnlyNote>}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {field("market-size-tam", "TAM", tam, setTam, "tam_minor")}
          {field("market-size-sam", "SAM", sam, setSam, "sam_minor")}
          {field("market-size-som", "SOM", som, setSom, "som_minor")}
          <div className="space-y-1">
            <label htmlFor="market-size-currency" className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Currency
            </label>
            <select
              id="market-size-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as MarketInputs["currency"])}
              disabled={!isFounder}
              className="w-full rounded-card border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 disabled:opacity-70"
            >
              <option value="NGN">NGN (₦)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor="market-size-source" className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            Source link
          </label>
          <input
            id="market-size-source"
            type="url"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            disabled={!isFounder}
            placeholder="https://…"
            className="w-full rounded-card border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:border-brand-hover focus:outline-none disabled:opacity-70"
          />
          {fieldErrors["source_url"] && <p className="text-xs text-danger-700">{fieldErrors["source_url"]}</p>}
        </div>
        {formError && (
          <p role="alert" className="text-xs text-danger-700">
            {formError}
          </p>
        )}
        {isFounder && (
          <div className="flex items-center justify-end gap-3">
            {saved && <span className="text-xs text-success">Saved. Your score has been updated.</span>}
            <button
              type="submit"
              disabled={saving}
              className="rounded-card bg-brand-hover px-4 py-2 text-xs font-semibold text-white hover:bg-brand-x153427 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save market size"}
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
