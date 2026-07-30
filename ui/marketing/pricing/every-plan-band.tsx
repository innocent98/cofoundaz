import { Container } from '@/ui/primitives'
import { pricing } from '@/content/pricing'

export function EveryPlanBand() {
  return (
    <section className="bg-green-900">
      <Container className="py-16 md:py-20">
        <h2 className="text-center font-display text-[26px] font-semibold text-white md:text-[32px]">
          {pricing.everyPlan.title}
        </h2>
        <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {pricing.everyPlan.items.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm leading-[1.5] text-green-100">
              <span aria-hidden="true" className="flex-none font-bold text-brass-500">
                ✓
              </span>
              <span className="sr-only">Included: </span>
              {item}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
