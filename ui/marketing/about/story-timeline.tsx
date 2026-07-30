import { Container, SectionHeading } from '@/ui/primitives'
import { about } from '@/content/about'

export function StoryTimeline() {
  return (
    <section>
      <Container width="prose" className="max-w-[820px] py-16 md:py-18">
        <SectionHeading title={about.storyTitle} className="mb-10" />
        <ol className="flex flex-col">
          {about.story.map((entry) => (
            <li
              key={`${entry.year}-${entry.title}`}
              className="grid grid-cols-1 gap-2 pb-8 md:grid-cols-[80px_1fr] md:gap-6"
            >
              {/* Deviation D-1: brass-700 for brass text on a white surface. */}
              <div className="pt-0.5 font-display text-lg font-bold text-brass-700 md:text-right">
                {entry.year}
              </div>
              <div className="relative border-l-2 border-green-100 pl-6">
                <span
                  aria-hidden="true"
                  className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-green-700"
                />
                <h3 className="text-[17px] font-bold text-sage-900">{entry.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-sage-500">{entry.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
