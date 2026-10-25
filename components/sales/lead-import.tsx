'use client';

import React, { useId, useRef, useState } from 'react';
import {
  IMPORT_FIELDS,
  commitLeadImport,
  importSummary,
  isNotFoundError,
  previewLeadImport,
  salesErrorMessage,
  type ImportField,
  type ImportPreview,
  type ImportResult,
} from '@/lib/api/sales';
import { ModalDialog } from '@/components/modal-dialog';
import { BTN_ACCENT, BTN_SECONDARY, INPUT } from './shared';

const MAX_BYTES = 2 * 1024 * 1024;

type Step =
  | { kind: 'choose' }
  | { kind: 'map'; preview: ImportPreview; mapping: Record<ImportField, string> }
  | { kind: 'done'; result: ImportResult };

/**
 * CSV import in three steps: choose the file (the API parses it and holds it for 30
 * minutes), map its columns to lead fields, then commit. Nothing is saved until the
 * commit. The result stays on screen so the invalid rows can be read and fixed.
 */
export function LeadImportModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  /** Called once the commit succeeded (the page toasts and reloads its list). */
  onImported: (result: ImportResult) => void;
}) {
  const [step, setStep] = useState<Step>({ kind: 'choose' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileId = useId();

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      setError('Choose a .csv file.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('CSV must be 2 MB or smaller.');
      return;
    }
    setBusy(true);
    try {
      const preview = await previewLeadImport(file);
      const mapping = { name: '', company: '', email: '' } as Record<ImportField, string>;
      for (const f of IMPORT_FIELDS) mapping[f.key] = preview.suggested_mapping[f.key] ?? '';
      setStep({ kind: 'map', preview, mapping });
    } catch (err) {
      setError(salesErrorMessage(err, 'We could not read that CSV file.'));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const commit = async () => {
    if (step.kind !== 'map') return;
    const { preview, mapping } = step;
    if (!mapping.name && !mapping.company) {
      setError('Map at least a Name or a Company column.');
      return;
    }
    const body: Partial<Record<ImportField, string>> = {};
    for (const f of IMPORT_FIELDS) if (mapping[f.key]) body[f.key] = mapping[f.key];
    setBusy(true);
    setError(null);
    try {
      const result = await commitLeadImport(preview.upload_id, body);
      setStep({ kind: 'done', result });
      onImported(result);
    } catch (err) {
      if (isNotFoundError(err)) {
        setError('That upload expired. Choose the file again.');
        setStep({ kind: 'choose' });
      } else {
        setError(salesErrorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalDialog
      label="Import leads from CSV"
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-[2px] p-0 md:p-4"
      className="bg-white rounded-t-modal md:rounded-modal w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-accent outline-none p-6 md:p-8 space-y-5"
    >
      <div>
        <h2 className="text-xl font-display font-bold text-neutral-900">Import leads from CSV</h2>
        <p className="text-sm text-neutral-500 mt-1">
          {step.kind === 'choose' && 'Choose a .csv file (2 MB or smaller, up to 5,000 rows). The first row must be the column names.'}
          {step.kind === 'map' && 'Match your columns to lead fields. Nothing is saved until you import.'}
          {step.kind === 'done' && 'Import finished.'}
        </p>
      </div>

      {step.kind === 'choose' && (
        <div className="space-y-3">
          <label htmlFor={fileId} className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block">
            CSV file
          </label>
          <input
            ref={fileRef}
            id={fileId}
            type="file"
            accept=".csv,text/csv"
            disabled={busy}
            onChange={(e) => void choose(e.target.files?.[0])}
            className="block w-full text-sm text-neutral-700 file:mr-4 file:rounded-card file:border file:border-neutral-300 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-neutral-700 hover:file:bg-neutral-50"
          />
          {busy && <p role="status" className="text-sm text-neutral-500">Reading the file...</p>}
        </div>
      )}

      {step.kind === 'map' && (
        <div className="space-y-5">
          <p className="text-sm text-neutral-700">
            Found <strong>{step.preview.row_count}</strong> row{step.preview.row_count === 1 ? '' : 's'} and{' '}
            <strong>{step.preview.headers.length}</strong> columns.
          </p>

          <div className="space-y-3">
            {IMPORT_FIELDS.map((f) => (
              <MappingRow
                key={f.key}
                label={f.label}
                headers={step.preview.headers}
                value={step.mapping[f.key]}
                onChange={(v) => setStep({ ...step, mapping: { ...step.mapping, [f.key]: v } })}
              />
            ))}
          </div>

          <div className="relative overflow-x-auto border border-neutral-200 rounded-card">
            <table className="w-full text-left text-xs">
              <caption className="sr-only">First rows of your file</caption>
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 uppercase tracking-wider">
                  {step.preview.headers.map((h, i) => (
                    <th key={`${h}-${i}`} scope="col" className="px-3 py-2 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {step.preview.sample_rows.map((row, ri) => (
                  <tr key={ri}>
                    {step.preview.headers.map((_, ci) => (
                      <td key={ci} className="px-3 py-2 whitespace-nowrap text-neutral-700">
                        {row[ci] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-500">
            Duplicates (same email as an existing lead or contact, or earlier in this file) are skipped. Every imported lead
            gets the source &ldquo;CSV import&rdquo;.
          </p>
        </div>
      )}

      {step.kind === 'done' && (
        <div className="space-y-4">
          <p role="status" className="text-base font-semibold text-neutral-900">
            {importSummary(step.result)}
          </p>
          {step.result.invalid_rows.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-800">
                {step.result.invalid_total} row{step.result.invalid_total === 1 ? '' : 's'} could not be imported
              </h3>
              <ul className="text-sm text-neutral-700 space-y-1 max-h-48 overflow-y-auto border border-neutral-200 rounded-card p-3">
                {step.result.invalid_rows.map((r) => (
                  <li key={r.row}>
                    Row {r.row}: {r.error}
                  </li>
                ))}
              </ul>
              {step.result.invalid_total > step.result.invalid_rows.length && (
                <p className="text-xs text-neutral-500">Showing the first {step.result.invalid_rows.length}.</p>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-card px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-1">
        {step.kind !== 'done' && (
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            Cancel
          </button>
        )}
        {step.kind === 'map' && (
          <button type="button" onClick={() => void commit()} disabled={busy} className={BTN_ACCENT}>
            {busy ? 'Importing...' : `Import ${step.preview.row_count} row${step.preview.row_count === 1 ? '' : 's'}`}
          </button>
        )}
        {step.kind === 'done' && (
          <button type="button" onClick={onClose} className={BTN_ACCENT}>
            Done
          </button>
        )}
      </div>
    </ModalDialog>
  );
}

function MappingRow({
  label,
  headers,
  value,
  onChange,
}: {
  label: string;
  headers: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm font-semibold text-neutral-700 w-28 shrink-0">
        {label}
      </label>
      <select id={id} className={INPUT} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Do not import</option>
        {headers.map((h, i) => (
          <option key={`${h}-${i}`} value={h}>
            {h}
          </option>
        ))}
      </select>
    </div>
  );
}
