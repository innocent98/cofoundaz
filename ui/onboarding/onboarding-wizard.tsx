'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import { Button, Field, fieldControlClasses } from '@/ui/primitives'
import {
  BUSINESS_MODELS,
  COFOUNDER_WARNING,
  GOAL_OPTIONS,
  INDUSTRIES,
  INVITE_ROLES,
  OTHER_INDUSTRY,
  STAGES,
} from '@/content/onboarding'

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
  ai_panel?: string | null
}

/** One entry per submitted invite row (POST /onboarding/invites). */
export interface InviteRowResult {
  email: string
  status: 'created' | 'skipped' | 'invalid'
  message: string | null
}

export type CompleteTarget = 'assessment' | 'dashboard'

export interface OnboardingWizardProps {
  initialValues?: Partial<OnboardingFormValues>
  aiPanel?: string | null
  /** Autosave. Resolve `null` when the save failed so the wizard stays on the step. */
  onSaveStep: (
    stepNumber: number,
    data: Partial<OnboardingFormValues>
  ) => Promise<{ ai_panel?: string | null } | null | void>
  onUploadLogo?: (file: File) => Promise<void>
  /** Resolve the per-row results; reject (or resolve null) when the request itself failed. */
  onSendInvites?: (invites: Array<{ email: string; role: string }>) => Promise<InviteRowResult[] | null>
  onComplete: (then: CompleteTarget) => Promise<void>
  onFetchAiPanel?: () => Promise<{ ai_panel?: string | null } | string | null | void>
  isSubmitting?: boolean
  error?: string | null
  /** Server-side field messages from a failed save, keyed by field name. */
  fieldErrors?: Record<string, string>
  // ISO country options for the step-1 Country select (passed in to keep ui/ portable).
  countries?: Array<{ code: string; name: string }>
}

/**
 * An opaque prose block rendering the AI Co-Founder calibration card / welcome message.
 * Gracefully renders nothing when aiPanel is null or whitespace.
 */
export function OnboardingAiPanel({ aiPanel }: { aiPanel?: string | null }) {
  if (!aiPanel || !aiPanel.trim()) {
    return null
  }

  return (
    <div
      data-testid="onboarding-ai-panel"
      role="region"
      aria-label="AI Co-Founder Calibration"
      className="rounded-card border border-brand-700/20 bg-brand-900 text-white p-5 shadow-card space-y-2.5 transition-all"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-700 text-accent-500">
          <Sparkles className="h-3.5 w-3.5 fill-current" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
          AI Co-Founder Calibration
        </span>
      </div>
      <div className="text-xs md:text-sm leading-relaxed text-brand-200 whitespace-pre-wrap font-normal">
        {aiPanel}
      </div>
    </div>
  )
}

const TOTAL_STEPS = 6

/** Best-effort country default from the browser locale ("en-NG" → "NG"), only if it is in the list. */
function defaultCountry(countries: Array<{ code: string }>): string {
  if (typeof navigator === 'undefined') return ''
  const tag = navigator.languages?.[0] || navigator.language || ''
  const region = tag.split('-')[1]?.toUpperCase() ?? ''
  return countries.some((c) => c.code === region) ? region : ''
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1 text-[12px] text-danger-700">
      {message}
    </p>
  )
}

