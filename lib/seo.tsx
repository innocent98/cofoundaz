import { pricing } from '@/content/pricing'

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cofoundaz.com'
).replace(/\/$/, '')

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Cofoundaz',
    url: siteUrl,
    description:
      'The AI operating system that takes founders from idea to profitability.',
  }
}

export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Cofoundaz',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `${siteUrl}/product`,
    description:
      'One connected workspace, a bench of AI advisors, and a clear next step every single day.',
  }
}

export function faqPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pricing.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
