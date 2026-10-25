'use client';

import React, { useId, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/app/(dashboard)/sales/ToastContext';
import { useContact, useMembers } from '@/hooks/useSalesCrm';
import { EnrollDialog } from './enroll-dialog';
import {
  contactName,
  createContact,
  deleteContact,
  salesErrorMessage,
  salesFieldErrors,
  updateContact,
  type Contact,
} from '@/lib/api/sales';
import {
  ActivityLog,
  BTN_ACCENT,
  BTN_DANGER,
  BTN_SECONDARY,
  ConfirmDialog,
  Drawer,
  ErrorState,
  Field,
  INPUT,
  LoadingState,
} from './shared';

interface ContactForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  title: string;
}

const emptyForm: ContactForm = { first_name: '', last_name: '', email: '', phone: '', title: '' };

function formOf(c: Contact): ContactForm {
  return {
    first_name: c.first_name,
    last_name: c.last_name ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    title: c.title ?? '',
  };
}

function ContactFields({
  form,
  setForm,
  errors,
}: {
  form: ContactForm;
  setForm: (patch: Partial<ContactForm>) => void;
  errors: Record<string, string>;
}) {
  const ids = { first: useId(), last: useId(), email: useId(), phone: useId(), title: useId() };
  return (
    <>
      <Field label="First name" htmlFor={ids.first} error={errors.first_name}>
        <input id={ids.first} className={INPUT} value={form.first_name} maxLength={100} onChange={(e) => setForm({ first_name: e.target.value })} />
      </Field>
      <Field label="Last name" htmlFor={ids.last} error={errors.last_name}>
        <input id={ids.last} className={INPUT} value={form.last_name} maxLength={100} onChange={(e) => setForm({ last_name: e.target.value })} />
      </Field>
      <Field label="Email" htmlFor={ids.email} error={errors.email}>
        <input id={ids.email} type="email" className={INPUT} value={form.email} onChange={(e) => setForm({ email: e.target.value })} />
      </Field>
      <Field label="Phone" htmlFor={ids.phone} error={errors.phone}>
        <input id={ids.phone} type="tel" className={INPUT} value={form.phone} maxLength={40} onChange={(e) => setForm({ phone: e.target.value })} />
      </Field>
      <Field label="Job title" htmlFor={ids.title} error={errors.title}>
        <input id={ids.title} className={INPUT} value={form.title} maxLength={120} onChange={(e) => setForm({ title: e.target.value })} />
      </Field>
    </>
  );
}

const orNull = (v: string) => v.trim() || null;

