import type { Metadata } from 'next'
import { Hero } from '@/ui/marketing/home/hero'
import { ProblemStrip } from '@/ui/marketing/home/problem-strip'
import { HowItWorks } from '@/ui/marketing/home/how-it-works'
import { FeatureGrid } from '@/ui/marketing/home/feature-grid'
import { TestimonialCarousel } from '@/ui/marketing/home/testimonial-carousel'
import { SecurityStrip } from '@/ui/marketing/home/security-strip'
import { CtaBand } from '@/ui/marketing/home/cta-band'
import { home } from '@/content/home'

export const metadata: Metadata = {
  description: home.hero.subtitle,
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemStrip />
      <HowItWorks />
      <FeatureGrid />
      <TestimonialCarousel />
      <SecurityStrip />
      <CtaBand
        title={home.finalCta.title}
        ctaLabel={home.finalCta.cta.label}
        ctaHref={home.finalCta.cta.href}
        subtitle={home.finalCta.subtitle}
      />
    </>
  )
}
