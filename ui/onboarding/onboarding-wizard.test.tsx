import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { OnboardingWizard } from './onboarding-wizard'

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