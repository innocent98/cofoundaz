import { Logo } from '@/ui/marketing/logo'
import { authPanel } from '@/content/auth'

export function AuthBrandPanel() {
  return (
    <div className="flex flex-col justify-between gap-8 bg-green-900 p-8 text-white lg:p-12">
      <Logo tone="dark" />
      <div className="hidden lg:block">
        <p className="max-w-[20ch] font-display text-[28px] italic leading-[1.4] text-white">
          {authPanel.quote}
        </p>
        <p className="mt-5 text-sm text-green-300">{authPanel.trustLine}</p>
      </div>
      <div className="hidden text-[13px] text-green-400 lg:block">{authPanel.copyright}</div>
    </div>
  )
}
