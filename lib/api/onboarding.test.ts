import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getOnboardingState, patchOnboardingState } from './onboarding'
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
})
