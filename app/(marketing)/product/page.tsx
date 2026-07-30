import type { Metadata } from 'next'
import { Container } from '@/ui/primitives'
import { ProductHero } from '@/ui/marketing/product/product-hero'
import { ScrollSpyNav } from '@/ui/marketing/product/scroll-spy-nav'
import { HubSection } from '@/ui/marketing/product/hub-section'
import { ScoreBand } from '@/ui/marketing/product/score-band'
import { CtaBand } from '@/ui/marketing/home/cta-band'
import { product } from '@/content/product'

export const metadata: Metadata = {
  title: 'Product',
  description: product.hero.subtitle,
  alternates: { canonical: '/product' },
}

export default function ProductPage() {
  return (
    <>
      <ProductHero />
      <ScrollSpyNav />
      <Container width="narrow" className="pb-6 pt-2">
        {product.hubGroups.map((group, index) => (
          <HubSection key={group.anchor} group={group} index={index} />
        ))}
      </Container>
      <ScoreBand />
      <CtaBand
        tone="light"
        title={product.finalCta.title}
        ctaLabel={product.finalCta.cta.label}
        ctaHref={product.finalCta.cta.href}
        subtitle={product.finalCta.subtitle}
      />
    </>
  )
}
