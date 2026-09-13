'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { Container } from '@/ui/primitives'
import { home } from '@/content/home'
import { cn } from '../../lib/cn'

const ROTATE_MS = 6000
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export function TestimonialCarousel() {
  const { title, quotes } = home.testimonials
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [cycle, setCycle] = useState(0)

  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  )

  useEffect(() => {
    if (reducedMotion || paused) return

    const timer = setInterval(
      () => setIndex((value) => (value + 1) % quotes.length),
      ROTATE_MS
    )
    return () => clearInterval(timer)
  }, [quotes.length, reducedMotion, paused, cycle])

  const quote = quotes[index]

  function select(next: number) {
    const target = (next + quotes.length) % quotes.length
    const selected = quotes[target]
    setIndex(target)
    setCycle((value) => value + 1)
    setAnnouncement(
      `Quote ${target + 1} of ${quotes.length}. ${selected.text} ${selected.name}, ${selected.company}.`
    )
  }

  function togglePause() {
    setPaused((prev) => !prev)
  }

  return (
    <section className="bg-green-950 text-green-100">
      <Container width="narrow" className="py-16 text-center md:py-22">
        <h2 className="font-display text-[28px] font-semibold text-white md:text-4xl">
          {title}
        </h2>

        <div
          role="group"
          aria-label={title}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div data-carousel-quote className="mt-11 min-h-[190px]">
            <p className="mx-auto max-w-[28ch] font-display text-xl italic leading-[1.45] text-balance text-white md:text-[26px]">
              “{quote.text}”
            </p>
            <div className="mt-7 flex items-center justify-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-green-600 text-[15px] font-bold text-white"
              >
                {quote.initials}
              </span>
              <div className="text-left">
                <div className="text-[15px] font-bold text-white">{quote.name}</div>
                <div className="text-[13px] text-green-300">{quote.company}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={togglePause}
              aria-label={paused ? 'Resume quote rotation' : 'Pause quote rotation'}
              className="flex h-11 w-11 flex-none items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              {paused ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              )}
            </button>

            {quotes.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show quote ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => select(i)}
                className="flex h-11 w-11 flex-none items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-2 w-2 rounded-full transition-colors',
                    i === index ? 'bg-copper-500' : 'bg-white/25'
                  )}
                />
              </button>
            ))}
          </div>

          <span aria-live="polite" className="sr-only">
            {announcement}
          </span>
        </div>
      </Container>
    </section>
  )
}