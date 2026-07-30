import type { FaqItem, MatrixSection, Plan } from './types'

const yes = { kind: 'yes' } as const
const text = (value: string) => ({ kind: 'text', value }) as const
const none = text('·')

export const pricing = {
  hero: {
    eyebrow: 'Pricing',
    title: 'Simple plans that grow with you.',
    subtitle:
      'Every plan includes the AI Co-Founder, your roadmap, and your Health Score. Start free, upgrade the day it pays for itself.',
    ticks: [
      'No credit card to start',
      'Cancel anytime',
      'Your data is never used to train AI',
    ],
  },

  plans: [
    {
      name: 'Starter',
      tagline: 'For validating an idea.',
      price: 'Free',
      per: null,
      popular: false,
      features: [
        'Core AI Co-Founder',
        'Roadmap and Health Score',
        'Business Builder',
        'Documents',
        'AI credits each month',
        '1 seat',
      ],
    },
    {
      name: 'Growth',
      tagline: 'For getting to revenue.',
      price: null,
      per: null,
      popular: true,
      features: [
        'Everything in Starter',
        'Marketing, Sales, Finance, Validation Hubs',
        'Analytics and Reports',
        'More AI credits',
        'Multiple seats',
      ],
    },
    {
      name: 'Scale',
      tagline: 'For raising and expanding.',
      price: null,
      per: null,
      popular: false,
      features: [
        'Everything in Growth',
        'Funding Hub and Investor Readiness',
        'Legal and Compliance',
        'Priority support',
        'Most AI credits',
        'Unlimited seats',
      ],
    },
  ] satisfies Plan[],

  addOnsBanner:
    'Need more AI credits or seats? Add them any time from Billing.',

  everyPlan: {
    title: 'In every plan, from day one',
    items: [
      'The AI Co-Founder chat, routed to the right specialist',
      'Your stage-based Roadmap and Today’s Mission',
      'Your explainable Startup Health Score',
      'Free professional collaborator seats (accountant, lawyer)',
      'Isolated, encrypted workspace with full audit trail',
      'Web and mobile access',
    ],
  },

  matrixTitle: 'Compare every plan',
  matrix: [
    {
      section: 'Core, in every plan',
      rows: [
        { feature: 'AI Co-Founder chat', starter: yes, growth: yes, scale: yes },
        { feature: 'Roadmap & Health Score', starter: yes, growth: yes, scale: yes },
        { feature: 'Business Builder & canvases', starter: yes, growth: yes, scale: yes },
        { feature: 'Documents & e-signature', starter: yes, growth: yes, scale: yes },
        { feature: 'AI credits per month', starter: text('Basic'), growth: text('More'), scale: text('Most') },
        { feature: 'Seats', starter: text('1'), growth: text('Multiple'), scale: text('Unlimited') },
      ],
    },
    {
      section: 'Grow & operate',
      rows: [
        { feature: 'Marketing Hub', starter: none, growth: yes, scale: yes },
        { feature: 'Sales Hub', starter: none, growth: yes, scale: yes },
        { feature: 'Finance Hub', starter: none, growth: yes, scale: yes },
        { feature: 'Validation Hub', starter: none, growth: yes, scale: yes },
        { feature: 'Analytics & Reports', starter: none, growth: yes, scale: yes },
      ],
    },
    {
      section: 'Fund & protect',
      rows: [
        { feature: 'Funding Hub & data room', starter: none, growth: none, scale: yes },
        { feature: 'Investor Readiness', starter: none, growth: none, scale: yes },
        { feature: 'Legal & Compliance', starter: none, growth: none, scale: yes },
      ],
    },
    {
      section: 'Support',
      rows: [
        { feature: 'Professional collaborators', starter: yes, growth: yes, scale: yes },
        { feature: 'Support', starter: text('Community'), growth: text('Standard'), scale: text('Priority') },
      ],
    },
  ] satisfies MatrixSection[],

  credits: {
    title: 'What is an AI credit?',
    body: 'A credit is roughly one AI answer or one generated artifact section. The big jobs, like a business plan or a financial model, always show their cost before you run them, so you are never surprised.',
    examples: [
      { label: 'Ask your AI Co-Founder a question', value: '≈ 1 credit' },
      { label: 'Draft a document section', value: '≈ 1 credit' },
      { label: 'Generate a full business plan', value: 'Shows cost first' },
      { label: 'Build a 3-statement financial model', value: 'Shows cost first' },
    ],
  },

  wordmarks: {
    title: 'Trusted by founders in 40+ countries',
    names: ['Kolo', 'Shamba', 'Payflow', 'GigPay', 'Thrive'],
  },

  faqTitle: 'Questions, answered.',
  faq: [
    {
      question: 'What counts as an AI credit?',
      answer:
        'A credit is roughly one AI answer or one generated artifact section. Big jobs like a business plan or financial model show their cost before you run them.',
    },
    {
      question: 'Can I change plans later?',
      answer:
        'Yes. Upgrades apply instantly; downgrades take effect at the end of your billing period.',
    },
    {
      question: 'Do you offer refunds?',
      answer:
        'If something is not right, reach out within 14 days of a charge and we will make it right.',
    },
    {
      question: 'Is my data used to train AI models?',
      answer: 'No. Your workspace data is never used to train models.',
    },
    {
      question: 'Can I invite my accountant or lawyer?',
      answer: 'Yes. Professional collaborator roles are free on every plan.',
    },
    {
      question: 'How do I cancel?',
      answer:
        'Cancel any time from Billing. Your plan stays active until the end of the period, and your data is kept for 90 days after that.',
    },
  ] satisfies FaqItem[],

  finalCta: {
    title: 'Try it free. Keep it if it earns its place.',
    body: 'Start on the free plan today. If something isn’t right in your first 14 days on a paid plan, reach out and we’ll make it right.',
    cta: { label: 'Start free', href: '/signup' },
  },
} as const
