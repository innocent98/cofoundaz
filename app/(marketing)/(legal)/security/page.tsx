import type { Metadata } from 'next'
import { LegalDocumentView } from '@/ui/marketing/legal-document'
import { legalDocuments } from '@/content/legal'

const doc = legalDocuments.security

export const metadata: Metadata = {
  title: doc.title,
  description: doc.intro,
  alternates: { canonical: '/security' },
}

export default function SecurityPage() {
  return <LegalDocumentView doc={doc} />
}
