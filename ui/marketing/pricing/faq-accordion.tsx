'use client'

import { useId, useState } from 'react'
import { pricing } from '@/content/pricing'

export function FaqAccordion() {
  const [open, setOpen] = useState(0)
  const baseId = useId()

  return (
    <div className="flex flex-col gap-3">
      {pricing.faq.map((item, index) => {
        const isOpen = open === index
        const triggerId = `${baseId}-trigger-${index}`
        const panelId = `${baseId}-panel-${index}`

        return (
          <div key={item.question} className="overflow-hidden rounded-card border border-green-100 bg-white">
            <button
              type="button"
              id={triggerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
            >
              <span className="text-base font-semibold text-sage-900">{item.question}</span>
              {/* Deviation D-1: copper-700 for copper text on a white surface. */}
              <span aria-hidden="true" className="flex-none text-lg font-semibold text-copper-700">
                {isOpen ? '−' : '+'}
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              hidden={!isOpen}
              className="px-5 pb-5 text-[15px] leading-relaxed text-sage-700"
            >
              {item.answer}
            </div>
          </div>
        )
      })}
    </div>
  )
}
