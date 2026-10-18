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
