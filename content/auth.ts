export const authPanel = {
  quote: 'The co-founder who never sleeps.',
  trustLine: 'Trusted by founders from idea to profitability.',
  copyright: '© Cofoundaz',
} as const

export const authModes = {
  signup: {
    title: 'Create your workspace',
    subtitle: 'Free to start. Set up in under 10 minutes.',
    cta: 'Create account',
    passwordHelp: '8+ characters, one number',
    footerText: 'Already have an account?',
    footerLink: { label: 'Log in', href: '/login' },
  },
  login: {
    title: 'Welcome back',
    subtitle: 'Log in to pick up where you left off.',
    cta: 'Log in',
    passwordHelp: null,
    footerText: 'New here?',
    footerLink: { label: 'Create your workspace', href: '/signup' },
  },
} as const

export const authShared = {
  google: 'Continue with Google',
  apple: 'Continue with Apple',
  divider: 'or',
  emailLabel: 'Work email',
  emailPlaceholder: 'you@startup.com',
  passwordLabel: 'Password',
  forgotPassword: 'Forgot password?',
  termsPrefix: 'I agree to the',
  termsLink: { label: 'Terms of Service', href: '/terms' },
  termsJoin: 'and',
  privacyLink: { label: 'Privacy Policy', href: '/privacy' },
} as const
