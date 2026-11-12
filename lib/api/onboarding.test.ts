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

describe('invites and pending_invite', () => {
  it('returns per-row results from POST /onboarding/invites', async () => {
    const { sendOnboardingInvites } = await import('./onboarding')
    const results = [{ email: 'nope', status: 'invalid', reason: 'invalid_email', message: 'bad' }]
    vi.mocked(clientModule.apiClient).mockResolvedValueOnce({ data: { created: [], results } })
    expect(await sendOnboardingInvites([{ email: 'nope', role: 'team_member' }])).toEqual(results)
  })

  it('reads pending_invite and tolerates a null startup/founder_profile', async () => {
    vi.mocked(clientModule.apiClient).mockResolvedValueOnce({
      data: { step: 1, completed: false, pending_invite: true, founder_profile: null, startup: null },
    })
    const s = await getOnboardingState()
    expect(s.pending_invite).toBe(true)
    expect(s.name).toBeNull()
  })

  it('declines an invitation by token', async () => {
    const { declineInvitation } = await import('./onboarding')
    vi.mocked(clientModule.apiClient).mockResolvedValueOnce({ data: { declined: true } })
    await declineInvitation('tok')
    expect(clientModule.apiClient).toHaveBeenCalledWith('/invitations/decline', {
      method: 'POST',
      body: JSON.stringify({ token: 'tok' }),
    })
  })
})
