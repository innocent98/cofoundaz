import type { FeatureTile, SecurityItem, Step, Testimonial } from './types'

export const home = {
  hero: {
    badge: 'AI operating system for founders',
    title: 'The co-founder who never sleeps.',
    subtitle:
      'Cofoundaz is the AI operating system that takes you from idea to profitability. One connected workspace, a bench of AI advisors, and a clear next step every single day.',
    primaryCta: { label: 'Start free', href: '/signup' },
    secondaryCta: { label: 'See how it works', href: '#how' },
    trustLine: 'No credit card required.',
  },

  problem: {
    title: 'Building a startup shouldn’t feel like guessing.',
    cards: [
      {
        icon: '⚄',
        title: 'Scattered everywhere',
        body: 'Your plan is in a doc, your numbers in a sheet, your tasks in your head. Nothing connects.',
      },
      {
        icon: '₦',
        title: 'Advice is expensive',
        body: 'Lawyers, accountants, and marketers charge by the hour, exactly when you have the least to spend.',
      },
      {
        icon: '?',
        title: 'What do I do next?',
        body: 'Every day starts with a hundred options and no clear priority.',
      },
    ] satisfies FeatureTile[],
  },

  howItWorks: {
    eyebrow: 'How it works',
    title: 'One workspace. One score. One next step.',
    steps: [
      {
        number: '1',
        title: 'Tell us about your startup',
        body: 'A 10 minute assessment calibrates your roadmap, your Health Score, and every AI advisor to your exact stage and industry.',
      },
      {
        number: '2',
        title: 'Meet your AI Co-Founder',
        body: 'Ask anything. It routes your question to the right specialist across legal, finance, marketing, sales, and fundraising, with full context on your business.',
      },
      {
        number: '3',
        title: 'Do today’s mission',
        body: 'Every morning, get the 1 to 3 highest-leverage actions. Complete them, build your streak, watch your Health Score climb.',
      },
    ] satisfies Step[],
  },

  features: {
    title: 'Everything a founder juggles, connected.',
    items: [
      { icon: '◈', title: 'Startup Health Score', body: 'An explainable 0 to 100 read on your whole business.' },
      { icon: '✦', title: 'AI Co-Founder', body: 'Ten specialist advisors behind one chat.' },
      { icon: '⟶', title: 'Stage-based Roadmap', body: 'From idea to scale, re-planned when life happens.' },
      { icon: '▤', title: 'Business Builder', body: 'Canvases to a full business plan in minutes.' },
      { icon: '✓', title: 'Validation Hub', body: 'Test assumptions before you spend.' },
      { icon: '₦', title: 'Finance Hub', body: 'Runway, forecasts, and invoices without a spreadsheet.' },
      { icon: '◆', title: 'Funding Hub', body: 'Data room, cap table, grants, and investor pipeline.' },
      { icon: '★', title: 'Marketplace', body: 'Vetted human experts when AI is not enough.' },
    ] satisfies FeatureTile[],
  },

  testimonials: {
    title: 'Founders are building faster.',
    quotes: [
      {
        text: 'It feels like having a co-founder, a lawyer, and a CFO in one place. I stopped guessing and started shipping.',
        initials: 'AN',
        name: 'Amara Nwosu',
        company: 'Kolo, savings for gig workers',
      },
      {
        text: 'The daily mission is the first thing I open. Small wins, every day, and the Health Score kept climbing.',
        initials: 'DK',
        name: 'Daniel Kariuki',
        company: 'Shamba, agri-logistics',
      },
      {
        text: 'We built our data room and closed our pre-seed in six weeks. Investors noticed how organized we were.',
        initials: 'FA',
        name: 'Fatima Adeyemi',
        company: 'Payflow, B2B payments',
      },
    ] satisfies Testimonial[],
  },

  security: {
    title: 'Your startup’s data is yours.',
    body: 'Isolated workspaces, encryption in transit and at rest, granular sharing controls, and a full audit trail.',
    items: [
      { title: 'Isolated workspaces', body: 'Tenant-isolated data with row-level policies.' },
      { title: 'Encrypted throughout', body: 'In transit and at rest, always.' },
      { title: 'Granular sharing', body: 'Control access per document and per role.' },
      { title: 'Full audit trail', body: 'Every sensitive action is logged.' },
    ] satisfies SecurityItem[],
  },

  finalCta: {
    title: 'Stop guessing. Start building.',
    cta: { label: 'Start free', href: '/signup' },
    subtitle: 'Set up in under 10 minutes.',
  },
} as const
