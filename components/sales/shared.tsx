'use client';

import React, { useId, useState } from 'react';
import { useToast } from '@/app/(dashboard)/sales/ToastContext';
import { useActivities, type LoadStatus } from '@/hooks/useSalesCrm';
import {
  ACTIVITY_KINDS,
  ACTIVITY_KIND_LABELS,
  createActivity,
  deleteActivity,
  salesFieldErrors,
  type ActivityKind,
  type Deal,
} from '@/lib/api/sales';
import { relativeTime } from '@/lib/relative-time';
import { BTN_PRIMARY, ErrorState, INPUT, LoadingState } from '@/components/marketing-hub/states';
import { Field } from '@/components/marketing-hub/drawer';

export {
  BTN_ACCENT,
  BTN_DANGER,
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD,
  EmptyState,
  ErrorState,
  INPUT,
  LABEL,
  LoadingState,
} from '@/components/marketing-hub/states';
export { ConfirmDialog } from '@/components/marketing-hub/confirm-dialog';
export { Drawer, Field } from '@/components/marketing-hub/drawer';

/** Loading / forbidden / error gate for a Sales page; the page renders its own empty states. */
export function SalesGate({
  status,
  error,
  onRetry,
  loadingLabel,
  children,
}: {
  status: LoadStatus;
  error: string | null;
  onRetry?: () => void;
  loadingLabel?: string;
  children: React.ReactNode;
}) {
  if (status === 'loading') return <LoadingState label={loadingLabel} />;
  if (status === 'forbidden') {
    return (
      <div role="status" className="bg-white rounded-modal border border-neutral-200/80 shadow-card p-8 space-y-2">
        <h2 className="font-display font-semibold text-lg text-neutral-900">Not available for your role</h2>
        <p className="text-sm text-neutral-600">
          The Sales Hub is open to founders and team members of this workspace. Ask a founder if you need access.
        </p>
      </div>
    );
  }
  if (status === 'error') return <ErrorState message={error ?? 'Something went wrong.'} onRetry={onRetry} />;
  return <>{children}</>;
}

/** The stall badge, rendered from the API's own flags (never recomputed). */
export function StallBadge({ deal, long = false }: { deal: Pick<Deal, 'is_stalled' | 'days_inactive'>; long?: boolean }) {
  if (!deal.is_stalled) return null;
  return (
    <span
      title={`No activity for ${deal.days_inactive} days`}
      className="bg-accent-100 text-accent-800 text-[10px] font-bold px-2 py-0.5 rounded-[6px] flex items-center gap-1 shrink-0"
    >
      <span aria-hidden="true">⚠</span> {long ? `Stalled, ${deal.days_inactive} days` : 'Stalled'}
    </span>
  );
}

export function OwnerSelect({
  id,
  value,
  owners,
  onChange,
}: {
  id: string;
  value: string | null;
  owners: { user_id: string; name: string | null; email: string }[];
  onChange: (ownerId: string | null) => void;
}) {
  // A former member can still be the stored owner; keep the option so the select does not lie.
  const known = value === null || owners.some((o) => o.user_id === value);
  return (
    <select id={id} className={INPUT} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">Unassigned</option>
      {!known && <option value={value ?? ''}>Former member</option>}
      {owners.map((o) => (
        <option key={o.user_id} value={o.user_id}>
          {o.name?.trim() || o.email}
        </option>
      ))}
    </select>
  );
}

const KIND_STYLE: Record<ActivityKind, string> = {
  note: 'bg-neutral-100 text-neutral-700',
  call: 'bg-brand-100 text-brand-800',
  email: 'bg-accent-100 text-accent-800',
  meeting: 'bg-brand-50 text-brand-700',
};

/**
 * The activity timeline of one record plus the "Log activity" form. `filter` is what
 * the list reads; `link` is what a new activity is attached to (an account page's
 * contact drawer logs against the contact and its account so both timelines show it).
 */
export function ActivityLog({
  filter,
  link,
  nameOf,
  onLogged,
  heading = 'Activity',
}: {
  filter: { account_id?: string; contact_id?: string; deal_id?: string };
  link: { account_id?: string | null; contact_id?: string | null; deal_id?: string | null };
  nameOf: (ownerId: string | null) => string;
  onLogged?: () => void;
  heading?: string;
}) {
  const { runAction } = useToast();
  const activities = useActivities(filter);
  const [kind, setKind] = useState<ActivityKind>('note');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const bodyId = useId();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) {
      setError('Write what happened.');
      return;
    }
    setBusy(true);
    setError(undefined);
    const res = await runAction(() => createActivity({ kind, body: text, ...link }), 'Activity logged');
    setBusy(false);
    if (res.ok) {
      setBody('');
      await activities.reload();
      onLogged?.();
    }
  };

  const remove = async (id: string) => {
    const res = await runAction(() => deleteActivity(id), 'Activity deleted');
    if (res.ok) {
      await activities.reload();
      onLogged?.();
    }
  };

  const items = activities.data?.items ?? [];

  return (
    <section aria-label={heading} className="space-y-4">
      <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{heading}</h3>

      <form onSubmit={submit} className="space-y-3" noValidate>
        <div className="flex gap-2">
          <select
            aria-label="Activity type"
            className={`${INPUT} !w-auto shrink-0`}
            value={kind}
            onChange={(e) => setKind(e.target.value as ActivityKind)}
          >
            {ACTIVITY_KINDS.map((k) => (
              <option key={k} value={k}>
                {ACTIVITY_KIND_LABELS[k]}
              </option>
            ))}
          </select>
          <Field label="What happened" htmlFor={bodyId} error={error}>
            <input
              id={bodyId}
              className={INPUT}
              placeholder="Met for coffee, sent the deck..."
              value={body}
              maxLength={4000}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>
        </div>
        <button type="submit" className={BTN_PRIMARY} disabled={busy}>
          {busy ? 'Logging...' : 'Log activity'}
        </button>
      </form>

      {activities.status === 'loading' && <LoadingState label="Loading activity" />}
      {activities.status === 'error' && <ErrorState message={activities.error ?? 'Could not load activity.'} onRetry={() => void activities.reload()} />}
      {activities.status === 'ready' && items.length === 0 && (
        <p className="text-sm text-neutral-500">No activity yet. Log the first call, email, meeting or note above.</p>
      )}
      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 text-sm border-b border-neutral-100 pb-3 last:border-0">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${KIND_STYLE[a.kind]}`}>
                    {ACTIVITY_KIND_LABELS[a.kind]}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {nameOf(a.author_id)} · {relativeTime(a.occurred_at)}
                  </span>
                </div>
                <p className="text-neutral-800 whitespace-pre-wrap break-words">{a.body}</p>
              </div>
              <button
                type="button"
                onClick={() => void remove(a.id)}
                aria-label={`Delete ${ACTIVITY_KIND_LABELS[a.kind].toLowerCase()} from ${relativeTime(a.occurred_at)}`}
                className="text-xs text-neutral-500 hover:text-danger-700 shrink-0 cursor-pointer"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Field errors keyed by the API field name, for forms that submit a whole body. */
export function useFieldErrors() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  return {
    errors,
    clear: () => setErrors({}),
    set: (err: unknown) => {
      const fe = salesFieldErrors(err);
      setErrors(fe);
      return fe;
    },
  };
}
