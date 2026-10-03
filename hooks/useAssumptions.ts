import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/lib/api/client';
import {
  listAssumptions,
  createAssumption,
  updateAssumption,
  type AssumptionStatus,
  type AssumptionRisk,
  type RawAssumption,
} from '@/lib/api/validation';

export type { AssumptionStatus, AssumptionRisk } from '@/lib/api/validation';

/** FE-friendly assumption shape (camelCase evidence count). */
export interface Assumption {
  id: string;
  statement: string;
  risk: AssumptionRisk;
  status: AssumptionStatus;
  evidenceCount: number;
}

function toAssumption(r: RawAssumption): Assumption {
  return {
    id: r.id,
    statement: r.statement,
    risk: r.risk,
    status: r.status,
    evidenceCount: r.evidence_count ?? 0,
  };
}

function errMsg(err: unknown): string {
  if (err instanceof ApiError) {
    const d = err.data as { error?: { message?: string } } | undefined;
    if (err.status === 403) return "You don't have access to validation in this workspace.";
    return d?.error?.message || 'Could not load assumptions.';
  }
  return 'Could not load assumptions.';
}

/**
 * Real Validation Hub assumptions (guide §1): list + create + status move.
 * `GET/POST/PATCH /validation/assumptions`.
 */
export function useAssumptions() {
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await listAssumptions();
      setAssumptions(rows.map(toAssumption));
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const addAssumption = useCallback(async (statement: string, risk: AssumptionRisk = 'high') => {
    const trimmed = statement.trim();
    if (!trimmed) return;
    const created = await createAssumption({ statement: trimmed, risk });
    setAssumptions((prev) => [toAssumption(created), ...prev]);
  }, []);

  const updateStatus = useCallback(
    async (id: string, status: AssumptionStatus) => {
      // Optimistic; reconcile with server truth on failure.
      setAssumptions((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      try {
        await updateAssumption(id, { status });
      } catch (err) {
        void load();
        throw err;
      }
    },
    [load]
  );

  return { assumptions, loading, error, addAssumption, updateStatus, refetch: load };
}
