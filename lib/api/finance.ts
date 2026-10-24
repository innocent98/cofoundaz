import { API_BASE, apiClient, ApiError } from './client';

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
export type TransactionSource =
  | 'manual'
  | 'invoice'
  | 'expense'
  | 'bank'
  | 'accounting'
  | 'paystack'
  | 'flutterwave';

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

/** One page of a cursor-paginated list. `total` is the exact count for the current filters. */
export interface Page<T> {
  items: T[];
  /** null on the last page. Pass back unchanged, with the same filters. */
  nextCursor: string | null;
  total: number | null;
}

interface PageMeta {
  next_cursor?: string | null;
  total_estimate?: number | null;
}

function toPage<T>(items: T[], meta: unknown): Page<T> {
  const m = (meta ?? {}) as PageMeta;
  return { items, nextCursor: m.next_cursor ?? null, total: m.total_estimate ?? null };
}

export const PAGE_SIZE = 50;

export async function listTransactions(
  filters: TransactionFilters = {},
  cursor?: string | null,
  limit: number = PAGE_SIZE,
): Promise<Page<Transaction>> {
  const res = await apiClient<Envelope<{ transactions: Transaction[] }>>(
    `/finance/transactions${query({ ...filters, limit: String(limit), cursor: cursor ?? undefined })}`,
  );
  return toPage(unwrap(res).transactions, res.meta);
}

// ---------------------------------------------------------------- categories

export interface FinanceCategory {
  name: string;
  is_default: boolean;
  in_use: boolean;
}

