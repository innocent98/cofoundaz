import { Container } from '@/ui/primitives'
import { pricing } from '@/content/pricing'

export function CreditPanel() {
  return (
    <section>
      <Container className="py-16 md:py-20">
        <div className="grid grid-cols-1 items-start gap-10 rounded-modal bg-green-50 p-8 md:p-13 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 className="mb-3 font-display text-[26px] font-semibold text-green-900 md:text-[32px]">
              {pricing.credits.title}
            </h2>
            <p className="max-w-[44ch] text-base leading-relaxed text-sage-700">
              {pricing.credits.body}
            </p>
          </div>
          <div className="flex flex-col gap-3.5">
            {pricing.credits.examples.map((example) => (
              <div
                key={example.label}
                className="flex items-center justify-between gap-4 rounded-[10px] border border-green-100 bg-white p-4"
              >
                <span className="text-sm text-sage-900">{example.label}</span>
                <span className="flex-none text-sm font-semibold text-green-700">{example.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
