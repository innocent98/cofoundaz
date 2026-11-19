"use client";

import { useWorkspace } from "@/components/workspace-context";

/**
 * Legal has two role sets: founder, team member and legal advisor read; only founder and
 * team member write. Controls for create, edit, delete and upload render only when
 * `canWrite`. (The server still returns 403 for everyone else.)
 */
export function useLegalAccess(): { canWrite: boolean; loading: boolean } {
  const { role, loading } = useWorkspace();
  return { canWrite: role === "founder" || role === "team_member", loading };
}