/** Defaults plus every category the workspace has used, one entry per case-folded name. */
export async function listCategories(): Promise<FinanceCategory[]> {
  const res = await apiClient<Envelope<{ categories: FinanceCategory[] }>>('/finance/categories');
  return unwrap(res).categories;
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
  /** Hosted checkout link; null when none was created (draft, no connection, or creation failed). */
  pay_url: string | null;
  pay_provider: PaymentProviderId | null;
  /** Set only when the provider's webhook paid the invoice. */
  paid_via: PaymentProviderId | null;
  last_reminded_at: string | null;
  reminder_count: number;
  overdue_notified_at: string | null;
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

export async function listInvoices(
  status?: InvoiceStatus,
  cursor?: string | null,
  limit: number = PAGE_SIZE,
): Promise<Page<Invoice>> {
  const res = await apiClient<Envelope<{ invoices: Invoice[] }>>(
    `/finance/invoices${query({ status, limit: String(limit), cursor: cursor ?? undefined })}`,
  );
  return toPage(unwrap(res).invoices, res.meta);
}

/** Queues a reminder email to the client. 422 unless sent, past due and no reminder in 24 hours. */
export async function remindInvoice(id: string): Promise<Invoice> {
  return unwrap(await apiClient<Envelope<Invoice>>(`/finance/invoices/${id}/remind`, { method: 'POST' }));
}

/** Creates or retries the pay link of a sent NGN invoice while a connection is active. */
export async function createPayLink(id: string): Promise<Invoice> {
  return unwrap(await apiClient<Envelope<Invoice>>(`/finance/invoices/${id}/pay-link`, { method: 'POST' }));
}

/**
 * Fetches the invoice PDF with the bearer token (a plain link cannot send it) and
 * hands the browser a blob download. Throws ApiError.
 */
export async function downloadInvoicePdf(invoice: Pick<Invoice, 'id' | 'number'>): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('cf_token') : null;
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('cf_workspace_id') : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (workspaceId) headers['X-Workspace-Id'] = workspaceId;
  const res = await fetch(`${API_BASE}/finance/invoices/${encodeURIComponent(invoice.id)}/pdf`, { headers });
  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* not JSON */
    }
    throw new ApiError(res.status, res.statusText, data);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `invoice-${invoice.number}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
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
  /** An API route (never a storage URL). Do not open it directly: call `getReceiptLink`. */
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

export async function listExpenses(
  filters: ExpenseFilters = {},
  cursor?: string | null,
  limit: number = PAGE_SIZE,
): Promise<Page<Expense>> {
  const res = await apiClient<Envelope<{ expenses: Expense[] }>>(
    `/finance/expenses${query({ ...filters, limit: String(limit), cursor: cursor ?? undefined })}`,
  );
  return toPage(unwrap(res).expenses, res.meta);
}

export interface ReceiptLink {
  /** Signed, needs no bearer token, expires in about 5 minutes. Never cache or store it. */
  url: string;
  expires_at: string;
  content_type: 'image/png' | 'image/jpeg' | 'application/pdf';
}

/** Asks for a fresh signed link each time the user opens a receipt. */
export async function getReceiptLink(expenseId: string): Promise<ReceiptLink> {
  return unwrap(await apiClient<Envelope<ReceiptLink>>(`/finance/expenses/${expenseId}/receipt`));
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
  /** null on an unbudgeted row (spend in a category with no budget). */
  id: string | null;
  category: string;
  period_month: string;
  /** null on an unbudgeted row. */
  limit_minor: number | null;
  currency: string;
  notes: string | null;
  /** Derived on every read: every money-out ledger row of the month in this category. Never sent. */
  spent_minor: number;
  variance_minor: number | null;
  /** (spent - limit) / limit, one decimal. null when the limit is 0 or missing. */
  variance_percent: number | null;
  over_budget: boolean;
  /** null when the limit is 0 or missing. Not capped at 100. */
  percent_used: number | null;
  /** `under` below 80%, `near` from 80% to 100%, `over` above, `unbudgeted` for spend with no budget. */
  status: BudgetStatus;
  unbudgeted: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export type BudgetStatus = 'under' | 'near' | 'over' | 'unbudgeted';

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

export interface HiringPlanItem {
  role: string;
  /** YYYY-MM, inside the model's months. */
  start_month: string;
  monthly_cost_minor: number;
}
export interface DatedCost {
  label: string;
  month: string;
  amount_minor: number;
}

/** What the engine used: the AI's values with the founder's edits on top. Bind the editor to this. */
export interface ModelAssumptions {
  monthly_revenue_growth_pct: number;
  cogs_pct_of_revenue: number;
  monthly_opex_growth_pct: number;
  ar_days: number;
  ap_days: number;
  narrative: string;
  /** `business_builder` when revenue starts from the plan sent from Business Builder, `actuals` when real transactions exist. */
  revenue_source?: 'business_builder' | 'actuals';
  revenue_0_minor?: number;
  monthly_costs_0_minor?: number;
  depreciation_months?: number;
  hiring_plan?: HiringPlanItem[];
  one_offs?: DatedCost[];
  capex?: DatedCost[];
}

/** The founder's edits only; `null` when nothing is edited. */
export type ModelOverrides = Partial<Omit<ModelAssumptions, 'narrative' | 'revenue_source'>>;

export interface ModelYearly {
  periods: { label: string; start_month: string; end_month: string }[];
  pnl: ModelStatement;
  cash_flow: ModelStatement;
  balance_sheet: ModelStatement;
}

export interface FinancialModel {
  id: string;
  status: FinancialModelStatus;
  horizon_months: number;
  currency: string;
  /** true when saved edits are not in the statements yet: offer Recalculate. */
  stale: boolean;
  overrides: ModelOverrides | null;
  recalculated_at: string | null;
  /** null on a model generated before the check existed. */
  balance_check: { balanced: boolean; max_abs_difference_minor: number } | null;
  assumptions: ModelAssumptions | null;
  /** The AI's baseline, shown as "AI suggested X" next to an edited field. */
  ai_assumptions: Omit<ModelAssumptions, 'hiring_plan' | 'one_offs' | 'capex'> | null;
  pnl: ModelStatement | null;
  cash_flow: ModelStatement | null;
  balance_sheet: ModelStatement | null;
  months: string[] | null;
  yearly: ModelYearly | null;
  error: string | null;
  generated_at: string | null;
  created_at: string;
  /** Recalculate response only: saved edits that fall outside the projection window. */
  warnings?: string[];
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

/** Saves edits. Omit = untouched, `null` = clear that edit, a list replaces the whole list. Statements do not change. */
export type ModelAssumptionsPatch = {
  [K in keyof ModelOverrides]?: ModelOverrides[K] | null;
};

export async function patchModelAssumptions(id: string, patch: ModelAssumptionsPatch): Promise<FinancialModel> {
  return unwrap(
    await apiClient<Envelope<FinancialModel>>(`/finance/model/${id}/assumptions`, {
      method: 'PATCH',
      body: json(patch),
    }),
  );
}

/** Re-runs the engine with the saved edits. Instant and costs no AI. */
export async function recalculateModel(id: string, refreshActuals = false): Promise<FinancialModel> {
  return unwrap(
    await apiClient<Envelope<FinancialModel>>(`/finance/model/${id}/recalculate`, {
      method: 'POST',
      body: json(refreshActuals ? { refresh_actuals: true } : {}),
    }),
  );
}

// ---------------------------------------------------------------- integrations (payments + bank)

export type PaymentProviderId = 'paystack' | 'flutterwave';
export type IntegrationProviderId = PaymentProviderId | 'mono';
export type ConnectionStatus = 'active' | 'needs_attention' | 'disconnected';

export interface SyncSummary {
  imported: number;
  fees: number;
  refunds: number;
  duplicates: number;
  invoice_matched: number;
  skipped_currency: number;
  skipped_oversize: number;
  fetched: number;
  credits: number;
  debits: number;
  paystack_payouts: number;
  paystack_unmatched: number;
}

/** The secret key is never returned: only the last 4 characters. */
export interface Connection {
  id: string;
  provider: IntegrationProviderId;
  status: ConnectionStatus;
  mode: 'test' | 'live';
  key_last4: string;
  account_name: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  last_sync_summary: Partial<SyncSummary> | null;
  webhook_url: string;
  created_at: string;
}

export interface MonoConnectConfig {
  /** false: the server has no Mono keys yet, show "Coming soon". */
  configured: boolean;
  public_key?: string | null;
  sandbox?: boolean;
}

export interface ProviderEntry {
  provider: IntegrationProviderId;
  label: string;
  key_hint: string;
  kind: 'payments' | 'bank';
  connection: Connection | null;
  connect_config: MonoConnectConfig | null;
}

export interface Integrations {
  /** false: connect and sync answer 503 until the server has an encryption key. */
  encryption_configured: boolean;
  providers: ProviderEntry[];
}

export async function getIntegrations(): Promise<Integrations> {
  return unwrap(await apiClient<Envelope<Integrations>>('/finance/integrations'));
}

/** Founder only. The key lives in this call's arguments only: never store it. */
export async function connectPaymentProvider(
  provider: PaymentProviderId,
  body: { secret_key: string; secret_hash?: string },
): Promise<Connection> {
  return unwrap(
    await apiClient<Envelope<Connection>>(`/finance/integrations/${provider}/connect`, {
      method: 'POST',
      body: json(body),
    }),
  );
}

/** Founder only. `code` is the one-time code Mono Connect hands the widget. */
export async function connectMono(code: string): Promise<Connection> {
  return unwrap(
    await apiClient<Envelope<Connection>>('/finance/integrations/mono/connect', {
      method: 'POST',
      body: json({ code }),
    }),
  );
}

export async function syncIntegration(
  provider: IntegrationProviderId,
): Promise<{ connection: Connection; summary: SyncSummary }> {
  return unwrap(
    await apiClient<Envelope<{ connection: Connection; summary: SyncSummary }>>(
      `/finance/integrations/${provider}/sync`,
      { method: 'POST' },
    ),
  );
}

/** Founder only. Imported rows stay. */
export async function disconnectIntegration(provider: IntegrationProviderId): Promise<Connection> {
  return unwrap(
    await apiClient<Envelope<Connection>>(`/finance/integrations/${provider}/disconnect`, { method: 'POST' }),
  );
}
