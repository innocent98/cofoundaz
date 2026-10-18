import { useCallback } from 'react';
import {
  getCashFlow,
  getRunway,
  listBudgets,
  listExpenses,
  listInvoices,
  listTransactions,
  getExpenseSummary,
  type Budget,
  type CashFlow,
  type Expense,
  type ExpenseSummary,
  type Invoice,
  type Runway,
  type Transaction,
} from '@/lib/api/finance';
import { useFinanceResource, type FinanceResource } from './useFinanceResource';

// Finance Hub data hooks. Each wraps one list/summary endpoint in the shared
// loading / ready / error / forbidden state machine. Writes go through
// lib/api/finance.ts directly from the pages, then call `reload()`.

export function useCashFlow(): FinanceResource<CashFlow> {
  return useFinanceResource(getCashFlow);
}

export function useTransactions(): FinanceResource<Transaction[]> {
  const load = useCallback(() => listTransactions(), []);
  return useFinanceResource(load);
}

export function useRunway(): FinanceResource<Runway> {
  return useFinanceResource(getRunway);
}

export function useInvoices(): FinanceResource<Invoice[]> {
  const load = useCallback(() => listInvoices(), []);
  return useFinanceResource(load);
}

export function useExpenses(month: string): FinanceResource<Expense[]> {
  const load = useCallback(() => listExpenses({ month }), [month]);
  return useFinanceResource(load);
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
 * Categories already used on expenses, for the shared picker on the Expenses and
 * Budgets forms. Budget "spent" matches the category string exactly, so both
 * forms must offer the same list.
 */
export const SUGGESTED_CATEGORIES = [
  'Payroll',
  'Infrastructure',
  'Software',
  'Marketing',
  'Operations',
  'Legal',
  'Equipment',
];

export function useKnownCategories(): string[] {
  const load = useCallback(() => listExpenses(), []);
  const { data } = useFinanceResource(load);
  const used = (data ?? []).map((e) => e.category);
  return Array.from(new Set([...used, ...SUGGESTED_CATEGORIES]));
}
