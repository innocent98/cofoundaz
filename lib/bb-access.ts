import type { MemberRole } from '@/lib/nav-access';

/**
 * What the caller may do in Business Builder (D-BB-3):
 *  - edit:    founder / team_member write directly and may run AI, export and restore.
 *  - suggest: business_consultant only; every edit becomes a pending suggestion.
 *  - read:    everyone else (mentor, ...). Hide add / edit / AI / export.
 * The server still enforces every route; this only decides what to show.
 */
export type BuilderMode = 'edit' | 'suggest' | 'read';

export interface BuilderAccess {
  mode: BuilderMode;
  /** Direct writes, AI, export, restore. */
  canEdit: boolean;
  /** Consultant: writes go through POST /suggestions. */
  suggestMode: boolean;
  /** May change content at all (directly or by suggestion). */
  canWrite: boolean;
  /** Everyone but investors may post comments. */
  canComment: boolean;
}

export function builderAccess(role: MemberRole | null, loading: boolean): BuilderAccess {
  let mode: BuilderMode;
  if (role === 'founder' || role === 'team_member') mode = 'edit';
  else if (role === 'business_consultant') mode = 'suggest';
  // An unknown role (the profile failed to load) keeps the founder UI: the server is the gate.
  else if (role === null && !loading) mode = 'edit';
  else mode = 'read';
  return {
    mode,
    canEdit: mode === 'edit',
    suggestMode: mode === 'suggest',
    canWrite: mode !== 'read',
    canComment: role !== 'investor',
  };
}

/** Record URL segment (plural) to the API's singular `kind` used by `POST /suggestions`. */
export const SUGGEST_KIND: Record<string, string> = {
  personas: 'persona',
  competitors: 'competitor',
  pricing: 'pricing',
  'revenue-streams': 'revenue_stream',
};
