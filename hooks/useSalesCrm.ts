'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '@/lib/api/sales';
import { isForbiddenError, salesErrorMessage } from '@/lib/api/sales';
import { listMembers, memberLabel, type TeamMember } from '@/lib/api/members';

// Sales CRM data hooks (Pipeline, Leads, Accounts). Every read exposes the same
// four honest states (loading / ready / error / forbidden) so a page never
// renders sample rows. Mutations are called straight from the api module by the
// page; the board's drag-and-drop move lives here because it is optimistic.

export type LoadStatus = 'loading' | 'ready' | 'error' | 'forbidden';

export interface Loader<T> {
  data: T | null;
  status: LoadStatus;
  error: string | null;
  /** Refetch; stale data stays visible. Resolves once the new data (or error) is in. */
  reload: () => Promise<void>;
  /** Patch the cached data locally (optimistic updates). */
  setData: (updater: (prev: T | null) => T | null) => void;
  /** The cached data right now, without waiting for a render. */
  getData: () => T | null;
}

interface LoaderState<T> {
  data: T | null;
  status: LoadStatus;
  error: string | null;
}

/**
 * Load `fetcher()` on mount and whenever the (memoised) fetcher identity changes.
 * A `null` fetcher keeps the loader idle in the loading state (nothing to fetch yet).
 */
export function useLoader<T>(fetcher: (() => Promise<T>) | null): Loader<T> {
  const [state, setState] = useState<LoaderState<T>>({ data: null, status: 'loading', error: null });
  const reqId = useRef(0);
  const dataRef = useRef<T | null>(null);

  const run = useCallback(
    async (showLoading: boolean) => {
      if (!fetcher) return;
      const id = ++reqId.current;
      if (showLoading) setState((s) => ({ ...s, status: 'loading', error: null }));
      try {
        const data = await fetcher();
        if (id === reqId.current) {
          dataRef.current = data;
          setState({ data, status: 'ready', error: null });
        }
      } catch (err) {
        if (id !== reqId.current) return;
        setState((s) => ({
          data: s.data,
          status: isForbiddenError(err) ? 'forbidden' : 'error',
          error: salesErrorMessage(err, 'Could not load this data.'),
        }));
      }
    },
    [fetcher]
  );

  const invalidate = useCallback(() => {
    reqId.current++;
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void run(true);
    });
    return invalidate;
  }, [run, invalidate]);

  const reload = useCallback(() => run(dataRef.current === null), [run]);

  // Computed from the ref, not inside the setState updater: React may run an updater later,
  // and a rollback that reads "the card as it was" must not depend on when that happens.
  const setData = useCallback((updater: (prev: T | null) => T | null) => {
    const next = updater(dataRef.current);
    dataRef.current = next;
    setState((s) => ({ ...s, data: next }));
  }, []);

  const getData = useCallback(() => dataRef.current, []);

  return { data: state.data, status: state.status, error: state.error, reload, setData, getData };
}

// ---------------------------------------------------------------- members (owner names)

export function useMembers() {
  const res = useLoader<TeamMember[]>(listMembers);
  const byId = useMemo(() => new Map((res.data ?? []).map((m) => [m.user_id, m])), [res.data]);
  /** Name (else email) of a member, "Unassigned" for null, "Former member" when they are gone. */
  const nameOf = useCallback(
    (ownerId: string | null | undefined) => {
      if (!ownerId) return 'Unassigned';
      const m = byId.get(ownerId);
      return m ? memberLabel(m) : 'Former member';
    },
    [byId]
  );
  // Only founders and team members can own sales records.
  const owners = useMemo(() => (res.data ?? []).filter((m) => m.role === 'founder' || m.role === 'team_member'), [res.data]);
  return { members: res.data ?? [], owners, nameOf };
}

// ---------------------------------------------------------------- board

export interface BoardData {
  overview: api.SalesOverview;
  stages: api.Stage[];
  deals: api.Deal[];
}

async function loadBoard(): Promise<BoardData> {
  const [overview, stages, deals] = await Promise.all([api.getOverview(), api.getStages(), api.listAllDeals()]);
  return { overview, stages, deals };
}

