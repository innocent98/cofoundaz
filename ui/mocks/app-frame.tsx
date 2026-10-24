import { cn } from '../lib/cn'

export type AppFrameVariant = 'overview' | 'build' | 'grow' | 'fund' | 'resources'

type CanvasBlock = {
  title: string
  notes: string[]
}

type PipelineDeal = {
  company: string
  value: string
  edgeClassName: string
}

type PipelineColumn = {
  name: string
  count: number
  deals: PipelineDeal[]
}

type Investor = {
  initials: string
  name: string
  check: string
  stage: string
  fgClassName: string
  bgClassName: string
}

type Expert = {
  initials: string
  name: string
  specialty: string
  rating: string
}

const RAIL_ITEMS: { glyph: string; variant: AppFrameVariant }[] = [
  { glyph: '◈', variant: 'overview' },
  { glyph: '▤', variant: 'build' },
  { glyph: '↗', variant: 'grow' },
  { glyph: '◆', variant: 'fund' },
  { glyph: '★', variant: 'resources' },
]

const VARIANT_URLS: Record<AppFrameVariant, string> = {
  overview: '/dashboard',
  build: '/business-builder',
  grow: '/sales',
  fund: '/funding',
  resources: '/marketplace',
}

const CANVAS: CanvasBlock[] = [
  { title: 'Key partners', notes: ['Mobile money agents', 'Microfinance banks'] },
  { title: 'Key activities', notes: ['Automated savings', 'Payouts'] },
  { title: 'Value proposition', notes: ['Save without thinking', 'No bank needed'] },
  { title: 'Customer relationships', notes: ['In-app coach'] },
  { title: 'Customer segments', notes: ['Gig workers', 'Traders'] },
  { title: 'Key resources', notes: ['Payments API', 'Trust'] },
  { title: 'Channels', notes: ['WhatsApp', 'Referral'] },
  { title: 'Cost structure', notes: ['Payment fees', 'Support'] },
  { title: 'Revenue streams', notes: ['₦500 / mo', 'Interest spread'] },
]

const PIPELINE: PipelineColumn[] = [
  {
    name: 'Qualified',
    count: 3,
    deals: [
      { company: 'Lagos Riders Co-op', value: '₦6.0M', edgeClassName: 'border-l-brand-300' },
      { company: 'MarketPlus', value: '₦4.2M', edgeClassName: 'border-l-brand-300' },
    ],
  },
  {
    name: 'Proposal',
    count: 2,
    deals: [{ company: 'BodaBoda Union', value: '₦9.0M', edgeClassName: 'border-l-brand-400' }],
  },
  {
    name: 'Negotiation',
    count: 1,
    deals: [{ company: 'GigPay HR', value: '₦12.0M', edgeClassName: 'border-l-accent-600' }],
  },
  {
    name: 'Won',
    count: 4,
    deals: [{ company: 'Thrive SACCO', value: '₦8.5M', edgeClassName: 'border-l-brand-600' }],
  },
]

const INVESTORS: Investor[] = [
  {
    initials: 'VC',
    name: 'Ventures for Africa',
    check: '$100k to $250k',
    stage: 'Term sheet',
    fgClassName: 'text-brand-600',
    bgClassName: 'bg-brand-100',
  },
  {
    initials: 'AH',
    name: 'Adia Holdings',
    check: '$50k angel',
    stage: 'Diligence',
    // green-900 on this bg-accent-100 pill for maximum contrast (~13:1) at the
    // smallest pill size. copper-700 would also pass here now (5.3:1); green-900
    // matches the light-wash text pattern used on the pricing add-ons banner.
    fgClassName: 'text-brand-900',
    bgClassName: 'bg-accent-100',
  },
  {
    initials: 'SF',
    name: 'Sahel Fund',
    check: '$150k',
    stage: 'Meeting',
    fgClassName: 'text-neutral-700',
    bgClassName: 'bg-neutral-100',
  },
]

const EXPERTS: Expert[] = [
  { initials: 'TN', name: 'Tayo N.', specialty: 'Startup lawyer', rating: '4.9' },
  { initials: 'GA', name: 'Grace A.', specialty: 'Fractional CFO', rating: '5.0' },
  { initials: 'IB', name: 'Ibrahim B.', specialty: 'Growth marketer', rating: '4.8' },
  { initials: 'ME', name: 'Mercy E.', specialty: 'Brand designer', rating: '4.9' },
]

