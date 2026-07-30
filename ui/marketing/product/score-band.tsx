import { Container, SectionHeading } from '@/ui/primitives'
import { product } from '@/content/product'

export function ScoreBand() {
  const { eyebrow, title, body, cards } = product.scoreBand
  return (
    <section className="bg-green-950">
      <Container width="narrow" className="py-16 text-center md:py-22">
        <SectionHeading tone="dark" eyebrow={eyebrow} title={title} />
        <p className="mx-auto mt-4.5 max-w-[58ch] text-base leading-relaxed text-green-200 md:text-[17px]">
          {body}
        </p>
        <div className="mt-12 grid grid-cols-1 gap-5 text-left md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="rounded-card border border-green-700 bg-green-900 p-6.5">
              <div className="text-base font-bold text-white">{card.title}</div>
              <p className="mt-2 text-sm leading-[1.55] text-green-200">{card.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
