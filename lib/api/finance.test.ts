import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as api from './finance';
import * as clientModule from './client';

vi.mock('./client', async () => {
  const actual = await vi.importActual<typeof clientModule>('./client');
  return { ...actual, apiClient: vi.fn() };
});

const apiClient = vi.mocked(clientModule.apiClient);
const { ApiError } = clientModule;

describe('Finance SDK (lib/api/finance.ts)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getCashFlow unwraps data', async () => {
    const cf = { cash_on_hand: 1, monthly_burn: 0, monthly_revenue: 0, runway_months: null, runway_low: false, currency: 'NGN', by_month: [] };
    apiClient.mockResolvedValueOnce({ data: cf, meta: null });
    expect(await api.getCashFlow()).toEqual(cf);
    expect(apiClient).toHaveBeenCalledWith('/finance/cash-flow');
  });

  it('listTransactions unwraps data.transactions and builds the query', async () => {
    apiClient.mockResolvedValueOnce({ data: { transactions: [{ id: 't1' }] }, meta: { next_cursor: 'c2', total_estimate: 7 } });
    const res = await api.listTransactions({ uncategorized: true, direction: 'out' });
    expect(res).toEqual({ items: [{ id: 't1' }], nextCursor: 'c2', total: 7 });
    expect(apiClient).toHaveBeenCalledWith('/finance/transactions?uncategorized=true&direction=out&limit=50');
  });

  it('listTransactions passes the cursor back unchanged and treats a missing meta as the last page', async () => {
    apiClient.mockResolvedValueOnce({ data: { transactions: [] }, meta: null });
    const res = await api.listTransactions({}, 'abc==', 10);
    expect(apiClient).toHaveBeenCalledWith('/finance/transactions?limit=10&cursor=abc%3D%3D');
    expect(res).toEqual({ items: [], nextCursor: null, total: null });
  });

  it('createTransaction POSTs minor units and returns the row', async () => {
    apiClient.mockResolvedValueOnce({ data: { id: 't1' } });
    await api.createTransaction({ date: '2026-10-01', description: 'x', amount_minor: 150000, direction: 'out' });
    expect(apiClient).toHaveBeenCalledWith('/finance/transactions', {
      method: 'POST',
      body: JSON.stringify({ date: '2026-10-01', description: 'x', amount_minor: 150000, direction: 'out' }),
    });
  });

  it('updateTransaction can clear a category with an explicit null', async () => {
    apiClient.mockResolvedValueOnce({ data: { id: 't1' } });
    await api.updateTransaction('t1', { category: null });
    expect(apiClient).toHaveBeenCalledWith('/finance/transactions/t1', { method: 'PATCH', body: '{"category":null}' });
  });

  it('deleteTransaction DELETEs and resolves void', async () => {
    apiClient.mockResolvedValueOnce({ data: { deleted: true } });
    expect(await api.deleteTransaction('t1')).toBeUndefined();
    expect(apiClient).toHaveBeenCalledWith('/finance/transactions/t1', { method: 'DELETE' });
  });

  it('saveRunwayAssumptions PUTs a partial body and returns the recomputed runway', async () => {
    const runway = { assumptions: { mom_growth_percent: 5 } };
    apiClient.mockResolvedValueOnce({ data: runway });
    expect(await api.saveRunwayAssumptions({ mom_growth_percent: 5 })).toEqual(runway);
    expect(apiClient).toHaveBeenCalledWith('/finance/runway/assumptions', { method: 'PUT', body: '{"mom_growth_percent":5}' });
  });

  it('invoice lifecycle hits the documented routes', async () => {
    apiClient.mockResolvedValue({ data: { id: 'i1' } });
    await api.sendInvoice('i1');
    await api.markInvoicePaid('i1');
    await api.markInvoiceUnpaid('i1');
    await api.deleteInvoice('i1');
    expect(apiClient.mock.calls.map((c) => [c[0], (c[1] as RequestInit).method])).toEqual([
      ['/finance/invoices/i1/send', 'POST'],
      ['/finance/invoices/i1/mark-paid', 'POST'],
      ['/finance/invoices/i1/mark-unpaid', 'POST'],
      ['/finance/invoices/i1', 'DELETE'],
    ]);
  });

  it('listInvoices unwraps data.invoices and filters by status', async () => {
    apiClient.mockResolvedValueOnce({ data: { invoices: [] } });
    await api.listInvoices('overdue');
    expect(apiClient).toHaveBeenCalledWith('/finance/invoices?status=overdue&limit=50');
  });

  it('listExpenses and getExpenseSummary pass month filters', async () => {
    apiClient.mockResolvedValueOnce({ data: { expenses: [] } });
    await api.listExpenses({ month: '2026-10' });
    expect(apiClient).toHaveBeenCalledWith('/finance/expenses?month=2026-10&limit=50');
    apiClient.mockResolvedValueOnce({ data: { month: '2026-10', rows: [] } });
    await api.getExpenseSummary('2026-10');
    expect(apiClient).toHaveBeenLastCalledWith('/finance/expenses/summary?month=2026-10');
  });

  it('uploadExpenseReceipt sends multipart with a single "file" part and no manual content-type', async () => {
    apiClient.mockResolvedValueOnce({ data: { id: 'e1' } });
    const file = new File(['x'], 'r.pdf', { type: 'application/pdf' });
    await api.uploadExpenseReceipt('e1', file);
    const [path, init] = apiClient.mock.calls[0] as [string, RequestInit];
    expect(path).toBe('/finance/expenses/e1/receipt');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('file')).toBe(file);
    expect(init.headers).toBeUndefined();
  });

  it('removeExpenseReceipt DELETEs the receipt sub-resource', async () => {
    apiClient.mockResolvedValueOnce({ data: { id: 'e1' } });
    await api.removeExpenseReceipt('e1');
    expect(apiClient).toHaveBeenCalledWith('/finance/expenses/e1/receipt', { method: 'DELETE' });
  });

  it('listBudgets requires the month and unwraps data.budgets', async () => {
    apiClient.mockResolvedValueOnce({ data: { month: '2026-10', budgets: [{ id: 'b1' }] } });
    expect(await api.listBudgets('2026-10')).toEqual([{ id: 'b1' }]);
    expect(apiClient).toHaveBeenCalledWith('/finance/budgets?month=2026-10');
  });

  it('budget seeders POST period_month and return only the created budgets', async () => {
    apiClient.mockResolvedValueOnce({ data: { month: '2026-10', budgets: [{ id: 'b1' }] } });
    expect(await api.draftBudgetsFromActuals('2026-10')).toHaveLength(1);
    expect(apiClient).toHaveBeenLastCalledWith('/finance/budgets/draft-from-actuals', { method: 'POST', body: '{"period_month":"2026-10"}' });
    apiClient.mockResolvedValueOnce({ data: { month: '2026-10', budgets: [] } });
    expect(await api.copyLastMonthBudgets('2026-10')).toEqual([]);
    expect(apiClient).toHaveBeenLastCalledWith('/finance/budgets/copy-last-month', { method: 'POST', body: '{"period_month":"2026-10"}' });
  });

  it('updateBudget can clear notes with null', async () => {
    apiClient.mockResolvedValueOnce({ data: { id: 'b1' } });
    await api.updateBudget('b1', { notes: null });
    expect(apiClient).toHaveBeenCalledWith('/finance/budgets/b1', { method: 'PATCH', body: '{"notes":null}' });
  });

  it('financial model: generate, latest (including none) and by id', async () => {
    apiClient.mockResolvedValueOnce({ data: { id: 'm1', status: 'generating' } });
    expect(await api.generateFinancialModel()).toEqual({ id: 'm1', status: 'generating' });
    expect(apiClient).toHaveBeenLastCalledWith('/finance/model/generate', { method: 'POST' });
    apiClient.mockResolvedValueOnce({ data: { status: 'none' } });
    expect(await api.getLatestFinancialModel()).toEqual({ status: 'none' });
    apiClient.mockResolvedValueOnce({ data: { id: 'm1' } });
    await api.getFinancialModel('m1');
    expect(apiClient).toHaveBeenLastCalledWith('/finance/model/m1');
  });
});

