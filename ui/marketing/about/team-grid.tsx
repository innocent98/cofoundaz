import { Button, Card, Container, SectionHeading } from '@/ui/primitives'
import { about } from '@/content/about'

export function TeamGrid() {
  return (
    <section className="bg-green-50">
      <Container className="py-16 md:py-18">
        <SectionHeading title={about.teamTitle} className="mb-10" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {about.team.map((member) => (
            <Card key={member.name} className="flex flex-col items-center p-7 text-center">
              <span
                aria-hidden="true"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 font-display text-base font-bold text-white"
              >
                {member.initials}
              </span>
              <h3 className="mt-4 text-[17px] font-bold text-green-900">{member.name}</h3>
              <p className="mt-1 text-sm text-sage-500">{member.role}</p>
            </Card>
          ))}
        </div>

        <div className="mt-10 rounded-card bg-green-900 px-8 py-10 text-center md:px-14">
          <h3 className="font-display text-2xl font-semibold text-white md:text-[28px]">
            {about.hiring.title}
          </h3>
          <p className="mt-2.5 text-[15px] leading-relaxed text-green-300">{about.hiring.subtitle}</p>
          <Button href={about.hiring.cta.href} variant="onDark" size="lg" className="mt-6">
            {about.hiring.cta.label}
          </Button>
        </div>
      </Container>
    </section>
  )
}
