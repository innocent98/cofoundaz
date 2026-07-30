import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { FaqAccordion } from './faq-accordion'
import { pricing } from '@/content/pricing'

describe('FaqAccordion', () => {
  it('renders a button per question', () => {
    render(<FaqAccordion />)
    for (const item of pricing.faq) {
      expect(screen.getByRole('button', { name: new RegExp(item.question) })).toBeInTheDocument()
    }
  })

  it('opens the first item by default, matching the comp', () => {
    render(<FaqAccordion />)
    const first = screen.getByRole('button', { name: new RegExp(pricing.faq[0].question) })
    expect(first).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(pricing.faq[0].answer)).toBeVisible()
  })

  it('opens one item at a time', async () => {
    const user = userEvent.setup()
    render(<FaqAccordion />)
    await user.click(screen.getByRole('button', { name: new RegExp(pricing.faq[1].question) }))
    expect(screen.getByRole('button', { name: new RegExp(pricing.faq[1].question) })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: new RegExp(pricing.faq[0].question) })).toHaveAttribute('aria-expanded', 'false')
  })

  it('collapses an open item when clicked again', async () => {
    const user = userEvent.setup()
    render(<FaqAccordion />)
    const first = screen.getByRole('button', { name: new RegExp(pricing.faq[0].question) })
    await user.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText(pricing.faq[0].answer)).not.toBeVisible()
  })

  it('associates each panel with its trigger', () => {
    render(<FaqAccordion />)
    const first = screen.getByRole('button', { name: new RegExp(pricing.faq[0].question) })
    const panelId = first.getAttribute('aria-controls')
    expect(panelId).toBeTruthy()
    expect(document.getElementById(panelId!)).toHaveAttribute('role', 'region')
  })

  it('keeps aria-controls resolvable on a closed item, hiding its panel instead of unmounting it', () => {
    render(<FaqAccordion />)
    // Every item is closed except index 0 by default; pick one that starts closed.
    const closedTrigger = screen.getByRole('button', { name: new RegExp(pricing.faq[1].question) })
    expect(closedTrigger).toHaveAttribute('aria-expanded', 'false')
    const panelId = closedTrigger.getAttribute('aria-controls')
    expect(panelId).toBeTruthy()
    const panel = document.getElementById(panelId!)
    expect(panel).not.toBeNull()
    expect(panel).toHaveAttribute('role', 'region')
    expect(panel).not.toBeVisible()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<FaqAccordion />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
