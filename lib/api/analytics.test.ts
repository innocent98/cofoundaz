import { describe, expect, it } from 'vitest';
import { ApiError } from './client';
import { blocksForApi, filenameFrom, toAnalyticsError } from './analytics';

describe('toAnalyticsError', () => {
  it('keeps the VERSION_CONFLICT code and message (guide: patch_stale_409)', () => {
    const e = toAnalyticsError(
      new ApiError(409, 'Conflict', {
        error: { code: 'VERSION_CONFLICT', message: 'Someone else changed this report. Reload it and apply your change again.', field_errors: [] },
      }),
    );
    expect(e).toMatchObject({ conflict: true, code: 'VERSION_CONFLICT' });
    expect(e.message).toBe('Someone else changed this report. Reload it and apply your change again.');
  });
  it('uses the field message when the 422 message is the generic one (guide: report_csv_422)', () => {
    const e = toAnalyticsError(
      new ApiError(422, 'Unprocessable', {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please check the highlighted fields.',
          field_errors: [{ field: 'format', message: "Input should be 'pdf' or 'xlsx'" }],
        },
      }),
    );
    expect(e.message).toBe("Input should be 'pdf' or 'xlsx'");
    expect(e.fieldErrors.format).toBe("Input should be 'pdf' or 'xlsx'");
  });
  it('flags 410 expired and 403', () => {
    const gone = toAnalyticsError(
      new ApiError(410, 'Gone', { error: { code: 'EXPORT_EXPIRED', message: 'This export expired. Generate it again.', field_errors: [] } }),
    );
    expect(gone.code).toBe('EXPORT_EXPIRED');
    expect(toAnalyticsError(new ApiError(403, 'Forbidden', null)).forbidden).toBe(true);
    expect(toAnalyticsError(new Error('x'), 'fallback').message).toBe('fallback');
  });
});

describe('blocksForApi', () => {
  it('flattens a block range, drops server fields and locked blocks', () => {
    expect(
      blocksForApi([
        {
          id: 'a1',
          type: 'metric',
          metric: 'finance.revenue',
          hub: 'finance',
          viz: 'line',
          title: '',
          range: { range: '90d', from: null, to: null },
          compare: 'year',
        },
        { id: 'l1', type: 'metric', locked: true, needs: 'finance', needs_label: 'Finance' },
        { id: 't1', type: 'text', title: 'Note', text: 'Hello' },
      ]),
    ).toEqual([
      { id: 'a1', type: 'metric', metric: 'finance.revenue', viz: 'line', title: null, compare: 'year', range: '90d', from: null, to: null },
      { id: 't1', type: 'text', title: 'Note', text: 'Hello' },
    ]);
  });
});

describe('filenameFrom', () => {
  it('prefers filename* (guide: download_pdf)', () => {
    const cd =
      "attachment; filename=\"Board pack 2026-10-15 to 2026-11-13.pdf\"; filename*=UTF-8''Board%20pack%202026-10-15%20to%202026-11-13.pdf";
    expect(filenameFrom(cd, 'x')).toBe('Board pack 2026-10-15 to 2026-11-13.pdf');
    expect(filenameFrom('attachment; filename="a.csv"', 'x')).toBe('a.csv');
    expect(filenameFrom('', 'fallback.pdf')).toBe('fallback.pdf');
  });
});
