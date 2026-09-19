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
}

// The API returns the {data, meta} envelope with founder fields nested under
// `founder_profile` and startup fields under `startup`. The wizard works with a
// flat shape, so we unwrap + flatten here — the one place that knows the nesting.
interface RawOnboardingState {
  step: number
  completed?: boolean
  assessment_pending?: boolean
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

function flatten(raw: RawOnboardingState): OnboardingState {
  const fp = raw.founder_profile ?? {}
  const st = raw.startup ?? {}
  return {
    step: raw.step,
    completed: raw.completed,
    full_name: fp.full_name ?? null,
    role_title: fp.role_title ?? null,
    country: fp.country ?? null,
    phone: fp.phone ?? null,
    how_heard: fp.how_heard ?? null,
    name: st.name ?? null,
    description: st.description ?? null,
    website: st.website ?? null,
    logo_url: st.logo_url ?? null,
    industry: st.industry ?? null,
    business_model: st.business_model ?? null,
    stage: st.stage ?? null,
    goals: raw.goals ?? [],
    notes: raw.notes ?? null,
    invites: raw.invites ?? [],
  }
}

export async function getOnboardingState(): Promise<OnboardingState> {
  const env = await apiClient<{ data: RawOnboardingState }>('/onboarding/state', {
    method: 'GET',
  })
  return flatten(env.data)
}

export async function patchOnboardingState(
  patch: OnboardingStatePatch
): Promise<OnboardingState> {
  // `step` is required by the API; flat fields autosave. NOTE: `country` must be
  // an ISO code (e.g. "NG") — a display name 500s server-side.
  const env = await apiClient<{ data: RawOnboardingState }>('/onboarding/state', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return flatten(env.data)
}

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