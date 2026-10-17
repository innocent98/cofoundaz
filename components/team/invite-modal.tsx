'use client';

import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import {
  INVITE_ROLE_OPTIONS,
  InviteError,
  sendInvitations,
  summarizeInvites,
  type InviteFieldError,
  type InviteResult,
  type InviteRole,
} from '@/lib/api/team';

interface Row {
  key: number;
  email: string;
  role: InviteRole;
}

const MAX_ROWS = 20;
const inputClass =
  'w-full px-4 py-3 text-sm rounded-card border border-sage-200 focus:outline-hidden focus:ring-2 focus:ring-[#9C5B34] focus:border-transparent placeholder-sage-500 text-sage-800 bg-white';

export function InviteModal({
  open,
  onClose,
  startupName,
  send = sendInvitations,
}: {
  open: boolean;
  onClose: () => void;
  startupName?: string | null;
  send?: typeof sendInvitations;
}) {
  const [rows, setRows] = useState<Row[]>([{ key: 0, email: '', role: 'team_member' }]);
  const [nextKey, setNextKey] = useState(1);
  const [sending, setSending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<InviteFieldError[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteResult | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Reopen clean.
  useEffect(() => {
    if (open) return;
    queueMicrotask(() => {
      setRows([{ key: 0, email: '', role: 'team_member' }]);
      setNextKey(1);
      setFieldErrors([]);
      setFormError(null);
      setResult(null);
    });
  }, [open]);

  if (!open) return null;

  const update = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const addRow = () => {
    if (rows.length >= MAX_ROWS) return;
    setRows((rs) => [...rs, { key: nextKey, email: '', role: 'team_member' }]);
    setNextKey((k) => k + 1);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setFormError(null);
    setFieldErrors([]);
    try {
      const res = await send(rows.map((r) => ({ email: r.email.trim(), role: r.role })));
      setResult(res);
    } catch (err) {
      if (err instanceof InviteError) {
        setFormError(err.message);
        setFieldErrors(err.fieldErrors);
      } else {
        setFormError('Couldn’t send your invitations. Try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const errorFor = (rowIndex: number, field: 'email' | 'role') =>
    fieldErrors.find((f) => f.row === rowIndex && f.field === field)?.message;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-xs" aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-title"
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-[24px] shadow-raised p-6 md:p-8 border border-sage-100 z-10"
      >
        <h2 id="invite-title" className="text-2xl font-bold text-[#1C201D] font-display mb-2">
          Invite to {startupName?.trim() || 'your workspace'}
        </h2>
        <p className="text-sm text-sage-500 mb-6 leading-relaxed">Teammates, mentors, or your accountant and lawyer (free seats).</p>

        {result ? (
          <div className="space-y-4">
            {result.created.length > 0 ? (
              <p role="status" className="text-sm font-semibold text-[#266B4E]">
                {summarizeInvites({ ...result, skipped: [] })}
              </p>
            ) : (
              <p role="status" className="text-sm font-semibold text-[#8A5330]">
                No new invitations were sent. {summarizeInvites({ ...result, created: [] })}
              </p>
            )}
            {result.created.length > 0 && result.skipped.length > 0 && (
              <p className="text-sm text-sage-600">{summarizeInvites({ ...result, created: [] })}</p>
            )}
            <ul className="space-y-1 text-xs text-sage-600">
              {result.created.map((email) => (
                <li key={`c-${email}`}>Invited {email}</li>
              ))}
              {result.skipped.map((email) => (
                <li key={`s-${email}`}>Skipped {email}</li>
              ))}
            </ul>
            {result.undelivered.length > 0 && (
              <ul role="alert" className="space-y-1 rounded-card border border-[#EADBCA] bg-[#F9F7F2] px-3 py-2 text-xs font-semibold text-[#8A5330]">
                {result.undelivered.map((email) => (
                  <li key={`u-${email}`}>We couldn’t email {email}. Check the address.</li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 bg-[#9C5B34] hover:bg-copper-700 text-white font-semibold text-sm rounded-card transition-colors shadow-card cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5" noValidate>
            {rows.map((row, i) => {
              const role = INVITE_ROLE_OPTIONS.find((o) => o.value === row.role);
              const emailError = errorFor(i, 'email');
              const roleError = errorFor(i, 'role');
              return (
                <fieldset key={row.key} className="space-y-3 border-0 p-0 m-0">
                  <div className="flex items-center justify-between">
                    <legend className="text-xs font-semibold text-sage-700">{rows.length > 1 ? `Person ${i + 1}` : 'Email'}</legend>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                        aria-label={`Remove person ${i + 1}`}
                        className="p-1 rounded-input text-sage-500 hover:text-sage-700 hover:bg-sage-100 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <input
                      type="email"
                      required
                      aria-label={`Email ${i + 1}`}
                      aria-invalid={emailError ? true : undefined}
                      value={row.email}
                      onChange={(e) => update(row.key, { email: e.target.value })}
                      placeholder="teammate@email.com"
                      className={`${inputClass} ${emailError ? 'border-[#B0483B]' : ''}`}
                    />
                    {emailError && <p className="mt-1 text-xs font-medium text-[#B0483B]">{emailError}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-sage-700 mb-1.5" htmlFor={`invite-role-${row.key}`}>
                      Role
                    </label>
                    <select
                      id={`invite-role-${row.key}`}
                      value={row.role}
                      onChange={(e) => update(row.key, { role: e.target.value as InviteRole })}
                      aria-invalid={roleError ? true : undefined}
                      className={`${inputClass} font-medium cursor-pointer`}
                    >
                      {INVITE_ROLE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {role?.hint && <p className="mt-1 text-xs text-sage-500">{role.hint}</p>}
                    {roleError && <p className="mt-1 text-xs font-medium text-[#B0483B]">{roleError}</p>}
                  </div>
                </fieldset>
              );
            })}

            {rows.length < MAX_ROWS && (
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#266B4E] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add another person
              </button>
            )}

            {formError && (
              <p role="alert" className="text-xs font-semibold text-[#8A5330] bg-[#F9F7F2] border border-[#EADBCA] rounded-card px-3 py-2">
                {formError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 border border-sage-300 text-sage-700 font-semibold text-sm rounded-card hover:bg-sage-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 px-4 bg-[#9C5B34] hover:bg-copper-700 text-white font-semibold text-sm rounded-card transition-colors shadow-card disabled:opacity-60 cursor-pointer"
              >
                {sending ? 'Sending…' : rows.length > 1 ? 'Send invites' : 'Send invite'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
