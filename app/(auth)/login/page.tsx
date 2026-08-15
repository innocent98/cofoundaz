import type { Metadata } from 'next'
import { AuthForm } from '@/ui/marketing/auth/auth-form'
import { authModes } from '@/content/auth'

export const metadata: Metadata = {
  title: authModes.login.title,
  description: authModes.login.subtitle,
  robots: { index: false, follow: true },
}

export default function LoginPage() {
  return <AuthForm mode="login" />
}
