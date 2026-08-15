import { AppFrame } from '@/ui/mocks/app-frame'
import type { HubGroup } from '@/content/types'
import { cn } from '../../lib/cn'

export function HubSection({ group, index }: { group: HubGroup; index: number }) {
  const reversed = index % 2 === 1
  return (
    <div
      id={group.anchor}
      className="grid scroll-mt-[140px] grid-cols-1 gap-10 border-t border-green-100 py-14 lg:grid-cols-[1fr_1.15fr] lg:gap-14"
    >
      <div className={cn(reversed && 'lg:order-2')}>
        {/* Deviation D-1: copper-700, not copper-600, for copper text on light. */}
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-copper-700">
          {group.kicker}
        </span>
        <h2 className="mb-3.5 mt-2.5 font-display text-[26px] font-semibold leading-[1.12] tracking-[-0.01em] text-green-900 md:text-[34px]">
          {group.title}
        </h2>
        <p className="mb-5 text-base leading-[1.62] text-sage-700">{group.blurb}</p>

        <ul className="flex flex-col gap-3.5">
          {group.items.map((item) => (
            <li key={item.name} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-[7px] bg-green-100 text-xs font-bold text-green-700"
              >
                ✓
              </span>
              <div>
                <div className="text-[15px] font-bold text-sage-900">{item.name}</div>
                <div className="text-[14.5px] leading-[1.5] text-sage-500">{item.body}</div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center gap-3.5 border-t border-green-50 pt-5">
          <div className="font-display text-[26px] font-bold text-green-700">{group.metric}</div>
          <div className="max-w-[22ch] text-[13.5px] leading-[1.35] text-sage-500">
            {group.metricLabel}
          </div>
        </div>
      </div>

      <div className={cn(reversed && 'lg:order-1')}>
        <AppFrame variant={group.variant} />
      </div>
    </div>
  )
}
