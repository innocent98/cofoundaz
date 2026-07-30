import type { StoryEntry, TeamMember, ValueItem } from './types'

export const about = {
  hero: {
    eyebrow: 'About Cofoundaz',
    title: 'We’re building the operating system for the next million founders.',
    subtitle:
      'A small team obsessed with one question: what would it take for any founder, anywhere, to build as if they had a world-class team on day one?',
  },

  why: {
    title: 'Why we exist',
    paragraphs: [
      'Most startups don’t fail because the idea was wrong. They fail from avoidable mistakes: the contract nobody read, the runway nobody watched, the customer nobody talked to. The knowledge to avoid all of it already exists, but it’s locked behind expensive advisors and hard-won scar tissue.',
      'Cofoundaz puts that knowledge in one place and makes it act like a co-founder. It plans with you, scores your progress honestly, and tells you the single most important thing to do next, every single day.',
    ],
  },

  stats: [
    { value: '10 min', label: 'from signup to a calibrated workspace' },
    { value: '1 to 3', label: 'clear actions in every daily mission' },
    { value: '11', label: 'AI specialists behind one chat' },
  ],

  missionQuote:
    'Great companies die from avoidable mistakes. We exist to make world-class company-building knowledge available to every founder on day zero.',

  storyTitle: 'Our story',
  story: [
    {
      year: '2024',
      title: 'A frustrating pattern',
      body: 'After watching capable founders stall on avoidable mistakes, we started asking why great company-building knowledge was still so hard to reach.',
    },
    {
      year: '2025',
      title: 'The first Health Score',
      body: 'We built an explainable score that read a whole business from live signals, not vanity metrics. Founders finally had one honest number.',
    },
    {
      year: '2025',
      title: 'The bench takes shape',
      body: 'We connected a roster of AI specialists behind a single chat, each with full context, so founders never had to pick the right advisor.',
    },
    {
      year: '2026',
      title: 'One connected workspace',
      body: 'Roadmap, finance, funding, legal, and growth came together into the operating system founders now open every morning.',
    },
  ] satisfies StoryEntry[],

  valuesTitle: 'What we believe',
  values: [
    { number: '01', title: 'Restraint over noise', body: 'The best tool shows you the one thing that matters, not a hundred things you could do.' },
    { number: '02', title: 'Clarity you can trace', body: 'Every number, every score, and every recommendation explains itself.' },
    { number: '03', title: 'Honesty over hype', body: 'We tell you what is working and what is not. No vanity metrics.' },
    { number: '04', title: 'Momentum, daily', body: 'Small, consistent progress compounds into real companies.' },
  ] satisfies ValueItem[],

  teamTitle: 'The people building it',
  team: [
    { initials: 'OA', name: 'Ope Adeyemi', role: 'Co-Founder & CEO' },
    { initials: 'LC', name: 'Lena Cho', role: 'Co-Founder & CTO' },
    { initials: 'MR', name: 'Marcus Reyes', role: 'Head of AI' },
    { initials: 'SB', name: 'Sara Bello', role: 'Head of Design' },
    { initials: 'DK', name: 'Daniel Kariuki', role: 'Head of Product' },
    { initials: 'FA', name: 'Fatima Adeyemi', role: 'Head of Growth' },
  ] satisfies TeamMember[],

  hiring: {
    title: 'We’re hiring across engineering, design, and AI.',
    subtitle: 'Remote-first, from anywhere our founders build.',
    // No careers page in v1; the comp routes this to contact.
    cta: { label: 'See open roles', href: '/contact' },
  },

  backers: {
    title: 'Backed by operators and funds who have built before',
    names: ['Sahel Fund', 'Ventures for Africa', 'Adia Holdings', 'Zenith Angels'],
  },

  finalCta: {
    title: 'Come build the thing that builds companies.',
    primaryCta: { label: 'Start free', href: '/signup' },
    secondaryCta: { label: 'See open roles', href: '/contact' },
  },
} as const
