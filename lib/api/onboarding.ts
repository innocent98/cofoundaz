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

export async function getOnboardingState(): Promise<OnboardingState> {
  return apiClient<OnboardingState>('/onboarding/state', {
    method: 'GET',
  })
}

export async function patchOnboardingState(
  patch: OnboardingStatePatch
): Promise<OnboardingState> {
  return apiClient<OnboardingState>('/onboarding/state', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function uploadOnboardingLogo(file: File): Promise<{ logo_url?: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const token = typeof window !== 'undefined' ? localStorage.getItem('cf_token') : null
  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch('/api/v1/onboarding/logo', {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`)
  }

  return response.json()
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