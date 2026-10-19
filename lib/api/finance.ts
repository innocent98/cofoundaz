import { apiClient, ApiError } from './client';

// Finance Hub (BE module 12). Shapes are copied from the live-captured guides in
// cofoundaz-api/docs/fe-integration-guide-finance-*.md. Money is ALWAYS integer
// minor units (kobo for NGN); display conversion lives in lib/finance/format.ts.
// Every route is workspace-scoped (apiClient adds X-Workspace-Id) and allowed for
// founder / team_member / accountant only; other roles get 403.

interface Envelope<T> {
  data: T;
  meta?: unknown;
}

const unwrap = <T>(res: Envelope<T>): T => res.data;

const json = (body: unknown): RequestInit['body'] => JSON.stringify(body);

// ---------------------------------------------------------------- errors

export interface FinanceError {
  status: number;
  code: string | null;
  /** Message to show the user: the API's own text, falling back to `fallback`. */
  message: string;
  /** Per-field messages keyed by the API's `field` (may include "" and "query.x"). */
  fieldErrors: Record<string, string>;
  forbidden: boolean;
}

const GENERIC_VALIDATION = 'Please check the highlighted fields.';

export function toFinanceError(err: unknown, fallback = 'Something went wrong. Try again.'): FinanceError {
  if (err instanceof ApiError) {
    const body = (err.data ?? null) as {
      error?: { code?: string; message?: string; field_errors?: { field?: string; message?: string }[] };
    } | null;
    const apiErr = body && typeof body === 'object' ? body.error : undefined;
    const fieldErrors: Record<string, string> = {};
    for (const fe of apiErr?.field_errors ?? []) {
      if (fe?.message) fieldErrors[fe.field ?? ''] = fe.message;
    }
    let message = apiErr?.message || fallback;
    // The envelope message for request-shape errors is a constant; the useful
    // text lives in field_errors, so surface the first one.
    if (message === GENERIC_VALIDATION) {
      const first = Object.values(fieldErrors)[0];
      if (first) message = first;
    }
    if (err.status === 403) {
      message = apiErr?.code === 'EMAIL_NOT_VERIFIED' ? message : 'Finance is not available for your role.';
    }
    return {
      status: err.status,
      code: apiErr?.code ?? null,
      message,
      fieldErrors,
      forbidden: err.status === 403 && apiErr?.code !== 'EMAIL_NOT_VERIFIED',
    };
  }
  return { status: 0, code: null, message: fallback, fieldErrors: {}, forbidden: false };
}

// ---------------------------------------------------------------- transactions + cash flow

export type TransactionDirection = 'in' | 'out';
/** Only `manual` rows are user-editable; the rest are owned by their parent record. */
export type TransactionSource = 'manual' | 'invoice' | 'expense' | 'bank' | 'accounting' | 'stripe';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string | null;
  amount_minor: number;
  currency: string;
  direction: TransactionDirection;
  source: TransactionSource;
  created_at: string;
  updated_at: string;
}

export interface TransactionInput {
  date: string;
  description: string;
  category?: string | null;
  amount_minor: number;
  currency?: string;
  direction: TransactionDirection;
}

export type TransactionPatch = Partial<TransactionInput>;

export interface TransactionFilters {
  uncategorized?: boolean;
  category?: string;
  direction?: TransactionDirection;
  date_from?: string;
  date_to?: string;
}

export interface CashFlowMonth {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface CashFlow {
  cash_on_hand: number;
  monthly_burn: number;
  monthly_revenue: number;
  runway_months: number | null;
  runway_low: boolean;
  currency: string;
  by_month: CashFlowMonth[];
}

function query(params: Record<string, string | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '' || v === false) continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export async function getCashFlow(): Promise<CashFlow> {
  return unwrap(await apiClient<Envelope<CashFlow>>('/finance/cash-flow'));
}

export async function listTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  const res = await apiClient<Envelope<{ transactions: Transaction[] }>>(
    `/finance/transactions${query({ ...filters })}`,
  );
  return unwrap(res).transactions;
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  return unwrap(
    await apiClient<Envelope<Transaction>>('/finance/transactions', { method: 'POST', body: json(input) }),
  );
}

