'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, Field, fieldControlClasses } from '@/ui/primitives'
import { contact } from '@/content/contact'

export function ContactForm() {
  const [sent, setSent] = useState(false)
  const successRef = useRef<HTMLDivElement>(null)

  // Submitting unmounts the focused submit button, which drops focus to
  // <body> — a keyboard or screen-reader user loses their place entirely.
  // Move focus onto the success panel instead (tabIndex -1 makes it a valid,
  // non-tabbable focus target).
  useEffect(() => {
    if (sent) successRef.current?.focus()
  }, [sent])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // TODO(marketing-backend): POST to /api/v1/marketing/contact once the
    // FastAPI marketing domain exists. Deliberately unwired for this phase —
    // see spec §3 "Explicitly out of scope".
    setSent(true)
  }

  if (sent) {
    return (
      <div
        ref={successRef}
        role="status"
        tabIndex={-1}
        className="mt-9 rounded-card border border-green-200 bg-green-100 p-8 text-center"
      >
        <span
          aria-hidden="true"
          className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-[22px] text-white"
        >
          ✓
        </span>
        <p className="text-[17px] font-semibold text-green-900">{contact.success}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-9 flex flex-col gap-4.5">
      <Field label={contact.fields.name.label} htmlFor="contact-name">
        {(describedById) => (
          <input
            id="contact-name"
            name="name"
            required
            aria-describedby={describedById}
            className={fieldControlClasses}
            placeholder={contact.fields.name.placeholder}
          />
        )}
      </Field>

      <Field label={contact.fields.email.label} htmlFor="contact-email">
        {(describedById) => (
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            aria-describedby={describedById}
            className={fieldControlClasses}
            placeholder={contact.fields.email.placeholder}
          />
        )}
      </Field>

      <Field label={contact.fields.topic.label} htmlFor="contact-topic">
        {(describedById) => (
          <select
            id="contact-topic"
            name="topic"
            aria-describedby={describedById}
            className={fieldControlClasses}
            defaultValue={contact.fields.topic.options[0]}
          >
            {contact.fields.topic.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field label={contact.fields.message.label} htmlFor="contact-message">
        {(describedById) => (
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            required
            aria-describedby={describedById}
            className={`${fieldControlClasses} resize-y`}
            placeholder={contact.fields.message.placeholder}
          />
        )}
      </Field>

      <Button type="submit" variant="accent" size="md" className="w-full">
        {contact.submit}
      </Button>
    </form>
  )
}
