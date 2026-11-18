'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Edit2, Trash2, AlertCircle, MessageSquare } from 'lucide-react';
import {
  getAdminCannedResponses,
  createAdminCannedResponse,
  updateAdminCannedResponse,
  deleteAdminCannedResponse,
  type AdminCannedResponse,
} from '@/lib/api/admin-tickets';
import { formatApiErrorMessage } from '@/lib/api/client';

export interface CannedResponsesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (response: AdminCannedResponse) => void;
}

export function CannedResponsesDialog({
  isOpen,
  onClose,
  onSelect,
}: CannedResponsesDialogProps): React.JSX.Element | null {
  const [responses, setResponses] = useState<AdminCannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit / Create state
  const [editingItem, setEditingItem] = useState<AdminCannedResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchResponses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminCannedResponses();
      setResponses(data);
    } catch (err: unknown) {
      setError(formatApiErrorMessage(err, 'Failed to load canned responses.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        void fetchResponses();
        setIsCreating(false);
        setEditingItem(null);
        setFormError(null);
        setDeletingId(null);
      });
    }
  }, [isOpen, fetchResponses]);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingItem(null);
    setTitle('');
    setBody('');
    setFormError(null);
    setIsCreating(true);
  };

  const handleStartEdit = (item: AdminCannedResponse) => {
    setIsCreating(false);
    setEditingItem(item);
    setTitle(item.title);
    setBody(item.body);
    setFormError(null);
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingItem(null);
    setTitle('');
    setBody('');
    setFormError(null);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (trimmedTitle.length < 1 || trimmedTitle.length > 80) {
      setFormError('Title must be between 1 and 80 characters.');
      return;
    }
    if (trimmedBody.length < 1 || trimmedBody.length > 2000) {
      setFormError('Body must be between 1 and 2000 characters.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editingItem) {
        const updated = await updateAdminCannedResponse(editingItem.id, {
          title: trimmedTitle,
          body: trimmedBody,
        });
        setResponses((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        const created = await createAdminCannedResponse({
          title: trimmedTitle,
          body: trimmedBody,
        });
        setResponses((prev) => [created, ...prev]);
      }
      handleCancelForm();
    } catch (err: unknown) {
      setFormError(formatApiErrorMessage(err, 'Failed to save canned response.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminCannedResponse(id);
      setResponses((prev) => prev.filter((r) => r.id !== id));
      setDeletingId(null);
    } catch (err: unknown) {
      setError(formatApiErrorMessage(err, 'Failed to delete canned response.'));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="canned-responses-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 font-body"
    >
      <div
        className="relative w-full max-w-2xl bg-surface border border-neutral-subtle rounded-modal shadow-raised overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-subtle bg-surface-raised shrink-0">
          <div className="flex items-center gap-2 text-brand">
            <MessageSquare className="w-5 h-5" />
            <h3 id="canned-responses-dialog-title" className="text-base font-bold text-main">
              Manage Canned Responses
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-subtle hover:text-main p-1 rounded-[6px] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div
              role="alert"
              className="p-3 bg-danger-subtle/30 border border-danger-subtle text-danger-strong text-xs rounded-input flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form when Creating or Editing */}
          {(isCreating || editingItem) ? (
            <form onSubmit={handleSaveForm} className="p-4 bg-surface-raised border border-neutral-subtle rounded-card space-y-4">
              <h4 className="text-sm font-semibold text-main">
                {editingItem ? 'Edit Canned Response' : 'New Canned Response'}
              </h4>

              {formError && (
                <div className="p-2.5 bg-danger-subtle/30 border border-danger-subtle text-danger-strong text-xs rounded-input flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-subtle">
                  <label htmlFor="canned-title-input" className="font-medium text-main">
                    Title <span className="text-danger-strong">*</span>
                  </label>
                  <span className="tabular-nums text-muted">{title.length} / 80</span>
                </div>
                <input
                  id="canned-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={80}
                  placeholder="e.g. Standard Greeting, Bug Report Received"
                  className="w-full px-3 py-1.5 text-sm bg-surface border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main placeholder:text-muted"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-subtle">
                  <label htmlFor="canned-body-input" className="font-medium text-main">
                    Body <span className="text-danger-strong">*</span>
                  </label>
                  <span className="tabular-nums text-muted">{body.length} / 2000</span>
                </div>
                <textarea
                  id="canned-body-input"
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={2000}
                  placeholder="Enter response body text (plain text only)..."
                  className="w-full px-3 py-1.5 text-sm bg-surface border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main placeholder:text-muted resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-subtle">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs font-medium text-subtle hover:text-main rounded-input transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-1.5 bg-brand text-white text-xs font-semibold rounded-input hover:bg-brand-hover shadow-card disabled:opacity-50 transition-all cursor-pointer"
                >
                  {saving ? 'Saving...' : editingItem ? 'Update response' : 'Create response'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs text-subtle font-medium">
                {responses.length} {responses.length === 1 ? 'response' : 'responses'} available
              </span>
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-3 py-1.5 bg-brand text-white rounded-input text-xs font-semibold hover:bg-brand-hover shadow-card inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New response</span>
              </button>
            </div>
          )}

          {/* List of Canned Responses */}
          {loading ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-subtle mt-2">Loading canned responses...</p>
            </div>
          ) : responses.length === 0 ? (
            <div className="py-8 text-center text-xs text-subtle bg-surface-raised border border-neutral-subtle rounded-card">
              No canned responses configured yet. Click &quot;New response&quot; to add one.
            </div>
          ) : (
            <div className="space-y-3">
              {responses.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-surface-raised border border-neutral-subtle rounded-card space-y-2 hover:border-neutral-strong/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="text-sm font-semibold text-main truncate">{item.title}</h5>
                    <div className="flex items-center gap-1 shrink-0">
                      {onSelect && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(item);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-brand text-white rounded-[6px] hover:bg-brand-hover shadow-card transition-colors cursor-pointer mr-1"
                        >
                          Use this
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="p-1 text-subtle hover:text-main rounded-[6px] transition-colors cursor-pointer"
                        aria-label={`Edit ${item.title}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(item.id)}
                        className="p-1 text-subtle hover:text-danger-strong rounded-[6px] transition-colors cursor-pointer"
                        aria-label={`Delete ${item.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-subtle whitespace-pre-wrap line-clamp-3 leading-relaxed">
                    {item.body}
                  </p>

                  {/* Delete Confirmation */}
                  {deletingId === item.id && (
                    <div className="p-2.5 bg-danger-subtle/30 border border-danger-subtle rounded-input text-xs space-y-2 animate-in fade-in">
                      <p className="text-danger-strong font-medium">
                        Delete &quot;{item.title}&quot;? This cannot be undone.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleDelete(item.id)}
                          className="px-2.5 py-1 bg-danger text-white text-xs font-semibold rounded-[6px] hover:bg-danger-hover transition-colors cursor-pointer"
                        >
                          Confirm delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="px-2.5 py-1 bg-surface border border-neutral-subtle text-subtle text-xs font-medium rounded-[6px] hover:text-main transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-subtle bg-surface-raised flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface border border-neutral-subtle rounded-input text-xs font-semibold text-main hover:bg-neutral-subtle transition-colors cursor-pointer shadow-card"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

