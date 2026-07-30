import { SiteChrome } from '@/ui/marketing/site-chrome'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SiteChrome>{children}</SiteChrome>
}
