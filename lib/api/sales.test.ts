import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as clientModule from './client';
import {
  commitLeadImport,
  contactName,
  convertLead,
  createDeal,
  daysUntil,
  dueLabel,
  formatMoney,
  getOverview,
  importSummary,
  isForbiddenError,
  isNotFoundError,
  isOverdue,
  koboToNairaInput,
  leadTitle,
  listActivities,
  listAllDeals,
  listLeads,
  moveDeal,
  nairaToKobo,
  previewLeadImport,
  saveStages,
  salesErrorMessage,
  salesFieldErrors,
  toStageInputs,
  type Deal,
} from './sales';

vi.mock('./client', () => {
  class ApiError extends Error {
    constructor(
      public status: number,
      public statusText: string,
      public data: unknown
    ) {
      super(`API Error ${status}: ${statusText}`);
    }
  }
  return { apiClient: vi.fn(), ApiError, API_BASE: '/api/v1' };
});

const api = () => vi.mocked(clientModule.apiClient);
const ApiErr = clientModule.ApiError;
const ok = <T,>(data: T) => ({ data, meta: null });
const bodyOf = (call: number) => JSON.parse((api().mock.calls[call][1] as RequestInit).body as string);

beforeEach(() => vi.clearAllMocks());

describe('sales client: request shapes (paths and bodies from the live guide)', () => {
  it('GET /sales unwraps the envelope', async () => {
    api().mockResolvedValueOnce(ok({ total_pipeline_minor: 0, weighted_forecast_minor: 0, win_rate: null, currency: 'NGN', stages: [] }));
    expect((await getOverview()).win_rate).toBeNull();
    expect(api()).toHaveBeenCalledWith('/sales', undefined);
  });

  it('PUT /sales/stages sends the whole ordered list, a new stage has no id', async () => {
    api().mockResolvedValueOnce(ok([]));
    await saveStages([
      { id: 'a', name: 'New', kind: 'open', win_probability: 10 },
      { name: 'Demo', kind: 'open', win_probability: 50 },
    ]);
    expect(api().mock.calls[0][0]).toBe('/sales/stages');
    expect((api().mock.calls[0][1] as RequestInit).method).toBe('PUT');
    expect(bodyOf(0)).toEqual({ stages: [{ id: 'a', name: 'New', kind: 'open', win_probability: 10 }, { name: 'Demo', kind: 'open', win_probability: 50 }] });
  });

  it('POST /sales/deals/{id}/stage carries the lost reason and note in one call', async () => {
    api().mockResolvedValueOnce(ok({}));
    await moveDeal('d1', 's9', { closed_reason: 'price', closed_note: 'Budget frozen' });
    expect(api().mock.calls[0][0]).toBe('/sales/deals/d1/stage');
    expect(bodyOf(0)).toEqual({ stage_id: 's9', closed_reason: 'price', closed_note: 'Budget frozen' });
  });

  it('a plain move sends only the stage', async () => {
    api().mockResolvedValueOnce(ok({}));
    await moveDeal('d1', 's2');
    expect(bodyOf(0)).toEqual({ stage_id: 's2' });
  });

  it('createDeal posts kobo as given', async () => {
    api().mockResolvedValueOnce(ok({}));
    await createDeal({ name: 'Acme', value_minor: 150050 });
    expect(bodyOf(0)).toEqual({ name: 'Acme', value_minor: 150050 });
  });

  it('list calls drop empty filters and keep paging', async () => {
    api().mockResolvedValueOnce(ok({ items: [], total: 0, limit: 25, offset: 50 }));
    await listLeads({ q: '', status: 'new', limit: 25, offset: 50 });
    expect(api().mock.calls[0][0]).toBe('/sales/leads?status=new&limit=25&offset=50');
  });

  it('activities are listed by the id they belong to', async () => {
    api().mockResolvedValueOnce(ok({ items: [], total: 0, limit: 100, offset: 0 }));
    await listActivities({ deal_id: 'd1', limit: 100 });
    expect(api().mock.calls[0][0]).toBe('/sales/activities?deal_id=d1&limit=100');
  });

  it('CSV preview is multipart (the client must not force a JSON content type)', async () => {
    api().mockResolvedValueOnce(ok({ upload_id: 'u', headers: [], sample_rows: [], suggested_mapping: {}, row_count: 0 }));
    await previewLeadImport(new File(['a,b'], 'leads.csv', { type: 'text/csv' }));
    expect(api().mock.calls[0][0]).toBe('/sales/leads/import/preview');
    const init = api().mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('file')).toBeInstanceOf(File);
  });

  it('CSV commit posts the upload id and the mapping', async () => {
    api().mockResolvedValueOnce(ok({ added: 1, duplicates_skipped: 0, invalid_rows: [], invalid_total: 0 }));
    await commitLeadImport('u1', { name: 'Full Name' });
    expect(bodyOf(0)).toEqual({ upload_id: 'u1', mapping: { name: 'Full Name' } });
  });

  it('convert is a bodyless POST', async () => {
    api().mockResolvedValueOnce(ok({}));
    await convertLead('l1');
    expect(api().mock.calls[0][0]).toBe('/sales/leads/l1/convert');
    expect((api().mock.calls[0][1] as RequestInit).body).toBeUndefined();
  });

  it('listAllDeals follows total across 200-row pages', async () => {
    const page = (n: number, offset: number) => ({ items: Array.from({ length: n }, (_, i) => ({ id: `d${offset + i}` }) as Deal), total: 230, limit: 200, offset });
    api().mockResolvedValueOnce(ok(page(200, 0))).mockResolvedValueOnce(ok(page(30, 200)));
    const all = await listAllDeals();
    expect(all).toHaveLength(230);
    expect(api().mock.calls[1][0]).toBe('/sales/deals?limit=200&offset=200');
  });
});

