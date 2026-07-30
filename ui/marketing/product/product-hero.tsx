import { Button, Container, SectionHeading } from '@/ui/primitives'
import { product } from '@/content/product'

export function ProductHero() {
  const { eyebrow, title, subtitle, primaryCta, secondaryCta, stats } = product.hero
  return (
    <section className="bg-green-900">
      <Container className="py-16 text-center md:py-20">
        <SectionHeading as="h1" tone="dark" eyebrow={eyebrow} title={title} className="mx-auto max-w-[18ch]" />
        <p className="mx-auto mt-5 max-w-[62ch] text-base leading-relaxed text-green-200 md:text-[19px]">
          {subtitle}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3.5 md:flex-row">
          <Button href={primaryCta.href} variant="accent" size="lg">{primaryCta.label}</Button>
          <Button href={secondaryCta.href} variant="onDark" size="lg">{secondaryCta.label}</Button>
        </div>
        <dl className="mt-13 flex flex-wrap justify-center gap-10 md:gap-14">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dd>
                <span className="block font-display text-[34px] font-bold text-white">{stat.value}</span>
                <span className="mt-0.5 block text-[13px] text-green-300">{stat.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}
