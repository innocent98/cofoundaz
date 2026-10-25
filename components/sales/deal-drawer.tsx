'use client';

import { FollowUpSection } from './follow-up';
import React, { useId, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/app/(dashboard)/sales/ToastContext';
import {
  useAccountOptions,
  useContactOptions,
  useDealDetail,
  useMembers,
} from '@/hooks/useSalesCrm';
import {
  CLOSED_REASONS,
  contactName,
  createDeal,
  deleteDeal,
  dueLabel,
  formatMoney,
  isOverdue,
  koboToNairaInput,
  nairaToKobo,
  salesErrorMessage,
  salesFieldErrors,
  updateDeal,
  type ClosedReason,
  type DealDetail,
  type DealPatch,
  type Stage,
} from '@/lib/api/sales';
import { relativeTime } from '@/lib/relative-time';
import { ModalDialog } from '@/components/modal-dialog';
import {
  ActivityLog,
  BTN_ACCENT,
  BTN_DANGER,
  BTN_PRIMARY,
  BTN_SECONDARY,
  ConfirmDialog,
  Drawer,
  ErrorState,
  Field,
  INPUT,
  LoadingState,
  OwnerSelect,
  StallBadge,
} from './shared';

type Owners = ReturnType<typeof useMembers>['owners'];

// ---------------------------------------------------------------- lost reason

/** Asks why a deal was lost before the move is sent (the API 422s a lost move without a reason). */
export function LostReasonModal({
  dealName,
  onConfirm,
  onCancel,
}: {
  dealName: string;
  onConfirm: (reason: ClosedReason, note: string | null) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState<ClosedReason | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const noteId = useId();

  const submit = async () => {
    if (!reason) return;
    setBusy(true);
    try {
      await onConfirm(reason, note.trim() || null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalDialog
      label="Why was this deal lost?"
      onClose={onCancel}
      overlayClassName="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      className="bg-white rounded-modal p-6 md:p-8 w-full max-w-sm shadow-accent space-y-5 outline-none"
    >
      <div>
        <h2 className="text-xl font-display font-bold text-neutral-900">Why was this deal lost?</h2>
        <p className="text-sm text-neutral-500 mt-1">{dealName}</p>
      </div>
      <div role="radiogroup" aria-label="Reason" className="grid grid-cols-2 gap-3">
        {CLOSED_REASONS.map((r) => (
          <button
            key={r.value}
            type="button"
            role="radio"
            aria-checked={reason === r.value}
            onClick={() => setReason(r.value)}
            className={`px-4 py-2 border rounded-card text-sm font-medium transition-colors cursor-pointer ${
              reason === r.value
                ? 'bg-brand-100 border-brand-700 text-brand-900'
                : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <Field label="Note (optional)" htmlFor={noteId}>
        <textarea
          id={noteId}
          rows={2}
          maxLength={2000}
          className={INPUT}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className={BTN_SECONDARY}>
          Cancel
        </button>
        <button type="button" onClick={() => void submit()} disabled={!reason || busy} className={BTN_PRIMARY}>
          {busy ? 'Saving...' : 'Mark as lost'}
        </button>
      </div>
    </ModalDialog>
  );
}

// ---------------------------------------------------------------- add deal

interface DealForm {
  name: string;
  account_id: string;
  contact_id: string;
  value: string;
  stage_id: string;
  next_step: string;
  next_step_due: string;
  owner_id: string | null;
}

function AccountContactFields({
  form,
  setForm,
  errors,
}: {
  form: Pick<DealForm, 'account_id' | 'contact_id'>;
  setForm: (patch: Partial<DealForm>) => void;
  errors: Record<string, string>;
}) {
  const accounts = useAccountOptions();
  const contacts = useContactOptions(form.account_id || null);
  const accountId = useId();
  const contactId = useId();
  return (
    <>
      <Field label="Account" htmlFor={accountId} error={errors.account_id}>
        <select
          id={accountId}
          className={INPUT}
          value={form.account_id}
          onChange={(e) => setForm({ account_id: e.target.value, contact_id: '' })}
        >
          <option value="">No account</option>
          {(accounts.data ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Contact"
        htmlFor={contactId}
        error={errors.contact_id}
        hint={form.account_id ? undefined : 'Pick an account to choose one of its contacts.'}
      >
        <select
          id={contactId}
          className={INPUT}
          value={form.contact_id}
          disabled={!form.account_id}
          onChange={(e) => setForm({ contact_id: e.target.value })}
        >
          <option value="">No contact</option>
          {(contacts.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {contactName(c)}
            </option>
          ))}
        </select>
      </Field>
    </>
  );
}

export function AddDealDrawer({
  stages,
  onClose,
  onCreated,
}: {
  stages: Stage[];
  onClose: () => void;
  onCreated: (dealId: string) => void;
}) {
  const { runAction } = useToast();
  const { owners } = useMembers();
  const openStages = stages.filter((s) => s.kind === 'open');
  const [form, setFormState] = useState<DealForm>({
    name: '',
    account_id: '',
    contact_id: '',
    value: '',
    stage_id: (openStages[0] ?? stages[0])?.id ?? '',
    next_step: '',
    next_step_due: '',
    owner_id: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const ids = { name: useId(), value: useId(), stage: useId(), step: useId(), due: useId(), owner: useId() };
  const setForm = (patch: Partial<DealForm>) => setFormState((f) => ({ ...f, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Give the deal a name.';
    const kobo = nairaToKobo(form.value);
    if (kobo === null) next.value_minor = 'Enter an amount in naira, like 250000 or 1500.50.';
    setErrors(next);
    if (Object.keys(next).length > 0 || kobo === null) return;

    setBusy(true);
    const res = await runAction(
      () =>
        createDeal({
          name: form.name.trim(),
          account_id: form.account_id || null,
          contact_id: form.contact_id || null,
          value_minor: kobo,
          stage_id: form.stage_id || undefined,
          next_step: form.next_step.trim() || null,
          next_step_due: form.next_step_due || null,
          owner_id: form.owner_id,
        }),
      'Deal added'
    );
    setBusy(false);
    if (res.ok) onCreated(res.value.id);
  };

  return (
    <Drawer
      title="Add deal"
      onClose={onClose}
      footer={
        <>
          <button type="submit" form="add-deal-form" className={BTN_ACCENT} disabled={busy}>
            {busy ? 'Adding...' : 'Add deal'}
          </button>
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            Cancel
          </button>
        </>
      }
    >
      <form id="add-deal-form" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field label="Deal name" htmlFor={ids.name} error={errors.name}>
          <input id={ids.name} className={INPUT} value={form.name} maxLength={200} onChange={(e) => setForm({ name: e.target.value })} />
        </Field>
        <AccountContactFields form={form} setForm={setForm} errors={errors} />
        <Field label="Value (₦)" htmlFor={ids.value} error={errors.value_minor}>
          <input
            id={ids.value}
            className={INPUT}
            inputMode="decimal"
            placeholder="250000"
            value={form.value}
            onChange={(e) => setForm({ value: e.target.value })}
          />
        </Field>
        <Field label="Stage" htmlFor={ids.stage}>
          <select id={ids.stage} className={INPUT} value={form.stage_id} onChange={(e) => setForm({ stage_id: e.target.value })}>
            {openStages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Next step" htmlFor={ids.step} error={errors.next_step}>
          <input id={ids.step} className={INPUT} maxLength={300} value={form.next_step} onChange={(e) => setForm({ next_step: e.target.value })} />
        </Field>
        <Field label="Next step due" htmlFor={ids.due} error={errors.next_step_due}>
          <input id={ids.due} type="date" className={INPUT} value={form.next_step_due} onChange={(e) => setForm({ next_step_due: e.target.value })} />
        </Field>
        <Field label="Owner" htmlFor={ids.owner} error={errors.owner_id}>
          <OwnerSelect id={ids.owner} value={form.owner_id} owners={owners} onChange={(owner_id) => setForm({ owner_id })} />
        </Field>
      </form>
    </Drawer>
  );
}

// ---------------------------------------------------------------- deal drawer

function DealBody({
  deal,
  stages,
  owners,
  nameOf,
  onSaved,
  onMoveRequest,
  onDeleted,
  reload,
}: {
  deal: DealDetail;
  stages: Stage[];
  owners: Owners;
  nameOf: (ownerId: string | null) => string;
  onSaved: () => void;
  onMoveRequest: (stageId: string) => void;
  onDeleted: () => void;
  reload: () => Promise<void>;
}) {
  const { runAction, triggerToast } = useToast();
  const [form, setFormState] = useState({
    name: deal.name,
    account_id: deal.account_id ?? '',
    contact_id: deal.contact_id ?? '',
    value: koboToNairaInput(deal.value_minor),
    next_step: deal.next_step ?? '',
    next_step_due: deal.next_step_due ?? '',
    owner_id: deal.owner_id,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ids = { name: useId(), value: useId(), stage: useId(), step: useId(), due: useId(), owner: useId() };
  const setForm = (patch: Partial<typeof form>) => setFormState((f) => ({ ...f, ...patch }));

  const stage = stages.find((s) => s.id === deal.stage_id);
  const open = stage?.kind === 'open';

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Give the deal a name.';
    const kobo = nairaToKobo(form.value);
    if (kobo === null) next.value_minor = 'Enter an amount in naira, like 250000 or 1500.50.';
    setErrors(next);
    if (Object.keys(next).length > 0 || kobo === null) return;

    const patch: DealPatch = {
      name: form.name.trim(),
      account_id: form.account_id || null,
      contact_id: form.contact_id || null,
      value_minor: kobo,
      next_step: form.next_step.trim() || null,
      next_step_due: form.next_step_due || null,
      owner_id: form.owner_id,
    };
    setBusy(true);
    try {
      await updateDeal(deal.id, patch);
      setErrors({});
      triggerToast('Deal saved');
      onSaved();
      await reload();
    } catch (err) {
      const fe = salesFieldErrors(err);
      setErrors(fe);
      // A 422 shows next to its field; anything else (network, 404) still needs a toast.
      if (Object.keys(fe).length === 0) triggerToast(salesErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    const res = await runAction(() => deleteDeal(deal.id), 'Deal deleted');
    setBusy(false);
    if (res.ok) onDeleted();
    else setConfirmDelete(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-display font-bold text-brand-900 text-lg">{formatMoney(deal.value_minor)}</span>
        <span className="text-neutral-500">in {stage?.name ?? 'an archived stage'}</span>
        <StallBadge deal={deal} long />
        {deal.closed_reason && (
          <span className="text-xs bg-neutral-100 text-neutral-700 rounded-full px-2 py-0.5 font-semibold">
            Lost: {CLOSED_REASONS.find((r) => r.value === deal.closed_reason)?.label ?? deal.closed_reason}
          </span>
        )}
      </div>
      {deal.closed_note && <p className="text-sm text-neutral-600 -mt-3">{deal.closed_note}</p>}
      {deal.is_stalled && (
        <p className="text-sm text-accent-800 bg-accent-100 rounded-card px-4 py-3">
          No activity for {deal.days_inactive} days. Log a call, email or note below to restart the clock.
        </p>
      )}

      <Field label="Stage" htmlFor={ids.stage}>
        <select
          id={ids.stage}
          className={INPUT}
          value={deal.stage_id}
          onChange={(e) => e.target.value !== deal.stage_id && onMoveRequest(e.target.value)}
        >
          {!stage && <option value={deal.stage_id}>Archived stage</option>}
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      <form onSubmit={save} noValidate className="flex flex-col gap-5">
        <Field label="Deal name" htmlFor={ids.name} error={errors.name}>
          <input id={ids.name} className={INPUT} value={form.name} maxLength={200} onChange={(e) => setForm({ name: e.target.value })} />
        </Field>
        <AccountContactFields form={form} setForm={(p) => setForm(p)} errors={errors} />
        <Field label="Value (₦)" htmlFor={ids.value} error={errors.value_minor}>
          <input id={ids.value} className={INPUT} inputMode="decimal" value={form.value} onChange={(e) => setForm({ value: e.target.value })} />
        </Field>
        <Field
          label="Next step"
          htmlFor={ids.step}
          error={errors.next_step}
          hint={
            deal.next_step_due
              ? `${isOverdue(deal.next_step_due) && open ? 'Overdue: ' : ''}${dueLabel(deal.next_step_due)}`
              : undefined
          }
        >
          <input id={ids.step} className={INPUT} maxLength={300} value={form.next_step} onChange={(e) => setForm({ next_step: e.target.value })} />
        </Field>
        <Field label="Next step due" htmlFor={ids.due} error={errors.next_step_due}>
          <input id={ids.due} type="date" className={INPUT} value={form.next_step_due} onChange={(e) => setForm({ next_step_due: e.target.value })} />
        </Field>
        <Field label="Owner" htmlFor={ids.owner} error={errors.owner_id}>
          <OwnerSelect id={ids.owner} value={form.owner_id} owners={owners} onChange={(owner_id) => setForm({ owner_id })} />
        </Field>
        <div className="flex gap-3">
          <button type="submit" className={BTN_ACCENT} disabled={busy}>
            {busy ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" className={BTN_DANGER} onClick={() => setConfirmDelete(true)} disabled={busy}>
            Delete deal
          </button>
        </div>
      </form>

      <hr className="border-neutral-200" />
      <section aria-label="Call prep" className="space-y-2">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Call prep</h3>
        <p className="text-sm text-neutral-600">A one-page AI brief for your next call on this deal: objections, a goal and questions to ask.</p>
        <Link href={`/sales/coach?tab=prep&deal=${encodeURIComponent(deal.id)}`} className={`${BTN_SECONDARY} inline-block`}>
          Prep for a call
        </Link>
      </section>

      <hr className="border-neutral-200" />
      <FollowUpSection dealId={deal.id} hasContact={!!deal.contact_id} />

      <hr className="border-neutral-200" />
      <ActivityLog
        heading="Activity and notes"
        filter={{ deal_id: deal.id }}
        link={{ deal_id: deal.id, account_id: deal.account_id, contact_id: deal.contact_id }}
        nameOf={nameOf}
        onLogged={() => {
          onSaved();
          void reload();
        }}
      />

      <hr className="border-neutral-200" />
      <section aria-label="Stage history" className="space-y-3">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Stage history</h3>
        <ol className="space-y-2 text-sm text-neutral-700">
          {[...deal.stage_history].reverse().map((h) => (
            <li key={h.id} className="flex justify-between gap-3">
              <span>{h.from_stage_name ? `${h.from_stage_name} → ${h.to_stage_name}` : `Created in ${h.to_stage_name}`}</span>
              <span className="text-xs text-neutral-500 whitespace-nowrap">{relativeTime(h.changed_at)}</span>
            </li>
          ))}
        </ol>
      </section>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this deal?"
          body={`"${deal.name}" and its activity are removed for everyone in the workspace. This cannot be undone.`}
          confirmLabel="Delete deal"
          danger
          busy={busy}
          onConfirm={() => void remove()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}

/**
 * The deal drawer (D-SAL-5): edit fields, change stage, activity timeline and notes,
 * stage history, delete. `onMoveRequest` hands a stage change to the board so a move
 * into Won (confetti) or Lost (reason modal) behaves the same as a drag.
 */
export function DealDrawer({
  dealId,
  stages,
  onClose,
  onChanged,
  onMoveRequest,
  refreshKey,
}: {
  dealId: string;
  stages: Stage[];
  onClose: () => void;
  /** The deal or its activity changed: the board should refresh. */
  onChanged: () => void;
  onMoveRequest: (dealId: string, stageId: string) => void;
  /** Bumped by the board after it moved this deal, so the drawer refetches. */
  refreshKey: number;
}) {
  const { owners, nameOf } = useMembers();
  const detail = useDealDetail(dealId);
  const { reload } = detail;

  // Refetch when the board moved the deal. Keyed render below keeps the form in step.
  const lastKey = React.useRef(refreshKey);
  React.useEffect(() => {
    if (lastKey.current !== refreshKey) {
      lastKey.current = refreshKey;
      void reload();
    }
  }, [refreshKey, reload]);

  const notFound = detail.status === 'error' && /not found/i.test(detail.error ?? '');

  return (
    <Drawer title={detail.data?.name ?? 'Deal'} onClose={onClose}>
      {detail.status === 'loading' && <LoadingState label="Loading deal" />}
      {detail.status === 'error' &&
        (notFound ? (
          <p role="alert" className="text-sm text-neutral-700">
            This deal was not found. It may have been deleted.
          </p>
        ) : (
          <ErrorState message={detail.error ?? 'Could not load this deal.'} onRetry={() => void reload()} />
        ))}
      {detail.status === 'forbidden' && <p className="text-sm text-neutral-700">Sales is not available for your role.</p>}
      {detail.data && (
        <DealBody
          key={detail.data.id}
          deal={detail.data}
          stages={stages}
          owners={owners}
          nameOf={nameOf}
          onSaved={onChanged}
          onMoveRequest={(stageId) => onMoveRequest(dealId, stageId)}
          onDeleted={() => {
            onChanged();
            onClose();
          }}
          reload={reload}
        />
      )}
    </Drawer>
  );
}
