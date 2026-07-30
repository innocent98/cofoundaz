import { Container } from '@/ui/primitives'
import { about } from '@/content/about'

export function WhySection() {
  return (
    <section>
      <Container className="grid grid-cols-1 gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 md:py-18">
        <div>
          <h2 className="font-display text-[28px] font-semibold text-balance text-green-900 md:text-[34px]">
            {about.why.title}
          </h2>
          {about.why.paragraphs.map((paragraph, index) => (
            <p key={index} className="mt-4 text-base leading-relaxed text-sage-700 md:text-[17px]">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 rounded-card bg-green-900 p-8 md:grid-cols-3 lg:grid-cols-1">
          {about.stats.map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-[38px] font-semibold text-white">{stat.value}</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-green-300">{stat.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
