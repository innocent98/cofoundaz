export const VALID_ONBOARDING_GOALS = [
  'Validate my idea',
  'Build my MVP',
  'Get first customers',
  'Grow revenue',
  'Raise funding',
  'Get legally set up',
  'Get financially organized',
  'Build my team',
] as const

export type OnboardingGoal = (typeof VALID_ONBOARDING_GOALS)[number]