export async function updateTransaction(id: string, patch: TransactionPatch): Promise<Transaction> {
  return unwrap(
    await apiClient<Envelope<Transaction>>(`/finance/transactions/${id}`, { method: 'PATCH', body: json(patch) }),
  );
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiClient<Envelope<{ deleted: boolean }>>(`/finance/transactions/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------- runway

export interface RunwayAssumptions {
  mom_growth_percent: number;
  hiring_spend_minor: number;
  one_off_costs_minor: number;
}

export interface RunwayBaseline {
  cash_on_hand: number;
  monthly_burn: number;
  monthly_revenue: number;
  currency: string;
}

export interface RunwayPoint {
  month: string;
  cash_balance: number;
  net: number;
}

export interface RunwayScenario {
  /** null = never runs out inside the horizon; 0 = already out of cash. */
  runway_months: number | null;
  cash_out_date: string | null;
  avg_net_burn_minor: number;
  by_month: RunwayPoint[];
}

export type RunwayScenarioKey = 'base' | 'best' | 'worst';

export interface Runway {
  assumptions: RunwayAssumptions;
  baseline: RunwayBaseline;
  horizon_months: number;
  scenarios: Record<RunwayScenarioKey, RunwayScenario>;
}

export async function getRunway(): Promise<Runway> {
  return unwrap(await apiClient<Envelope<Runway>>('/finance/runway'));
}

/** Partial update. Returns the fully recomputed runway: do not GET afterwards. */
export async function saveRunwayAssumptions(patch: Partial<RunwayAssumptions>): Promise<Runway> {
  return unwrap(
    await apiClient<Envelope<Runway>>('/finance/runway/assumptions', { method: 'PUT', body: json(patch) }),
  );
}

// ---------------------------------------------------------------- invoices

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
export type InvoiceTerms = 'net_15' | 'net_30' | 'due_on_receipt';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price_minor: number;
  /** Response only; the server computes it. */
  amount_minor?: number;
}

export interface Invoice {
  id: string;
  number: string;
  client_name: string;
  client_email: string;
  line_items: (InvoiceLineItem & { amount_minor: number })[];
  subtotal_minor: number;
  tax_percent: number;
  tax_minor: number;
  total_minor: number;
  currency: string;
  terms: InvoiceTerms;
  status: InvoiceStatus;
  issued_on: string | null;
  due_on: string | null;
  paid_at: string | null;
  auto_remind: boolean;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceInput {
  client_name: string;
  client_email: string;
  line_items: { description: string; quantity: number; unit_price_minor: number }[];
  tax_percent?: number;
  currency?: string;
  terms?: InvoiceTerms;
}

export type InvoicePatch = Partial<InvoiceInput> & { auto_remind?: boolean };

export async function listInvoices(status?: InvoiceStatus): Promise<Invoice[]> {
  const res = await apiClient<Envelope<{ invoices: Invoice[] }>>(`/finance/invoices${query({ status })}`);
  return unwrap(res).invoices;
}

export async function createInvoice(input: InvoiceInput): Promise<Invoice> {
  return unwrap(await apiClient<Envelope<Invoice>>('/finance/invoices', { method: 'POST', body: json(input) }));
}

export async function updateInvoice(id: string, patch: InvoicePatch): Promise<Invoice> {
  return unwrap(
    await apiClient<Envelope<Invoice>>(`/finance/invoices/${id}`, { method: 'PATCH', body: json(patch) }),
  );
}

export async function sendInvoice(id: string): Promise<Invoice> {
  return unwrap(await apiClient<Envelope<Invoice>>(`/finance/invoices/${id}/send`, { method: 'POST' }));
}

export async function markInvoicePaid(id: string): Promise<Invoice> {
  return unwrap(await apiClient<Envelope<Invoice>>(`/finance/invoices/${id}/mark-paid`, { method: 'POST' }));
}

export async function markInvoiceUnpaid(id: string): Promise<Invoice> {
  return unwrap(await apiClient<Envelope<Invoice>>(`/finance/invoices/${id}/mark-unpaid`, { method: 'POST' }));
}

export async function deleteInvoice(id: string): Promise<void> {
  await apiClient<Envelope<{ deleted: boolean }>>(`/finance/invoices/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------- expenses

export interface Expense {
  id: string;
  vendor: string;
  category: string;
  expense_date: string;
  amount_minor: number;
  currency: string;
  recurring: boolean;
  notes: string | null;
  has_receipt: boolean;
  receipt_url: string | null;
  transaction_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseInput {
  vendor: string;
  category: string;
  expense_date: string;
  amount_minor: number;
  currency?: string;
  recurring?: boolean;
  notes?: string | null;
}

/** `notes: null` is the only allowed explicit null. */
export type ExpensePatch = Partial<ExpenseInput>;

export interface ExpenseFilters {
  category?: string;
  month?: string;
  date_from?: string;
  date_to?: string;
  recurring?: boolean;
}

export interface ExpenseSummaryRow {
  category: string;
  total_minor: number;
  percent: number;
}

export interface ExpenseSummary {
  month: string;
  currency: string;
  total_minor: number;
  rows: ExpenseSummaryRow[];
}

export const RECEIPT_TYPES = ['image/png', 'image/jpeg', 'application/pdf'] as const;
export const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;

export async function listExpenses(filters: ExpenseFilters = {}): Promise<Expense[]> {
  const res = await apiClient<Envelope<{ expenses: Expense[] }>>(`/finance/expenses${query({ ...filters })}`);
  return unwrap(res).expenses;
}

export async function getExpenseSummary(month?: string): Promise<ExpenseSummary> {
  return unwrap(await apiClient<Envelope<ExpenseSummary>>(`/finance/expenses/summary${query({ month })}`));
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  return unwrap(await apiClient<Envelope<Expense>>('/finance/expenses', { method: 'POST', body: json(input) }));
}

export async function updateExpense(id: string, patch: ExpensePatch): Promise<Expense> {
  return unwrap(
    await apiClient<Envelope<Expense>>(`/finance/expenses/${id}`, { method: 'PATCH', body: json(patch) }),
  );
}

export async function deleteExpense(id: string): Promise<void> {
  await apiClient<Envelope<{ deleted: boolean }>>(`/finance/expenses/${id}`, { method: 'DELETE' });
}

/** multipart/form-data, one part named `file`. Content-Type is left to the browser. */
export async function uploadExpenseReceipt(id: string, file: File): Promise<Expense> {
  const form = new FormData();
  form.append('file', file);
  return unwrap(
    await apiClient<Envelope<Expense>>(`/finance/expenses/${id}/receipt`, { method: 'POST', body: form }),
  );
}

export async function removeExpenseReceipt(id: string): Promise<Expense> {
  return unwrap(await apiClient<Envelope<Expense>>(`/finance/expenses/${id}/receipt`, { method: 'DELETE' }));
}

// ---------------------------------------------------------------- budgets

export interface Budget {
  id: string;
  category: string;
  period_month: string;
  limit_minor: number;
  currency: string;
  notes: string | null;
  /** Derived on every read from that month's expenses. Never sent. */
  spent_minor: number;
  variance_minor: number;
  over_budget: boolean;
  /** null iff limit_minor is 0. Not capped at 100. */
  percent_used: number | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetInput {
  category: string;
  period_month: string;
  limit_minor: number;
  currency?: string;
  notes?: string | null;
}

/** Only the limit and notes are editable; `notes: null` clears the note. */
export interface BudgetPatch {
  limit_minor?: number;
  notes?: string | null;
}

export async function listBudgets(month: string): Promise<Budget[]> {
  const res = await apiClient<Envelope<{ month: string; budgets: Budget[] }>>(
    `/finance/budgets${query({ month })}`,
  );
  return unwrap(res).budgets;
}

export async function createBudget(input: BudgetInput): Promise<Budget> {
  return unwrap(await apiClient<Envelope<Budget>>('/finance/budgets', { method: 'POST', body: json(input) }));
}

export async function updateBudget(id: string, patch: BudgetPatch): Promise<Budget> {
  return unwrap(
    await apiClient<Envelope<Budget>>(`/finance/budgets/${id}`, { method: 'PATCH', body: json(patch) }),
  );
}

export async function deleteBudget(id: string): Promise<void> {
  await apiClient<Envelope<{ deleted: boolean }>>(`/finance/budgets/${id}`, { method: 'DELETE' });
}

/** Returns ONLY the budgets just created; refetch the month to render it fully. */
export async function draftBudgetsFromActuals(periodMonth: string): Promise<Budget[]> {
  const res = await apiClient<Envelope<{ month: string; budgets: Budget[] }>>('/finance/budgets/draft-from-actuals', {
    method: 'POST',
    body: json({ period_month: periodMonth }),
  });
  return unwrap(res).budgets;
}

/** Returns ONLY the budgets just created; refetch the month to render it fully. */
export async function copyLastMonthBudgets(periodMonth: string): Promise<Budget[]> {
  const res = await apiClient<Envelope<{ month: string; budgets: Budget[] }>>('/finance/budgets/copy-last-month', {
    method: 'POST',
    body: json({ period_month: periodMonth }),
  });
  return unwrap(res).budgets;
}

// ---------------------------------------------------------------- financial model

export type FinancialModelStatus = 'generating' | 'complete' | 'failed';

export interface ModelRow {
  label: string;
  values: number[];
}

export interface ModelStatement {
  rows: ModelRow[];
}

export interface ModelAssumptions {
  monthly_revenue_growth_pct: number;
  cogs_pct_of_revenue: number;
  monthly_opex_growth_pct: number;
  ar_days: number;
  ap_days: number;
  narrative: string;
  /** `business_builder` when revenue starts from the plan sent from Business Builder, `actuals` when real transactions exist. */
  revenue_source?: 'business_builder' | 'actuals';
}

export interface FinancialModel {
  id: string;
  status: FinancialModelStatus;
  horizon_months: number;
  currency: string;
  assumptions: ModelAssumptions | null;
  pnl: ModelStatement | null;
  cash_flow: ModelStatement | null;
  balance_sheet: ModelStatement | null;
  months: string[] | null;
  error: string | null;
  generated_at: string | null;
  created_at: string;
}

/** `GET /finance/model` returns this when the workspace has never generated one. */
export interface NoFinancialModel {
  status: 'none';
}

export async function generateFinancialModel(): Promise<{ id: string; status: 'generating' }> {
  return unwrap(
    await apiClient<Envelope<{ id: string; status: 'generating' }>>('/finance/model/generate', { method: 'POST' }),
  );
}

export async function getLatestFinancialModel(): Promise<FinancialModel | NoFinancialModel> {
  return unwrap(await apiClient<Envelope<FinancialModel | NoFinancialModel>>('/finance/model'));
}

export async function getFinancialModel(id: string): Promise<FinancialModel> {
  return unwrap(await apiClient<Envelope<FinancialModel>>(`/finance/model/${id}`));
}
