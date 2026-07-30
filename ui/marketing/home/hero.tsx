import { Badge, Button, Container } from '@/ui/primitives'
import { ProductShot } from '@/ui/mocks/product-shot'
import { home } from '@/content/home'

export function Hero() {
  const { badge, title, subtitle, primaryCta, secondaryCta, trustLine } = home.hero
  return (
    <section className="border-b border-green-100 bg-green-50">
      <Container className="grid grid-cols-1 items-center gap-12 py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
        <div className="animate-[fade-up_0.6s_ease-out_both]">
          <Badge>
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brass-600" />
            {badge}
          </Badge>
          <h1 className="mt-5 font-display text-[38px] font-semibold leading-[1.02] tracking-[-0.02em] text-balance text-green-900 md:text-5xl lg:text-[60px]">
            {title}
          </h1>
          <p className="mt-5 max-w-[34ch] text-base leading-[1.55] text-sage-700 md:text-[19px]">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3.5 md:flex-row md:items-center">
            <Button href={primaryCta.href} variant="accent" size="lg" className="shadow-accent">
              {primaryCta.label}
            </Button>
            <Button href={secondaryCta.href} variant="secondary" size="lg">
              {secondaryCta.label}
            </Button>
          </div>
          <p className="mt-4.5 text-sm italic text-sage-500">{trustLine}</p>
        </div>

        <div className="animate-[fade-up_0.7s_0.12s_ease-out_both]">
          <ProductShot />
        </div>
      </Container>
    </section>
  )
}
