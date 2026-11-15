'use client';

import React, { useState, useEffect } from 'react';
import {
  getSuperAdminFlags,
  getFlagImpact,
  createSuperAdminFlag,
  updateSuperAdminFlag,
  getAdminWorkspaces,
  FeatureFlagItem,
  FlagImpactResponse,
  AdminWorkspaceRow,
} from '@/lib/api/admin';
import { formatApiErrorMessage } from '@/lib/api/client';
import { StaffActionDialog } from '@/components/admin/staff-action-dialog';
import { Plus, Edit2, AlertCircle, RefreshCw, X, Search, Check } from 'lucide-react';

export function SuperAdminFlagsView(): React.JSX.Element {
  const [flags, setFlags] = useState<FeatureFlagItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toggle or Rollout Impact Confirm State
  const [impactTarget, setImpactTarget] = useState<{
    flag: FeatureFlagItem;
    proposedEnabled: boolean;
    proposedRollout: number;
    impact: FlagImpactResponse;
  } | null>(null);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);

  // New Flag Modal State
  const [isNewFlagOpen, setIsNewFlagOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStage, setNewStage] = useState<'beta' | 'ga' | 'internal'>('beta');

  // Edit Flag Modal State
  const [editingFlag, setEditingFlag] = useState<FeatureFlagItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStage, setEditStage] = useState<'beta' | 'ga' | 'internal'>('beta');
  const [editAllowList, setEditAllowList] = useState<Array<{ id: string; name: string }>>([]);
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [workspaceSearchResults, setWorkspaceSearchResults] = useState<AdminWorkspaceRow[]>([]);
  const [isSearchingWorkspaces, setIsSearchingWorkspaces] = useState(false);

  const loadFlags = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSuperAdminFlags();
      setFlags(data);
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to load feature flags.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadFlags();
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Trigger Impact Check before Toggle or Rollout change
  const handleInitiateRolloutChange = async (
    flag: FeatureFlagItem,
    proposedEnabled: boolean,
    proposedRollout: number
  ) => {
    setIsLoadingImpact(true);
    try {
      const impact = await getFlagImpact(flag.key, proposedEnabled, proposedRollout);
      setImpactTarget({
        flag,
        proposedEnabled,
        proposedRollout,
        impact,
      });
    } catch (err) {
      showToast(formatApiErrorMessage(err, 'Could not calculate rollout impact.'));
    } finally {
      setIsLoadingImpact(false);
    }
  };

  const handleConfirmRolloutChange = async ({
    reason,
    totp_code,
  }: {
    reason: string;
    totp_code: string;
  }) => {
    if (!impactTarget) return;
    const { flag, proposedEnabled, proposedRollout } = impactTarget;

    const payload: {
      enabled?: boolean;
      rollout_pct?: number;
      reason: string;
      totp_code: string;
    } = { reason, totp_code };

    if (flag.enabled !== proposedEnabled) {
      payload.enabled = proposedEnabled;
    }
    if (flag.rollout_pct !== proposedRollout) {
      payload.rollout_pct = proposedRollout;
    }

    await updateSuperAdminFlag(flag.key, payload);
    showToast(`Flag ${flag.key} updated.`);
    setImpactTarget(null);
    await loadFlags();
  };

  // Open Edit Dialog
  const handleOpenEdit = (flag: FeatureFlagItem) => {
    setEditingFlag(flag);
    setEditName(flag.name);
    setEditDescription(flag.description || '');
    setEditStage((flag.stage as 'beta' | 'ga' | 'internal') || 'beta');
    // Prepopulate allow list names if stored or map IDs
    const currentList = (flag.workspace_ids || []).map((id) => ({ id, name: id }));
    setEditAllowList(currentList);
    setWorkspaceSearch('');
    setWorkspaceSearchResults([]);
  };

  // Search Workspaces for Allow-list
  useEffect(() => {
    if (!editingFlag) return;
    if (!workspaceSearch.trim()) {
      queueMicrotask(() => {
        setWorkspaceSearchResults([]);
      });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingWorkspaces(true);
      try {
        const res = await getAdminWorkspaces({ query: workspaceSearch.trim(), limit: 5 });
        setWorkspaceSearchResults(res.workspaces);
      } catch {
        setWorkspaceSearchResults([]);
      } finally {
        setIsSearchingWorkspaces(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [workspaceSearch, editingFlag]);

  const handleToggleAllowWorkspace = (ws: AdminWorkspaceRow) => {
    setEditAllowList((prev) => {
      const exists = prev.some((item) => item.id === ws.id);
      if (exists) {
        return prev.filter((item) => item.id !== ws.id);
      } else {
        return [...prev, { id: ws.id, name: ws.name }];
      }
    });
  };

  const handleConfirmEditFlag = async ({
    reason,
    totp_code,
  }: {
    reason: string;
    totp_code: string;
  }) => {
    if (!editingFlag) return;

    const changedPayload: {
      name?: string;
      description?: string;
      stage?: string;
      workspace_ids?: string[];
      reason: string;
      totp_code: string;
    } = { reason, totp_code };

    if (editName !== editingFlag.name) changedPayload.name = editName;
    if (editDescription !== editingFlag.description) changedPayload.description = editDescription;
    if (editStage !== editingFlag.stage) changedPayload.stage = editStage;

    const newIds = editAllowList.map((w) => w.id);
    const oldIds = editingFlag.workspace_ids || [];
    const isIdsDifferent =
      newIds.length !== oldIds.length || newIds.some((id) => !oldIds.includes(id));
    if (isIdsDifferent) {
      changedPayload.workspace_ids = newIds;
    }

    await updateSuperAdminFlag(editingFlag.key, changedPayload);
    showToast(`Flag ${editingFlag.key} updated.`);
    setEditingFlag(null);
    await loadFlags();
  };

  // Key validation: lowercase letters, digits, _, 3-60 chars, starts with letter
  const isKeyValid = /^[a-z][a-z0-9_]{2,59}$/.test(newKey.trim());
  const canSubmitNewFlag =
    isKeyValid && newName.trim().length > 0 && newDescription.trim().length > 0;

  const handleConfirmNewFlag = async ({
    reason,
    totp_code,
  }: {
    reason: string;
    totp_code: string;
  }) => {
    await createSuperAdminFlag({
      key: newKey.trim(),
      name: newName.trim(),
      description: newDescription.trim(),
      stage: newStage,
      reason,
      totp_code,
    });
    showToast(`Flag ${newKey.trim()} created.`);
    setIsNewFlagOpen(false);
    setNewKey('');
    setNewName('');
    setNewDescription('');
    setNewStage('beta');
    await loadFlags();
  };

  const getStageBadgeClass = (stage?: string) => {
    switch (stage?.toLowerCase()) {
      case 'ga':
        return 'bg-brand-50 text-brand-700 border-brand-200';
      case 'beta':
        return 'bg-accent-100 text-accent-800 border-accent-200';
      case 'internal':
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
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

      {/* Header with New Flag button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-main">Platform Feature Flags</h2>
          <p className="text-xs text-subtle mt-0.5">
            Real-time toggles and graduated percentage rollouts across workspaces.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewFlagOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand text-surface rounded-input text-xs font-medium hover:bg-brand-strong transition-colors"
        >
          <Plus className="w-4 h-4" />
          New feature flag
        </button>
      </div>

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
            onClick={loadFlags}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-neutral-subtle rounded-input text-main hover:bg-surface-raised font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 bg-surface border border-neutral-subtle rounded-card h-44 animate-pulse"
            />
          ))}
        </div>
      ) : flags.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-neutral-subtle rounded-card text-subtle text-sm">
          No feature flags configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flags.map((flag) => {
            const rolloutOptions = [0, 10, 25, 50, 100];
            return (
              <div
                key={flag.key}
                className="p-5 bg-surface border border-neutral-subtle rounded-card shadow-card space-y-4"
              >
                {/* Header: Name, Key, Badge & Edit */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-main">{flag.name}</span>
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-pill border uppercase tracking-wider ${getStageBadgeClass(
                          flag.stage
                        )}`}
                      >
                        {flag.stage}
                      </span>
                    </div>
                    <div className="text-xs font-body text-subtle break-all">
                      {flag.key}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(flag)}
                    className="p-1.5 text-subtle hover:text-main rounded-input hover:bg-surface-raised transition-colors"
                    aria-label={`Edit ${flag.name}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-subtle leading-relaxed">{flag.description}</p>

                {/* Kill Switch Toggle */}
                <div className="pt-2 border-t border-neutral-subtle flex items-center justify-between">
                  <span className="text-xs font-medium text-main">On / Off (kill switch)</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={flag.enabled}
                    disabled={isLoadingImpact}
                    onClick={() =>
                      handleInitiateRolloutChange(flag, !flag.enabled, flag.rollout_pct)
                    }
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-brand ${
                      flag.enabled ? 'bg-brand' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out ${
                        flag.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Rollout % Buttons */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-subtle">
                    <span>Rollout percentage</span>
                    <span className="font-semibold text-main">{flag.rollout_pct}%</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {rolloutOptions.map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        disabled={isLoadingImpact}
                        onClick={() => handleInitiateRolloutChange(flag, flag.enabled, pct)}
                        className={`py-1 text-xs font-medium rounded-input border transition-colors ${
                          flag.rollout_pct === pct
                            ? 'bg-brand text-surface border-brand'
                            : 'bg-surface-raised border-neutral-subtle text-subtle hover:text-main hover:border-neutral-500'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Affects line */}
                <div className="text-xs text-subtle pt-1">
                  Affects{' '}
                  <span className="font-semibold text-main tabular-nums">
                    {flag.affected_workspaces ?? 0}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-main tabular-nums">
                    {flag.total_workspaces ?? 0}
                  </span>{' '}
                  workspaces
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Impact Confirmation Dialog for Toggle / Rollout % */}
      {impactTarget && (
        <StaffActionDialog
          isOpen={true}
          title={`Update Flag ${impactTarget.flag.key}`}
          confirmCopy={`This affects ~${impactTarget.impact.affected_after} workspaces (now ${impactTarget.impact.affected_now}). Changes are live for real users at once.`}
          actionButtonLabel="Save Changes"
          actionButtonVariant="primary"
          onClose={() => setImpactTarget(null)}
          onConfirm={handleConfirmRolloutChange}
        />
      )}

      {/* New Flag Dialog */}
      {isNewFlagOpen && (
        <StaffActionDialog
          isOpen={true}
          title="Create New Feature Flag"
          actionButtonLabel="Create Flag"
          actionButtonVariant="primary"
          isSubmitDisabled={!canSubmitNewFlag}
          onClose={() => setIsNewFlagOpen(false)}
          onConfirm={handleConfirmNewFlag}
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="new-flag-key" className="text-xs font-medium text-main">
                Flag key <span className="text-danger-strong">*</span>
              </label>
              <input
                id="new-flag-key"
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. ai_voice_notes"
                className="w-full px-3 py-2 text-xs font-body bg-surface-raised border border-neutral-subtle rounded-input text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <p className="text-[11px] text-subtle">
                Lowercase letters, digits, and underscores (3-60 chars). Can&apos;t be changed later.
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="new-flag-name" className="text-xs font-medium text-main">
                Display name <span className="text-danger-strong">*</span>
              </label>
              <input
                id="new-flag-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. AI Voice Notes"
                className="w-full px-3 py-2 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="new-flag-desc" className="text-xs font-medium text-main">
                Description <span className="text-danger-strong">*</span>
              </label>
              <textarea
                id="new-flag-desc"
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Explain what this flag enables..."
                className="w-full px-3 py-2 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand resize-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="new-flag-stage" className="text-xs font-medium text-main">
                Stage
              </label>
              <select
                id="new-flag-stage"
                value={newStage}
                onChange={(e) => setNewStage(e.target.value as 'beta' | 'ga' | 'internal')}
                className="w-full px-3 py-2 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="beta">Beta</option>
                <option value="ga">GA</option>
                <option value="internal">Internal</option>
              </select>
              <p className="text-[11px] text-subtle">New flags start off at 0% rollout.</p>
            </div>
          </div>
        </StaffActionDialog>
      )}

      {/* Edit Flag Dialog */}
      {editingFlag && (
        <StaffActionDialog
          isOpen={true}
          title={`Edit Flag ${editingFlag.key}`}
          actionButtonLabel="Save Changes"
          actionButtonVariant="primary"
          onClose={() => setEditingFlag(null)}
          onConfirm={handleConfirmEditFlag}
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="edit-flag-name" className="text-xs font-medium text-main">
                Display name
              </label>
              <input
                id="edit-flag-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="edit-flag-desc" className="text-xs font-medium text-main">
                Description
              </label>
              <textarea
                id="edit-flag-desc"
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main focus:outline-none focus:ring-1 focus:ring-brand resize-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="edit-flag-stage" className="text-xs font-medium text-main">
                Stage
              </label>
              <select
                id="edit-flag-stage"
                value={editStage}
                onChange={(e) => setEditStage(e.target.value as 'beta' | 'ga' | 'internal')}
                className="w-full px-3 py-2 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="beta">Beta</option>
                <option value="ga">GA</option>
                <option value="internal">Internal</option>
              </select>
              <p className="text-[11px] text-subtle">
                Stage is only a label. Use the allow-list to limit who gets it.
              </p>
            </div>

            {/* Workspace Allow-list */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-main">Workspace Allow-list</label>
              {/* Selected Chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-surface-raised border border-neutral-subtle rounded-input">
                {editAllowList.length === 0 ? (
                  <span className="text-xs text-muted">No workspaces restricted (open to rollout)</span>
                ) : (
                  editAllowList.map((ws) => (
                    <span
                      key={ws.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-brand-50 border border-brand-200 text-brand-700 rounded-pill font-medium"
                    >
                      {ws.name}
                      <button
                        type="button"
                        onClick={() =>
                          setEditAllowList((prev) => prev.filter((item) => item.id !== ws.id))
                        }
                        className="p-0.5 hover:text-danger-strong"
                        aria-label={`Remove ${ws.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Workspace Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-subtle absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={workspaceSearch}
                  onChange={(e) => setWorkspaceSearch(e.target.value)}
                  placeholder="Search workspace name to add..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-surface border border-neutral-subtle rounded-input text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
                />
                {isSearchingWorkspaces && (
                  <div className="absolute right-2.5 top-2.5 text-xs text-subtle animate-spin">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Search dropdown results */}
              {workspaceSearchResults.length > 0 && (
                <div className="max-h-36 overflow-y-auto bg-surface border border-neutral-subtle rounded-input divide-y divide-neutral-subtle shadow-card">
                  {workspaceSearchResults.map((ws) => {
                    const isSelected = editAllowList.some((item) => item.id === ws.id);
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => handleToggleAllowWorkspace(ws)}
                        className="w-full px-3 py-2 text-xs flex items-center justify-between text-left hover:bg-surface-raised transition-colors"
                      >
                        <span className="font-medium text-main">{ws.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </StaffActionDialog>
      )}
    </div>
  );
}
