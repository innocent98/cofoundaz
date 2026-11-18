'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getSuperAdminAudit,
  exportSuperAdminAuditCsv,
  SuperAdminAuditItem,
} from '@/lib/api/admin';
import { formatApiErrorMessage } from '@/lib/api/client';
import {
  Download,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';

export function SuperAdminAuditView(): React.JSX.Element {
  const [items, setItems] = useState<SuperAdminAuditItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters State
  const [filterActor, setFilterActor] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterWorkspace, setFilterWorkspace] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Row Expand State
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Export Dialog State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportReason, setExportReason] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAudit = useCallback(
    async (cursor?: string) => {
      if (cursor) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const res = await getSuperAdminAudit({
          actor: filterActor,
          action: filterAction,
          workspace_id: filterWorkspace,
          start_date: filterStartDate,
          end_date: filterEndDate,
          cursor,
          limit: 25,
        });

        if (cursor) {
          setItems((prev) => [...prev, ...res.items]);
        } else {
          setItems(res.items);
        }
        setNextCursor(res.next_cursor);
      } catch (err) {
        setError(formatApiErrorMessage(err, 'Failed to load audit logs.'));
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [filterActor, filterAction, filterWorkspace, filterStartDate, filterEndDate]
  );

  useEffect(() => {
    queueMicrotask(() => {
      void loadAudit();
    });
  }, [loadAudit]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    void loadAudit();
  };

  const handleResetFilters = () => {
    setFilterActor('');
    setFilterAction('all');
    setFilterWorkspace('');
    setFilterStartDate('');
    setFilterEndDate('');
    queueMicrotask(() => {
      void loadAudit();
    });
  };

  const handleToggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatTimestamp = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  // Export CSV Handler
  const trimmedReason = exportReason.trim();
  const isExportReasonValid = trimmedReason.length >= 10 && trimmedReason.length <= 500;

  const handleConfirmExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isExportReasonValid || isExporting) return;

    setIsExporting(true);
    setExportError(null);

    try {
      const { blob, filename } = await exportSuperAdminAuditCsv({
        reason: trimmedReason,
        actor: filterActor,
        action: filterAction,
        workspace_id: filterWorkspace,
        start_date: filterStartDate,
        end_date: filterEndDate,
      });

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast('audit-log.csv downloaded.');
      setIsExportModalOpen(false);
      setExportReason('');
      // Refetch audit log to show the new audit.exported row
      await loadAudit();
    } catch (err) {
      setExportError(formatApiErrorMessage(err, 'Failed to export audit log.'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-neutral-900 text-surface text-sm font-medium rounded-input shadow-raised animate-in fade-in"
        >
          {toastMessage}
        </div>
      )}

      {/* Header with Export Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-main">Audit Explorer</h2>
          <p className="text-xs text-subtle mt-0.5">
            Immutable log of all staff mutations, permission elevations, and overrides.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsExportModalOpen(true);
            setExportReason('');
            setExportError(null);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface border border-neutral-subtle rounded-input text-xs font-medium text-main hover:bg-surface-raised transition-colors"
        >
          <Download className="w-4 h-4 text-brand" />
          Export CSV
        </button>
      </div>

      {/* Filter Controls Card */}
      <form
        onSubmit={handleApplyFilters}
        className="p-4 bg-surface border border-neutral-subtle rounded-card shadow-card space-y-3"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Actor Filter */}
          <div>
            <label htmlFor="filter-actor" className="text-xs font-medium text-subtle block mb-1">
              Actor
            </label>
            <input
              id="filter-actor"
              type="text"
              value={filterActor}
              onChange={(e) => setFilterActor(e.target.value)}
              placeholder="Email or user ID..."
              className="w-full px-3 py-1.5 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Action Filter */}
          <div>
            <label htmlFor="filter-action" className="text-xs font-medium text-subtle block mb-1">
              Action
            </label>
            <select
              id="filter-action"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="all">All actions</option>
              <option value="staff.invite">staff.invite</option>
              <option value="staff.edit">staff.edit</option>
              <option value="staff.revoke">staff.revoke</option>
              <option value="flag.create">flag.create</option>
              <option value="flag.update">flag.update</option>
              <option value="billing.refund">billing.refund</option>
              <option value="billing.credit">billing.credit</option>
              <option value="billing.extend_trial">billing.extend_trial</option>
              <option value="billing.comp">billing.comp</option>
              <option value="user.suspend">user.suspend</option>
              <option value="audit.export">audit.export</option>
            </select>
          </div>

          {/* Workspace Filter */}
          <div>
            <label htmlFor="filter-workspace" className="text-xs font-medium text-subtle block mb-1">
              Workspace ID
            </label>
            <input
              id="filter-workspace"
              type="text"
              value={filterWorkspace}
              onChange={(e) => setFilterWorkspace(e.target.value)}
              placeholder="ws-..."
              className="w-full px-3 py-1.5 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Date Range: Start Date */}
          <div>
            <label htmlFor="filter-start-date" className="text-xs font-medium text-subtle block mb-1">
              Start Date
            </label>
            <input
              id="filter-start-date"
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Date Range: End Date */}
          <div>
            <label htmlFor="filter-end-date" className="text-xs font-medium text-subtle block mb-1">
              End Date
            </label>
            <input
              id="filter-end-date"
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        {/* Filter Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-subtle">
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-1.5 text-xs font-medium text-subtle hover:text-main rounded-input transition-colors"
          >
            Clear filters
          </button>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-brand text-surface text-xs font-medium rounded-input hover:bg-brand-strong transition-colors"
          >
            Apply filters
          </button>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="p-4 bg-danger-subtle/20 border border-danger-subtle rounded-card flex items-center justify-between text-sm text-danger-strong"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => loadAudit()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-neutral-subtle rounded-input text-main hover:bg-surface-raised font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-surface border border-neutral-subtle rounded-card shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-neutral-100 rounded-input animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-subtle">
            Nothing matches that search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-raised border-b border-neutral-subtle text-subtle uppercase font-medium tracking-wider">
                <tr>
                  <th scope="col" className="w-8 px-3 py-3" />
                  <th scope="col" className="px-4 py-3">When</th>
                  <th scope="col" className="px-4 py-3">Actor</th>
                  <th scope="col" className="px-4 py-3">Action</th>
                  <th scope="col" className="px-4 py-3">Target</th>
                  <th scope="col" className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-subtle">
                {items.map((item) => {
                  const isExpanded = Boolean(expandedRows[item.id]);
                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        onClick={() => handleToggleRow(item.id)}
                        className="hover:bg-surface-raised cursor-pointer transition-colors"
                      >
                        <td className="px-3 py-3 text-subtle">
                          {item.details ? (
                            isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-brand" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-subtle" />
                            )
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-subtle whitespace-nowrap tabular-nums">
                          {formatTimestamp(item.created_at)}
                        </td>
                        <td className="px-4 py-3 font-medium text-main">
                          {item.actor_email || item.actor_id || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 font-semibold text-[11px] bg-brand-50 text-brand-700 border border-brand-200 rounded-pill">
                            {item.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-subtle font-body text-[11px] max-w-xs truncate">
                          {item.entity_type
                            ? `${item.entity_type}:${item.entity_id || '-'}`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-subtle max-w-xs truncate">
                          {item.reason || '-'}
                        </td>
                      </tr>

                      {/* Expanded Row with Readable JSON */}
                      {isExpanded && item.details && (
                        <tr className="bg-surface-raised/60">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="space-y-1.5">
                              <span className="text-xs font-semibold text-main">
                                Details Payload:
                              </span>
                              <pre className="p-3 bg-surface border border-neutral-subtle rounded-input text-[11px] font-body text-main overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                {JSON.stringify(item.details, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More Button */}
        {nextCursor && (
          <div className="p-4 border-t border-neutral-subtle text-center bg-surface-raised">
            <button
              type="button"
              disabled={isLoadingMore}
              onClick={() => loadAudit(nextCursor)}
              className="px-4 py-2 bg-surface border border-neutral-subtle rounded-input text-xs font-medium text-main hover:bg-surface-raised transition-colors disabled:opacity-50"
            >
              {isLoadingMore ? 'Loading more...' : 'Load more'}
            </button>
          </div>
        )}
      </div>

      {/* Export Dialog (Reason required, 10-500 chars, no TOTP code needed) */}
      {isExportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="audit-export-dialog-title"
        >
          <div className="relative w-full max-w-md bg-surface border border-neutral-subtle rounded-modal shadow-raised overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-subtle bg-surface-raised">
              <h2 id="audit-export-dialog-title" className="text-base font-semibold text-main">
                Export Audit Log
              </h2>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                disabled={isExporting}
                className="text-subtle hover:text-main p-1 rounded-[6px]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmExport} className="p-6 space-y-4">
              <div className="p-3 bg-brand-50 border border-brand-200 rounded-input text-xs text-brand-800 font-medium">
                Max 5,000 rows exported. The export writes its own permanent audit row.
              </div>

              {exportError && (
                <div
                  role="alert"
                  className="p-3 bg-danger-subtle/30 border border-danger-subtle text-danger-strong text-xs rounded-input"
                >
                  {exportError}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-subtle">
                  <label htmlFor="audit-export-reason" className="text-main">
                    Reason for export <span className="text-danger-strong">*</span>
                  </label>
                  <span
                    className={`tabular-nums ${
                      trimmedReason.length > 500
                        ? 'text-danger-strong font-bold'
                        : trimmedReason.length < 10
                        ? 'text-muted'
                        : 'text-success-strong'
                    }`}
                  >
                    {trimmedReason.length} / 500 chars (min 10)
                  </span>
                </div>
                <textarea
                  id="audit-export-reason"
                  rows={3}
                  value={exportReason}
                  onChange={(e) => setExportReason(e.target.value)}
                  placeholder="Explain why this audit log export is being performed..."
                  disabled={isExporting}
                  className="w-full px-3 py-2 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-subtle">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  disabled={isExporting}
                  className="px-3.5 py-2 text-xs font-medium text-subtle hover:text-main rounded-input transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isExportReasonValid || isExporting}
                  className="px-4 py-2 bg-brand text-surface text-xs font-medium rounded-input hover:bg-brand-strong transition-colors disabled:opacity-50"
                >
                  {isExporting ? 'Exporting...' : 'Download audit-log.csv'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
