'use client'

import React, { useState } from 'react'
import { Button, Field, fieldControlClasses } from '@/ui/primitives'

export interface OnboardingFormValues {
  step: number
  full_name: string
  role_title: string
  country: string
  phone: string
  how_heard: string
  name: string
  description: string
  website: string
  industry: string
  business_model: string
  stage: string
  goals: string[]
  notes: string
}

export interface OnboardingWizardProps {
  initialValues?: Partial<OnboardingFormValues>
  onSaveStep: (stepNumber: number, data: Partial<OnboardingFormValues>) => Promise<void>
  onUploadLogo?: (file: File) => Promise<void>
  onSendInvites?: (invites: Array<{ email: string; role: string }>) => Promise<void>
  onComplete: () => Promise<void>
  isSubmitting?: boolean
  error?: string | null
  // ISO country options for the step-1 Country select (passed in to keep ui/ portable).
  countries?: Array<{ code: string; name: string }>
}

const TOTAL_STEPS = 6

const BUSINESS_MODELS = [
  { id: 'b2b', label: 'B2B (Business to Business)' },
  { id: 'b2c', label: 'B2C (Business to Consumer)' },
  { id: 'b2b2c', label: 'B2B2C' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'services', label: 'Services' },
]

const STAGES = [
  { id: 'idea', label: 'Idea / Concept' },
  { id: 'validation', label: 'Problem Validation' },
  { id: 'build', label: 'Building MVP' },
  { id: 'launch', label: 'Launched / Early Traction' },
  { id: 'growth', label: 'Growth / Scaling' },
  { id: 'scale', label: 'Mature Scale' },
]

const GOAL_OPTIONS = [
  'Find co-founders or key hires',
  'Raise seed / angel capital',
  'Build and ship MVP',
  'Acquire initial 100 customers',
  'Scale marketing & sales',
  'Set up legal & governance',
]

const MEMBERSHIP_ROLES = [
  { id: 'founder', label: 'Co-Founder' },
  { id: 'team_member', label: 'Team Member' },
  { id: 'mentor', label: 'Mentor' },
  { id: 'accountant', label: 'Accountant' },
  { id: 'legal_advisor', label: 'Legal Advisor' },
  { id: 'business_consultant', label: 'Business Consultant' },
  { id: 'investor', label: 'Investor' },
]

