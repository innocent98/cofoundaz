'use client';

import React, { useId, useState } from 'react';
import { X } from 'lucide-react';

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'list' | 'select';
  required?: boolean;
  options?: string[]; // for `select`
  placeholder?: string;
  half?: boolean; // render two-per-row on wider screens
}

interface RecordFormModalProps {
  title: string;
  fields: FormField[];
  /** Existing record `data` when editing; omit for create. */
  initial?: Record<string, unknown>;
  submitting?: boolean;
  error?: string | null;
  /** API field_errors keyed by field key, shown under each input. */
  fieldErrors?: Record<string, string>;
  /** Consultant suggest mode: the primary button reads "Suggest this". */
  suggestMode?: boolean;
  onSubmit: (data: Record<string, unknown>) => void;
  onClose: () => void;
}

// Records store lists as string arrays; the form edits them as one-item-per-line
// text. These convert between the two representations.
function toFormValue(field: FormField, raw: unknown): string {
  if (field.type === 'list') {
    return Array.isArray(raw) ? raw.join('\n') : '';
  }
  if (raw === null || raw === undefined) return '';
  return String(raw);
}

function fromFormValue(field: FormField, value: string): unknown {
  if (field.type === 'list') {
    return value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (field.type === 'number') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return value.trim();
}

const inputClass =
  'w-full border border-line-strong rounded-input px-3 py-2 text-sm focus:outline-none focus:border-line-focus focus:ring-1 focus:ring-line-focus placeholder:text-brand-xa3b899';

export function RecordFormModal({
  title,
  fields,
  initial,
  submitting,
  error,
  fieldErrors,
  suggestMode,
  onSubmit,
  onClose,
}: RecordFormModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const f of fields) seed[f.key] = toFormValue(f, initial?.[f.key]);
    return seed;
  });

  const uid = useId();
  const setValue = (key: string, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {};
    for (const f of fields) {
      // A select left on "Select…" is unset, not an empty string the API would reject.
      if (f.type === 'select' && !(values[f.key] ?? '')) continue;
      data[f.key] = fromFormValue(f, values[f.key] ?? '');
    }
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-brand-x061a12/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-modal w-full max-w-lg shadow-raised overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface-faint shrink-0">
          <h3 className="font-bold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-subtle hover:text-ink transition-colors p-1 rounded-input hover:bg-line"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => {
              const id = `${uid}-${field.key}`;
              const fieldError = fieldErrors?.[field.key];
              const a11y = {
                id,
                'aria-invalid': fieldError ? (true as const) : undefined,
                'aria-describedby': fieldError ? `${id}-error` : undefined,
              };
              return (
              <div
                key={field.key}
                className={`space-y-1.5 ${field.half ? 'md:col-span-1' : 'md:col-span-2'}`}
              >
                <label htmlFor={id} className="text-xs font-bold text-neutral-x55625a uppercase tracking-wider">
                  {field.label}
                  {field.required && <span className="text-danger-text"> *</span>}
                </label>

                {field.type === 'textarea' && (
                  <textarea
                    {...a11y}
                    required={field.required}
                    value={values[field.key] ?? ''}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className={`${inputClass} resize-y`}
                  />
                )}

                {field.type === 'list' && (
                  <textarea
                    {...a11y}
                    value={values[field.key] ?? ''}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    placeholder={field.placeholder || 'One per line'}
                    rows={3}
                    className={`${inputClass} resize-y`}
                  />
                )}

                {field.type === 'select' && (
                  <select
                    {...a11y}
                    required={field.required}
                    value={values[field.key] ?? ''}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    {(field.options || []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                )}

                {(field.type === 'text' || field.type === 'number') && (
                  <input
                    {...a11y}
                    type={field.type === 'number' ? 'number' : 'text'}
                    step={field.type === 'number' ? 'any' : undefined}
                    required={field.required}
                    value={values[field.key] ?? ''}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={inputClass}
                  />
                )}

                {field.type === 'list' && (
                  <p className="text-[10px] text-ink-subtle">One per line.</p>
                )}
                {fieldError && (
                  <p id={`${id}-error`} className="text-xs font-medium text-danger-text">
                    {fieldError}
                  </p>
                )}
              </div>
              );
            })}
          </div>

          {error && (
            <p className="text-xs text-danger-text bg-danger-wash border border-danger-xf0d5d5 rounded-input px-3 py-2">
              {error}
            </p>
          )}

          <div className="pt-1 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-neutral-xdcdcd6 hover:bg-surface-muted text-ink rounded-card text-sm font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-brand-strong hover:bg-brand-rail-ink disabled:opacity-60 text-white rounded-card text-sm font-bold transition-colors"
            >
              {submitting ? 'Saving…' : suggestMode ? 'Suggest this' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
