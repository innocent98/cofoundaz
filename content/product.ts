import type { HubGroup } from './types'

export const product = {
  hero: {
    eyebrow: 'The product',
    title: 'Every job a founder has, in one place that actually talks to itself.',
    subtitle:
      'Most tools hand you an empty box and wish you luck. Cofoundaz hands you a plan, a score, and a specialist for every question, all working from the same live picture of your business.',
    primaryCta: { label: 'Start free', href: '/signup' },
    secondaryCta: { label: 'See pricing', href: '/pricing' },
    stats: [
      { value: '26', label: 'connected modules' },
      { value: '11', label: 'AI specialists' },
      { value: '1', label: 'Health Score' },
    ],
  },

  subNav: [
    { label: 'Overview', anchor: 'p-overview' },
    { label: 'Build', anchor: 'p-build' },
    { label: 'Grow', anchor: 'p-grow' },
    { label: 'Fund & protect', anchor: 'p-fund' },
    { label: 'Resources', anchor: 'p-resources' },
  ],

  hubGroups: [
    {
      kicker: 'Overview',
      anchor: 'p-overview',
      variant: 'overview',
      title: 'The one screen you check every morning',
      blurb:
        'Open Cofoundaz and the picture is already drawn: your Health Score, today’s mission, your runway, and the risks your AI Co-Founder is quietly watching. Nothing to assemble, nothing to reconcile.',
      items: [
        { name: 'Startup Health Score', body: 'An explainable 0 to 100 read on your whole business.' },
        { name: 'Today’s Mission', body: 'The one to three highest-leverage moves, chosen for you daily.' },
        { name: 'Stage-based Roadmap', body: 'From idea to scale, re-planned when life happens.' },
      ],
      metric: '5 sec',
      metricLabel: 'to the whole truth about your business',
    },
    {
      kicker: 'Build',
      anchor: 'p-build',
      variant: 'build',
      title: 'From a blank page to a fundable plan',
      blurb:
        'Shape the idea with lean and business-model canvases, personas, pricing, and competitive analysis. When you’re ready, one click turns all of it into a full business plan, written in your numbers.',
      items: [
        { name: 'Business Builder', body: 'Canvases to a full business plan in minutes.' },
        { name: 'Validation Hub', body: 'Test assumptions with smoke tests, interviews, and surveys.' },
        { name: 'Assessment', body: 'A short adaptive check-in that calibrates everything.' },
      ],
      metric: '9 canvases',
      metricLabel: 'compiled into one investor-ready plan',
    },
    {
      kicker: 'Grow',
      anchor: 'p-grow',
      variant: 'grow',
      title: 'Ship marketing, close deals, know your numbers',
      blurb:
        'Write and schedule the campaign, work a pipeline that forecasts itself, and watch a finance hub that tells you the truth about runway. Growth stops being three disconnected chores.',
      items: [
        { name: 'Marketing Hub', body: 'Plan it, write it, ship it, measure it.' },
        { name: 'Sales Hub', body: 'A pipeline, email sequences, and an AI sales coach.' },
        { name: 'Finance Hub', body: 'Runway, forecasts, and invoices without a spreadsheet.' },
      ],
      metric: '3 hubs',
      metricLabel: 'marketing, sales, and finance, one engine',
    },
    {
      kicker: 'Fund & protect',
      anchor: 'p-fund',
      variant: 'fund',
      title: 'Raise with clarity, and stay covered',
      blurb:
        'Build the data room before investors ask, model the round before you sign, and rehearse the hard questions before the meeting. Meanwhile, legal and compliance keep the raise from derailing.',
      items: [
        { name: 'Funding Hub', body: 'Data room, cap table, grants, and investor pipeline.' },
        { name: 'Investor Readiness', body: 'Score your deck, rehearse the Q and A, tighten the story.' },
        { name: 'Legal & Compliance', body: 'Formation, contracts, IP, and filing deadlines.' },
      ],
      metric: 'Series A ready',
      metricLabel: 'a data room you can share in a day',
    },
    {
      kicker: 'Resources',
      anchor: 'p-resources',
      variant: 'resources',
      title: 'A human, or a lesson, exactly when you need it',
      blurb:
        'When AI isn’t enough, a vetted lawyer, accountant, or marketer is one click away. And a curriculum built for your stage keeps you learning what matters now, not what the internet thinks you need.',
      items: [
        { name: 'Marketplace', body: 'Vetted human experts when AI is not enough.' },
        { name: 'Learning Academy', body: 'The curriculum for exactly where you are.' },
        { name: 'Documents', body: 'Every file, versioned, shareable, and signable.' },
      ],
      metric: 'Vetted',
      metricLabel: 'experts and a stage-matched curriculum',
    },
  ] satisfies HubGroup[],

  scoreBand: {
    eyebrow: 'The thread that connects it all',
    title: 'One score to tell you if it’s working.',
    body: 'Every action in every module feeds one number: your Startup Health Score. It is the single read on whether you are building a real company, and it is honest about where you are not.',
    cards: [
      { title: 'Explainable', body: 'Every point traces back to something real, from runway to validation evidence.' },
      { title: 'Live', body: 'It recomputes as you work, so the number in front of you is always today’s truth.' },
      { title: 'Actionable', body: 'Each recommendation shows its estimated lift, so you always know the highest-leverage move.' },
    ],
  },

  finalCta: {
    title: 'Your co-founder is ready when you are.',
    cta: { label: 'Start free', href: '/signup' },
    subtitle: 'No credit card required.',
  },
} as const
