import { Card, Container, SectionHeading } from '@/ui/primitives'
import { home } from '@/content/home'

export function FeatureGrid() {
  return (
    <section>
      <Container className="py-16 md:py-22">
        <SectionHeading title={home.features.title} />
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {home.features.items.map((tile) => (
            <Card
              key={tile.title}
              className="p-6 transition-all hover:-translate-y-[3px] hover:shadow-raised"
            >
              <div
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-green-100 text-lg font-bold text-green-700"
              >
                {tile.icon}
              </div>
              <h3 className="mb-1.5 mt-4 text-base font-bold text-sage-900">{tile.title}</h3>
              <p className="text-sm leading-[1.55] text-sage-500">{tile.body}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}
