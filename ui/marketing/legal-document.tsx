import Link from 'next/link'
import { Container } from '@/ui/primitives'
import { legalBackLink } from '@/content/legal'
import type { LegalDocument } from '@/content/types'

export function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  return (
    <Container width="prose" className="pb-24 pt-16">
      <Link href={legalBackLink.href} className="text-[13px] font-semibold text-sage-500 hover:text-green-700">
        {legalBackLink.label}
      </Link>

      <h1 className="mt-5 font-display text-[32px] font-semibold text-green-900 md:text-[40px]">
        {doc.title}
      </h1>
      <p className="mt-2.5 text-[13px] text-sage-500">Last updated: {doc.updated}</p>

      <hr className="my-7 border-green-100" />

      <p className="text-base leading-[1.7] text-sage-700">{doc.intro}</p>

      <div className="mt-8 flex flex-col gap-7">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-2.5 text-[19px] font-bold text-sage-900">{section.heading}</h2>
            <p className="text-[15px] leading-[1.7] text-sage-700">{section.body}</p>
          </section>
        ))}
      </div>
    </Container>
  )
}
