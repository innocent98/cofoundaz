'use client';

import React, { useState, useEffect } from 'react';
import {
  getAdminKpis,
  getSuperAdminAuditRecent,
  DashboardKpisResponse,
  SuperAdminAuditItem,
} from '@/lib/api/admin';
import { formatApiErrorMessage } from '@/lib/api/client';
import { Building2, History, AlertCircle, RefreshCw } from 'lucide-react';

export function SuperAdminOverviewView(): React.JSX.Element {
  const [kpis, setKpis] = useState<DashboardKpisResponse | null>(null);
  const [recentActions, setRecentActions] = useState<SuperAdminAuditItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [kpisData, auditData] = await Promise.all([
        getAdminKpis(),
        getSuperAdminAuditRecent(),
      ]);
      setKpis(kpisData);
      setRecentActions(auditData);
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to load overview data.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, []);

  const formatTimestamp = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Error state with retry */}
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
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-neutral-subtle rounded-input text-main hover:bg-surface-raised font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Workspaces Tile */}
        <div className="p-5 bg-surface border border-neutral-subtle rounded-card shadow-card">
          <div className="flex items-center justify-between text-subtle mb-3">
            <span className="text-sm font-medium text-main">Total Workspaces</span>
            <Building2 className="w-5 h-5 text-brand" />
          </div>
          {isLoading ? (
            <div className="h-8 w-24 bg-neutral-100 rounded-input animate-pulse" />
          ) : (
            <div>
              <div className="text-2xl font-bold font-display text-main tabular-nums">
                {kpis?.total_workspaces?.value != null
                  ? kpis.total_workspaces.value.toLocaleString()
                  : '-'}
              </div>
              <div className="text-xs text-subtle mt-1 font-medium">
                {kpis?.total_workspaces?.new_in_window != null
                  ? `+${kpis.total_workspaces.new_in_window} in 30 days`
                  : 'Active workspaces across platform'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Privileged Actions */}
      <div className="bg-surface border border-neutral-subtle rounded-card shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-main">Recent Privileged Actions</h3>
          </div>
          <span className="text-xs text-subtle font-medium">Last 5 actions</span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-neutral-100 rounded-input animate-pulse" />
            ))}
          </div>
        ) : recentActions.length === 0 ? (
          <div className="p-8 text-center text-sm text-subtle">
            No recent privileged actions logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-raised border-b border-neutral-subtle text-xs font-medium text-subtle uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3">Action</th>
                  <th scope="col" className="px-5 py-3">Actor</th>
                  <th scope="col" className="px-5 py-3">Reason</th>
                  <th scope="col" className="px-5 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-subtle">
                {recentActions.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-raised transition-colors">
                    <td className="px-5 py-3.5 font-medium text-main">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 rounded-pill">
                        {item.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-subtle">
                      {item.actor_email || item.actor_id || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-subtle max-w-xs truncate">
                      {item.reason || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-subtle whitespace-nowrap text-xs tabular-nums">
                      {formatTimestamp(item.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
