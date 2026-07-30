import type { Metadata } from 'next'
import { Container, SectionHeading } from '@/ui/primitives'
import { PricingCard } from '@/ui/marketing/pricing/pricing-card'
import { ComparisonMatrix } from '@/ui/marketing/pricing/comparison-matrix'
import { FaqAccordion } from '@/ui/marketing/pricing/faq-accordion'
import { CreditPanel } from '@/ui/marketing/pricing/credit-panel'
import { WordmarkRow } from '@/ui/marketing/pricing/wordmark-row'
import { EveryPlanBand } from '@/ui/marketing/pricing/every-plan-band'
import { CtaBand } from '@/ui/marketing/home/cta-band'
import { pricing } from '@/content/pricing'
import { JsonLd, faqPageJsonLd } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Pricing',
  description: pricing.hero.subtitle,
  alternates: { canonical: '/pricing' },
}

export default function PricingPage() {
  return (
    <>
      <JsonLd data={faqPageJsonLd()} />
      <Container className="pb-6 pt-16 text-center">
        <SectionHeading as="h1" eyebrow={pricing.hero.eyebrow} title={pricing.hero.title} subtitle={pricing.hero.subtitle} className="[&_p]:max-w-[52ch]" />
        <ul className="mt-5 flex flex-wrap justify-center gap-5 text-[13.5px] text-sage-500">
          {pricing.hero.ticks.map((tick) => (
            <li key={tick}>
              <span aria-hidden="true">✓ </span>
              {tick}
            </li>
          ))}
        </ul>
      </Container>

      {/* Growth first at base width so the recommended plan is not buried below the fold. */}
      <Container width="narrow" className="grid grid-cols-1 items-start gap-5.5 py-6 lg:grid-cols-3">
        {/* Visually-hidden section heading: PricingCard's plan name is an h3
            (the responsive sweep's "Growth is the first pricing card" test
            locates plan cards by h3), so without an intervening h2 the page
            jumped h1 -> h3, which Lighthouse's heading-order audit flags.
            sr-only keeps the visual design (no comp'd heading here) intact. */}
        <h2 className="sr-only">Plans</h2>
        <div className="order-2 lg:order-1"><PricingCard plan={pricing.plans[0]} /></div>
        <div className="order-1 lg:order-2"><PricingCard plan={pricing.plans[1]} /></div>
        <div className="order-3"><PricingCard plan={pricing.plans[2]} /></div>
      </Container>

      <Container width="narrow" className="pb-14">
        {/* text-green-900, not text-brass-700 — brass-700 on this bg-brass-100
            banner only clears 4.16:1 (needs 4.5:1). green-900 on brass-100
            matches the Badge accent-tone pattern and clears 13.32:1. */}
        <p className="rounded-card border border-brass-200 bg-brass-100 px-6 py-5 text-center text-[15px] font-semibold text-green-900">
          {pricing.addOnsBanner}
        </p>
      </Container>

      <EveryPlanBand />

      <Container width="prose" className="max-w-[1080px] pt-18">
        <SectionHeading title={pricing.matrixTitle} className="mb-8" />
        <ComparisonMatrix />
      </Container>

      <CreditPanel />
      <WordmarkRow />

      <Container width="prose" className="pb-24 pt-12">
        <SectionHeading title={pricing.faqTitle} className="mb-7" />
        <FaqAccordion />
      </Container>

      <CtaBand
        title={pricing.finalCta.title}
        ctaLabel={pricing.finalCta.cta.label}
        ctaHref={pricing.finalCta.cta.href}
      />
    </>
  )
}
