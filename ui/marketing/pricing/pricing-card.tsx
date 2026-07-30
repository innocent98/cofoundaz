import { Badge, Button } from '@/ui/primitives'
import type { Plan } from '@/content/types'
import { cn } from '@/lib/cn'

export function PricingCard({ plan }: { plan: Plan }) {
  const dark = plan.popular
  return (
    <div
      className={cn(
        'relative rounded-modal p-8',
        dark
          ? 'border border-green-900 bg-green-900 shadow-raised'
          : 'border border-green-100 bg-white shadow-card'
      )}
    >
      {plan.popular ? (
        <Badge tone="accent" className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
          Most popular
        </Badge>
      ) : null}

      <h3 className={cn('font-display text-2xl font-semibold', dark ? 'text-white' : 'text-green-900')}>
        {plan.name}
      </h3>
      <p className={cn('mt-1.5 text-sm', dark ? 'text-green-300' : 'text-sage-500')}>
        {plan.tagline}
      </p>

      {/* Growth and Scale have no price yet — PRD §3.3 marks tiers TBD by business,
          and the comp ships an empty price slot. Do not invent a number. */}
      {plan.price ? (
        <div data-price className="mt-5 mb-1 flex items-baseline gap-1">
          <span className={cn('font-display text-[40px] font-bold', dark ? 'text-white' : 'text-green-900')}>
            {plan.price}
          </span>
          {plan.per ? (
            <span className={cn('text-sm', dark ? 'text-green-300' : 'text-sage-500')}>{plan.per}</span>
          ) : null}
        </div>
      ) : (
        <div aria-hidden="true" className="mt-5 mb-1 h-[48px]" />
      )}

      <Button
        href="/signup"
        variant={dark ? 'accent' : 'secondary'}
        size="md"
        className="my-5 w-full"
      >
        Start free
      </Button>

      <ul className="flex flex-col gap-2.5">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className={cn('flex gap-2.5 text-sm leading-[1.45]', dark ? 'text-green-100' : 'text-sage-700')}
          >
            <span aria-hidden="true" className={cn('flex-none font-bold', dark ? 'text-brass-500' : 'text-green-600')}>
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}
