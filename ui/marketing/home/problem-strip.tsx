import { Card, Container, SectionHeading } from '@/ui/primitives'
import { home } from '@/content/home'

export function ProblemStrip() {
  return (
    <section>
      <Container className="py-16 md:py-22">
        <SectionHeading title={home.problem.title} className="mx-auto max-w-[20ch]" />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {home.problem.cards.map((card) => (
            <Card key={card.title} className="p-8">
              <div
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-[11px] bg-green-50 text-xl text-green-600"
              >
                {card.icon}
              </div>
              <h3 className="mb-2 mt-5 text-[19px] font-bold text-sage-900">{card.title}</h3>
              <p className="text-[15px] leading-relaxed text-sage-700">{card.body}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}