export function OnboardingWizard({
  initialValues,
  aiPanel: propAiPanel,
  onSaveStep,
  onUploadLogo,
  onSendInvites,
  onComplete,
  onFetchAiPanel,
  isSubmitting = false,
  error,
  fieldErrors: serverFieldErrors,
  countries = [],
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(Math.min(initialValues?.step || 1, TOTAL_STEPS))
  const [localAiPanel, setLocalAiPanel] = useState<string | null>(null)
  const currentAiPanel = propAiPanel ?? localAiPanel ?? initialValues?.ai_panel ?? null
  const hasRefetchedAiPanelRef = useRef(false)

  // Single delayed re-fetch when arriving at the last step if ai_panel is not yet loaded.
  // NO tight-loop polling.
  useEffect(() => {
    if (currentStep === TOTAL_STEPS && !currentAiPanel && !hasRefetchedAiPanelRef.current && onFetchAiPanel) {
      hasRefetchedAiPanelRef.current = true
      const timer = setTimeout(async () => {
        try {
          const fresh = await onFetchAiPanel()
          if (typeof fresh === 'string' && fresh) {
            setLocalAiPanel(fresh)
          } else if (fresh && typeof fresh === 'object' && 'ai_panel' in fresh && fresh.ai_panel) {
            setLocalAiPanel(fresh.ai_panel)
          }
        } catch {
          // non-blocking
        }
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [currentStep, currentAiPanel, onFetchAiPanel])

  const storedIndustry = initialValues?.industry || ''
  const industryIsListed = (INDUSTRIES as readonly string[]).includes(storedIndustry)

  const [values, setValues] = useState<OnboardingFormValues>({
    step: initialValues?.step || 1,
    full_name: initialValues?.full_name || '',
    role_title: initialValues?.role_title || '',
    country: initialValues?.country || defaultCountry(countries),
    phone: initialValues?.phone || '',
    how_heard: initialValues?.how_heard || '',
    name: initialValues?.name || '',
    description: initialValues?.description || '',
    website: initialValues?.website || '',
    industry: storedIndustry,
    business_model: initialValues?.business_model || '',
    stage: initialValues?.stage || '',
    goals: initialValues?.goals || [],
    notes: initialValues?.notes || '',
    ai_panel: initialValues?.ai_panel ?? null,
  })
  // Industry is a pick-list; "Other" (or an older free-text value) opens a text field.
  const [industryChoice, setIndustryChoice] = useState<string>(
    industryIsListed ? storedIndustry : storedIndustry ? OTHER_INDUSTRY : ''
  )
  const [industryOther, setIndustryOther] = useState<string>(
    !industryIsListed && storedIndustry && storedIndustry !== OTHER_INDUSTRY ? storedIndustry : ''
  )

  const [invites, setInvites] = useState<Array<{ email: string; role: string; message?: string | null }>>([
    { email: '', role: 'team_member' },
  ])
  const [sentCount, setSentCount] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({})

  const activeError = error || localError
  const fe = { ...serverFieldErrors, ...stepErrors }

  function updateField<K extends keyof OnboardingFormValues>(field: K, val: OnboardingFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: val }))
    setStepErrors((prev) => (field in prev ? { ...prev, [field]: '' } : prev))
  }

  function toggleGoal(goal: string) {
    setValues((prev) => {
      if (prev.goals.includes(goal)) return { ...prev, goals: prev.goals.filter((g) => g !== goal) }
      if (prev.goals.length >= 3) return prev
      return { ...prev, goals: [...prev.goals, goal] }
    })
  }

  /** The industry as it is saved: the picked label, or the typed text for "Other". */
  function resolvedIndustry(): string {
    return industryChoice === OTHER_INDUSTRY ? industryOther.trim() : industryChoice
  }

  /** Required fields of the step being left. Returns field → message. */
  function validateStep(step: number): Record<string, string> {
    const errs: Record<string, string> = {}
    if (step === 1 && !values.full_name.trim()) errs.full_name = 'Please enter your full name.'
    if (step === 2) {
      if (!values.name.trim()) errs.name = 'Please enter your startup or workspace name.'
      // http(s) only (gap 6); a bare domain is fine, the API adds https://.
      const site = values.website.trim()
      if (site && /^[a-z][a-z0-9+.-]*:/i.test(site) && !/^https?:\/\//i.test(site)) {
        errs.website = 'Enter a web address starting with http or https.'
      }
    }
    if (step === 3) {
      if (!industryChoice) errs.industry = 'Pick your industry.'
      else if (industryChoice === OTHER_INDUSTRY && !industryOther.trim()) errs.industry = 'Tell us your industry.'
      if (!values.business_model) errs.business_model = 'Pick your business model.'
      if (!values.stage) errs.stage = 'Pick your stage.'
    }
    return errs
  }

  async function advanceTo(nextStep: number) {
    const data = { ...values, industry: resolvedIndustry(), step: nextStep }
    const res = await onSaveStep(nextStep, data)
    if (res === null) return false // the save failed: the page shows why, stay here
    if (res && typeof res === 'object' && 'ai_panel' in res && res.ai_panel) {
      setLocalAiPanel(res.ai_panel)
    }
    setCurrentStep(nextStep)
    return true
  }

  async function handleNext(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    const errs = validateStep(currentStep)
    setStepErrors(errs)
    if (Object.keys(errs).length) return

    if (currentStep === 2 && selectedFile && onUploadLogo) {
      await onUploadLogo(selectedFile)
    }

    if (currentStep === 5) {
      await handleSendInvites()
      return
    }
    if (currentStep === TOTAL_STEPS) return // step 6 has its own two buttons
    await advanceTo(currentStep + 1)
  }

  async function handleSendInvites() {
    const filled = invites.filter((inv) => inv.email.trim().length > 0)
    if (filled.length === 0) {
      setLocalError("Add an email address, or choose \u201cSkip \u2014 it's just me for now\u201d.")
      return
    }
    if (!onSendInvites) {
      await advanceTo(6)
      return
    }
    const results = await onSendInvites(filled.map((i) => ({ email: i.email.trim(), role: i.role })))
    if (!results) return // request failed: the page shows the message
    const created = results.filter((r) => r.status === 'created').length
    setSentCount((n) => n + created)
    // Keep only the rows that did not go out, each with its reason, so the person can fix them.
    const failed = filled
      .map((inv, i) => ({ inv, r: results[i] }))
      .filter(({ r }) => r && r.status !== 'created')
      .map(({ inv, r }) => ({ ...inv, message: r?.message || "That invite didn't go out." }))
    if (failed.length === 0) {
      await advanceTo(6)
      return
    }
    setInvites(failed)
  }

  async function handleBack() {
    if (currentStep > 1) {
      setLocalError(null)
      setStepErrors({})
      setCurrentStep(currentStep - 1)
    }
  }

  const hasCoFounder = invites.some((i) => i.role === 'founder' && i.email.trim())
  const invitesFailed = invites.some((i) => i.message)

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
          <span>Step {currentStep} of {TOTAL_STEPS}</span>
          <span>{Math.round((currentStep / TOTAL_STEPS) * 100)}% completed</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-neutral-200">
          <div
            className="h-full bg-brand-700 transition-all duration-300"
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-card border border-neutral-200 bg-white p-6 md:p-8 shadow-card">
        {activeError && (
          <div
            role="alert"
            className="mb-6 rounded-input border border-danger-200 bg-danger-50 p-3 text-[13px] text-danger-700"
          >
            {activeError}
          </div>
        )}

        <form onSubmit={handleNext} noValidate>
          {/* Step 1: Founder Profile */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-brand-900">First, about you</h1>
              <p className="text-sm text-neutral-500">
                Let&apos;s set up your profile and your role in the startup.
              </p>

              <div>
                <Field label="Full Name" htmlFor="onboard-name" help={null}>
                  {() => (
                    <input
                      id="onboard-name"
                      type="text"
                      value={values.full_name}
                      onChange={(e) => updateField('full_name', e.target.value)}
                      className={fieldControlClasses}
                      placeholder="Jane Doe"
                      aria-invalid={fe.full_name ? true : undefined}
                      required
                    />
                  )}
                </Field>
                <FieldError id="err-full_name" message={fe.full_name} />
              </div>

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
                    // The API stores country as an ISO code: submit the code, not the name.
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

                <div>
                  <Field label="Phone Number" htmlFor="onboard-phone" help={null}>
                    {() => (
                      <input
                        id="onboard-phone"
                        type="tel"
                        value={values.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        className={fieldControlClasses}
                        placeholder="+1 (555) 000-0000"
                        aria-invalid={fe.phone ? true : undefined}
                      />
                    )}
                  </Field>
                  <FieldError id="err-phone" message={fe.phone} />
                </div>
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

          {/* Step 2: Startup core + logo */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-brand-900">Now, your startup</h1>
              <p className="text-sm text-neutral-500">
                What is your company or venture called, and what does it do?
              </p>

              <div>
                <Field label="Startup Name" htmlFor="startup-name" help={null}>
                  {() => (
                    <input
                      id="startup-name"
                      type="text"
                      value={values.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className={fieldControlClasses}
                      placeholder="Acme Innovations"
                      aria-invalid={fe.name ? true : undefined}
                      required
                    />
                  )}
                </Field>
                <FieldError id="err-name" message={fe.name} />
              </div>

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

              <div>
                <Field label="Website (optional)" htmlFor="startup-web" help={null}>
                  {() => (
                    <input
                      id="startup-web"
                      type="text"
                      inputMode="url"
                      value={values.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      className={fieldControlClasses}
                      placeholder="https://example.com"
                      aria-invalid={fe.website ? true : undefined}
                    />
                  )}
                </Field>
                <FieldError id="err-website" message={fe.website} />
              </div>

              <div className="flex flex-col items-center justify-center rounded-input border-2 border-dashed border-neutral-300 p-6 text-center hover:bg-neutral-50">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0])
                  }}
                  className="sr-only"
                />
                <label htmlFor="logo-upload" className="cursor-pointer font-semibold text-brand-700 hover:underline">
                  {selectedFile ? selectedFile.name : 'Add your logo (optional)'}
                </label>
                <p className="mt-1 text-xs text-neutral-500">PNG, JPG, or SVG up to 5MB</p>
              </div>
            </div>
          )}

          {/* Step 3: Industry, model & stage */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <h1 className="font-display text-2xl font-bold text-brand-900">What are you building?</h1>
              <p className="text-sm text-neutral-500">
                Help us customize your workspace tools to your operating model.
              </p>

              <div>
                <Field label="Primary Industry" htmlFor="startup-ind" help={null}>
                  {() => (
                    <select
                      id="startup-ind"
                      value={industryChoice}
                      onChange={(e) => {
                        setIndustryChoice(e.target.value)
                        setStepErrors((p) => ({ ...p, industry: '' }))
                      }}
                      className={fieldControlClasses}
                      aria-invalid={fe.industry ? true : undefined}
                    >
                      <option value="">Select your industry</option>
                      {INDUSTRIES.map((i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                      <option value={OTHER_INDUSTRY}>{OTHER_INDUSTRY}</option>
                    </select>
                  )}
                </Field>
                {industryChoice === OTHER_INDUSTRY && (
                  <input
                    type="text"
                    aria-label="Your industry"
                    value={industryOther}
                    onChange={(e) => setIndustryOther(e.target.value)}
                    maxLength={80}
                    className={`${fieldControlClasses} mt-2`}
                    placeholder="Tell us your industry"
                  />
                )}
                <FieldError id="err-industry" message={fe.industry} />
              </div>

              <div role="group" aria-labelledby="model-label">
                <span id="model-label" className="mb-2 block text-xs font-semibold text-neutral-700">
                  Business Model
                </span>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {BUSINESS_MODELS.map((model) => {
                    const isSelected = values.business_model === model.id
                    return (
                      <button
                        type="button"
                        key={model.id}
                        aria-pressed={isSelected}
                        onClick={() => updateField('business_model', model.id)}
                        className={`rounded-input border p-2.5 text-center text-xs font-medium transition ${
                          isSelected
                            ? 'border-brand-700 bg-brand-50 text-brand-900 ring-2 ring-brand-700/20'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {model.label}
                      </button>
                    )
                  })}
                </div>
                <FieldError id="err-business_model" message={fe.business_model} />
              </div>

              <div role="group" aria-labelledby="stage-label">
                <span id="stage-label" className="mb-2 block text-xs font-semibold text-neutral-700">
                  Current Stage
                </span>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:grid-cols-3">
                  {STAGES.map((stg) => {
                    const isSelected = values.stage === stg.id
                    return (
                      <button
                        type="button"
                        key={stg.id}
                        aria-pressed={isSelected}
                        onClick={() => updateField('stage', stg.id)}
                        className={`rounded-input border p-3 text-left transition ${
                          isSelected
                            ? 'border-brand-700 bg-brand-50 text-brand-900 ring-2 ring-brand-700/20'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <span className="block text-sm font-semibold">{stg.label}</span>
                        <span className="mt-0.5 block text-xs text-neutral-500">{stg.sub}</span>
                      </button>
                    )
                  })}
                </div>
                <FieldError id="err-stage" message={fe.stage} />
              </div>
            </div>
          )}

          {/* Step 4: Goals */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-brand-900">What do you want to get done first?</h1>
              <p className="text-sm text-neutral-500">
                Pick up to 3. {values.goals.length}/3 chosen.
              </p>

              <div className="flex flex-wrap gap-2 pt-2" role="group" aria-label="Goals">
                {GOAL_OPTIONS.map((g) => {
                  const isChecked = values.goals.includes(g)
                  const atLimit = !isChecked && values.goals.length >= 3
                  return (
                    <button
                      type="button"
                      key={g}
                      aria-pressed={isChecked}
                      disabled={atLimit}
                      onClick={() => toggleGoal(g)}
                      className={`rounded-pill border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        isChecked
                          ? 'border-brand-700 bg-brand-50 text-brand-900 font-semibold'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {g}
                    </button>
                  )
                })}
              </div>
              <FieldError id="err-goals" message={fe.goals} />

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

          {/* Step 5: Invite your team */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-brand-900">Who is building this with you?</h1>
              <p className="text-sm text-neutral-500">
                Add co-founders, early advisors, or team members. You can always do this later.
              </p>

              <OnboardingAiPanel aiPanel={currentAiPanel} />

              {sentCount > 0 && (
                <p role="status" className="rounded-input bg-brand-50 p-3 text-[13px] text-brand-800">
                  {sentCount} {sentCount === 1 ? 'invite' : 'invites'} sent.
                  {invitesFailed ? ' Fix the rest below, or skip them.' : ''}
                </p>
              )}

              <div className="space-y-3">
                {invites.map((inv, idx) => (
                  <div key={idx}>
                    <div className="flex flex-col gap-2 md:flex-row">
                      <input
                        type="email"
                        aria-label={`Invite ${idx + 1} email`}
                        value={inv.email}
                        onChange={(e) => {
                          const next = [...invites]
                          next[idx] = { ...next[idx], email: e.target.value, message: null }
                          setInvites(next)
                        }}
                        placeholder="teammate@startup.com"
                        aria-invalid={inv.message ? true : undefined}
                        className={`${fieldControlClasses} flex-1 min-w-0`}
                      />
                      <select
                        aria-label={`Invite ${idx + 1} role`}
                        value={inv.role}
                        onChange={(e) => {
                          const next = [...invites]
                          next[idx] = { ...next[idx], role: e.target.value }
                          setInvites(next)
                        }}
                        className={`${fieldControlClasses} md:!w-44 shrink-0`}
                      >
                        {INVITE_ROLES.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {inv.message && (
                      <p role="alert" className="mt-1 text-[12px] text-danger-700">
                        {inv.message}
                      </p>
                    )}
                  </div>
                ))}

                {hasCoFounder && (
                  <p className="text-[12px] font-medium text-accent-700">{COFOUNDER_WARNING}</p>
                )}

                <button
                  type="button"
                  onClick={() => setInvites([...invites, { email: '', role: 'team_member' }])}
                  className="text-xs font-semibold text-brand-700 hover:underline"
                >
                  + Add another invite
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Kickoff Assessment */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-brand-900">One last thing: your kickoff assessment</h1>
              <p className="text-sm text-neutral-500">
                About ten minutes of questions so your Health Score and roadmap start from where you really are,
                not from defaults. You can do it later from your dashboard.
              </p>
              <OnboardingAiPanel aiPanel={currentAiPanel} />
            </div>
          )}

          {/* Wizard Action Controls */}
          {currentStep < TOTAL_STEPS ? (
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-neutral-200 pt-5">
              {currentStep > 1 ? (
                <Button type="button" variant="secondary" size="md" onClick={handleBack} disabled={isSubmitting}>
                  Back
                </Button>
              ) : (
                <div />
              )}

              <div className="flex flex-wrap items-center justify-end gap-3">
                {currentStep === 5 && (
                  <button
                    type="button"
                    onClick={() => void advanceTo(6)}
                    disabled={isSubmitting}
                    className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
                  >
                    Skip &mdash; it&apos;s just me for now
                  </button>
                )}
                <Button type="submit" variant="accent" size="md" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : currentStep === 5 ? 'Send invites' : 'Continue'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-8 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-neutral-200 pt-5 md:flex-row md:items-center">
              <Button type="button" variant="secondary" size="md" onClick={handleBack} disabled={isSubmitting}>
                Back
              </Button>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <button
                  type="button"
                  onClick={() => void onComplete('dashboard')}
                  disabled={isSubmitting}
                  className="rounded-input border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                >
                  Do it later
                </button>
                <Button type="button" variant="accent" size="md" disabled={isSubmitting} onClick={() => void onComplete('assessment')}>
                  {isSubmitting ? 'Setting up...' : 'Start assessment'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
