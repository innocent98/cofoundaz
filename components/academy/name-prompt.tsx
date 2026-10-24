'use client';

import React, { useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { updateProfileName, type MeResponse } from '@/lib/api/profile';

function fieldMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const body = (err.data as { error?: { message?: string; field_errors?: { field: string; message: string }[] } } | null)?.error;
    const fe = body?.field_errors?.find((f) => f.field === 'full_name') ?? body?.field_errors?.[0];
    if (fe?.message) return fe.message;
    if (body?.message) return body.message;
  }
  return 'Could not save your name. Please try again.';
}

/**
 * Asked before a member finishes a course with no profile name: the certificate
 * prints the name at the moment it is issued and never changes afterwards. Saves
 * through PATCH /auth/me, hands the normalised `me` back, then the caller continues.
 */
export function NamePrompt({ onSaved, onCancel }: { onSaved: (me: MeResponse) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onSaved(await updateProfileName(name));
    } catch (err) {
      setError(fieldMessage(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} aria-labelledby="name-prompt-title" className="space-y-3 rounded-modal border border-copper-200 bg-copper-100 p-6">
      <h2 id="name-prompt-title" className="text-base font-semibold text-sage-900">Add your name before you finish</h2>
      <p className="text-sm text-sage-700">
        Your certificate prints this name for good. It cannot be changed after the certificate is issued, so enter it the way you want it to appear.
      </p>
      <div className="space-y-1">
        <label htmlFor="full-name" className="text-xs font-bold uppercase tracking-wider text-sage-700">Full name</label>
        <input
          id="full-name"
          type="text"
          autoComplete="name"
          value={name}
          maxLength={200}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'full-name-error' : undefined}
          className="min-h-11 w-full rounded-card border border-sage-300 bg-white px-3 text-sm text-sage-900 focus:border-green-700 focus:outline-none"
        />
        {error && <p id="full-name-error" role="alert" className="text-sm text-red-700">{error}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="min-h-11 rounded-card bg-green-700 px-4 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60">
          {busy ? 'Saving...' : 'Save name and finish course'}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className="min-h-11 rounded-card border border-sage-300 bg-white px-4 text-sm font-semibold text-sage-800 hover:bg-sage-50">
          Not now
        </button>
      </div>
    </form>
  );
}
