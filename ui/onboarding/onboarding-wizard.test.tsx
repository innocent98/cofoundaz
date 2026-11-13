import { render, screen, fireEvent, act } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { OnboardingWizard, OnboardingAiPanel } from './onboarding-wizard'

vi.mock('@/lib/api/onboarding', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/onboarding')>()
  return {
    ...actual,
    getOnboardingState: vi.fn().mockResolvedValue({ step: 1, ai_panel: null }),
  }
})

vi.setConfig({ testTimeout: 30000 })

describe('OnboardingWizard Step 1', () => {
  it('renders the step 1 headline and labels', () => {
    render(
      <OnboardingWizard
        onSaveStep={vi.fn()}
        onComplete={vi.fn()}
      />
    )
    expect(screen.getByRole('heading', { level: 1, name: 'First, about you' })).toBeInTheDocument()
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Role or Title')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  })

  it('validates full name before allowing progress', async () => {
    const onSaveStep = vi.fn()
    render(
      <OnboardingWizard
        onSaveStep={onSaveStep}
        onComplete={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Please enter your full name.')
    expect(onSaveStep).not.toHaveBeenCalled()
  })

  it('calls onSaveStep with next step number when valid', async () => {
    const onSaveStep = vi.fn().mockResolvedValue(undefined)
    render(
      <OnboardingWizard
        onSaveStep={onSaveStep}
        onComplete={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Jane Doe' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(onSaveStep).toHaveBeenCalledWith(2, expect.objectContaining({
      step: 2,
      full_name: 'Jane Doe',
    }))
  })

  it('has no accessibility violations on initial render', async () => {
    const { container } = render(
      <OnboardingWizard
        onSaveStep={vi.fn()}
        onComplete={vi.fn()}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('OnboardingAiPanel & ai_panel integration', () => {
  it('renders nothing when ai_panel is null or whitespace', () => {
    const { container } = render(<OnboardingAiPanel aiPanel={null} />)
    expect(container.firstChild).toBeNull()

    const { container: emptyContainer } = render(<OnboardingAiPanel aiPanel="   " />)
    expect(emptyContainer.firstChild).toBeNull()
  })

  it('renders opaque prose block with freeform text when ai_panel is provided', () => {
    const welcomeMessage = 'Welcome to Cofaundaz! Based on your B2B model in FinTech, I have calibrated your initial 90-day execution roadmap.'
    render(<OnboardingAiPanel aiPanel={welcomeMessage} />)

    const panel = screen.getByTestId('onboarding-ai-panel')
    expect(panel).toBeInTheDocument()
    expect(screen.getByText('AI Co-Founder Calibration')).toBeInTheDocument()
    expect(screen.getByText(welcomeMessage)).toBeInTheDocument()
  })

  it('renders ai_panel on the review/completion step (step 6) without blocking completion', async () => {
    const aiText = 'Your AI Co-Founder is ready to accelerate your venture.'
    const onComplete = vi.fn().mockResolvedValue(undefined)

    await act(async () => {
      render(
        <OnboardingWizard
          initialValues={{ step: 6, ai_panel: aiText }}
          onSaveStep={vi.fn()}
          onComplete={onComplete}
        />
      )
    })

    expect(screen.getByTestId('onboarding-ai-panel')).toHaveTextContent(aiText)
    const completeBtn = screen.getByRole('button', { name: 'Start assessment' })
    expect(completeBtn).toBeEnabled()

    await act(async () => {
      fireEvent.click(completeBtn)
    })
    expect(onComplete).toHaveBeenCalledWith('assessment')
  })

  it('gracefully renders nothing for ai_panel when null on step 6 and does not block flow', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined)

    await act(async () => {
      render(
        <OnboardingWizard
          initialValues={{ step: 6, ai_panel: null }}
          onSaveStep={vi.fn()}
          onComplete={onComplete}
        />
      )
    })

    expect(screen.queryByTestId('onboarding-ai-panel')).not.toBeInTheDocument()
    const completeBtn = screen.getByRole('button', { name: 'Start assessment' })
    expect(completeBtn).toBeEnabled()

    await act(async () => {
      fireEvent.click(completeBtn)
    })
    expect(onComplete).toHaveBeenCalledWith('assessment')
  })
})
describe('OnboardingWizard PRD flow (steps 3 to 6)', () => {
  it('step 3 will not continue until industry, model and stage are chosen', async () => {
    const onSaveStep = vi.fn().mockResolvedValue(undefined)
    render(<OnboardingWizard initialValues={{ step: 3 }} onSaveStep={onSaveStep} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText('Pick your industry.')).toBeInTheDocument()
    expect(screen.getByText('Pick your business model.')).toBeInTheDocument()
    expect(screen.getByText('Pick your stage.')).toBeInTheDocument()
    expect(onSaveStep).not.toHaveBeenCalled()
  })

  it('offers the 26 approved industries plus Other, with a free-text field for Other', () => {
    render(<OnboardingWizard initialValues={{ step: 3 }} onSaveStep={vi.fn()} onComplete={vi.fn()} />)
    const select = screen.getByLabelText('Primary Industry') as HTMLSelectElement
    expect(select.options.length).toBe(1 + 25 + 1) // placeholder + 25 labels + Other
    fireEvent.change(select, { target: { value: 'Other' } })
    expect(screen.getByLabelText('Your industry')).toBeInTheDocument()
  })

  it('shows the six stage cards with their sublabels', () => {
    render(<OnboardingWizard initialValues={{ step: 3 }} onSaveStep={vi.fn()} onComplete={vi.fn()} />)
    expect(screen.getByText("It's in my head or on paper")).toBeInTheDocument()
    expect(screen.getByText("I'm expanding what already works")).toBeInTheDocument()
  })

  it('stays on the step when the save fails', async () => {
    const onSaveStep = vi.fn().mockResolvedValue(null)
    render(<OnboardingWizard initialValues={{ step: 1, full_name: 'Jane' }} onSaveStep={onSaveStep} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await act(async () => {})
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument()
  })

  it('limits goals to three chips', () => {
    render(<OnboardingWizard initialValues={{ step: 4, goals: ['Validate my idea', 'Build my MVP', 'Raise funding'] }} onSaveStep={vi.fn()} onComplete={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Grow revenue' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Validate my idea' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('invite step: no Investor, Co-Founder warning, per-row failure, skip', async () => {
    const onSendInvites = vi.fn().mockResolvedValue([
      { email: 'nope', status: 'invalid', message: "That doesn't look like an email address." },
    ])
    render(<OnboardingWizard initialValues={{ step: 5 }} onSaveStep={vi.fn().mockResolvedValue({})} onSendInvites={onSendInvites} onComplete={vi.fn()} />)
    const role = screen.getByLabelText('Invite 1 role') as HTMLSelectElement
    expect(Array.from(role.options).map((o) => o.text)).not.toContain('Investor')
    fireEvent.change(screen.getByLabelText('Invite 1 email'), { target: { value: 'nope' } })
    fireEvent.change(role, { target: { value: 'founder' } })
    expect(screen.getByText('Co-Founders have full access, including billing.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Send invites' }))
    expect(await screen.findByText("That doesn't look like an email address.")).toBeInTheDocument()
    expect(screen.getByText('Step 5 of 6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Skip/ })).toBeInTheDocument()
  })

  it('skip moves on to the assessment step; Do it later completes to the dashboard', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined)
    render(<OnboardingWizard initialValues={{ step: 5 }} onSaveStep={vi.fn().mockResolvedValue({})} onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('button', { name: /Skip/ }))
    expect(await screen.findByText('Step 6 of 6')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Do it later' }))
    expect(onComplete).toHaveBeenCalledWith('dashboard')
  })

  it('step 2 refuses a non-http website before saving', async () => {
    const onSaveStep = vi.fn().mockResolvedValue({})
    render(<OnboardingWizard initialValues={{ step: 2, name: 'Acme' }} onSaveStep={onSaveStep} onComplete={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Website (optional)'), { target: { value: 'javascript:void(0)' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText('Enter a web address starting with http or https.')).toBeInTheDocument()
    expect(onSaveStep).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Website (optional)'), { target: { value: 'acme.example' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await act(async () => {})
    expect(onSaveStep).toHaveBeenCalled()
  })

  it('step 2 stays put when the logo is rejected, and the hint states the real 2 MB limit', async () => {
    const onSaveStep = vi.fn().mockResolvedValue({})
    const onUploadLogo = vi.fn().mockResolvedValue(false)
    render(
      <OnboardingWizard
        initialValues={{ step: 2, name: 'Acme' }}
        onSaveStep={onSaveStep}
        onUploadLogo={onUploadLogo}
        onComplete={vi.fn()}
      />
    )
    expect(screen.getByText(/up to 2 MB/)).toBeInTheDocument()
    const file = new File(['x'], 'notes.txt', { type: 'text/plain' })
    fireEvent.change(document.getElementById('logo-upload') as HTMLInputElement, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await act(async () => {})
    expect(onUploadLogo).toHaveBeenCalledWith(file)
    expect(onSaveStep).not.toHaveBeenCalled()
  })
})
