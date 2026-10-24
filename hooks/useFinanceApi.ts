import { useCallback } from 'react';
import {
  getCashFlow,
  getIntegrations,
  listCategories,
  getRunway,
  listBudgets,
  listExpenses,
  listInvoices,
  listTransactions,
  getExpenseSummary,
  type Budget,
  type CashFlow,
  type Expense,
  type FinanceCategory,
  type Integrations,
  type InvoiceStatus,
  type TransactionFilters,
  type ExpenseSummary,
  type Invoice,
  type Runway,
  type Transaction,
} from '@/lib/api/finance';
import { useFinancePaged, type PagedList } from './useFinancePaged';
import { useFinanceResource, type FinanceResource } from './useFinanceResource';

// Finance Hub data hooks. Each wraps one list/summary endpoint in the shared
// loading / ready / error / forbidden state machine. Writes go through
// lib/api/finance.ts directly from the pages, then call `reload()`.

export function useCashFlow(): FinanceResource<CashFlow> {
  return useFinanceResource(getCashFlow);
}

export function useTransactions(filters: TransactionFilters): PagedList<Transaction> {
  const { uncategorized, category, direction, date_from, date_to } = filters;
  const fetchPage = useCallback(
    (cursor: string | null) => listTransactions({ uncategorized, category, direction, date_from, date_to }, cursor),
    [uncategorized, category, direction, date_from, date_to],
  );
  return useFinancePaged(fetchPage);
}

export function useRunway(): FinanceResource<Runway> {
  return useFinanceResource(getRunway);
}

export function useInvoices(status?: InvoiceStatus): PagedList<Invoice> {
  const fetchPage = useCallback((cursor: string | null) => listInvoices(status, cursor), [status]);
  return useFinancePaged(fetchPage);
}

export function useExpenses(month: string): PagedList<Expense> {
  const fetchPage = useCallback((cursor: string | null) => listExpenses({ month }, cursor), [month]);
  return useFinancePaged(fetchPage);
}

export function useExpenseSummary(month: string): FinanceResource<ExpenseSummary> {
  const load = useCallback(() => getExpenseSummary(month), [month]);
  return useFinanceResource(load);
}

export function useBudgets(month: string): FinanceResource<Budget[]> {
  const load = useCallback(() => listBudgets(month), [month]);
  return useFinanceResource(load);
}

/**
 * The category list for every picker: the defaults plus every category the
 * workspace has used, one entry per case-folded name. `reload` after a write
 * that may introduce a new category.
 */
export function useCategories(): FinanceResource<FinanceCategory[]> {
  return useFinanceResource(listCategories);
}

export function useIntegrations(): FinanceResource<Integrations> {
  return useFinanceResource(getIntegrations);
}

/** Exact count of ledger rows with no category, for the "Needs a category" chip. */
export function useUncategorizedCount(): FinanceResource<number> {
  const load = useCallback(async () => (await listTransactions({ uncategorized: true }, null, 1)).total ?? 0, []);
  return useFinanceResource(load);
}
