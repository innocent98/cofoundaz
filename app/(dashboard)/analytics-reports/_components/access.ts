"use client";

import { useWorkspace } from "@/components/workspace-context";
import type { MemberRole } from "@/lib/nav-access";

/**
 * Who may do what in Analytics (spec §3, guides A-C). The server enforces every route; this only
 * decides which controls render.
 * - Founder, team member: Overview, builder, reports, exports (team member: own exports only).
 * - Accountant: Overview (finance cards only), reports shared with them, exports of finished runs.
 * - Mentor, business consultant: reports shared with them, on screen only (no Overview, no files).
 */
export interface AnalyticsAccess {
  role: MemberRole | null;
  loading: boolean;
  canOverview: boolean;
  canWrite: boolean;
  canExport: boolean;
  canStartRun: boolean;
  isFounder: boolean;
}

export function analyticsAccess(role: MemberRole | null): Omit<AnalyticsAccess, "loading"> {
  const writer = role === "founder" || role === "team_member";
  return {
    role,
    canOverview: writer || role === "accountant",
    canWrite: writer,
    canExport: writer || role === "accountant",
    canStartRun: writer,
    isFounder: role === "founder",
  };
}

export function useAnalyticsAccess(): AnalyticsAccess {
  const { role, loading } = useWorkspace();
  return { ...analyticsAccess(role), loading };
}
