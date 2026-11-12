// Onboarding wizard options (PRD §01.6, decisions D-AUTH-4/-5/-7, approved 2026-11-12).
// Goal labels are the exact strings the API accepts; do not reword them.

export const INDUSTRIES = [
  'Fintech',
  'Healthtech',
  'Edtech',
  'Agritech',
  'E-commerce & retail',
  'Logistics & supply chain',
  'Marketplaces',
  'SaaS & developer tools',
  'AI & data',
  'Climate & energy',
  'Mobility & transport',
  'Proptech & construction',
  'Media & entertainment',
  'Gaming',
  'Travel & hospitality',
  'Food & beverage',
  'Fashion & beauty',
  'Consumer hardware',
  'Manufacturing',
  'Telecoms & connectivity',
  'Legaltech & govtech',
  'HR & recruiting',
  'Cybersecurity',
  'Insurtech',
  'Professional services',
] as const

export const OTHER_INDUSTRY = 'Other'

export const GOAL_OPTIONS = [
  'Validate my idea',
  'Build my MVP',
  'Get first customers',
  'Grow revenue',
  'Raise funding',
  'Get legally set up',
  'Get financially organized',
  'Build my team',
] as const

export const STAGES = [
  { id: 'idea', label: 'Idea', sub: "It's in my head or on paper" },
  { id: 'validation', label: 'Validation', sub: "I'm testing it with real people" },
  { id: 'build', label: 'Build', sub: "I'm building the product" },
  { id: 'launch', label: 'Launch', sub: "I'm live with first users" },
  { id: 'growth', label: 'Growth', sub: 'I have revenue and I\'m growing' },
  { id: 'scale', label: 'Scale', sub: "I'm expanding what already works" },
] as const

export const BUSINESS_MODELS = [
  { id: 'b2b', label: 'B2B (Business to Business)' },
  { id: 'b2c', label: 'B2C (Business to Consumer)' },
  { id: 'b2b2c', label: 'B2B2C' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'services', label: 'Services' },
] as const

// D-AUTH-4: no Investor here (invited later from Team / Investor Readiness);
// Co-Founder is the `founder` role and carries a one-line warning.
export const INVITE_ROLES = [
  { id: 'founder', label: 'Co-Founder' },
  { id: 'team_member', label: 'Team Member' },
  { id: 'mentor', label: 'Mentor' },
  { id: 'accountant', label: 'Accountant' },
  { id: 'legal_advisor', label: 'Legal Advisor' },
  { id: 'business_consultant', label: 'Business Consultant' },
] as const

export const COFOUNDER_WARNING = 'Co-Founders have full access, including billing.'
