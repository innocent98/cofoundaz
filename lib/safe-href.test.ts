import { describe, expect, it } from 'vitest';
import { safeInternalHref } from './safe-href';

describe('safeInternalHref', () => {
  it('keeps in-app routes, queries included', () => {
    expect(safeInternalHref('/roadmap')).toBe('/roadmap');
    expect(safeInternalHref('/ai?c=123')).toBe('/ai?c=123');
  });
  it('drops external, protocol-relative, backslash and non-string values', () => {
    for (const bad of ['https://evil.example', '//evil.example', '/\\evil.example', '/ \t//evil.example', '/\n/evil.example', '/.//evil.example', '/a/..//evil.example', 'javascript:alert(1)', 'roadmap', '', null, undefined]) {
      expect(safeInternalHref(bad as string | null)).toBeNull();
    }
  });
});

describe('marketing search hrefs', () => {
  it.each([
    '/marketing/campaigns/56e3de5a-c3d3-411f-aecf-afa46b32c369',
    '/marketing/calendar?entry=3eb508f6-15b8-4959-a0a1-06a8bea034e5',
    '/marketing/segments',
  ])('passes %s through unchanged', (href) => {
    expect(safeInternalHref(href)).toBe(href);
  });
});
