import { describe, expect, it } from "vitest";
import { analyticsAccess } from "./access";
import { canOpenPath } from "@/lib/nav-access";
import { pollDelay } from "@/hooks/useExportWatch";

describe("analyticsAccess (spec §3, guides A-C)", () => {
  it("founder and team member build, run and export", () => {
    for (const role of ["founder", "team_member"] as const) {
      expect(analyticsAccess(role)).toMatchObject({ canOverview: true, canWrite: true, canExport: true, canStartRun: true });
    }
    expect(analyticsAccess("founder").isFounder).toBe(true);
    expect(analyticsAccess("team_member").isFounder).toBe(false);
  });
  it("accountant sees the Overview and exports finished runs, but never builds or runs", () => {
    expect(analyticsAccess("accountant")).toMatchObject({ canOverview: true, canWrite: false, canExport: true, canStartRun: false });
  });
  it("mentor and business consultant only read shared reports on screen", () => {
    for (const role of ["mentor", "business_consultant"] as const) {
      expect(analyticsAccess(role)).toMatchObject({ canOverview: false, canWrite: false, canExport: false, canStartRun: false });
    }
  });
});

describe("route access", () => {
  it("opens Analytics to the five analytics roles and denies the others", () => {
    for (const role of ["founder", "team_member", "mentor", "business_consultant", "accountant"] as const) {
      expect(canOpenPath("/analytics-reports/saved", role)).toBe(true);
    }
    expect(canOpenPath("/analytics-reports", "investor")).toBe(false);
    expect(canOpenPath("/analytics-reports/exports", "legal_advisor")).toBe(false);
  });
});

describe("export polling cadence (guide §6)", () => {
  it("polls every 2 s, backs off to 5 s, stops at 2 minutes", () => {
    expect(pollDelay(0)).toBe(2000);
    expect(pollDelay(25_000)).toBe(5000);
    expect(pollDelay(120_000)).toBeNull();
  });
});
