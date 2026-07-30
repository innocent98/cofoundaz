'use client'

import { useEffect, useState } from 'react'
import { Container } from '@/ui/primitives'
import { home } from '@/content/home'
import { cn } from '@/lib/cn'

const ROTATE_MS = 6000

export function TestimonialCarousel() {
  const { title, quotes } = home.testimonials
  const [index, setIndex] = useState(0)

  useEffect(() => {
    // Deviation D-2 / WCAG 2.2.2: no auto-advancing motion under reduced motion.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const timer = setInterval(
      () => setIndex((value) => (value + 1) % quotes.length),
      ROTATE_MS
    )
    return () => clearInterval(timer)
  }, [quotes.length])

  const quote = quotes[index]

  return (
    <section className="bg-green-950 text-green-100">
      <Container width="narrow" className="py-16 text-center md:py-22">
        <h2 className="font-display text-[28px] font-semibold text-white md:text-4xl">
          {title}
        </h2>

        <div aria-live="polite" className="mt-11 min-h-[190px]">
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

        <div className="mt-6 flex justify-center">
          {quotes.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show quote ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => setIndex(i)}
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
        </div>
      </Container>
    </section>
  )
}
