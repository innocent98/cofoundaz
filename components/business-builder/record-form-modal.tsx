'use client';

import React, { useState } from 'react';
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
  'w-full border border-[#D5DDD6] rounded-input px-3 py-2 text-sm focus:outline-none focus:border-[#4D6D58] focus:ring-1 focus:ring-[#4D6D58] placeholder:text-[#A3B899]';

export function RecordFormModal({
  title,
  fields,
  initial,
  submitting,
  error,
  onSubmit,
  onClose,
}: RecordFormModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const f of fields) seed[f.key] = toFormValue(f, initial?.[f.key]);
    return seed;
  });

  const setValue = (key: string, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {};
    for (const f of fields) data[f.key] = fromFormValue(f, values[f.key] ?? '');
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-[#061A12]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-modal w-full max-w-lg shadow-raised overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[#E8E8E2] flex items-center justify-between bg-[#FBFBFA] shrink-0">
          <h3 className="font-bold text-[#1E2923]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8E9B90] hover:text-[#1E2923] transition-colors p-1 rounded-input hover:bg-[#E8E8E2]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div
                key={field.key}
                className={`space-y-1.5 ${field.half ? 'md:col-span-1' : 'md:col-span-2'}`}
              >
                <label className="text-xs font-bold text-[#55625A] uppercase tracking-wider">
                  {field.label}
                  {field.required && <span className="text-[#A34B4B]"> *</span>}
                </label>

                {field.type === 'textarea' && (
                  <textarea
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
                    value={values[field.key] ?? ''}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    placeholder={field.placeholder || 'One per line'}
                    rows={3}
                    className={`${inputClass} resize-y`}
                  />
                )}

                {field.type === 'select' && (
                  <select
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
                  <p className="text-[10px] text-[#8E9B90]">One per line.</p>
                )}
              </div>
            ))}
          </div>

          {error && (
            <p className="text-xs text-[#A34B4B] bg-[#FBEBEB] border border-[#F0D5D5] rounded-input px-3 py-2">
              {error}
            </p>
          )}

          <div className="pt-1 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-[#DCDCD6] hover:bg-[#F5F5F0] text-[#1E2923] rounded-card text-sm font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-[#183B28] hover:bg-[#12261C] disabled:opacity-60 text-white rounded-card text-sm font-bold transition-colors"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
