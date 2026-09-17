'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingWizard, OnboardingFormValues } from '@/ui/onboarding/onboarding-wizard'
import {
  getOnboardingState,
  patchOnboardingState,
  uploadOnboardingLogo,
  sendOnboardingInvites,
  completeOnboarding,
  BusinessModel,
  StartupStage,
  MembershipRole,
} from '@/lib/api/onboarding'
import { ApiError } from '@/lib/api/client'
import { COUNTRIES } from '@/lib/countries'

export default function OnboardingPage() {
  const router = useRouter()
  const [initialData, setInitialData] = useState<Partial<OnboardingFormValues> | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadState() {
      try {
        const state = await getOnboardingState()
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
        })
      } catch {
        // Unauthenticated or fresh user starts on Step 1
        setInitialData({ step: 1 })
      } finally {
        setLoading(false)
      }
    }
    loadState()
  }, [])

  async function handleSaveStep(step: number, data: Partial<OnboardingFormValues>) {
    setSubmitting(true)
    setError(null)
    try {
      await patchOnboardingState({
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
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(`Failed to save step: ${err.status}`)
      } else {
        setError('Network error while saving progress.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUploadLogo(file: File) {
    try {
      await uploadOnboardingLogo(file)
    } catch {
      // Non-blocking upload error
    }
  }

  async function handleSendInvites(invites: Array<{ email: string; role: string }>) {
    try {
      const items = invites.map((i) => ({
        email: i.email,
        role: i.role as MembershipRole,
      }))
      await sendOnboardingInvites(items)
    } catch {
      // Non-blocking invite error
    }
  }

  async function handleComplete() {
    setSubmitting(true)
    setError(null)
    try {
      await completeOnboarding()
      router.push('/dashboard')
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
        <p className="text-sm font-medium text-sage-500">Loading your onboarding session...</p>
      </div>
    )
  }

  return (
    <OnboardingWizard
      initialValues={initialData || { step: 1 }}
      onSaveStep={handleSaveStep}
      onUploadLogo={handleUploadLogo}
      onSendInvites={handleSendInvites}
      onComplete={handleComplete}
      isSubmitting={submitting}
      error={error}
      countries={COUNTRIES}
    />
  )
}