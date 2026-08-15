import type { Metadata } from 'next'
import { LegalDocumentView } from '@/ui/marketing/legal-document'
import { legalDocuments } from '@/content/legal'

const doc = legalDocuments.cookies

export const metadata: Metadata = {
  title: doc.title,
  description: doc.intro,
  alternates: { canonical: '/cookies' },
}

export default function CookiesPage() {
  return <LegalDocumentView doc={doc} />
}
