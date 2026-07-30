import { cn } from '../lib/cn'

export function ProductShot({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'overflow-hidden rounded-[14px] border border-green-100 bg-white shadow-raised',
        className
      )}
    >
      <div className="flex h-[38px] items-center gap-[7px] bg-green-900 px-3.5">
        <span className="h-[9px] w-[9px] rounded-full bg-green-400" />
        <span className="h-[9px] w-[9px] rounded-full bg-green-300" />
        <span className="h-[9px] w-[9px] rounded-full bg-green-200" />
        <span className="ml-3 text-[11px] font-semibold text-green-300">
          app.cofoundaz.com/dashboard
        </span>
      </div>

      <div className="grid grid-cols-[52px_1fr]">
        <div className="flex flex-col items-center gap-3.5 bg-green-900 py-3.5">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-input bg-green-700">
            <span className="h-[11px] w-[11px] rounded-full border-2 border-brass-500 border-r-transparent" />
          </span>
          <span className="h-[26px] w-[26px] rounded-[7px] bg-green-700" />
          <span className="h-[26px] w-[26px] rounded-[7px] bg-white/10" />
          <span className="h-[26px] w-[26px] rounded-[7px] bg-white/10" />
          <span className="h-[26px] w-[26px] rounded-[7px] bg-white/10" />
        </div>

        <div className="overflow-hidden bg-sage-100 p-5">
          <div className="font-display text-[17px] font-semibold text-green-900">
            Good morning, Amara.
          </div>
          <div className="mt-0.5 text-xs text-sage-500">
            Here’s where Kolo stands today.
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-[150px_1fr]">
            <div className="flex flex-col items-center rounded-card border border-green-100 bg-white p-4">
              <div className="self-start text-[10px] font-bold uppercase tracking-[0.06em] text-sage-500">
                Startup Health
              </div>
              <div className="relative mt-2 h-[118px] w-[118px]">
                <svg width="118" height="118" viewBox="0 0 118 118">
                  <circle cx="59" cy="59" r="52" fill="none" stroke="var(--color-green-100)" strokeWidth="12" />
                  <circle
                    cx="59" cy="59" r="52" fill="none"
                    stroke="var(--color-green-500)" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray="327" strokeDashoffset="91"
                    transform="rotate(-90 59 59)"
                    style={{ animation: 'ring-in 900ms ease-out both' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-[34px] font-bold leading-none text-green-900">72</span>
                  <span className="text-[10px] font-semibold text-green-600">+4 this week</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="rounded-card border border-green-100 bg-white px-3.5 py-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-sage-500">
                  Today’s Mission
                </div>
                <div className="mt-2.5 flex items-center gap-2.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-green-600 text-[10px] text-white">✓</span>
                  <span className="text-xs text-sage-500 line-through">Interview 3 gig workers</span>
                </div>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="h-4 w-4 rounded-[5px] border-[1.5px] border-sage-300" />
                  <span className="text-xs font-medium text-sage-900">Draft your Lean Canvas</span>
                </div>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="h-4 w-4 rounded-[5px] border-[1.5px] border-sage-300" />
                  <span className="text-xs font-medium text-sage-900">Set your pricing tiers</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-card border border-green-100 bg-white px-3.5 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-sage-500">Runway</div>
                  <div className="mt-1 font-display text-[22px] font-bold text-green-900">8.4 mo</div>
                </div>
                <div className="rounded-card border border-green-100 bg-white px-3.5 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-sage-500">Monthly revenue</div>
                  <div className="mt-1 font-display text-[22px] font-bold text-green-900">₦1.6M</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2.5 rounded-card bg-green-900 px-3.5 py-3">
            <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-brass-600 text-[13px] font-bold text-green-900">✦</span>
            <span className="text-xs text-green-100">
              Your riskiest untested assumption is pricing. Want an experiment for it?
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
