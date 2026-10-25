'use client';

import React from 'react';
import { memberLabel, type TeamMember } from '@/lib/api/members';

interface PersonSelectProps {
  /** The current person's user id, or null for Unassigned. */
  value: string | null;
  members: TeamMember[];
  onChange: (userId: string | null) => void;
  label: string;
  disabled?: boolean;
  /** Shown for a current person who is no longer in the members list. */
  fallbackLabel?: string;
}

/** Owner / assignee picker over GET /team/members, with an "Unassigned" option (sends null). */
export function PersonSelect({ value, members, onChange, label, disabled, fallbackLabel }: PersonSelectProps) {
  const known = value === null || members.some((m) => m.user_id === value);
  return (
    <select
      aria-label={label}
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
      className="max-w-[180px] bg-surface-subtle border border-line-soft rounded-input px-2 py-1 text-sm font-semibold text-ink outline-none focus:border-brand-mid disabled:opacity-60"
    >
      <option value="">Unassigned</option>
      {!known && value && <option value={value}>{fallbackLabel || 'Former member'}</option>}
      {members.map((m) => (
        <option key={m.user_id} value={m.user_id}>
          {memberLabel(m)}
        </option>
      ))}
    </select>
  );
}
