"use client";

import React from "react";
import type { RunResult } from "@/lib/api/analytics";
import { resultBlockId } from "@/lib/analytics-format";
import { MetricCard } from "./metric";
import { SeriesChart } from "./series-chart";
import { LockedTile, cardCls } from "./ui";

/**
 * Renders a run's (or a preview's) results in block order. A locked result is drawn as a lock with
 * the hub name and nothing else; `number` blocks are cards; `line`/`bar` blocks add a chart with its
 * table alternative; text blocks are notes.
 */
export function RunResults({ results }: { results: RunResult[] }) {
  if (results.length === 0) return <p className="text-sm text-neutral-500">This report has no blocks.</p>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {results.map((r) => {
        const key = resultBlockId(r);
        if ("locked" in r && r.locked) {
          return (
            <div key={key} className="md:col-span-1">
              <LockedTile needsLabel={r.needs_label} />
            </div>
          );
        }
        if (r.type === "text") {
          return (
            <div key={key} className={`${cardCls} p-5 md:col-span-2`}>
              {r.title && <h3 className="text-sm font-bold text-neutral-800 mb-1">{r.title}</h3>}
              <p className="text-sm text-neutral-700 whitespace-pre-line">{r.text}</p>
            </div>
          );
        }
        const metricResult = r as Extract<RunResult, { block_id: string; type: "metric" }>;
        const chart = metricResult.viz !== "number" && metricResult.result.status === "ok";
        return (
          <div key={key} className={chart ? "md:col-span-2 space-y-3" : ""}>
            <MetricCard metric={metricResult.result} title={metricResult.title} showSpark={!chart} />
            {chart && (
              <div className={`${cardCls} p-5`}>
                <SeriesChart metrics={[metricResult.result]} kind={metricResult.viz === "bar" ? "bar" : "line"} height={200} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