describe('toFinanceError', () => {
  const apiError = (status: number, body: unknown) => new ApiError(status, 'x', body);

  it('uses the API message for state errors (e.g. illegal invoice transition)', () => {
    const fe = api.toFinanceError(
      apiError(422, { error: { code: 'VALIDATION_ERROR', message: 'Only a draft invoice can be sent.', field_errors: [{ field: 'status', message: 'Only a draft invoice can be sent.' }] } }),
    );
    expect(fe.message).toBe('Only a draft invoice can be sent.');
    expect(fe.fieldErrors).toEqual({ status: 'Only a draft invoice can be sent.' });
    expect(fe.forbidden).toBe(false);
  });

  it('replaces the generic validation message with the first field error', () => {
    const fe = api.toFinanceError(
      apiError(422, { error: { code: 'VALIDATION_ERROR', message: 'Please check the highlighted fields.', field_errors: [{ field: 'vendor', message: 'String should have at least 1 character' }] } }),
    );
    expect(fe.message).toBe('String should have at least 1 character');
    expect(fe.fieldErrors.vendor).toBeDefined();
  });

  it('keeps the empty-string field key for explicit-null errors', () => {
    const fe = api.toFinanceError(apiError(422, { error: { code: 'VALIDATION_ERROR', message: 'Please check the highlighted fields.', field_errors: [{ field: '', message: 'Value error, limit_minor may not be null' }] } }));
    expect(fe.fieldErrors['']).toContain('limit_minor');
  });

  it('flags a 403 FORBIDDEN as a role problem', () => {
    const fe = api.toFinanceError(apiError(403, { error: { code: 'FORBIDDEN', message: "You don't have permission to do that.", field_errors: [] } }));
    expect(fe.forbidden).toBe(true);
    expect(fe.message).toBe('Finance is not available for your role.');
  });

  it('does not treat EMAIL_NOT_VERIFIED as a role problem', () => {
    const fe = api.toFinanceError(apiError(403, { error: { code: 'EMAIL_NOT_VERIFIED', message: 'Verify your email first.', field_errors: [] } }));
    expect(fe.forbidden).toBe(false);
    expect(fe.message).toBe('Verify your email first.');
  });

  it('falls back for non-API errors and unparseable bodies', () => {
    expect(api.toFinanceError(new TypeError('network'), 'Nope').message).toBe('Nope');
    expect(api.toFinanceError(apiError(500, 'oops'), 'Fallback').message).toBe('Fallback');
  });

  it('listCategories unwraps data.categories', async () => {
    apiClient.mockResolvedValueOnce({ data: { categories: [{ name: 'Rent', is_default: true, in_use: false }] } });
    expect(await api.listCategories()).toEqual([{ name: 'Rent', is_default: true, in_use: false }]);
    expect(apiClient).toHaveBeenCalledWith('/finance/categories');
  });

  it('getReceiptLink asks the receipt route for a fresh signed link', async () => {
    const link = { url: 'https://api.example/finance/receipts/download?token=t', expires_at: '2026-10-24T12:00:00+00:00', content_type: 'image/png' };
    apiClient.mockResolvedValueOnce({ data: link });
    expect(await api.getReceiptLink('e1')).toEqual(link);
    expect(apiClient).toHaveBeenCalledWith('/finance/expenses/e1/receipt');
  });

  it('integrations: list, sync and disconnect use the provider route', async () => {
    apiClient.mockResolvedValueOnce({ data: { encryption_configured: true, providers: [] } });
    await api.getIntegrations();
    expect(apiClient).toHaveBeenLastCalledWith('/finance/integrations');
    apiClient.mockResolvedValueOnce({ data: { connection: { id: 'c1' }, summary: { imported: 1 } } });
    expect((await api.syncIntegration('paystack')).summary.imported).toBe(1);
    expect(apiClient).toHaveBeenLastCalledWith('/finance/integrations/paystack/sync', { method: 'POST' });
    apiClient.mockResolvedValueOnce({ data: { id: 'c1', status: 'disconnected' } });
    await api.disconnectIntegration('mono');
    expect(apiClient).toHaveBeenLastCalledWith('/finance/integrations/mono/disconnect', { method: 'POST' });
  });

  it('connect sends the secret key (and hash for Flutterwave) and the Mono code', async () => {
    apiClient.mockResolvedValue({ data: { id: 'c1' } });
    await api.connectPaymentProvider('paystack', { secret_key: 'sk_test_PLACEHOLDER' });
    expect(apiClient).toHaveBeenLastCalledWith('/finance/integrations/paystack/connect', {
      method: 'POST',
      body: '{"secret_key":"sk_test_PLACEHOLDER"}',
    });
    await api.connectPaymentProvider('flutterwave', { secret_key: 'FLWSECK_TEST-PLACEHOLDER', secret_hash: 'hash' });
    expect(apiClient).toHaveBeenLastCalledWith('/finance/integrations/flutterwave/connect', {
      method: 'POST',
      body: '{"secret_key":"FLWSECK_TEST-PLACEHOLDER","secret_hash":"hash"}',
    });
    await api.connectMono('code_placeholder');
    expect(apiClient).toHaveBeenLastCalledWith('/finance/integrations/mono/connect', { method: 'POST', body: '{"code":"code_placeholder"}' });
  });

  it('invoice automation routes: remind and pay-link POST with no body', async () => {
    apiClient.mockResolvedValue({ data: { id: 'i1' } });
    await api.remindInvoice('i1');
    expect(apiClient).toHaveBeenLastCalledWith('/finance/invoices/i1/remind', { method: 'POST' });
    await api.createPayLink('i1');
    expect(apiClient).toHaveBeenLastCalledWith('/finance/invoices/i1/pay-link', { method: 'POST' });
  });

  it('model: patch assumptions sends only the changed keys and recalculate can refresh actuals', async () => {
    apiClient.mockResolvedValue({ data: { id: 'm1' } });
    await api.patchModelAssumptions('m1', { ar_days: 30, hiring_plan: null });
    expect(apiClient).toHaveBeenLastCalledWith('/finance/model/m1/assumptions', { method: 'PATCH', body: '{"ar_days":30,"hiring_plan":null}' });
    await api.recalculateModel('m1');
    expect(apiClient).toHaveBeenLastCalledWith('/finance/model/m1/recalculate', { method: 'POST', body: '{}' });
    await api.recalculateModel('m1', true);
    expect(apiClient).toHaveBeenLastCalledWith('/finance/model/m1/recalculate', { method: 'POST', body: '{"refresh_actuals":true}' });
  });
});
