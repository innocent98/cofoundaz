'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { OnboardingWizard, OnboardingFormValues, CompleteTarget } from '@/ui/onboarding/onboarding-wizard'
import {
  getOnboardingState,
  patchOnboardingState,
  uploadOnboardingLogo,
  sendOnboardingInvites,
  InviteResult,
  completeOnboarding,
  BusinessModel,
  StartupStage,
  MembershipRole,
} from '@/lib/api/onboarding'
import { ApiError } from '@/lib/api/client'
import { apiErrorInfo } from '@/lib/api/api-error'
import { readInvite } from '@/lib/auth/pending'
import { syncActiveWorkspace } from '@/lib/auth/post-login'
import { COUNTRIES } from '@/lib/countries'

export default function OnboardingPage() {
  const router = useRouter()
  const [initialData, setInitialData] = useState<Partial<OnboardingFormValues> | null>(null)
  const [aiPanel, setAiPanel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [pendingInvite, setPendingInvite] = useState(false)

  useEffect(() => {
    async function loadState() {
      try {
        const state = await getOnboardingState()
        // Finished (or a member of someone else's workspace, whose state reads completed):
        // the wizard is not for them.
        if (state.completed) {
          router.replace('/dashboard')
          return
        }
        setPendingInvite(state.pending_invite === true)
        if (state.ai_panel) {
          setAiPanel(state.ai_panel)
        }
        setInitialData({
          step: state.step || 1,
          full_name: state.full_name || '',
          role_title: state.role_title || '',
          country: state.country || '',
          phone: state.phone || '',
          how_heard: state.how_heard || '',
          name: state.name || '',
          description: state.description || '',
          website: state.website || '',
          industry: state.industry || '',
          business_model: state.business_model || '',
          stage: state.stage || '',
          goals: state.goals || [],
          notes: state.notes || '',
          ai_panel: state.ai_panel || null,
        })
      } catch {
        // Unauthenticated or fresh user starts on Step 1
        setInitialData({ step: 1 })
      } finally {
        setLoading(false)
      }
    }
    loadState()
  }, [router])

  async function handleSaveStep(step: number, data: Partial<OnboardingFormValues>) {
    setSubmitting(true)
    setError(null)
    setFieldErrors({})
    try {
      const res = await patchOnboardingState({
        step,
        full_name: data.full_name || null,
        role_title: data.role_title || null,
        country: data.country || null,
        phone: data.phone || null,
        how_heard: data.how_heard || null,
        name: data.name || null,
        description: data.description || null,
        website: data.website || null,
        industry: data.industry || null,
        business_model: (data.business_model as BusinessModel) || null,
        stage: (data.stage as StartupStage) || null,
        goals: data.goals || null,
        notes: data.notes || null,
      })
      if (res?.ai_panel) {
        setAiPanel(res.ai_panel)
      }
      return res
    } catch (err: unknown) {
      const info = apiErrorInfo(err, 'Could not save your progress. Please try again.')
      if (info.code === 'ONBOARDING_NOT_FOR_INVITED') {
        router.replace('/dashboard')
        return null
      }
      if (info.fieldErrors.length) {
        setFieldErrors(Object.fromEntries(info.fieldErrors.map((f) => [f.field, f.message])))
        setError(info.message)
      } else {
        setError(err instanceof ApiError ? info.message : 'Network error while saving progress.')
      }
      return null
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUploadLogo(file: File): Promise<boolean> {
    setError(null)
    try {
      await uploadOnboardingLogo(file)
      return true
    } catch (err) {
      // The API's own message ("Logo must be 2 MB or smaller.") is shown and the wizard stays on step 2.
      setError(apiErrorInfo(err, 'Could not upload the logo. Please try again.').message)
      return false
    }
  }

  async function handleSendInvites(
    invites: Array<{ email: string; role: string }>
  ): Promise<InviteResult[] | null> {
    setSubmitting(true)
    setError(null)
    try {
      return await sendOnboardingInvites(
        invites.map((i) => ({ email: i.email, role: i.role as MembershipRole }))
      )
    } catch (err) {
      setError(apiErrorInfo(err, 'Could not send the invites. Please try again.').message)
      return null
    } finally {
      setSubmitting(false)
    }
  }

  async function handleComplete(then: CompleteTarget) {
    setSubmitting(true)
    setError(null)
    try {
      await completeOnboarding()
      // Onboarding just created the workspace; the signup/login session predates
      // it, so sync the active workspace id into the client before the dashboard
      // loads — otherwise every tenant-scoped call 422s on a missing X-Workspace-Id.
      await syncActiveWorkspace()
      router.push(then === 'assessment' ? '/assessment' : '/dashboard')
    } catch (err: unknown) {
      // 422 ONBOARDING_INCOMPLETE lists the still-missing fields — surface them.
      if (err instanceof ApiError) {
        const d = err.data as {
          error?: { message?: string; field_errors?: Array<{ message?: string }> }
        }
        const fieldMsgs = (d?.error?.field_errors ?? [])
          .map((f) => f.message)
          .filter(Boolean)
          .join(' ')
        setError(
          [d?.error?.message, fieldMsgs].filter(Boolean).join(' ') ||
            'Could not complete onboarding. Please try again.'
        )
      } else {
        setError('Could not complete onboarding. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm font-medium text-neutral-500">Loading your onboarding session...</p>
      </div>
    )
  }

  const savedInvite = readInvite()

  return (
    <div className="w-full">
      {pendingInvite && (
        <div role="status" className="mx-auto mt-6 w-full max-w-2xl rounded-card border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          You have a pending invitation to join a startup.{' '}
          {savedInvite ? (
            <Link href={`/invite/${encodeURIComponent(savedInvite)}`} className="font-semibold underline">
              Open the invitation
            </Link>
          ) : (
            'Open the link in your invitation email to accept or decline it.'
          )}{' '}
          Or set up your own startup below.
        </div>
      )}
      <OnboardingWizard
      initialValues={initialData || { step: 1 }}
      aiPanel={aiPanel}
      onSaveStep={handleSaveStep}
      onUploadLogo={handleUploadLogo}
      onSendInvites={handleSendInvites}
      onComplete={handleComplete}
      onFetchAiPanel={getOnboardingState}
      isSubmitting={submitting}
      error={error}
      countries={COUNTRIES}
      fieldErrors={fieldErrors}
    />
    </div>
  )
}