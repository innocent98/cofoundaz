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
  // Only *user-initiated* changes are announced. Putting `aria-live` on the
  // auto-rotating quote itself would read a whole testimonial to a screen
  // reader every 6 seconds, forever (WCAG 4.1.3 with 2.2.2) — so the quote
  // region carries no live semantics and this sr-only region is populated
  // solely by prev/next/dot activation.
  const [announcement, setAnnouncement] = useState('')
  // Bumped by every manual selection so the rotation effect tears down and
  // restarts. Keying the restart off `index` alone would miss the case where
  // the user re-selects the quote already on screen (or steps back and forth),
  // which must still restart the dwell.
  const [cycle, setCycle] = useState(0)
  // The server snapshot is `false` (there is no media query to read during a
  // static render), so SSR and hydration agree; the client snapshot is read
  // during the very first client render, well before any 6s tick could fire,
  // and re-reads if the user changes the OS setting mid-session.
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  )

  useEffect(() => {
    // Deviation D-2 / WCAG 2.2.2: never auto-advance under reduced motion, and
    // never while the user has pressed Pause. `cycle` is a dependency so any
    // manual selection restarts the full 6s dwell instead of inheriting the
    // remainder of an interval already in flight.
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

  const controlClasses =
    'flex h-11 w-11 flex-none items-center justify-center rounded-full text-green-300 hover:text-white'

  return (
    <section className="bg-green-950 text-green-100">
      <Container width="narrow" className="py-16 text-center md:py-22">
        <h2 className="font-display text-[28px] font-semibold text-white md:text-4xl">
          {title}
        </h2>

        <div role="group" aria-label={title}>
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

          <div className="mt-6 flex items-center justify-center">
            <button
              type="button"
              aria-label="Previous quote"
              onClick={() => select(index - 1)}
              className={controlClasses}
            >
              <span aria-hidden="true" className="text-[22px] leading-none">‹</span>
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
                {/* The visible indicator stays a small 8px dot; the button
                    itself is the full 44px touch target (Lighthouse's
                    target-size audit flagged the dot alone at 8x8px). */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-2 w-2 rounded-full transition-colors',
                    i === index ? 'bg-brass-500' : 'bg-white/25'
                  )}
                />
              </button>
            ))}

            <button
              type="button"
              aria-label="Next quote"
              onClick={() => select(index + 1)}
              className={controlClasses}
            >
              <span aria-hidden="true" className="text-[22px] leading-none">›</span>
            </button>

            {/* WCAG 2.2.2 (Pause, Stop, Hide) — an explicit control, not
                pause-on-hover, because hover helps neither keyboard nor touch
                users. Not rendered under reduced motion, where nothing rotates
                and a Pause button would be a control over nothing. */}
            {!reducedMotion && (
              <button
                type="button"
                data-carousel-toggle
                aria-label={paused ? 'Resume quote rotation' : 'Pause quote rotation'}
                onClick={() => setPaused((value) => !value)}
                className={cn(controlClasses, 'ml-1')}
              >
                <span aria-hidden="true" className="text-[15px] leading-none">
                  {paused ? '▶' : '❚❚'}
                </span>
              </button>
            )}
          </div>

          <span aria-live="polite" className="sr-only">
            {announcement}
          </span>
        </div>
      </Container>
    </section>
  )
}
