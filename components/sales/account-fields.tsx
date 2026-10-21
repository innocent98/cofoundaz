'use client';

import React from 'react';
import type { useMembers } from '@/hooks/useSalesCrm';
import { Field, INPUT, OwnerSelect } from './shared';

export interface AccountFormState {
  name: string;
  website: string;
  industry: string;
  description: string;
  owner_id: string | null;
}

export interface AccountFieldIds {
  name: string;
  website: string;
  industry: string;
  description: string;
  owner: string;
}

/** The account form fields shared by "New account" and the account page's info panel. */
export function AccountFields({
  ids,
  form,
  setForm,
  errors,
  owners,
}: {
  ids: AccountFieldIds;
  form: AccountFormState;
  setForm: (patch: Partial<AccountFormState>) => void;
  errors: Record<string, string>;
  owners: ReturnType<typeof useMembers>['owners'];
}) {
  return (
    <>
      <Field label="Account name" htmlFor={ids.name} error={errors.name}>
        <input id={ids.name} className={INPUT} value={form.name} maxLength={200} onChange={(e) => setForm({ name: e.target.value })} />
      </Field>
      <Field label="Website" htmlFor={ids.website} error={errors.website}>
        <input id={ids.website} className={INPUT} placeholder="acme.com" value={form.website} onChange={(e) => setForm({ website: e.target.value })} />
      </Field>
      <Field label="Industry" htmlFor={ids.industry} error={errors.industry}>
        <input id={ids.industry} className={INPUT} value={form.industry} maxLength={120} onChange={(e) => setForm({ industry: e.target.value })} />
      </Field>
      <Field label="Notes" htmlFor={ids.description} error={errors.description}>
        <textarea id={ids.description} rows={3} className={INPUT} value={form.description} maxLength={4000} onChange={(e) => setForm({ description: e.target.value })} />
      </Field>
      <Field label="Owner" htmlFor={ids.owner} error={errors.owner_id}>
        <OwnerSelect id={ids.owner} value={form.owner_id} owners={owners} onChange={(owner_id) => setForm({ owner_id })} />
      </Field>
    </>
  );
}