export function AddContactDrawer({
  accountId,
  onClose,
  onCreated,
}: {
  accountId: string | null;
  onClose: () => void;
  onCreated: (contact: Contact) => void;
}) {
  const { triggerToast } = useToast();
  const [form, setFormState] = useState<ContactForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const setForm = (patch: Partial<ContactForm>) => setFormState((f) => ({ ...f, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim()) {
      setErrors({ first_name: 'Add a first name.' });
      return;
    }
    setBusy(true);
    try {
      const created = await createContact({
        first_name: form.first_name.trim(),
        last_name: orNull(form.last_name),
        email: orNull(form.email),
        phone: orNull(form.phone),
        title: orNull(form.title),
        account_id: accountId,
      });
      triggerToast('Contact added');
      onCreated(created);
    } catch (err) {
      const fe = salesFieldErrors(err);
      setErrors(fe);
      if (Object.keys(fe).length === 0) triggerToast(salesErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      title="Add contact"
      onClose={onClose}
      footer={
        <>
          <button type="submit" form="add-contact-form" className={BTN_ACCENT} disabled={busy}>
            {busy ? 'Adding...' : 'Add contact'}
          </button>
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            Cancel
          </button>
        </>
      }
    >
      <form id="add-contact-form" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <ContactFields form={form} setForm={setForm} errors={errors} />
      </form>
    </Drawer>
  );
}

function ContactBody({
  contact,
  accountName,
  onChanged,
  onDeleted,
  nameOf,
}: {
  contact: Contact;
  accountName: string | null;
  onChanged: () => void;
  onDeleted: () => void;
  nameOf: (ownerId: string | null) => string;
}) {
  const { runAction, triggerToast } = useToast();
  const [form, setFormState] = useState<ContactForm>(() => formOf(contact));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const setForm = (patch: Partial<ContactForm>) => setFormState((f) => ({ ...f, ...patch }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim()) {
      setErrors({ first_name: 'Add a first name.' });
      return;
    }
    setBusy(true);
    try {
      await updateContact(contact.id, {
        first_name: form.first_name.trim(),
        last_name: orNull(form.last_name),
        email: orNull(form.email),
        phone: orNull(form.phone),
        title: orNull(form.title),
      });
      setErrors({});
      triggerToast('Contact saved');
      onChanged();
    } catch (err) {
      const fe = salesFieldErrors(err);
      setErrors(fe);
      if (Object.keys(fe).length === 0) triggerToast(salesErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    const res = await runAction(() => deleteContact(contact.id), 'Contact deleted');
    setBusy(false);
    if (res.ok) onDeleted();
    else setConfirmDelete(false);
  };

  return (
    <>
      {contact.account_id && accountName && (
        <p className="text-sm text-neutral-600">
          Works at{' '}
          <Link href={`/sales/accounts/${contact.account_id}`} className="font-semibold text-brand-800 hover:underline">
            {accountName}
          </Link>
        </p>
      )}
      <form onSubmit={save} noValidate className="flex flex-col gap-5">
        <ContactFields form={form} setForm={setForm} errors={errors} />
        <div className="flex gap-3">
          <button type="submit" className={BTN_ACCENT} disabled={busy}>
            {busy ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" className={BTN_SECONDARY} onClick={() => setEnrolling(true)} disabled={busy}>
            Enrol in sequence
          </button>
          <button type="button" className={BTN_DANGER} onClick={() => setConfirmDelete(true)} disabled={busy}>
            Delete contact
          </button>
        </div>
      </form>
      <hr className="border-neutral-200" />
      <ActivityLog
        heading="Activity"
        filter={{ contact_id: contact.id }}
        link={{ contact_id: contact.id, account_id: contact.account_id }}
        nameOf={nameOf}
        onLogged={onChanged}
      />
      {enrolling && (
        <EnrollDialog
          targets={{ label: contactName(contact), contact_ids: [contact.id] }}
          onClose={() => setEnrolling(false)}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete this contact?"
          body={`${contactName(contact)} is removed. Deals that listed them keep working without a contact.`}
          confirmLabel="Delete contact"
          danger
          busy={busy}
          onConfirm={() => void remove()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}

/** The contact drawer: fields, "Log activity" timeline, delete. */
export function ContactDrawer({
  contactId,
  accountName,
  onClose,
  onChanged,
}: {
  contactId: string;
  accountName?: string | null;
  onClose: () => void;
  /** The contact (or its activity) changed or was deleted: refresh the list behind. */
  onChanged: () => void;
}) {
  const contact = useContact(contactId);
  const { nameOf } = useMembers();
  const notFound = contact.status === 'error' && /not found/i.test(contact.error ?? '');

  return (
    <Drawer title={contact.data ? contactName(contact.data) : 'Contact'} onClose={onClose}>
      {contact.status === 'loading' && <LoadingState label="Loading contact" />}
      {contact.status === 'error' &&
        (notFound ? (
          <p role="alert" className="text-sm text-neutral-700">
            This contact was not found. It may have been deleted.
          </p>
        ) : (
          <ErrorState message={contact.error ?? 'Could not load this contact.'} onRetry={() => void contact.reload()} />
        ))}
      {contact.data && (
        <ContactBody
          key={contact.data.id}
          contact={contact.data}
          accountName={accountName ?? null}
          nameOf={nameOf}
          onChanged={() => {
            onChanged();
            void contact.reload();
          }}
          onDeleted={() => {
            onChanged();
            onClose();
          }}
        />
      )}
    </Drawer>
  );
}
