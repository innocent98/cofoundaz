import type { Metadata } from 'next'
import { LegalDocumentView } from '@/ui/marketing/legal-document'
import { legalDocuments } from '@/content/legal'

const doc = legalDocuments.privacy

export const metadata: Metadata = {
  title: doc.title,
  description: doc.intro,
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return <LegalDocumentView doc={doc} />
}
