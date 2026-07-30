import type { Metadata } from 'next'
import { AuthForm } from '@/ui/marketing/auth/auth-form'
import { authModes } from '@/content/auth'

export const metadata: Metadata = {
  title: authModes.signup.title,
  description: authModes.signup.subtitle,
  robots: { index: false, follow: true },
}

export default function SignupPage() {
  return <AuthForm mode="signup" />
}