function OverviewPanel() {
  return (
    <div>
      <div className="font-display text-[17px] font-semibold text-brand-900">
        Good morning, Amara.
      </div>
      <div className="mt-0.5 text-xs text-neutral-500">Here’s where Kolo stands today.</div>

      <div className="mt-4 grid grid-cols-[148px_1fr] gap-3.5">
        <div className="flex flex-col items-center rounded-card border border-brand-100 bg-white p-4">
          <div className="self-start text-[10px] font-bold uppercase tracking-[0.06em] text-neutral-500">
            Startup Health
          </div>
          <div className="relative mt-2 h-[112px] w-[112px]">
            <svg width="112" height="112" viewBox="0 0 118 118">
              <circle cx="59" cy="59" r="52" fill="none" stroke="var(--color-brand-100)" strokeWidth="12" />
              <circle
                cx="59" cy="59" r="52" fill="none"
                stroke="var(--color-brand-500)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray="327" strokeDashoffset="91"
                transform="rotate(-90 59 59)"
                style={{ animation: 'ring-in 900ms ease-out both' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-[32px] font-bold leading-none text-brand-900">72</span>
              <span className="text-[10px] font-semibold text-brand-600">+4 this week</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-card border border-brand-100 bg-white px-3.5 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-neutral-500">
                Runway
              </div>
              <div className="mt-1 font-display text-[22px] font-bold text-brand-900">8.4 mo</div>
            </div>
            <div className="rounded-card border border-brand-100 bg-white px-3.5 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-neutral-500">
                Revenue
              </div>
              <div className="mt-1 font-display text-[22px] font-bold text-brand-900">₦1.6M</div>
            </div>
          </div>
          <div className="rounded-card border border-brand-100 bg-white px-3.5 py-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-neutral-500">
              Risks
            </div>
            <div className="mt-[9px] flex items-center gap-2">
              <span className="h-[7px] w-[7px] rounded-full bg-danger-600" />
              <span className="text-xs text-neutral-900">Runway tightening, revenue flat 2 months</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-[7px] w-[7px] rounded-full bg-accent-600" />
              <span className="text-xs text-neutral-900">Compliance filing due in 9 days</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2.5 rounded-card bg-brand-900 px-3.5 py-3">
        <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-accent-600 text-[13px] font-bold text-white">
          ✦
        </span>
        <span className="text-xs text-brand-100">
          Your riskiest untested assumption is pricing. Want an experiment for it?
        </span>
      </div>
    </div>
  )
}

function BuildPanel() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="font-display text-base font-semibold text-brand-900">
          Business Model Canvas
        </div>
        {/* green-900 on bg-accent-100 for maximum contrast at 10px — see the
            Diligence badge comment above the INVESTORS array. */}
        <span className="rounded-pill border border-accent-200 bg-accent-100 px-2 py-1 text-[10px] font-bold text-brand-900">
          ✦ AI draft
        </span>
      </div>
      <div className="mt-3.5 grid grid-cols-3 gap-2">
        {CANVAS.map((block) => (
          <div key={block.title} className="min-h-[96px] rounded-[9px] border border-brand-100 bg-white p-2.5">
            <div className="text-[9px] font-bold uppercase tracking-[0.04em] text-neutral-500">
              {block.title}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {block.notes.map((note) => (
                <span
                  key={note}
                  className="rounded-[5px] bg-brand-100 px-1.5 py-[3px] text-[9.5px] leading-tight text-brand-700"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GrowPanel() {
  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="font-display text-base font-semibold text-brand-900">Pipeline</div>
        <span className="text-[11px] text-neutral-500">
          Value <b className="font-bold text-brand-900">₦42.0M</b>
        </span>
        <span className="text-[11px] text-neutral-500">
          Win rate <b className="font-bold text-brand-600">31%</b>
        </span>
      </div>
      <div className="mt-3.5 grid grid-cols-4 gap-2">
        {PIPELINE.map((column) => (
          <div key={column.name}>
            <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.04em] text-neutral-500">
              <span>{column.name}</span>
              <span className="text-neutral-300">{column.count}</span>
            </div>
            <div className="flex flex-col gap-2">
              {column.deals.map((deal) => (
                <div
                  key={deal.company}
                  className={cn(
                    'rounded-[9px] border border-brand-100 border-l-[3px] bg-white p-2.5',
                    deal.edgeClassName
                  )}
                >
                  <div className="text-[11.5px] font-bold text-neutral-900">{deal.company}</div>
                  <div className="mt-[3px] text-[11px] font-semibold text-brand-600">{deal.value}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FundPanel() {
  return (
    <div>
      <div className="font-display text-base font-semibold text-brand-900">Pre-seed round</div>
      <div className="mt-3 rounded-card border border-brand-100 bg-white p-3.5">
        <div className="mb-2 flex justify-between text-xs">
          <span className="text-neutral-500">Soft-committed</span>
          <span className="font-bold text-brand-900">₦58M of ₦90M</span>
        </div>
        <div className="h-[10px] overflow-hidden rounded-pill bg-brand-100">
          <div className="h-full w-[64%] bg-brand-500" />
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {INVESTORS.map((investor) => (
          <div
            key={investor.name}
            className="flex items-center gap-2.5 rounded-[10px] border border-brand-100 bg-white px-[13px] py-[11px]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-input bg-brand-800 text-[11px] font-bold text-brand-200">
              {investor.initials}
            </span>
            <div className="flex-1">
              <div className="text-[12.5px] font-bold text-neutral-900">{investor.name}</div>
              <div className="text-[10.5px] text-neutral-500">{investor.check}</div>
            </div>
            <span
              className={cn(
                'rounded-pill px-[9px] py-1 text-[10px] font-bold',
                investor.fgClassName,
                investor.bgClassName
              )}
            >
              {investor.stage}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResourcesPanel() {
  return (
    <div>
      <div className="font-display text-base font-semibold text-brand-900">Marketplace</div>
      <div className="mt-0.5 text-[11px] text-neutral-500">Vetted experts, matched to your roadmap</div>
      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        {EXPERTS.map((expert) => (
          <div key={expert.name} className="rounded-[11px] border border-brand-100 bg-white p-[13px]">
            <div className="flex items-center gap-[9px]">
              <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {expert.initials}
              </span>
              <div>
                <div className="text-xs font-bold text-neutral-900">{expert.name}</div>
                <div className="text-[10.5px] text-neutral-500">{expert.specialty}</div>
              </div>
            </div>
            <div className="mt-[11px] flex items-center justify-between">
              <span className="text-[10.5px] font-semibold text-accent-700">★ {expert.rating}</span>
              <span className="rounded-pill bg-brand-100 px-[7px] py-[3px] text-[10px] font-bold text-brand-700">
                Vetted
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AppFrame({
  variant,
  className,
}: {
  variant: AppFrameVariant
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'overflow-hidden rounded-[14px] border border-brand-100 bg-white shadow-raised',
        className
      )}
    >
      <div className="flex h-10 items-center gap-[7px] bg-brand-900 px-3.5">
        <span className="h-[9px] w-[9px] rounded-full bg-brand-400" />
        <span className="h-[9px] w-[9px] rounded-full bg-brand-300" />
        <span className="h-[9px] w-[9px] rounded-full bg-brand-200" />
        <span className="mx-auto text-[11px] font-semibold tracking-[0.01em] text-brand-300">
          app.cofoundaz.com{VARIANT_URLS[variant]}
        </span>
      </div>

      <div className="grid h-[400px] grid-cols-[52px_1fr]">
        <div className="flex flex-col items-center gap-3 bg-brand-900 py-3.5">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-input bg-brand-700">
            <span className="h-[11px] w-[11px] rounded-full border-2 border-accent-500 border-r-transparent" />
          </span>
          {RAIL_ITEMS.map((item) => {
            const active = item.variant === variant
            return (
              <span
                key={item.variant}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-input text-[13px]',
                  active ? 'bg-brand-700 text-accent-500' : 'bg-white/[0.07] text-brand-300'
                )}
              >
                {item.glyph}
              </span>
            )
          })}
        </div>

        <div className="relative overflow-hidden bg-neutral-100 p-5">
          {variant === 'overview' ? <OverviewPanel /> : null}
          {variant === 'build' ? <BuildPanel /> : null}
          {variant === 'grow' ? <GrowPanel /> : null}
          {variant === 'fund' ? <FundPanel /> : null}
          {variant === 'resources' ? <ResourcesPanel /> : null}
        </div>
      </div>
    </div>
  )
}