/**
 * The pipeline board: overview, stages and deals together. `moveDeal` is
 * optimistic: the card jumps columns at once and jumps back if the API refuses
 * (it throws the ApiError so the page can show the API's own message).
 */
export function useSalesBoard() {
  const loader = useLoader<BoardData>(loadBoard);
  const { setData, getData, reload } = loader;

  const moveDeal = useCallback(
    async (
      dealId: string,
      stageId: string,
      lost?: { closed_reason: api.ClosedReason; closed_note?: string | null }
    ): Promise<api.DealDetail> => {
      const before = getData()?.deals.find((d) => d.id === dealId);
      setData((prev) =>
        prev ? { ...prev, deals: prev.deals.map((d) => (d.id === dealId ? { ...d, stage_id: stageId } : d)) } : prev
      );
      try {
        const moved = await api.moveDeal(dealId, stageId, lost);
        setData((prev) =>
          prev ? { ...prev, deals: prev.deals.map((d) => (d.id === dealId ? stripHistory(moved) : d)) } : prev
        );
        void reload();
        return moved;
      } catch (err) {
        setData((prev) =>
          prev && before ? { ...prev, deals: prev.deals.map((d) => (d.id === dealId ? before : d)) } : prev
        );
        throw err;
      }
    },
    [setData, getData, reload]
  );

  return { ...loader, moveDeal };
}

function stripHistory(d: api.DealDetail): api.Deal {
  const rest: Partial<api.DealDetail> = { ...d };
  delete rest.stage_history;
  return rest as api.Deal;
}

// ---------------------------------------------------------------- lists

export const PAGE_SIZE = 25;

export function useLeadList(query: { q: string; status: api.LeadStatus | ''; offset: number }) {
  const { q, status, offset } = query;
  const fetcher = useCallback(
    () => api.listLeads({ q: q || undefined, status: status || undefined, limit: PAGE_SIZE, offset }),
    [q, status, offset]
  );
  return useLoader(fetcher);
}

export function useAccountList(query: { q: string; offset: number }) {
  const { q, offset } = query;
  const fetcher = useCallback(() => api.listAccounts({ q: q || undefined, limit: PAGE_SIZE, offset }), [q, offset]);
  return useLoader(fetcher);
}

export function useAccountDetail(accountId: string | null) {
  const fetcher = useMemo(() => (accountId ? () => api.getAccount(accountId) : null), [accountId]);
  return useLoader(fetcher);
}

export function useDealDetail(dealId: string | null) {
  const fetcher = useMemo(() => (dealId ? () => api.getDeal(dealId) : null), [dealId]);
  return useLoader(fetcher);
}

export function useContact(contactId: string | null) {
  const fetcher = useMemo(() => (contactId ? () => api.getContact(contactId) : null), [contactId]);
  return useLoader(fetcher);
}

/** Activities for one record, newest first. Needs at least one id (the API 422s otherwise). */
export function useActivities(filter: { account_id?: string; contact_id?: string; deal_id?: string } | null) {
  const { account_id, contact_id, deal_id } = filter ?? {};
  const fetcher = useMemo(
    () =>
      account_id || contact_id || deal_id
        ? () => api.listActivities({ account_id, contact_id, deal_id, limit: 100 })
        : null,
    [account_id, contact_id, deal_id]
  );
  return useLoader(fetcher);
}

/** Every account, for the deal / contact pickers (bounded to two pages). */
export function useAccountOptions() {
  const fetcher = useCallback(async () => {
    const first = await api.listAccounts({ limit: 200 });
    if (first.total <= first.items.length) return first.items;
    const second = await api.listAccounts({ limit: 200, offset: 200 });
    return [...first.items, ...second.items];
  }, []);
  return useLoader<api.Account[]>(fetcher);
}

/** Contacts of one account, for the deal drawer's contact picker. */
export function useContactOptions(accountId: string | null) {
  const fetcher = useMemo(
    () => (accountId ? async () => (await api.listContacts({ account_id: accountId, limit: 200 })).items : null),
    [accountId]
  );
  return useLoader<api.Contact[]>(fetcher);
}
