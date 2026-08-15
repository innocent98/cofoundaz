import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { LegalDocumentView } from './legal-document'
import { legalDocuments } from '@/content/legal'

const doc = legalDocuments.terms

describe('LegalDocumentView', () => {
  it('renders the title as the single h1', () => {
    render(<LegalDocumentView doc={doc} />)
    expect(screen.getByRole('heading', { level: 1, name: doc.title })).toBeInTheDocument()
  })

  it('shows the last-updated stamp', () => {
    render(<LegalDocumentView doc={doc} />)
    expect(screen.getByText(`Last updated: ${doc.updated}`)).toBeInTheDocument()
  })

  it('renders every section as an h2 with its body', () => {
    render(<LegalDocumentView doc={doc} />)
    for (const section of doc.sections) {
      expect(screen.getByRole('heading', { level: 2, name: section.heading })).toBeInTheDocument()
      expect(screen.getByText(section.body)).toBeInTheDocument()
    }
  })

  it('offers a back-home link', () => {
    render(<LegalDocumentView doc={doc} />)
    expect(screen.getByRole('link', { name: /Back home/ })).toHaveAttribute('href', '/')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<LegalDocumentView doc={doc} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