export function OnboardingWizard({
  initialValues,
  onSaveStep,
  onUploadLogo,
  onSendInvites,
  onComplete,
  isSubmitting = false,
  error,
  countries = [],
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(initialValues?.step || 1)
  const [values, setValues] = useState<OnboardingFormValues>({
    step: initialValues?.step || 1,
    full_name: initialValues?.full_name || '',
    role_title: initialValues?.role_title || '',
    country: initialValues?.country || '',
    phone: initialValues?.phone || '',
    how_heard: initialValues?.how_heard || '',
    name: initialValues?.name || '',
    description: initialValues?.description || '',
    website: initialValues?.website || '',
    industry: initialValues?.industry || '',
    business_model: initialValues?.business_model || '',
    stage: initialValues?.stage || '',
    goals: initialValues?.goals || [],
    notes: initialValues?.notes || '',
  })

  const [invites, setInvites] = useState<Array<{ email: string; role: string }>>([
    { email: '', role: 'team_member' },
  ])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const activeError = error || localError

  function updateField<K extends keyof OnboardingFormValues>(field: K, val: OnboardingFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: val }))
  }

  function toggleGoal(goal: string) {
    setValues((prev) => {
      const exists = prev.goals.includes(goal)
      if (exists) {
        return { ...prev, goals: prev.goals.filter((g) => g !== goal) }
      }
      if (prev.goals.length >= 3) {
        return prev
      }
      return { ...prev, goals: [...prev.goals, goal] }
    })
  }

  async function handleNext(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)

    if (currentStep === 1 && !values.full_name.trim()) {
      setLocalError('Please enter your full name.')
      return
    }

    if (currentStep === 2 && !values.name.trim()) {
      setLocalError('Please enter your startup or workspace name.')
      return
    }

    if (currentStep === 5 && selectedFile && onUploadLogo) {
      await onUploadLogo(selectedFile)
    }

    if (currentStep === 6) {
      const validInvites = invites.filter((inv) => inv.email.trim().length > 0)
      if (validInvites.length > 0 && onSendInvites) {
        await onSendInvites(validInvites)
      }
      await onComplete()
      return
    }

    const nextStep = currentStep + 1
    await onSaveStep(nextStep, { ...values, step: nextStep })
    setCurrentStep(nextStep)
  }

  async function handleBack() {
    if (currentStep > 1) {
      setLocalError(null)
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-medium text-sage-500">
          <span>Step {currentStep} of {TOTAL_STEPS}</span>
          <span>{Math.round((currentStep / TOTAL_STEPS) * 100)}% completed</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-sage-200">
          <div
            className="h-full bg-green-700 transition-all duration-300"
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-card border border-sage-200 bg-white p-6 md:p-8 shadow-card">
        {activeError && (
          <div
            role="alert"
            className="mb-6 rounded-input border border-red-200 bg-red-50 p-3 text-[13px] text-red-700"
          >
            {activeError}
          </div>
        )}

        <form onSubmit={handleNext} noValidate>
          {/* Step 1: Founder Profile */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-green-900">
                Tell us about yourself
              </h1>
              <p className="text-sm text-sage-500">
                let&apos;s set up your profile credentials and role in the startup.
              </p>

              <Field label="Full Name" htmlFor="onboard-name" help={null}>
                {() => (
                  <input
                    id="onboard-name"
                    type="text"
                    value={values.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                    className={fieldControlClasses}
                    placeholder="Jane Doe"
                    required
                  />
                )}
              </Field>

              <Field label="Role or Title" htmlFor="onboard-role" help={null}>
                {() => (
                  <input
                    id="onboard-role"
                    type="text"
                    value={values.role_title}
                    onChange={(e) => updateField('role_title', e.target.value)}
                    className={fieldControlClasses}
                    placeholder="Founder & CEO"
                  />
                )}
              </Field>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Country" htmlFor="onboard-country" help={null}>
                  {() => (
                    // The API stores country as an ISO code — submit the code, not the name.
                    <select
                      id="onboard-country"
                      value={values.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      className={fieldControlClasses}
                    >
                      <option value="">Select a country</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>

                <Field label="Phone Number" htmlFor="onboard-phone" help={null}>
                  {() => (
                    <input
                      id="onboard-phone"
                      type="tel"
                      value={values.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className={fieldControlClasses}
                      placeholder="+1 (555) 000-0000"
                    />
                  )}
                </Field>
              </div>

              <Field label="How did you hear about Cofoundaz?" htmlFor="onboard-heard" help={null}>
                {() => (
                  <input
                    id="onboard-heard"
                    type="text"
                    value={values.how_heard}
                    onChange={(e) => updateField('how_heard', e.target.value)}
                    className={fieldControlClasses}
                    placeholder="Community, Twitter/X, Referral..."
                  />
                )}
              </Field>
            </div>
          )}

          {/* Step 2: Startup Core */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-green-900">
                Your Startup Details
              </h1>
              <p className="text-sm text-sage-500">
                What is your company or venture called, and what does it do?
              </p>

              <Field label="Startup Name" htmlFor="startup-name" help={null}>
                {() => (
                  <input
                    id="startup-name"
                    type="text"
                    value={values.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className={fieldControlClasses}
                    placeholder="Acme Innovations"
                    required
                  />
                )}
              </Field>

              <Field label="Short Description" htmlFor="startup-desc" help={null}>
                {() => (
                  <textarea
                    id="startup-desc"
                    value={values.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className={`${fieldControlClasses} min-h-[80px]`}
                    placeholder="One or two sentences summarizing your product value proposition."
                  />
                )}
              </Field>

              <Field label="Website (optional)" htmlFor="startup-web" help={null}>
                {() => (
                  <input
                    id="startup-web"
                    type="url"
                    value={values.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    className={fieldControlClasses}
                    placeholder="https://example.com"
                  />
                )}
              </Field>
            </div>
          )}

          {/* Step 3: Model & Stage */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <h1 className="font-display text-2xl font-bold text-green-900">
                Business Model & Stage
              </h1>
              <p className="text-sm text-sage-500">
                Help us customize your workspace tools to your operating model.
              </p>

              <Field label="Primary Industry" htmlFor="startup-ind" help={null}>
                {() => (
                  <input
                    id="startup-ind"
                    type="text"
                    value={values.industry}
                    onChange={(e) => updateField('industry', e.target.value)}
                    className={fieldControlClasses}
                    placeholder="Fintech, Healthtech, AI, Climate..."
                  />
                )}
              </Field>

              <div>
                <label className="mb-2 block text-xs font-semibold text-sage-700">
                  Business Model
                </label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {BUSINESS_MODELS.map((model) => {
                    const isSelected = values.business_model === model.id
                    return (
                      <button
                        type="button"
                        key={model.id}
                        onClick={() => updateField('business_model', model.id)}
                        className={`rounded-input border p-2.5 text-center text-xs font-medium transition ${
                          isSelected
                            ? 'border-green-700 bg-green-50 text-green-900 ring-2 ring-green-700/20'
                            : 'border-sage-200 bg-white text-sage-700 hover:bg-sage-100'
                        }`}
                      >
                        {model.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-sage-700">
                  Current Stage
                </label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {STAGES.map((stg) => {
                    const isSelected = values.stage === stg.id
                    return (
                      <button
                        type="button"
                        key={stg.id}
                        onClick={() => updateField('stage', stg.id)}
                        className={`rounded-input border p-2.5 text-center text-xs font-medium transition ${
                          isSelected
                            ? 'border-green-700 bg-green-50 text-green-900 ring-2 ring-green-700/20'
                            : 'border-sage-200 bg-white text-sage-700 hover:bg-sage-100'
                        }`}
                      >
                        {stg.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Goals */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-green-900">
                Select Your Key Goals
              </h1>
              <p className="text-sm text-sage-500">
                Choose up to 3 focus areas you want to tackle first in Cofoundaz.
              </p>

              <div className="space-y-2.5 pt-2">
                {GOAL_OPTIONS.map((g) => {
                  const isChecked = values.goals.includes(g)
                  return (
                    <div
                      key={g}
                      onClick={() => toggleGoal(g)}
                      className={`flex cursor-pointer items-center justify-between rounded-input border p-3 text-sm transition ${
                        isChecked
                          ? 'border-green-700 bg-green-50 text-green-900 font-medium'
                          : 'border-sage-200 bg-white text-sage-700 hover:bg-sage-100'
                      }`}
                    >
                      <span>{g}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="h-4 w-4 accent-green-600"
                      />
                    </div>
                  )
                })}
              </div>

              <Field label="Additional Notes or Specific Needs" htmlFor="goal-notes" help={null}>
                {() => (
                  <textarea
                    id="goal-notes"
                    value={values.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    className={`${fieldControlClasses} min-h-[70px]`}
                    placeholder="Anything else your advisors or the platform should know?"
                  />
                )}
              </Field>
            </div>
          )}

          {/* Step 5: Logo & Branding */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-green-900">
                Upload Startup Logo
              </h1>
              <p className="text-sm text-sage-500">
                Add an avatar or logo for your workspace dashboard.
              </p>

              <div className="flex flex-col items-center justify-center rounded-input border-2 border-dashed border-sage-300 p-8 text-center hover:bg-sage-50">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0])
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="logo-upload"
                  className="cursor-pointer font-semibold text-green-700 hover:underline"
                >
                  {selectedFile ? selectedFile.name : 'Choose a file to upload'}
                </label>
                <p className="mt-1 text-xs text-sage-500">PNG, JPG, or SVG up to 5MB</p>
              </div>
            </div>
          )}

          {/* Step 6: Team Invites */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-green-900">
                Invite Your Team
              </h1>
              <p className="text-sm text-sage-500">
                Add co-founders, early advisors, or team members (optional).
              </p>

              <div className="space-y-3">
                {invites.map((inv, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="email"
                      value={inv.email}
                      onChange={(e) => {
                        const next = [...invites]
                        next[idx].email = e.target.value
                        setInvites(next)
                      }}
                      placeholder="teammate@startup.com"
                      className={`${fieldControlClasses} flex-1 min-w-0`}
                    />
                    <select
                      value={inv.role}
                      onChange={(e) => {
                        const next = [...invites]
                        next[idx].role = e.target.value
                        setInvites(next)
                      }}
                      className={`${fieldControlClasses} !w-44 shrink-0`}
                    >
                      {MEMBERSHIP_ROLES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setInvites([...invites, { email: '', role: 'team_member' }])}
                  className="text-xs font-semibold text-green-700 hover:underline"
                >
                  + Add another invite
                </button>
              </div>
            </div>
          )}

          {/* Wizard Action Controls */}
          <div className="mt-8 flex items-center justify-between border-t border-sage-200 pt-5">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            <Button
              type="submit"
              variant="accent"
              size="md"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : currentStep === TOTAL_STEPS
                ? 'Complete Setup'
                : 'Continue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
