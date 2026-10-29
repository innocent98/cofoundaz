import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './client';
import { calendarApi, calendarErrorCode, calendarErrorMessage, calendarFieldErrors } from './calendar';

const apiError = (status: number, error: object) => new ApiError(status, 'x', { error });

describe('calendar error helpers', () => {
  it('shows the server sentence, stripping pydantic\'s "Value error, " prefix from form-level rules', () => {
    const e = apiError(422, {
      code: 'VALIDATION_ERROR',
      message: 'Please check the highlighted fields.',
      field_errors: [{ field: '', message: 'Value error, an all-day event may not carry a start or end time' }],
    });
    expect(calendarErrorMessage(e)).toBe('an all-day event may not carry a start or end time');
    expect(calendarErrorCode(e)).toBe('VALIDATION_ERROR');
  });

  it('keys field errors by field and strips the prefix there too', () => {
    const e = apiError(422, {
      code: 'VALIDATION_ERROR',
      message: 'Please check the highlighted fields.',
      field_errors: [
        { field: 'title', message: 'String should have at least 1 character' },
        { field: 'timezone', message: 'Value error, timezone must be an IANA name such as Africa/Lagos' },
      ],
    });
    expect(calendarFieldErrors(e)).toEqual({
      title: 'String should have at least 1 character',
      timezone: 'timezone must be an IANA name such as Africa/Lagos',
    });
  });

  it('falls back for a non-API error', () => {
    expect(calendarErrorMessage(new Error('offline'))).toBe('offline');
    expect(calendarErrorMessage({}, 'nope')).toBe('nope');
  });
});

describe('calendarApi', () => {
  afterEach(() => vi.restoreAllMocks());

  function mockFetch(body: unknown) {
    const spy = vi.fn().mockImplementation(async () => new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal('fetch', spy);
    return spy;
  }

  it('unwraps the data envelope and sends the feed range', async () => {
    const spy = mockFetch({ data: { items: [], counts: {}, layers: [] }, meta: null });
    const feed = await calendarApi.feed('2026-11-01', '2026-11-30');
    expect(feed.items).toEqual([]);
    expect(String(spy.mock.calls[0][0])).toContain('/calendar/feed?date_from=2026-11-01&date_to=2026-11-30');
  });

  it('connects Google with credentials so the browser keeps the OAuth cookie', async () => {
    const spy = mockFetch({ data: { auth_url: 'https://accounts.google.com/x', expires_in: 600 }, meta: null });
    await calendarApi.connectGoogle();
    const init = spy.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
  });

  it('adds every pending action item when no ids are given', async () => {
    const spy = mockFetch({ data: { created: [], milestone_id: 'm', action_items: [] }, meta: null });
    await calendarApi.addToTasks('abc');
    expect((spy.mock.calls[0][1] as RequestInit).body).toBe('{}');
    await calendarApi.addToTasks('abc', ['i1']);
    expect((spy.mock.calls[1][1] as RequestInit).body).toBe('{"item_ids":["i1"]}');
  });
});
