import { describe, expect, it } from 'vitest'
import { faqPageJsonLd, organizationJsonLd, serializeJsonLd, softwareApplicationJsonLd, siteUrl } from './seo'
import { pricing } from '@/content/pricing'

describe('siteUrl', () => {
  it('is an absolute https URL with no trailing slash', () => {
    expect(siteUrl).toMatch(/^https:\/\//)
    expect(siteUrl.endsWith('/')).toBe(false)
  })
})

describe('organizationJsonLd', () => {
  it('declares an Organization with name and url', () => {
    const data = organizationJsonLd()
    expect(data['@type']).toBe('Organization')
    expect(data.name).toBe('Cofoundaz')
    expect(data.url).toBe(siteUrl)
  })
})

describe('softwareApplicationJsonLd', () => {
  it('declares a BusinessApplication', () => {
    const data = softwareApplicationJsonLd()
    expect(data['@type']).toBe('SoftwareApplication')
    expect(data.applicationCategory).toBe('BusinessApplication')
  })
})

describe('faqPageJsonLd', () => {
  it('mirrors every FAQ item from the pricing content', () => {
    const data = faqPageJsonLd()
    expect(data['@type']).toBe('FAQPage')
    expect(data.mainEntity).toHaveLength(pricing.faq.length)
    expect(data.mainEntity[0].name).toBe(pricing.faq[0].question)
    expect(data.mainEntity[0].acceptedAnswer.text).toBe(pricing.faq[0].answer)
  })
})

describe('serializeJsonLd', () => {
  it('escapes "<" so a "</script>" in the data cannot terminate the script tag early, while still round-tripping through JSON.parse unchanged', () => {
    const data = { text: 'Ends with </script><script>alert(1)</script> in it' }
    const serialized = serializeJsonLd(data)

    expect(serialized).not.toContain('<')
    expect(JSON.parse(serialized)).toEqual(data)
  })
})
