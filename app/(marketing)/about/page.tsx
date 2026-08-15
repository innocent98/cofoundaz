import type { Metadata } from 'next'
import { Button, Container, SectionHeading } from '@/ui/primitives'
import { WhySection } from '@/ui/marketing/about/why-section'
import { StoryTimeline } from '@/ui/marketing/about/story-timeline'
import { ValuesGrid } from '@/ui/marketing/about/values-grid'
import { TeamGrid } from '@/ui/marketing/about/team-grid'
import { about } from '@/content/about'

export const metadata: Metadata = {
  title: 'About',
  description: about.hero.subtitle,
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <>
      <Container width="prose" className="max-w-[900px] pb-8 pt-16 text-center">
        <SectionHeading
          as="h1"
          eyebrow={about.hero.eyebrow}
          title={about.hero.title}
          subtitle={about.hero.subtitle}
          className="[&_p]:max-w-[58ch]"
        />
      </Container>

      <WhySection />

      <section className="bg-green-950">
        <Container width="prose" className="max-w-[820px] py-16 text-center">
          <p className="font-display text-xl italic leading-[1.45] text-balance text-white md:text-[28px]">
            {about.missionQuote}
          </p>
        </Container>
      </section>

      <StoryTimeline />
      <ValuesGrid />
      <TeamGrid />

      <Container className="pt-16 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-sage-500">
          {about.backers.title}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-10 opacity-72">
          {about.backers.names.map((name) => (
            <span key={name} className="font-display text-xl font-semibold text-sage-700">
              {name}
            </span>
          ))}
        </div>
      </Container>

      <Container className="py-18 text-center">
        <h2 className="font-display text-[28px] font-semibold text-balance text-green-900 md:text-4xl">
          {about.finalCta.title}
        </h2>
        <div className="mt-6 flex flex-col justify-center gap-3.5 md:flex-row">
          <Button href={about.finalCta.primaryCta.href} variant="accent" size="lg">
            {about.finalCta.primaryCta.label}
          </Button>
          <Button href={about.finalCta.secondaryCta.href} variant="secondary" size="lg">
            {about.finalCta.secondaryCta.label}
          </Button>
        </div>
      </Container>
    </>
  )
}
