import { Container, SectionHeading } from '@/ui/primitives'
import { home } from '@/content/home'

export function HowItWorks() {
  const { eyebrow, title, steps } = home.howItWorks
  return (
    <section id="how" className="bg-green-900 scroll-mt-[72px]">
      <Container className="py-16 md:py-22">
        <SectionHeading tone="dark" eyebrow={eyebrow} title={title} />
        <div className="mt-13 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="rounded-[14px] border border-green-700 bg-green-800 p-8">
              <div
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-copper-500 font-display text-xl font-bold text-green-900"
              >
                {step.number}
              </div>
              <h3 className="mb-2 mt-5 text-xl font-bold text-white">{step.title}</h3>
              <p className="text-[15px] leading-relaxed text-green-200">{step.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
