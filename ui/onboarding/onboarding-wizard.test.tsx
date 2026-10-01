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
    expect(screen.getByRole('heading', { level: 1, name: 'Tell us about yourself' })).toBeInTheDocument()
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
    const completeBtn = screen.getByRole('button', { name: 'Complete Setup' })
    expect(completeBtn).toBeEnabled()

    await act(async () => {
      fireEvent.click(completeBtn)
    })
    expect(onComplete).toHaveBeenCalled()
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
    const completeBtn = screen.getByRole('button', { name: 'Complete Setup' })
    expect(completeBtn).toBeEnabled()

    await act(async () => {
      fireEvent.click(completeBtn)
    })
    expect(onComplete).toHaveBeenCalled()
  })
})