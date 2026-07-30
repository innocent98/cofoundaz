import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { ContactForm } from './contact-form'
import { contact } from '@/content/contact'

describe('ContactForm', () => {
  it('gives every control a real label, not a placeholder', () => {
    render(<ContactForm />)
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Topic')).toBeInTheDocument()
    expect(screen.getByLabelText('Message')).toBeInTheDocument()
  })

  it('offers the four PRD topics', () => {
    render(<ContactForm />)
    const select = screen.getByLabelText('Topic')
    for (const option of contact.fields.topic.options) {
      expect(within(select).getByRole('option', { name: option })).toBeInTheDocument()
    }
  })

  it('swaps the form for the success panel on submit', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await user.type(screen.getByLabelText('Name'), 'Amara Nwosu')
    await user.type(screen.getByLabelText('Email'), 'amara@kolo.africa')
    await user.type(screen.getByLabelText('Message'), 'Hello')
    await user.click(screen.getByRole('button', { name: contact.submit }))

    expect(screen.getByText(contact.success)).toBeInTheDocument()
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
  })

  it('announces success as a status region', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await user.type(screen.getByLabelText('Name'), 'Amara Nwosu')
    await user.type(screen.getByLabelText('Email'), 'amara@kolo.africa')
    await user.type(screen.getByLabelText('Message'), 'Hello')
    await user.click(screen.getByRole('button', { name: contact.submit }))
    expect(screen.getByRole('status')).toHaveTextContent(contact.success)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<ContactForm />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
