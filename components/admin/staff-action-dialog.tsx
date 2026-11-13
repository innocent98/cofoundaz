'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ApiError, formatApiErrorMessage } from '@/lib/api/client';
import { AlertCircle, Lock, ShieldAlert, X } from 'lucide-react';

export interface StaffActionDialogProps {
  isOpen: boolean;
  title: string;
  confirmCopy: string;
  actionButtonLabel?: string;
  actionButtonVariant?: 'danger' | 'primary';
  onClose: () => void;
  onConfirm: (payload: { reason: string; totp_code: string }) => Promise<void>;
}

export function StaffActionDialog(props: StaffActionDialogProps): React.JSX.Element | null {
  if (!props.isOpen) return null;
  // Keyed so state is freshly initialized whenever title or dialog changes
  return <StaffActionDialogModal key={props.title} {...props} />;
}

function StaffActionDialogModal({
  title,
  confirmCopy,
  actionButtonLabel = 'Confirm',
  actionButtonVariant = 'danger',
  onClose,
  onConfirm,
}: StaffActionDialogProps): React.JSX.Element {
  const [reason, setReason] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isTooManyAttempts, setIsTooManyAttempts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasonInputRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Autofocus reason input
  useEffect(() => {
    reasonInputRef.current?.focus();
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  const trimmedReason = reason.trim();
  const trimmedReasonLength = trimmedReason.length;
  const isReasonValid = trimmedReasonLength >= 10 && trimmedReasonLength <= 500;
  const isTotpValid = /^\d{6}$/.test(totpCode.trim());
  const canSubmit = isReasonValid && isTotpValid && !isSubmitting && !isTooManyAttempts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await onConfirm({
        reason: trimmedReason,
        totp_code: totpCode.trim(),
      });
      // Success: close dialog
      onClose();
    } catch (err: unknown) {
      // Clear the authenticator code field after any failure (codes are single-use)
      setTotpCode('');

      if (err instanceof ApiError) {
        const data = err.data as { error?: { code?: string; message?: string }; message?: string; detail?: string } | null;
        const code = data?.error?.code;

        if (err.status === 403) {
          if (code === 'STEP_UP_INVALID' || !code) {
            setError('That code was already used or isn\'t right. Wait for the next code and try again.');
          } else {
            setError(formatApiErrorMessage(err, 'Permission denied.'));
          }
          return;
        }

        if (err.status === 429) {
          if (code === 'TOO_MANY_ATTEMPTS') {
            setIsTooManyAttempts(true);
            setError(formatApiErrorMessage(err, 'Too many attempts. Please try again later.'));
            return;
          }
        }

        setError(formatApiErrorMessage(err, 'Action failed. Please try again.'));
      } else {
        setError(formatApiErrorMessage(err, 'An unexpected error occurred. Please try again.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-action-dialog-title"
      ref={dialogRef}
    >
      <div
        className="relative w-full max-w-lg bg-surface border border-neutral-subtle rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-subtle bg-surface-raised">
          <div className="flex items-center gap-2 text-danger-strong">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <h2 id="staff-action-dialog-title" className="text-base font-semibold text-main">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="text-subtle hover:text-main p-1 rounded-md transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Confirmation Copy */}
          <div className="p-3.5 bg-danger-subtle/20 border border-danger-subtle/40 rounded-lg text-sm font-medium text-main">
            {confirmCopy}
          </div>

          {/* Audit Notice */}
          <div className="flex items-center gap-2 text-xs text-subtle">
            <Lock className="w-3.5 h-3.5 text-brand" />
            <span>This action is permanently logged.</span>
          </div>

          {/* Inline Error Message */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 bg-danger-subtle/30 border border-danger-subtle text-danger-strong text-xs rounded-lg"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* Reason Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-subtle">
              <label htmlFor="staff-action-reason" className="text-main">
                Reason <span className="text-danger-strong">*</span>
              </label>
              <span
                className={`tabular-nums ${
                  trimmedReasonLength > 500
                    ? 'text-danger-strong font-bold'
                    : trimmedReasonLength < 10
                    ? 'text-muted'
                    : 'text-success-strong'
                }`}
              >
                {trimmedReasonLength} / 500 chars (min 10)
              </span>
            </div>
            <textarea
              id="staff-action-reason"
              ref={reasonInputRef}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting || isTooManyAttempts}
              placeholder="Explain why this action is being taken (10-500 characters)..."
              className="w-full px-3.5 py-2 text-sm bg-surface-raised border border-neutral-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-main placeholder:text-muted resize-none disabled:opacity-60"
            />
          </div>

          {/* Authenticator Code Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-subtle">
              <label htmlFor="staff-action-totp" className="text-main">
                Authenticator code <span className="text-danger-strong">*</span>
              </label>
              <span className="text-muted">6 digits</span>
            </div>
            <input
              id="staff-action-totp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={totpCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setTotpCode(val);
              }}
              disabled={isSubmitting || isTooManyAttempts}
              placeholder="000000"
              autoComplete="one-time-code"
              className="w-full px-3.5 py-2 text-center text-lg tracking-[0.3em] font-mono font-bold bg-surface-raised border border-neutral-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-main placeholder:text-muted disabled:opacity-60"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-subtle hover:text-main hover:bg-surface-raised rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-all shadow-sm flex items-center justify-center gap-2 ${
                actionButtonVariant === 'danger'
                  ? 'bg-danger hover:bg-danger-hover disabled:bg-danger/40'
                  : 'bg-brand hover:bg-brand-hover disabled:bg-brand/40'
              } disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                actionButtonLabel
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
