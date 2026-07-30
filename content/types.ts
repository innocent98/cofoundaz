export type NavLink = { label: string; href: string }

export type FeatureTile = { icon: string; title: string; body: string }
export type Step = { number: string; title: string; body: string }
export type Testimonial = {
  text: string
  initials: string
  name: string
  company: string
}
export type SecurityItem = { title: string; body: string }

export type HubGroup = {
  kicker: string
  anchor: string
  variant: 'overview' | 'build' | 'grow' | 'fund' | 'resources'
  title: string
  blurb: string
  items: { name: string; body: string }[]
  metric: string
  metricLabel: string
}

export type Plan = {
  name: string
  tagline: string
  /** null until the business sets pricing. PRD §3.3: "tier names/prices TBD by business". */
  price: string | null
  per: string | null
  popular: boolean
  features: string[]
}

/**
 * A cell is a tick, an explicit "not included", or a short label such as
 * "Basic" / "Unlimited".
 *
 * `no` is its own arm rather than `text('·')` because the middle dot is purely
 * visual: rendered as text it leaves a screen-reader user unable to tell "not
 * included" from an empty cell (WCAG 1.1.1 / 1.3.1). The renderer pairs the
 * glyph with an sr-only "Not included".
 */
export type MatrixCell = { kind: 'yes' } | { kind: 'no' } | { kind: 'text'; value: string }
export type MatrixRow = {
  feature: string
  starter: MatrixCell
  growth: MatrixCell
  scale: MatrixCell
}
export type MatrixSection = { section: string; rows: MatrixRow[] }

export type FaqItem = { question: string; answer: string }

export type StoryEntry = { year: string; title: string; body: string }
export type ValueItem = { number: string; title: string; body: string }
export type TeamMember = { initials: string; name: string; role: string }

export type LegalSection = { heading: string; body: string }
export type LegalDocument = {
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}
