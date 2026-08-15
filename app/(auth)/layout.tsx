import { AuthBrandPanel } from '@/ui/marketing/auth/auth-brand-panel'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] lg:grid-cols-[45%_1fr] lg:grid-rows-1">
      <AuthBrandPanel />
      <main className="flex items-center justify-center bg-green-50 p-6 lg:p-12">
        {children}
      </main>
    </div>
  )
}
