import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Field, fieldControlClasses } from './field'

describe('Field', () => {
  it('associates the label with the control via htmlFor/id', () => {
    render(
      <Field label="Name" htmlFor="test-name">
        {(describedById) => (
          <input id="test-name" className={fieldControlClasses} aria-describedby={describedById} />
        )}
      </Field>
    )
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })

  it('wires aria-describedby to the element that actually renders the help text when help is set', () => {
    render(
      <Field label="Name" htmlFor="test-name" help="We never share this.">
        {(describedById) => (
          <input id="test-name" className={fieldControlClasses} aria-describedby={describedById} />
        )}
      </Field>
    )
    const control = screen.getByLabelText('Name')
    const describedById = control.getAttribute('aria-describedby')
    expect(describedById).toBeTruthy()

    const describer = document.getElementById(describedById as string)
    expect(describer).not.toBeNull()
    expect(describer).toHaveTextContent('We never share this.')
  })

  it('emits no aria-describedby when help is omitted', () => {
    render(
      <Field label="Name" htmlFor="test-name">
        {(describedById) => (
          <input id="test-name" className={fieldControlClasses} aria-describedby={describedById} />
        )}
      </Field>
    )
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-describedby')
  })

  it('emits no aria-describedby when help is explicitly null', () => {
    render(
      <Field label="Name" htmlFor="test-name" help={null}>
        {(describedById) => (
          <input id="test-name" className={fieldControlClasses} aria-describedby={describedById} />
        )}
      </Field>
    )
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-describedby')
  })
})
