export const authPanel = {
  quote: 'The co-founder who never sleeps.',
  trustLine: 'Trusted by founders from idea to profitability.',
  copyright: '© Cofoundaz',
} as const

export const authModes = {
  signup: {
    title: 'Create your workspace',
    subtitle: 'Free to start. Set up in under 10 minutes.',
    inviteTitle: 'Join {startup}',
    inviteSubtitle: 'Create your account to accept the invitation.',
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
  googleSignup: 'Continue with Google',
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

// Copy for the Google sign-in return page (`/auth/google/callback`).
export const googleSignIn = {
  loading: 'Signing you in with Google',
  backToSignIn: 'Back to sign in',
  continueAnyway: 'Continue',
  unknownError: "We couldn't sign you in with Google. Try again.",
  ticketInvalid: 'That sign-in has expired. Start again.',
  startNotConfigured: "Google sign-in isn't available right now. Use your email instead.",
  inviteInvalid: 'This invitation is no longer valid.',
  tooManyAttempts: 'Too many attempts. Please wait a moment and try again.',
  startGeneric: "We couldn't start Google sign-in. Please try again.",
  errors: {
    access_denied: 'You cancelled Google sign-in.',
    email_not_verified:
      "Google hasn't verified that email address. Use another Google account or sign up with email.",
    invalid_state: 'That sign-in expired. Please try again.',
    invite_email_mismatch:
      'This invitation was sent to a different email address. Sign in with the invited Google account.',
    invite_invalid: 'This invitation is no longer valid.',
    account_disabled: 'This account has been suspended. Contact support.',
    account_unavailable: 'This account is unavailable.',
    google_account_mismatch:
      'This account is linked to a different Google account. Use that one, or sign in with your password.',
    exchange_failed: "We couldn't verify your Google sign-in. Try again.",
    maintenance: "Cofoundaz is in maintenance. New accounts can't be created right now.",
    rate_limited: 'Too many attempts. Try again in a few minutes.',
    try_again: 'Something went wrong. Please try again.',
  },
} as const

// PRD §01 copy for the sign-in, sign-up and recovery screens (gaps 2, 8, 12, 14, 15).
export const authCopy = {
  emailTaken: 'That email already has an account.',
  emailTakenLink: 'Log in instead?',
  termsRequired: 'Accept the Terms and Privacy Policy to create your account.',
  lockedFallback: 'Too many attempts. Try again in a few minutes or reset your password.',
  lockedReset: 'Reset your password',
  rateLimited: 'Too many requests. Please wait a moment and try again.',
  mfaExpired: 'Your sign-in timed out. Log in again.',
  forgotSent: 'If that email has an account, a reset link is on its way.',
  resetTitle: 'Choose a new password',
  resetDone: 'Password updated. Log in with your new password.',
  verifiedTitle: "You're verified. Let's build.",
  checkInbox: 'Check your inbox',
  checkInboxExpiry: 'It expires in 24 hours.',
} as const
