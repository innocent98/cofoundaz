import { afterEach, describe, expect, it, vi } from 'vitest';
import { replaceUrl } from './replace-url';

describe('replaceUrl', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('changes the query string in place', () => {
    window.history.replaceState(null, '', '/settings?tab=billing');
    replaceUrl('/settings?tab=profile');
    expect(window.location.pathname + window.location.search).toBe('/settings?tab=profile');
  });

  it('adds no history entry, so Back still leaves the page', () => {
    const push = vi.spyOn(window.history, 'pushState');
    replaceUrl('/settings?tab=security');
    expect(push).not.toHaveBeenCalled();
    push.mockRestore();
  });
});
