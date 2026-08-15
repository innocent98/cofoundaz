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

/**
 * `JSON.stringify` does not escape `<` or `/`, so a data value containing
 * `</script>` would terminate the script tag early and inject the remainder
 * as markup. `<` is a valid JSON escape for `<` — parsers read it
 * identically, but the literal character never reaches the HTML.
 */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
