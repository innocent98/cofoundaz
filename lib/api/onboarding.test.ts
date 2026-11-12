import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  getOnboardingState,
  patchOnboardingState,
  postOnboardingState,
  buildOnboardingPatchPayload,
  sanitizeGoals,
  VALID_ONBOARDING_GOALS,
} from './onboarding'
import * as clientModule from './client'

vi.mock('./client', () => ({
  apiClient: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(public status: number, public statusText: string, public data: unknown) {
      super(`API Error ${status}: ${statusText}`)
    }
  },
}))

describe('Onboarding API Client (lib/api/onboarding.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('unwraps and flattens ai_panel from GET /onboarding/state', async () => {
    const rawResponse = {
      data: {
        step: 2,
        completed: false,
        ai_panel: 'Welcome! Based on your early SaaS profile, we are calibrating your AI Co-Founder.',
        founder_profile: {
          full_name: 'Jane Doe',
          role_title: 'CEO',
        },
        startup: {
          name: 'Acme SaaS',
        },
      },
    }

    vi.mocked(clientModule.apiClient).mockResolvedValueOnce(rawResponse)

    const result = await getOnboardingState()

    expect(clientModule.apiClient).toHaveBeenCalledWith('/onboarding/state', { method: 'GET' })
    expect(result.step).toBe(2)
    expect(result.full_name).toBe('Jane Doe')
    expect(result.name).toBe('Acme SaaS')
    expect(result.ai_panel).toBe(
      'Welcome! Based on your early SaaS profile, we are calibrating your AI Co-Founder.'
    )
  })

  it('defaults ai_panel to null when omitted or null in GET /onboarding/state', async () => {
    const rawResponse = {
      data: {
        step: 1,
        completed: false,
        ai_panel: null,
      },
    }

    vi.mocked(clientModule.apiClient).mockResolvedValueOnce(rawResponse)

    const result = await getOnboardingState()
    expect(result.ai_panel).toBeNull()
  })

  it('unwraps updated ai_panel from PATCH /onboarding/state', async () => {
    const rawPatchResponse = {
      data: {
        step: 6,
        completed: false,
        ai_panel: 'AI Co-Founder calibrated: 3 team recommendations generated.',
      },
    }

    vi.mocked(clientModule.apiClient).mockResolvedValueOnce(rawPatchResponse)

    const result = await patchOnboardingState({
      step: 6,
      ai_panel: null,
    })

    expect(clientModule.apiClient).toHaveBeenCalledWith('/onboarding/state', expect.objectContaining({
      method: 'PATCH',
    }))
    expect(result.step).toBe(6)
    expect(result.ai_panel).toBe('AI Co-Founder calibrated: 3 team recommendations generated.')
  })

  it('sanitizes and maps goals to valid backend enum strings', () => {
    expect(VALID_ONBOARDING_GOALS).toHaveLength(8)
    expect(VALID_ONBOARDING_GOALS).toContain('Validate my idea')
    expect(VALID_ONBOARDING_GOALS).toContain('Build my MVP')
    expect(VALID_ONBOARDING_GOALS).toContain('Get first customers')
    expect(VALID_ONBOARDING_GOALS).toContain('Grow revenue')
    expect(VALID_ONBOARDING_GOALS).toContain('Raise funding')
    expect(VALID_ONBOARDING_GOALS).toContain('Get legally set up')
    expect(VALID_ONBOARDING_GOALS).toContain('Get financially organized')
    expect(VALID_ONBOARDING_GOALS).toContain('Build my team')

    expect(sanitizeGoals(null)).toBeNull()
    expect(sanitizeGoals([])).toBeNull()

    // Maps legacy phrases to valid enum strings
    const mapped = sanitizeGoals([
      'Build and ship MVP',
      'Acquire initial 100 customers',
      'Raise seed / angel capital',
    ])
    expect(mapped).toEqual(['Build my MVP', 'Get first customers', 'Raise funding'])

    // Deduplicates and limits to 3
    const deduped = sanitizeGoals([
      'Validate my idea',
      'Validate my idea',
      'Build my MVP',
      'Grow revenue',
      'Raise funding',
    ])
    expect(deduped).toEqual(['Validate my idea', 'Build my MVP', 'Grow revenue'])
  })

  it('buildOnboardingPatchPayload builds sanitized goals payload', () => {
    const payload = buildOnboardingPatchPayload({
      step: 4,
      goals: ['Validate my idea', 'Build my MVP'],
    })
    expect(payload.goals).toEqual(['Validate my idea', 'Build my MVP'])

    const emptyPayload = buildOnboardingPatchPayload({
      step: 4,
      goals: [],
    })
    expect(emptyPayload.goals).toBeNull()
  })

  it('posts valid goals payload to /onboarding/state via postOnboardingState', async () => {
    const rawResponse = {
      data: {
        step: 5,
        completed: false,
        goals: ['Validate my idea'],
      },
    }
    vi.mocked(clientModule.apiClient).mockResolvedValueOnce(rawResponse)

    await postOnboardingState({
      step: 5,
      goals: ['Validate my idea'],
    })

    expect(clientModule.apiClient).toHaveBeenCalledWith(
      '/onboarding/state',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          step: 5,
          full_name: null,
          role_title: null,
          country: null,
          phone: null,
          how_heard: null,
          name: null,
          description: null,
          website: null,
          industry: null,
          business_model: null,
          stage: null,
          goals: ['Validate my idea'],
          notes: null,
        }),
      })
    )
  })
})
