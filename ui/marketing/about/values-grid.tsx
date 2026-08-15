import { Card, Container, SectionHeading } from '@/ui/primitives'
import { about } from '@/content/about'

export function ValuesGrid() {
  return (
    <section className="bg-white">
      <Container width="narrow" className="py-16 md:py-18">
        <SectionHeading title={about.valuesTitle} className="mb-10" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {about.values.map((value) => (
            <Card key={value.title} className="p-7">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-card bg-green-100 font-display text-sm font-bold text-green-700"
              >
                {value.number}
              </span>
              <h3 className="mt-4 text-[19px] font-bold text-green-900">{value.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-sage-700">{value.body}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}
