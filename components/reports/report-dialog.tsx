'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { X, AlertCircle } from 'lucide-react';
import { reportItem, REPORT_REASONS, type ReportItemType, type ReportReason } from '@/lib/api/reports';
import { ApiError, formatApiErrorMessage } from '@/lib/api/client';

export interface ReportDialogProps {
  isOpen: boolean;
  itemType: ReportItemType;
  itemId: string;
  onClose: () => void;
  onSuccess: () => void;
  onNotFound?: () => void;
}

const REASONS: Array<{ key: ReportReason; label: string }> = [
  { key: 'spam', label: REPORT_REASONS.spam },
  { key: 'abusive', label: REPORT_REASONS.abusive },
  { key: 'harmful', label: REPORT_REASONS.harmful },
  { key: 'inaccurate', label: REPORT_REASONS.inaccurate },
  { key: 'privacy', label: REPORT_REASONS.privacy },
  { key: 'other', label: REPORT_REASONS.other },
];

export function ReportDialog(props: ReportDialogProps): React.JSX.Element | null {
  if (!props.isOpen) return null;
  return <ReportDialogModal key={`${props.itemType}-${props.itemId}`} {...props} />;
}

function ReportDialogModal({
  itemType,
  itemId,
  onClose,
  onSuccess,
  onNotFound,
}: ReportDialogProps): React.JSX.Element {
  const [selectedReason, setSelectedReason] = useState<ReportReason | ''>('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submitting, onClose]);

  const isNoteRequired = selectedReason === 'other';
  const trimmedNote = note.trim();
  const canSubmit =
    Boolean(selectedReason) &&
    (!isNoteRequired || trimmedNote.length > 0) &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedReason) return;

    setGeneralError(null);
    setNoteError(null);
    setSubmitting(true);

    try {
      await reportItem({
        item_type: itemType,
        item_id: itemId,
        reason: selectedReason,
        note: trimmedNote || undefined,
      });

      toast.success("Thanks, we'll take a look");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const data = err.data as {
          error?: { code?: string; message?: string; field?: string };
          message?: string;
        } | null;
        const code = data?.error?.code;
        const msg = data?.error?.message || data?.message || formatApiErrorMessage(err);
        const field = data?.error?.field;

        // 409 ALREADY_REPORTED: treat as success
        if (err.status === 409 || code === 'ALREADY_REPORTED') {
          toast.success("Thanks, we'll take a look");
          onSuccess();
          onClose();
          return;
        }

        // 404 NOT_FOUND: item is gone or not yours: close dialog and refetch
        if (err.status === 404 || code === 'NOT_FOUND') {
          onClose();
          if (onNotFound) {
            onNotFound();
          } else {
            toast.error(msg || 'This item could not be found.');
          }
          return;
        }

        // 429 RATE_LIMITED: keep dialog open
        if (err.status === 429 || code === 'RATE_LIMITED') {
          setGeneralError(msg || 'You have submitted too many reports recently. Please wait a moment.');
          return;
        }

        // 422 validation / empty field or note error
        if (err.status === 422) {
          if (!field || field === 'note') {
            setNoteError(msg);
          } else {
            setGeneralError(msg);
          }
          return;
        }

        setGeneralError(msg);
      } else {
        setGeneralError(formatApiErrorMessage(err, "Couldn't submit report. Try again."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md bg-white rounded-modal border border-line-soft shadow-card p-6 flex flex-col gap-5 text-ink animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between">
          <h2 id="report-dialog-title" className="text-base font-bold text-ink">
            {itemType === 'ai_message' ? 'Report AI Co-Founder Reply' : 'Report Comment'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close dialog"
            className="p-1 rounded-card text-ink-muted hover:text-ink hover:bg-surface-faint transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {generalError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-card bg-danger-50 border border-danger-200 text-danger-700 text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{generalError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2.5">
            <legend className="text-xs font-semibold text-ink-muted mb-1">
              Why are you reporting this {itemType === 'ai_message' ? 'reply' : 'comment'}?
            </legend>
            <div className="flex flex-col gap-2">
              {REASONS.map((r) => (
                <label
                  key={r.key}
                  className={`flex items-center gap-3 p-2.5 rounded-card border transition-colors cursor-pointer text-xs font-medium ${
                    selectedReason === r.key
                      ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold'
                      : 'border-line-soft hover:bg-surface-faint text-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r.key}
                    checked={selectedReason === r.key}
                    onChange={() => {
                      setSelectedReason(r.key);
                      setNoteError(null);
                      if (r.key === 'other') {
                        setTimeout(() => noteInputRef.current?.focus(), 50);
                      }
                    }}
                    className="accent-brand-600 w-4 h-4 cursor-pointer"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="report-note" className="font-semibold text-ink">
                Note {isNoteRequired ? <span className="text-danger-600">*</span> : <span className="text-ink-subtle font-normal">(optional)</span>}
              </label>
              <span className={`text-[11px] ${note.length >= 480 ? 'text-danger-600 font-semibold' : 'text-ink-subtle'}`}>
                {note.length}/500
              </span>
            </div>
            <textarea
              id="report-note"
              ref={noteInputRef}
              rows={3}
              maxLength={500}
              placeholder={isNoteRequired ? 'Please describe the issue (required)' : 'Additional details to help our team understand the issue'}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (noteError) setNoteError(null);
              }}
              className={`w-full rounded-input border px-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-1 transition-all ${
                noteError
                  ? 'border-danger-600 focus:border-danger-600 focus:ring-danger-600'
                  : 'border-line-soft focus:border-brand-600 focus:ring-brand-600'
              }`}
            />
            {noteError && (
              <p className="text-[11px] text-danger-600 mt-0.5">{noteError}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line-soft">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-card text-xs font-semibold text-ink-muted hover:bg-surface-faint transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 rounded-card text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-card"
            >
              {submitting ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
