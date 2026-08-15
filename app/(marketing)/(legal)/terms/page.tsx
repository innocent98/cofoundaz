import type { Metadata } from 'next'
import { LegalDocumentView } from '@/ui/marketing/legal-document'
import { legalDocuments } from '@/content/legal'

const doc = legalDocuments.terms

export const metadata: Metadata = {
  title: doc.title,
  description: doc.intro,
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return <LegalDocumentView doc={doc} />
}
