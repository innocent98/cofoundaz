import { apiClient } from './client'

export type BusinessModel =
  | 'b2b'
  | 'b2c'
  | 'b2b2c'
  | 'marketplace'
  | 'hardware'
  | 'services'

export type StartupStage =
  | 'idea'
  | 'validation'
  | 'build'
  | 'launch'
  | 'growth'
  | 'scale'

export type MembershipRole =
  | 'founder'
  | 'team_member'
  | 'mentor'
  | 'accountant'
  | 'legal_advisor'
  | 'business_consultant'
  | 'investor'

import { VALID_ONBOARDING_GOALS, type OnboardingGoal } from '@/ui/onboarding/constants'
export { VALID_ONBOARDING_GOALS, type OnboardingGoal }

const GOAL_MAPPING: Record<string, OnboardingGoal> = {
  'validate my idea': 'Validate my idea',
  'validate idea': 'Validate my idea',
  'build my mvp': 'Build my MVP',
  'build and ship mvp': 'Build my MVP',
  'get first customers': 'Get first customers',
  'acquire initial 100 customers': 'Get first customers',
  'grow revenue': 'Grow revenue',
  'scale marketing & sales': 'Grow revenue',
  'raise funding': 'Raise funding',
  'raise seed / angel capital': 'Raise funding',
  'get legally set up': 'Get legally set up',
  'set up legal & governance': 'Get legally set up',
  'get financially organized': 'Get financially organized',
  'build my team': 'Build my team',
  'find co-founders or key hires': 'Build my team',
}

export function normalizeGoal(goal: string): OnboardingGoal | null {
  const trimmed = goal.trim()
  if ((VALID_ONBOARDING_GOALS as readonly string[]).includes(trimmed)) {
    return trimmed as OnboardingGoal
  }
  const lower = trimmed.toLowerCase()
  if (GOAL_MAPPING[lower]) {
    return GOAL_MAPPING[lower]
  }
  return null
}

export function sanitizeGoals(goals?: string[] | null): string[] | null {
  if (!goals || !Array.isArray(goals) || goals.length === 0) {
    return null
  }
  const valid = goals
    .map(normalizeGoal)
    .filter((g): g is OnboardingGoal => g !== null)
  const unique = Array.from(new Set(valid)).slice(0, 3)
  return unique.length > 0 ? unique : null
}

export interface InviteItem {
  email: string
  role: MembershipRole
}

export interface OnboardingState {
  step: number
  full_name?: string | null
  role_title?: string | null
  country?: string | null
  phone?: string | null
  how_heard?: string | null
  name?: string | null
  description?: string | null
  website?: string | null
  industry?: string | null
  business_model?: BusinessModel | null
  stage?: StartupStage | null
  goals?: string[] | null
  notes?: string | null
  logo_url?: string | null
  invites?: InviteItem[]
  ai_panel?: string | null
  [key: string]: unknown
}

export interface OnboardingStatePatch {
  step: number
  full_name?: string | null
  role_title?: string | null
  country?: string | null
  phone?: string | null
  how_heard?: string | null
  name?: string | null
  description?: string | null
  website?: string | null
  industry?: string | null
  business_model?: BusinessModel | null
  stage?: StartupStage | null
  goals?: string[] | null
  notes?: string | null
  ai_panel?: string | null
}

// The API returns the {data, meta} envelope with founder fields nested under
// `founder_profile` and startup fields under `startup`. The wizard works with a
// flat shape, so we unwrap + flatten here — the one place that knows the nesting.
interface RawOnboardingState {
  step: number
  completed?: boolean
  assessment_pending?: boolean
  ai_panel?: string | null
  founder_profile?: {
    full_name?: string | null
    role_title?: string | null
    country?: string | null
    phone?: string | null
    how_heard?: string | null
  }
  startup?: {
    id?: string
    name?: string | null
    description?: string | null
    website?: string | null
    logo_url?: string | null
    industry?: string | null
    business_model?: BusinessModel | null
    stage?: StartupStage | null
  }
  goals?: string[] | null
  notes?: string | null
  invites?: InviteItem[]
}

