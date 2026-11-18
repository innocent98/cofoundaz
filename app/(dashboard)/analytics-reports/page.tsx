"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CheckCircle2, Eye } from "lucide-react";
import { exportDataTables, getByHub, getOverview, type Overview, type RangeSpec } from "@/lib/api/analytics";
import { DEFAULT_RANGE } from "@/lib/analytics-format";
import { useAnalyticsResource } from "@/hooks/useAnalyticsResource";
import { useHealthBenchmarks } from "@/hooks/useHealthDetails";
import { useAnalyticsAccess } from "./_components/access";
import { MetricCard, PeriodLine, RangePicker } from "./_components/metric";
import { SeriesChart } from "./_components/series-chart";
import { CustomMetricsPanel } from "./_components/custom-metrics";
import { ExportMenu } from "./_components/export-menu";
import { EmptyBlock, ErrorBlock, ForbiddenBlock, HubLink, PageHeader, ResourceGate, SkeletonRows, cardCls } from "./_components/ui";

/** A custom range is only sent once both dates are filled in; until then the last numbers stay. */
function settled(r: RangeSpec, last: RangeSpec): RangeSpec {
  return r.range === "custom" && (!r.from || !r.to) ? last : r;
}

export default function AnalyticsOverviewPage() {
  const router = useRouter();
  const access = useAnalyticsAccess();
  const [range, setRange] = useState<RangeSpec>(DEFAULT_RANGE);
  const [applied, setApplied] = useState<RangeSpec>(DEFAULT_RANGE);
  const [nonce, setNonce] = useState(0);

  // Mentors and business consultants have no Overview: they read reports shared with them.
  const readerOnly = !access.loading && access.role !== null && !access.canOverview && (access.role === "mentor" || access.role === "business_consultant");
  useEffect(() => {
    if (readerOnly) router.replace("/analytics-reports/saved");
  }, [readerOnly, router]);

  const onRange = (next: RangeSpec) => {
    setRange(next);
    setApplied((last) => settled(next, last));
  };

  const load = useCallback(
    () => getOverview(applied),
    // `nonce` refetches after a custom metric changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applied, nonce],
  );
  const overview = useAnalyticsResource<Overview>(readerOnly || access.loading ? null : load);

  if (readerOnly) return <SkeletonRows rows={2} label="Opening reports shared with you" />;

  const exportKeys = (overview.data?.cards ?? []).filter((c) => c.status !== "locked" && c.status !== "unknown").map((c) => c.key);

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="How the business is doing"
        subtitle="Live numbers from every hub you can open, for the period you pick."
        action={
          access.canExport ? (
            <ExportMenu
              label="Export data"
              disabled={exportKeys.length === 0}
              disabledReason={exportKeys.length === 0 ? "Nothing to export for this period yet." : undefined}
              options={[
                { label: "Spreadsheet (XLSX)", start: () => exportDataTables({ metrics: exportKeys, range: applied, format: "xlsx", include_metadata: true }) },
                { label: "CSV", start: () => exportDataTables({ metrics: exportKeys, range: applied, format: "csv", include_metadata: true }) },
              ]}
            />
          ) : undefined
        }
      />

      <RangePicker value={range} onChange={onRange} idPrefix="ov" />
      {range.range === "custom" && (!range.from || !range.to) && (
        <p className="text-xs text-neutral-500">Pick both dates to update the numbers.</p>
      )}

      <ResourceGate resource={overview} skeleton={<CardsSkeleton />} forbidden={<ForbiddenBlock />}>
        {(ov) => (
          <div className="space-y-6">
            <PeriodLine period={ov.period} compare={ov.compare_period} />
            {ov.cards.length === 0 ? (
              <div className={cardCls}>
                <EmptyBlock title="No numbers you can see" body="Your role doesn't open any hub with headline numbers." />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {ov.cards.map((c) => (
                  <MetricCard key={c.key} metric={c} />
                ))}
              </div>
            )}

            {ov.chart && (
              <section aria-labelledby="chart-h" className={`${cardCls} p-5 md:p-6 space-y-3`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h2 id="chart-h" className="text-lg font-display font-semibold text-neutral-900">
                    {ov.chart.series.map((s) => s.label).filter(Boolean).join(" and ")}
                  </h2>
                  <HubLink path={ov.chart.series[0]?.hub_path} label="Where this comes from" />
                </div>
                <SeriesChart metrics={ov.chart.series} />
              </section>
            )}

            <section aria-labelledby="notes-h" className={`${cardCls} p-5 md:p-6 space-y-3`}>
              <h2 id="notes-h" className="text-lg font-display font-semibold text-neutral-900">
                What the numbers say
              </h2>
              {ov.insights.length === 0 ? (
                <p className="text-sm text-neutral-500">Nothing stands out yet. Notes appear once there is enough data to compare.</p>
              ) : (
                <ul className="space-y-2">
                  {ov.insights.map((n) => (
                    <li key={`${n.source}-${n.text}`} className="flex items-start gap-3 text-sm">
                      {n.kind === "working" ? (
                        <CheckCircle2 className="w-4 h-4 text-success-700 mt-0.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4 text-warning-700 mt-0.5 shrink-0" aria-hidden="true" />
                      )}
                      <span className="flex-1 text-neutral-800">
                        <span className="sr-only">{n.kind === "working" ? "Working: " : "Watch: "}</span>
                        {n.text}
                      </span>
                      <HubLink path={n.hub_path} label="Source" />
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] text-neutral-500">Worked out from the numbers by fixed rules, not AI.</p>
            </section>

            <ByHubSection range={applied} hubs={ov.hubs} nonce={nonce} />
          </div>
        )}
      </ResourceGate>

      {access.canWrite && <CustomMetricsPanel onChanged={() => setNonce((n) => n + 1)} />}
      {access.canWrite && <BenchmarksCard />}
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div role="status" aria-label="Loading numbers" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={`${cardCls} p-5 h-36 animate-pulse`}>
          <div className="h-3 w-1/2 rounded bg-neutral-100 mb-4" />
          <div className="h-6 w-2/3 rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

/** By hub: a pill per hub the viewer can open (hidden hubs are not listed), tiles per hub. */
function ByHubSection({ range, hubs, nonce }: { range: RangeSpec; hubs: Overview["hubs"]; nonce: number }) {
  const [hub, setHub] = useState<string | null>(null);
  const load = useCallback(
    () => getByHub(range, hub ?? undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range, hub, nonce],
  );
  const res = useAnalyticsResource(load);
  const pills = useMemo(() => [{ hub: null as string | null, label: "All hubs" }, ...hubs.map((h) => ({ hub: h.hub as string | null, label: h.label }))], [hubs]);

  return (
    <section aria-labelledby="byhub-h" className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h2 id="byhub-h" className="text-lg font-display font-semibold text-neutral-900">
          By hub
        </h2>
        <div role="group" aria-label="Filter by hub" className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {pills.map((p) => (
            <button
              key={p.label}
              type="button"
              aria-pressed={hub === p.hub}
              onClick={() => setHub(p.hub)}
              className={`px-3 py-1.5 max-md:min-h-11 rounded-full text-xs font-semibold whitespace-nowrap border ${
                hub === p.hub ? "bg-accent-200 text-ink border-accent-200" : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {res.status === "loading" && <SkeletonRows rows={2} label="Loading hubs" />}
      {res.status === "error" && <ErrorBlock message={res.error ?? "Couldn't load this. Try again."} onRetry={() => void res.reload()} />}
      {res.status === "forbidden" && <ForbiddenBlock body="Your role can't open that hub." />}
      {res.status === "ready" && res.data && (
        <div className="space-y-5">
          {res.data.hubs.map((h) => (
            <div key={h.hub} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-700">{h.label}</h3>
                <Link href={h.path} className="inline-flex items-center gap-0.5 max-md:min-h-11 text-xs font-bold text-brand-800 hover:underline">
                  Open {h.label} <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                </Link>
              </div>
              {h.tiles.length === 0 ? (
                <p className="text-sm text-neutral-500">No metrics here yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {h.tiles.map((t) => (
                    <MetricCard key={t.key} metric={t} showSpark={false} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const DIMENSION_LABEL: Record<string, string> = {
  overall: "Overall",
  product: "Product",
  market: "Market",
  money: "Money",
  legal: "Legal",
  team: "Team",
};

/** Benchmarks reuse the Health Score cohort (D-ANA-8): same stage and industry, bucketed, your rank only. */
function BenchmarksCard() {
  const { benchmarks, loading, error, refetch } = useHealthBenchmarks();
  const overall = benchmarks?.status === "ok" ? benchmarks.percentiles?.overall ?? null : null;

  return (
    <section aria-labelledby="bench-h" className={`${cardCls} p-5 md:p-6 space-y-3`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 id="bench-h" className="text-lg font-display font-semibold text-neutral-900">
          Benchmarks
        </h2>
        <HubLink path="/health/benchmarks" label="Open Health benchmarks" />
      </div>
      {loading && <SkeletonRows rows={1} label="Loading benchmarks" />}
      {!loading && error && <ErrorBlock message={error} onRetry={() => void refetch()} />}
      {!loading && !error && benchmarks && !overall && (
        <p className="text-sm text-neutral-600">
          Not enough peers yet. Benchmarks appear once at least {benchmarks.min_cohort_size} startups at your stage and in your industry have a
          Health Score.
        </p>
      )}
      {!loading && !error && benchmarks && overall && (
        <div className="space-y-2">
          <p className="text-sm text-neutral-600">
            Health Score against {benchmarks.cohort.stage} {benchmarks.cohort.industry} startups. You are in the {overall.your_percentile}th
            percentile.
          </p>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              ["You", overall.you],
              ["Lower quarter", overall.p25],
              ["Median", overall.p50],
              ["Upper quarter", overall.p75],
            ].map(([k, v]) => (
              <div key={k} className="rounded-card bg-neutral-50 border border-neutral-200 p-3">
                <dt className="text-xs text-neutral-500">{k}</dt>
                <dd className="text-lg font-display font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[11px] text-neutral-500">
            Dimensions:{" "}
            {Object.keys(benchmarks.percentiles ?? {})
              .filter((k) => k !== "overall")
              .map((k) => DIMENSION_LABEL[k] ?? k)
              .join(", ")}
            . Peer figures are rounded to 5 points for privacy.
          </p>
        </div>
      )}
    </section>
  );
}