describe('sales errors (shapes from the guide)', () => {
  const e = (status: number, code: string, message: string, fields: { field: string; message: string }[] = []) =>
    new ApiErr(status, 'x', { error: { code, message, field_errors: fields } });

  it('a business-rule 422 shows its own text', () => {
    expect(salesErrorMessage(e(422, 'VALIDATION_ERROR', 'Move the deals out of Qualified first.', [{ field: 'stages', message: 'Move the deals out of Qualified first.' }]))).toBe(
      'Move the deals out of Qualified first.'
    );
  });

  it('a pydantic 422 uses the field text and drops "Value error, "', () => {
    const err = e(422, 'VALIDATION_ERROR', 'Please check the highlighted fields.', [{ field: 'website', message: 'Value error, Website must be an http or https address.' }]);
    expect(salesErrorMessage(err)).toBe('Website must be an http or https address.');
    expect(salesFieldErrors(err)).toEqual({ website: 'Website must be an http or https address.' });
  });

  it('403 is a role problem, 404 is not-found', () => {
    const forbidden = e(403, 'FORBIDDEN', "You don't have permission to do that.");
    expect(isForbiddenError(forbidden)).toBe(true);
    expect(salesErrorMessage(forbidden)).toBe('Sales is not available for your role.');
    expect(isNotFoundError(e(404, 'NOT_FOUND', 'Not found.'))).toBe(true);
    expect(isNotFoundError(forbidden)).toBe(false);
  });

  it('an unreadable CSV keeps its message (no field errors)', () => {
    expect(salesErrorMessage(e(422, 'VALIDATION_ERROR', 'We could not read that CSV file.'))).toBe('We could not read that CSV file.');
  });

  it('falls back for non-API errors', () => {
    expect(salesErrorMessage(null, 'Nope')).toBe('Nope');
  });
});

describe('money and pure helpers', () => {
  it('kobo to naira always shows two decimals', () => {
    expect(formatMoney(25000050)).toBe('₦250,000.50');
    expect(formatMoney(150000000)).toBe('₦1,500,000.00');
    expect(formatMoney(0)).toBe('₦0.00');
    expect(formatMoney(null)).toBe('-');
  });

  it('nairaToKobo parses what a person types and rejects nonsense', () => {
    expect(nairaToKobo('250,000.50')).toBe(25000050);
    expect(nairaToKobo('₦1,500')).toBe(150000);
    expect(nairaToKobo('0.5')).toBe(50);
    expect(nairaToKobo('')).toBe(0);
    expect(nairaToKobo('-5')).toBeNull();
    expect(nairaToKobo('12.345')).toBeNull();
    expect(nairaToKobo('abc')).toBeNull();
  });

  it('koboToNairaInput round-trips the amount field', () => {
    expect(koboToNairaInput(0)).toBe('');
    expect(koboToNairaInput(150000)).toBe('1500');
    expect(koboToNairaInput(150005)).toBe('1500.05');
    expect(nairaToKobo(koboToNairaInput(175025))).toBe(175025);
  });

  it('due labels and overdue are by calendar day', () => {
    const now = new Date(2026, 9, 21, 15, 0);
    expect(daysUntil('2026-10-21', now)).toBe(0);
    expect(dueLabel('2026-10-21', now)).toBe('Today');
    expect(dueLabel('2026-10-22', now)).toBe('Tomorrow');
    expect(dueLabel('2026-10-20', now)).toBe('Yesterday');
    expect(dueLabel('2026-10-24', now)).toBe('in 3 days');
    expect(dueLabel('2026-10-16', now)).toBe('5 days ago');
    expect(isOverdue('2026-10-20', now)).toBe(true);
    expect(isOverdue('2026-10-21', now)).toBe(false);
    expect(isOverdue(null, now)).toBe(false);
  });

  it('import summary matches the toast copy, with plural handling and invalid rows', () => {
    expect(importSummary({ added: 2, duplicates_skipped: 1, invalid_rows: [], invalid_total: 0 })).toBe('2 added, 1 duplicate skipped');
    expect(importSummary({ added: 0, duplicates_skipped: 3, invalid_rows: [], invalid_total: 2 })).toBe('0 added, 3 duplicates skipped, 2 invalid');
  });

  it('display helpers', () => {
    expect(contactName({ first_name: 'Tunde', last_name: 'Okafor' })).toBe('Tunde Okafor');
    expect(contactName({ first_name: 'Solo', last_name: null })).toBe('Solo');
    expect(leadTitle({ name: null, company: 'Zenith' })).toBe('Zenith');
    expect(leadTitle({ name: null, company: null })).toBe('Unnamed lead');
  });

  it('toStageInputs keeps ids and drops position', () => {
    expect(toStageInputs([{ id: 'a', name: 'New', position: 0, kind: 'open', win_probability: 10 }])).toEqual([{ id: 'a', name: 'New', kind: 'open', win_probability: 10 }]);
  });
});
