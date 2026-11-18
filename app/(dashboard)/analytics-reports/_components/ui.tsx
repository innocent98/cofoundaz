"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import type { AnalyticsResource } from "@/hooks/useAnalyticsResource";
import { ErrorBlock, SkeletonRows } from "../../legal/_components/ui";
import { lockedText } from "@/lib/analytics-format";

// The generic building blocks (buttons, fields, dialogs, drawers, states) are shared with Legal so
// every page in the app renders loading, empty and error the same way. Analytics adds its own
// denial text, a 404 block and the locked-block tile.
export {
  ConfirmDialog,
  Drawer,
  EmptyBlock,
  ErrorBlock,
  Field,
  FormError,
  PageHeader,
  SkeletonRows,
  StatusChip,
  darkBtn,
  dangerBtn,
  dangerLinkBtn,
  inputCls,
  labelCls,
  linkBtn,
  primaryBtn,
  secondaryBtn,
} from "../../legal/_components/ui";

export const cardCls = "bg-white rounded-modal border border-neutral-200 shadow-card";

export function ForbiddenBlock({ body }: { body?: string }) {
  return (
    <div role="alert" className={`${cardCls} p-12 text-center`}>
      <h2 className="text-xl font-display font-bold text-neutral-900 mb-2">Not available for your role</h2>
      <p className="text-sm text-neutral-500 max-w-md mx-auto">
        {body ??
          "Analytics is open to founders and team members. Accountants see Finance numbers, and mentors and business consultants see reports a founder shares with them."}
      </p>
    </div>
  );
}

export function NotFoundBlock({ what = "report" }: { what?: string }) {
  return (
    <div role="alert" className={`${cardCls} p-12 text-center`}>
      <h2 className="text-xl font-display font-bold text-neutral-900 mb-2">This {what} isn&apos;t available</h2>
      <p className="text-sm text-neutral-500 max-w-md mx-auto mb-4">
        It may have been deleted, or it is no longer shared with you.
      </p>
      <Link href="/analytics-reports/saved" className="text-sm font-bold text-brand-800 hover:underline">
        Back to reports
      </Link>
    </div>
  );
}

/** Skeleton / forbidden / not found / error + Retry for a resource that is not ready. */
export function ResourceGate<T>({
  resource,
  skeleton,
  forbidden,
  what,
  children,
}: {
  resource: AnalyticsResource<T>;
  skeleton?: React.ReactNode;
  forbidden?: React.ReactNode;
  what?: string;
  children: (data: T) => React.ReactNode;
}) {
  if (resource.status === "loading") return <>{skeleton ?? <SkeletonRows />}</>;
  if (resource.status === "forbidden") return <>{forbidden ?? <ForbiddenBlock />}</>;
  if (resource.status === "not_found") return <NotFoundBlock what={what} />;
  if (resource.status === "error" || resource.data === null) {
    return <ErrorBlock message={resource.error ?? "Couldn't load this. Try again."} onRetry={() => void resource.reload()} />;
  }
  return <>{children(resource.data)}</>;
}

/** A block the viewer's role cannot open: the lock and the hub name, never a number or a metric name. */
export function LockedTile({ needsLabel, compact = false }: { needsLabel: string; compact?: boolean }) {
  return (
    <div
      className={`rounded-card border border-dashed border-neutral-300 bg-neutral-50 flex items-center gap-3 ${compact ? "p-3" : "p-5"}`}
      aria-label={`Locked. ${lockedText(needsLabel)}.`}
    >
      <span className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center shrink-0">
        <Lock className="w-4 h-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-neutral-700">{lockedText(needsLabel)}</p>
        <p className="text-xs text-neutral-500">Your role can&apos;t see this block. The numbers are not sent to you.</p>
      </div>
    </div>
  );
}

/** "Open Finance" style link to the hub a figure comes from (provenance, gap 74). */
export function HubLink({ path, label }: { path?: string; label: string }) {
  if (!path || !path.startsWith("/")) return null;
  return (
    <Link href={path} className="inline-flex items-center gap-0.5 max-md:min-h-11 text-xs font-bold text-brand-800 hover:underline">
      {label}
      <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
    </Link>
  );
}
