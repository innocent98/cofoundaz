import { Container } from '@/ui/primitives'
import { home } from '@/content/home'

export function SecurityStrip() {
  return (
    <section>
      <Container className="py-16 md:py-20">
        <div className="grid grid-cols-1 items-center gap-10 rounded-modal border border-green-100 bg-green-50 p-8 md:p-13 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-modal bg-green-700 text-[22px] text-copper-500"
            >
              🛡
            </div>
            <h2 className="mb-3 mt-5 font-display text-[26px] font-semibold text-green-900 md:text-[32px]">
              {home.security.title}
            </h2>
            <p className="max-w-[44ch] text-base leading-relaxed text-sage-700">
              {home.security.body}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {home.security.items.map((item) => (
              <div key={item.title} className="rounded-[10px] border border-green-100 bg-white p-4">
                <div className="text-[13px] font-bold text-sage-900">{item.title}</div>
                <div className="mt-1 text-[12.5px] leading-[1.5] text-sage-500">{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
