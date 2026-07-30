'use client'

import { useEffect, useState } from 'react'
import { product } from '@/content/product'
import { cn } from '../../lib/cn'

export function ScrollSpyNav() {
  const [active, setActive] = useState<string>(product.subNav[0].anchor)

  useEffect(() => {
    const sections = product.subNav
      .map((item) => document.getElementById(item.anchor))
      .filter((el): el is HTMLElement => el !== null)
    if (typeof IntersectionObserver === 'undefined' || sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-140px 0px -60% 0px' }
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="sticky top-[71px] z-30 border-b border-green-100 bg-white/92 backdrop-blur-[12px]">
      <nav
        aria-label="Product sections"
        className="mx-auto flex h-14 max-w-[1280px] items-center gap-1.5 overflow-x-auto px-4 md:justify-center md:flex-wrap md:px-6"
      >
        {product.subNav.map((item) => (
          <a
            key={item.anchor}
            href={`#${item.anchor}`}
            aria-current={active === item.anchor ? 'true' : undefined}
            className={cn(
              'whitespace-nowrap rounded-pill border px-4 py-2 text-[13.5px] font-semibold transition-colors',
              active === item.anchor
                ? 'border-green-200 bg-green-100 text-green-700'
                : 'border-green-100 bg-green-50 text-sage-700 hover:bg-green-100'
            )}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
