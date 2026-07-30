import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-07-30')

  return [
    { url: siteUrl, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/product`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteUrl}/pricing`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteUrl}/about`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/contact`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${siteUrl}/security`, lastModified, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${siteUrl}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/cookies`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
