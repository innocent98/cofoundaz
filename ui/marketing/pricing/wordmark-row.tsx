import { Container } from '@/ui/primitives'
import { pricing } from '@/content/pricing'

export function WordmarkRow() {
  return (
    <section>
      <Container className="py-14 text-center md:py-16">
        <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
          {pricing.wordmarks.title}
        </h2>
        <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {pricing.wordmarks.names.map((name) => (
            <li key={name} className="font-display text-xl font-semibold text-neutral-700 opacity-72">
              {name}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
