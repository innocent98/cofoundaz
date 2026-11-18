'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import {
  getAdminReportsCounts,
  getAdminReports,
  getAdminReport,
  dismissAdminReport,
  escalateAdminReport,
  removeAdminReportContent,
  restoreAdminReportContent,
  type AdminReportTab,
  type AdminReportType,
  type AdminReportsCounts,
  type AdminReportSummary,
  type AdminReportDetail,
  ApiError,
} from '@/lib/api/admin-reports';
import { type AdminMeResponse } from '@/lib/api/admin';
import { formatApiErrorMessage } from '@/lib/api/client';
import { relativeTime } from '@/lib/relative-time';
import { REPORT_REASONS } from '@/lib/api/reports';
import { StaffActionDialog } from './staff-action-dialog';

export interface AdminReportsViewProps {
  adminMe: AdminMeResponse;
}

interface ReasonActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  actionButtonLabel: string;
  actionButtonVariant?: 'danger' | 'primary';
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function ReasonActionModal(props: ReasonActionModalProps): React.JSX.Element | null {
  if (!props.isOpen) return null;
  return <ReasonActionModalInner key={props.title} {...props} />;
}

function ReasonActionModalInner({
  isOpen,
  title,
  description,
  actionButtonLabel,
  actionButtonVariant = 'primary',
  onClose,
  onConfirm,
}: ReasonActionModalProps): React.JSX.Element | null {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const trimmed = reason.trim();
  const valid = trimmed.length >= 10 && trimmed.length <= 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;

    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(trimmed);
      onClose();
    } catch (err: unknown) {
      setError(formatApiErrorMessage(err, "Couldn't complete that action. Try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reason-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-md bg-white rounded-modal border border-line-soft shadow-card p-6 flex flex-col gap-4 text-ink">
        <div className="flex items-center justify-between">
          <h2 id="reason-modal-title" className="text-base font-bold text-ink">
            {title}
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

        <p className="text-xs text-ink-muted leading-relaxed">{description}</p>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-card bg-danger-50 border border-danger-200 text-danger-700 text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="action-reason" className="font-semibold text-ink">
                Reason <span className="text-danger-600">*</span>
              </label>
              <span className={`text-[11px] ${trimmed.length < 10 || trimmed.length > 500 ? 'text-ink-subtle' : 'text-brand-700 font-semibold'}`}>
                {trimmed.length}/500 (min 10)
              </span>
            </div>
            <textarea
              id="action-reason"
              ref={inputRef}
              rows={4}
              maxLength={500}
              placeholder="State the internal reason for this decision (10–500 characters)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-input border border-line-soft px-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
            />
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
              disabled={!valid || submitting}
              className={`px-4 py-2 rounded-card text-xs font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-card ${
                actionButtonVariant === 'danger'
                  ? 'bg-danger-600 hover:bg-danger-700'
                  : 'bg-brand-600 hover:bg-brand-700'
              }`}
            >
              {submitting ? 'Submitting…' : actionButtonLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminReportsView({ adminMe }: AdminReportsViewProps): React.JSX.Element {
  const isSuperAdmin = adminMe.role === 'super_admin';

  const [activeTab, setActiveTab] = useState<AdminReportTab>('open');
  const [counts, setCounts] = useState<AdminReportsCounts>({ open: 0, escalated: 0, closed: 0 });
  const [reports, setReports] = useState<AdminReportSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AdminReportDetail | null>(null);

  const [typeFilter, setTypeFilter] = useState<AdminReportType | 'all'>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Dialogs
  const [dismissDialogOpen, setDismissDialogOpen] = useState(false);
  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  // Debounce search query ~300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch counts
  const fetchCounts = useCallback(async () => {
    try {
      const data = await getAdminReportsCounts();
      setCounts(data);
    } catch {
      // ignore
    }
  }, []);

  // Fetch report list
  const fetchReportsList = useCallback(
    async (cursor?: string) => {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoadingList(true);
      }
      setActionError(null);

      try {
        const res = await getAdminReports({
          tab: activeTab,
          type: typeFilter,
          reason: reasonFilter,
          query: debouncedQuery,
          cursor,
        });

        if (cursor) {
          setReports((prev) => [...prev, ...res.reports]);
        } else {
          setReports(res.reports);
          if (res.reports.length > 0) {
            setSelectedReportId((current) =>
              current && res.reports.some((r) => r.id === current) ? current : res.reports[0].id
            );
          } else {
            setSelectedReportId(null);
            setSelectedReport(null);
          }
        }
        setNextCursor(res.next_cursor);
      } catch (err: unknown) {
        setActionError(formatApiErrorMessage(err, "Couldn't load reports."));
      } finally {
        setLoadingList(false);
        setLoadingMore(false);
      }
    },
    [activeTab, typeFilter, reasonFilter, debouncedQuery]
  );

  // Fetch single report detail
  const fetchDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const detail = await getAdminReport(id);
      setSelectedReport(detail);
    } catch (err: unknown) {
      setActionError(formatApiErrorMessage(err, "Couldn't load report details."));
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // Initial load and filter changes
  useEffect(() => {
    queueMicrotask(() => {
      void fetchCounts();
    });
  }, [fetchCounts]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchReportsList();
    });
  }, [fetchReportsList]);

  useEffect(() => {
    if (selectedReportId) {
      queueMicrotask(() => {
        void fetchDetail(selectedReportId);
      });
    }
  }, [selectedReportId, fetchDetail]);

  // Action helpers (refetches list, counts, detail)
  const refreshAll = useCallback(async () => {
    await fetchCounts();
    await fetchReportsList();
    if (selectedReportId) {
      await fetchDetail(selectedReportId);
    }
  }, [fetchCounts, fetchReportsList, fetchDetail, selectedReportId]);

  const handleDismiss = async (reason: string) => {
    if (!selectedReport) return;
    await dismissAdminReport(selectedReport.id, { reason });
    await refreshAll();
  };

  const handleEscalate = async (reason: string) => {
    if (!selectedReport) return;
    try {
      await escalateAdminReport(selectedReport.id, { reason });
      await refreshAll();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        // 409 ALREADY_ESCALATED: refetch
        await refreshAll();
        return;
      }
      throw err;
    }
  };

  const handleRemove = async ({ reason, totp_code }: { reason: string; totp_code: string }) => {
    if (!selectedReport) return;
    await removeAdminReportContent(selectedReport.id, { reason, totp_code });
    await refreshAll();
  };

  const handleRestore = async ({ reason, totp_code }: { reason: string; totp_code: string }) => {
    if (!selectedReport) return;
    await restoreAdminReportContent(selectedReport.id, { reason, totp_code });
    await refreshAll();
  };

  // Status Chip helper
  const renderStatusChip = (status?: string) => {
    if (!status) return null;
    switch (status) {
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-semibold bg-neutral-100 text-neutral-700">
            Dismissed
          </span>
        );
      case 'removed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-semibold bg-danger-50 text-danger-700">
            Removed
          </span>
        );
      case 'restored':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-semibold bg-brand-50 text-brand-700">
            Restored
          </span>
        );
      case 'escalated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-semibold bg-accent-100 text-accent-700">
            Escalated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-semibold bg-neutral-100 text-neutral-700">
            {status}
          </span>
        );
    }
  };

  // Escalated report rule (R7): only super admin can decide
  const isEscalatedReport = activeTab === 'escalated' || selectedReport?.status === 'escalated';
  const canDecideEscalated = isSuperAdmin || !isEscalatedReport;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Stats Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-modal border border-line-soft p-5 shadow-card">
        <div>
          <h1 className="text-xl font-bold font-display text-ink">Content Moderation & Reports</h1>
          <p className="text-xs text-ink-muted mt-1">
            Review reported AI Co-Founder replies and teammate comments. Founder privacy protected (snippet only).
          </p>
        </div>

        {/* Tab Badges */}
        <div className="flex items-center gap-2">
          {(['open', 'escalated', 'closed'] as const).map((tab) => {
            const count = counts[tab] ?? 0;
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedReportId(null);
                  setSelectedReport(null);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-card text-xs font-semibold transition-all ${
                  active
                    ? 'bg-brand-600 text-white shadow-card'
                    : 'bg-surface-faint text-ink-muted hover:text-ink hover:bg-neutral-100'
                }`}
              >
                <span className="capitalize">{tab}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-pill text-[10px] font-bold ${
                    active ? 'bg-white/20 text-white' : 'bg-line-soft text-ink'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 rounded-card bg-danger-50 border border-danger-200 text-danger-700 text-xs"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed flex-1">{actionError}</p>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="p-1 text-danger-700 hover:text-danger-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white rounded-card border border-line-soft p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-ink-subtle text-[11px] font-semibold mr-1">Type:</span>
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'ai_message', label: 'AI reply' },
                { key: 'comment', label: 'Comment' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTypeFilter(t.key)}
                className={`px-2.5 py-1 rounded-card text-xs font-medium transition-colors ${
                  typeFilter === t.key
                    ? 'bg-brand-100 text-brand-900 font-semibold'
                    : 'text-ink-muted hover:bg-surface-faint'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-line-soft hidden md:block" />

          {/* Reason Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <label htmlFor="report-reason-filter" className="text-ink-subtle text-[11px] font-semibold">
              Reason:
            </label>
            <select
              id="report-reason-filter"
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="rounded-input border border-line-soft bg-white px-2 py-1 text-xs text-ink focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            >
              <option value="all">All reasons</option>
              {Object.entries(REPORT_REASONS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-ink-subtle pointer-events-none" />
          <input
            type="text"
            placeholder="Search snippet, workspace, reporter…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-input border border-line-soft text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-ink-subtle hover:text-ink"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List View */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {loadingList ? (
            <div className="bg-white rounded-modal border border-line-soft p-12 text-center text-xs text-ink-muted shadow-card flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
              <span>Loading reports…</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-modal border border-line-soft p-12 text-center text-xs text-ink-muted shadow-card flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-brand-600" />
              <p className="font-semibold text-ink text-sm">No reports found</p>
              <p className="text-ink-subtle">
                {activeTab === 'open'
                  ? 'There are no active open reports to review.'
                  : activeTab === 'escalated'
                  ? 'There are no reports currently escalated to Super Admin.'
                  : 'No closed reports match your filter.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {reports.map((r) => {
                const isSelected = selectedReportId === r.id;
                const reasonLabel = (REPORT_REASONS as Record<string, string>)[r.reason] || r.reason;
                const isAI = r.item_type === 'ai_message';

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReportId(r.id)}
                    className={`text-left p-4 rounded-card border transition-all cursor-pointer flex flex-col gap-2.5 shadow-card ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/40 ring-1 ring-brand-600'
                        : 'border-line-soft bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isAI ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-bold bg-brand-100 text-brand-900">
                            <Sparkles className="w-3 h-3 text-brand-700" />
                            AI reply
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-bold bg-accent-100 text-accent-700">
                            <MessageSquare className="w-3 h-3 text-accent-700" />
                            Comment
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-semibold bg-neutral-100 text-ink">
                          {reasonLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-ink-subtle">
                        <Clock className="w-3 h-3" />
                        <span>{relativeTime(r.created_at)}</span>
                      </div>
                    </div>

                    {/* Snippet preview */}
                    <p className="text-xs text-ink line-clamp-3 leading-relaxed font-body">
                      {r.snippet}
                      {r.snippet_truncated && '…'}
                    </p>

                    {/* Footer metadata */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-line-soft/80 text-[11px] text-ink-muted">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-ink truncate">{r.workspace.name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-surface-faint text-ink-subtle uppercase">
                          {r.workspace.plan_key}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span>by {r.reporter.name || r.reporter.email}</span>
                        {activeTab === 'closed' && renderStatusChip(r.status)}
                      </div>
                    </div>
                  </button>
                );
              })}

              {nextCursor && (
                <button
                  type="button"
                  onClick={() => void fetchReportsList(nextCursor)}
                  disabled={loadingMore}
                  className="w-full py-2.5 rounded-card border border-line-soft bg-white text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface-faint transition-colors disabled:opacity-50 shadow-card"
                >
                  {loadingMore ? 'Loading more…' : 'Load more'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Detail Pane */}
        <div className="lg:col-span-7 bg-white rounded-modal border border-line-soft p-6 shadow-card flex flex-col gap-6 sticky top-4">
          {loadingDetail ? (
            <div className="py-24 text-center text-xs text-ink-muted flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
              <span>Loading report details…</span>
            </div>
          ) : !selectedReport ? (
            <div className="py-24 text-center text-xs text-ink-muted flex flex-col items-center justify-center gap-2">
              <ShieldAlert className="w-8 h-8 text-ink-subtle" />
              <p className="font-semibold text-ink text-sm">No report selected</p>
              <p className="text-ink-subtle">Select a report from the list to review snippet and take action.</p>
            </div>
          ) : (
            <>
              {/* Detail Header */}
              <div className="flex flex-col gap-3 pb-4 border-b border-line-soft">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {selectedReport.item_type === 'ai_message' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-xs font-bold bg-brand-100 text-brand-900">
                        <Sparkles className="w-3.5 h-3.5 text-brand-700" />
                        AI Co-Founder Reply
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-xs font-bold bg-accent-100 text-accent-700">
                        <MessageSquare className="w-3.5 h-3.5 text-accent-700" />
                        Comment
                      </span>
                    )}

                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-semibold bg-neutral-100 text-ink">
                      {(REPORT_REASONS as Record<string, string>)[selectedReport.reason] || selectedReport.reason}
                    </span>

                    {renderStatusChip(selectedReport.status)}
                  </div>

                  <span className="text-xs text-ink-subtle">
                    Reported {relativeTime(selectedReport.created_at)}
                  </span>
                </div>

                {selectedReport.reports_on_item > 1 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-card bg-brand-50 border border-brand-200 text-brand-900 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 text-brand-700" />
                    <span>{selectedReport.reports_on_item} people reported this content</span>
                  </div>
                )}
              </div>

              {/* Reported Content Snippet (PLAIN TEXT ONLY, privacy rule D-ADM-9) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink uppercase tracking-wide">
                    Reported Snippet
                  </span>
                  <span className="text-[11px] text-ink-subtle">Plain text preview (D-ADM-9 privacy rule)</span>
                </div>
                <div className="p-4 rounded-card bg-surface-faint border border-line-soft text-ink font-body text-xs leading-relaxed whitespace-pre-wrap break-words">
                  {selectedReport.snippet}
                </div>
              </div>

              {/* Reporter's Note (if provided) */}
              {selectedReport.note && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-ink uppercase tracking-wide">
                    Reporter&apos;s Note
                  </span>
                  <div className="p-3.5 rounded-card bg-neutral-50 border border-line-soft text-ink font-body text-xs italic leading-relaxed whitespace-pre-wrap">
                    &ldquo;{selectedReport.note}&rdquo;
                  </div>
                </div>
              )}

              {/* Authorship & Workspace Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-card bg-surface-subtle border border-line-soft text-xs">
                <div>
                  <span className="text-ink-subtle block font-medium mb-0.5">Reported By</span>
                  <p className="font-semibold text-ink">{selectedReport.reporter.name || 'Anonymous'}</p>
                  <p className="text-[11px] text-ink-muted">{selectedReport.reporter.email}</p>
                </div>

                <div>
                  <span className="text-ink-subtle block font-medium mb-0.5">Author</span>
                  <p className="font-semibold text-ink">
                    {selectedReport.author ? selectedReport.author.name : 'AI Co-Founder'}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {selectedReport.item_type === 'ai_message' ? 'Autonomous AI reply' : 'Workspace member'}
                  </p>
                </div>

                <div>
                  <span className="text-ink-subtle block font-medium mb-0.5">Workspace</span>
                  <p className="font-semibold text-ink">{selectedReport.workspace.name}</p>
                  <p className="text-[11px] text-ink-muted uppercase">Plan: {selectedReport.workspace.plan_key}</p>
                </div>

                <div>
                  <span className="text-ink-subtle block font-medium mb-0.5">Report ID</span>
                  <p className="font-body text-[11px] text-ink-muted truncate">{selectedReport.id}</p>
                </div>
              </div>

              {/* Audit history for Escalated / Decided reports */}
              {(selectedReport.escalation_reason || selectedReport.decision_reason) && (
                <div className="flex flex-col gap-3 p-4 rounded-card border border-line-soft bg-surface-faint text-xs">
                  <span className="font-bold text-ink uppercase tracking-wide text-[11px]">Audit History</span>

                  {selectedReport.escalation_reason && (
                    <div>
                      <div className="flex items-center gap-1.5 text-ink font-semibold">
                        <ArrowUpRight className="w-3.5 h-3.5 text-accent-700" />
                        <span>Escalated by {selectedReport.escalated_by?.name || 'Staff moderator'}</span>
                      </div>
                      <p className="text-ink-muted mt-0.5 pl-5 italic font-body">
                        &ldquo;{selectedReport.escalation_reason}&rdquo;
                      </p>
                    </div>
                  )}

                  {selectedReport.decision_reason && (
                    <div>
                      <div className="flex items-center gap-1.5 text-ink font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-700" />
                        <span>Decided by {selectedReport.decided_by?.name || 'Staff moderator'}</span>
                        {selectedReport.decided_at && (
                          <span className="text-ink-subtle font-normal">
                            ({relativeTime(selectedReport.decided_at)})
                          </span>
                        )}
                      </div>
                      <p className="text-ink-muted mt-0.5 pl-5 italic font-body">
                        &ldquo;{selectedReport.decision_reason}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons Section */}
              <div className="pt-4 border-t border-line-soft flex flex-wrap items-center justify-between gap-3">
                {/* R7: Escalated reports rule check */}
                {!canDecideEscalated ? (
                  <div className="w-full flex items-center gap-2 p-3 rounded-card bg-accent-50 border border-accent-200 text-accent-900 text-xs font-semibold">
                    <ShieldAlert className="w-4 h-4 text-accent-700" />
                    <span>Waiting for a Super Admin</span>
                  </div>
                ) : (
                  <>
                    {/* Open or Escalated tab actions */}
                    {activeTab !== 'closed' && (
                      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                        <button
                          type="button"
                          onClick={() => setDismissDialogOpen(true)}
                          className="px-3.5 py-2 rounded-card border border-line-soft bg-white hover:bg-surface-faint text-xs font-semibold text-ink transition-colors shadow-card"
                        >
                          Dismiss Report
                        </button>

                        {activeTab === 'open' && (
                          <button
                            type="button"
                            onClick={() => setEscalateDialogOpen(true)}
                            className="px-3.5 py-2 rounded-card border border-line-soft bg-white hover:bg-surface-faint text-xs font-semibold text-accent-800 transition-colors shadow-card flex items-center gap-1.5"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 text-accent-700" />
                            Escalate to Super Admin
                          </button>
                        )}
                      </div>
                    )}

                    {/* Dangerous Action: Remove Content */}
                    {activeTab !== 'closed' && (
                      <button
                        type="button"
                        onClick={() => setRemoveDialogOpen(true)}
                        className="px-4 py-2 rounded-card bg-danger-600 hover:bg-danger-700 text-white text-xs font-bold transition-colors shadow-card flex items-center gap-1.5 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove Content
                      </button>
                    )}

                    {/* Closed Tab: Restore Content (only on removed reports) */}
                    {activeTab === 'closed' && selectedReport.status === 'removed' && (
                      <button
                        type="button"
                        onClick={() => setRestoreDialogOpen(true)}
                        className="px-4 py-2 rounded-card bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shadow-card flex items-center gap-1.5 ml-auto"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        Restore Content
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dismiss Dialog (Reason only, 10-500 chars) */}
      <ReasonActionModal
        isOpen={dismissDialogOpen}
        title="Dismiss Report"
        description="Dismissing marks this report as reviewed with no action taken on the author's content."
        actionButtonLabel="Dismiss Report"
        actionButtonVariant="primary"
        onClose={() => setDismissDialogOpen(false)}
        onConfirm={handleDismiss}
      />

      {/* Escalate Dialog (Reason only, 10-500 chars) */}
      <ReasonActionModal
        isOpen={escalateDialogOpen}
        title="Escalate Report to Super Admin"
        description="Escalating moves this report to the Escalated queue, reserved for Super Admin review."
        actionButtonLabel="Escalate to Super Admin"
        actionButtonVariant="primary"
        onClose={() => setEscalateDialogOpen(false)}
        onConfirm={handleEscalate}
      />

      {/* Remove Content Dialog (StaffActionDialog: Reason + fresh 6-digit TOTP) */}
      <StaffActionDialog
        isOpen={removeDialogOpen}
        title="Remove reported content"
        confirmCopy="The author will see 'Removed by moderation'. This closes every report on this item. You can restore it later."
        actionButtonLabel="Remove content"
        actionButtonVariant="danger"
        onClose={() => setRemoveDialogOpen(false)}
        onConfirm={handleRemove}
      />

      {/* Restore Content Dialog (StaffActionDialog: Reason + fresh 6-digit TOTP) */}
      <StaffActionDialog
        isOpen={restoreDialogOpen}
        title="Restore reported content"
        confirmCopy="Restore this content? The author and workspace members will be able to see and interact with it again."
        actionButtonLabel="Restore content"
        actionButtonVariant="primary"
        onClose={() => setRestoreDialogOpen(false)}
        onConfirm={handleRestore}
      />
    </div>
  );
}