function flatten(raw?: RawOnboardingState | null): OnboardingState {
  if (!raw) {
    return {
      step: 1,
      goals: [],
      invites: [],
    }
  }
  const anyRaw = (raw as unknown) as Record<string, unknown>
  const inner = (anyRaw.data as Record<string, unknown>) ?? anyRaw
  const fp = (inner.founder_profile as Record<string, unknown> | undefined) ?? {}
  const st = (inner.startup as Record<string, unknown> | undefined) ?? {}
  const rawGoals = (inner.goals ?? anyRaw.goals) as string[] | null | undefined
  const rawInvites = (inner.invites ?? anyRaw.invites) as InviteItem[] | undefined
  return {
    step: Number(inner.step ?? anyRaw.step ?? 1),
    completed: Boolean(inner.completed ?? anyRaw.completed),
    ai_panel: (inner.ai_panel as string) ?? (anyRaw.ai_panel as string) ?? null,
    full_name: (fp.full_name as string) ?? (inner.full_name as string) ?? null,
    role_title: (fp.role_title as string) ?? (inner.role_title as string) ?? null,
    country: (fp.country as string) ?? (inner.country as string) ?? null,
    phone: (fp.phone as string) ?? (inner.phone as string) ?? null,
    how_heard: (fp.how_heard as string) ?? (inner.how_heard as string) ?? null,
    name: (st.name as string) ?? (inner.name as string) ?? null,
    description: (st.description as string) ?? (inner.description as string) ?? null,
    website: (st.website as string) ?? (inner.website as string) ?? null,
    logo_url: (st.logo_url as string) ?? (inner.logo_url as string) ?? null,
    industry: (st.industry as string) ?? (inner.industry as string) ?? null,
    business_model: (st.business_model as BusinessModel) ?? (inner.business_model as BusinessModel) ?? null,
    stage: (st.stage as StartupStage) ?? (inner.stage as StartupStage) ?? null,
    goals: sanitizeGoals(rawGoals) ?? (Array.isArray(rawGoals) ? rawGoals : []),
    notes: (inner.notes as string) ?? (anyRaw.notes as string) ?? null,
    invites: Array.isArray(rawInvites) ? rawInvites : [],
  }
}

export function buildOnboardingPatchPayload(patch: OnboardingStatePatch): OnboardingStatePatch {
  const sanitizedGoals = sanitizeGoals(patch.goals)
  return {
    step: patch.step,
    full_name: patch.full_name?.trim() || null,
    role_title: patch.role_title?.trim() || null,
    country: patch.country?.trim() || null,
    phone: patch.phone?.trim() || null,
    how_heard: patch.how_heard?.trim() || null,
    name: patch.name?.trim() || null,
    description: patch.description?.trim() || null,
    website: patch.website?.trim() || null,
    industry: patch.industry?.trim() || null,
    business_model: patch.business_model || null,
    stage: patch.stage || null,
    goals: sanitizedGoals && sanitizedGoals.length > 0 ? sanitizedGoals : null,
    notes: patch.notes?.trim() || null,
    ...(patch.ai_panel !== undefined ? { ai_panel: patch.ai_panel } : {}),
  }
}

export async function getOnboardingState(): Promise<OnboardingState> {
  const env = await apiClient<{ data?: RawOnboardingState } | RawOnboardingState>('/onboarding/state', {
    method: 'GET',
  })
  return flatten(env && 'data' in env && env.data ? env.data : (env as RawOnboardingState))
}

export async function patchOnboardingState(
  patch: OnboardingStatePatch
): Promise<OnboardingState> {
  // `step` is required by the API; flat fields autosave. NOTE: `country` must be
  // an ISO code (e.g. "NG") — a display name 500s server-side.
  const payload = buildOnboardingPatchPayload(patch)
  const env = await apiClient<{ data?: RawOnboardingState } | RawOnboardingState>('/onboarding/state', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return flatten(env && 'data' in env && env.data ? env.data : (env as RawOnboardingState))
}

export async function postOnboardingState(
  patch: OnboardingStatePatch
): Promise<OnboardingState> {
  const payload = buildOnboardingPatchPayload(patch)
  const env = await apiClient<{ data?: RawOnboardingState } | RawOnboardingState>('/onboarding/state', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return flatten(env && 'data' in env && env.data ? env.data : (env as RawOnboardingState))
}

export const saveOnboardingState = patchOnboardingState

export async function uploadOnboardingLogo(file: File): Promise<{ logo_url?: string }> {
  // apiClient omits Content-Type for FormData (letting the browser set the
  // multipart boundary) and applies the real API base URL, auth, and refresh —
  // same path as every other call, no same-origin fallback.
  const formData = new FormData()
  formData.append('file', file)

  const res = await apiClient<{ logo_url?: string; data?: { logo_url?: string } }>(
    '/onboarding/logo',
    { method: 'POST', body: formData }
  )
  return res.data ?? res
}

export async function sendOnboardingInvites(
  invites: InviteItem[]
): Promise<{ success: boolean; count?: number }> {
  return apiClient<{ success: boolean; count?: number }>('/onboarding/invites', {
    method: 'POST',
    body: JSON.stringify({ invites }),
  })
}

export async function completeOnboarding(): Promise<Record<string, unknown>> {
  return apiClient<Record<string, unknown>>('/onboarding/complete', {
    method: 'POST',
  })
}
