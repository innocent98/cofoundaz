'use client';

import React, { useState, useEffect } from 'react';
import {
  getSuperAdminStaff,
  addSuperAdminStaff,
  editSuperAdminStaff,
  revokeSuperAdminStaff,
  SuperAdminStaffMember,
  AdminMeResponse,
} from '@/lib/api/admin';
import { formatApiErrorMessage } from '@/lib/api/client';
import { StaffActionDialog } from '@/components/admin/staff-action-dialog';
import { UserPlus, AlertCircle, RefreshCw } from 'lucide-react';

interface SuperAdminStaffViewProps {
  currentStaff: AdminMeResponse | null;
}

const AVAILABLE_SCOPES = [
  { id: 'support', label: 'Support' },
  { id: 'content', label: 'Content' },
  { id: 'moderation', label: 'Moderation' },
];

export function SuperAdminStaffView({ currentStaff }: SuperAdminStaffViewProps): React.JSX.Element {
  const [staff, setStaff] = useState<SuperAdminStaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Staff Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<'admin' | 'super_admin'>('admin');
  const [addScopes, setAddScopes] = useState<string[]>(['support']);

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState<SuperAdminStaffMember | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'super_admin'>('admin');
  const [editScopes, setEditScopes] = useState<string[]>([]);

  // Revoke Staff State
  const [revokingStaff, setRevokingStaff] = useState<SuperAdminStaffMember | null>(null);

  const loadStaff = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSuperAdminStaff();
      setStaff(data);
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to load staff list.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadStaff();
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const formatTimestamp = (dateStr?: string | null) => {
    if (!dateStr) return 'Never';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  // Add Staff Handler
  const handleToggleAddScope = (scopeId: string) => {
    setAddScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    );
  };

  const isAddValid =
    addEmail.trim().length > 0 &&
    (addRole === 'super_admin' || addScopes.length > 0);

  const handleConfirmAdd = async ({ reason, totp_code }: { reason: string; totp_code: string }) => {
    await addSuperAdminStaff({
      email: addEmail.trim(),
      role: addRole,
      scopes: addRole === 'admin' ? addScopes : [],
      reason,
      totp_code,
    });

    showToast(`${addEmail.trim()} added.`);
    setIsAddModalOpen(false);
    setAddEmail('');
    setAddRole('admin');
    setAddScopes(['support']);
    await loadStaff();
  };

  // Edit Staff Handler
  const handleOpenEdit = (member: SuperAdminStaffMember) => {
    setEditingStaff(member);
    setEditRole((member.role as 'admin' | 'super_admin') || 'admin');
    setEditScopes(member.scopes || []);
  };

  const handleToggleEditScope = (scopeId: string) => {
    setEditScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    );
  };

  const isEditValid = editRole === 'super_admin' || editScopes.length > 0;

  const handleConfirmEdit = async ({ reason, totp_code }: { reason: string; totp_code: string }) => {
    if (!editingStaff) return;
    try {
      await editSuperAdminStaff(editingStaff.id, {
        role: editRole,
        scopes: editRole === 'admin' ? editScopes : [],
        reason,
        totp_code,
      });
      showToast('Access updated.');
      setEditingStaff(null);
      await loadStaff();
    } catch (err: unknown) {
      const msg = formatApiErrorMessage(err);
      if (msg.includes('ALREADY_REVOKED') || (err as { status?: number }).status === 409) {
        showToast('That access was revoked. Add them again.');
        setEditingStaff(null);
        await loadStaff();
      } else {
        throw err;
      }
    }
  };

  // Revoke Staff Handler
  const handleOpenRevoke = (member: SuperAdminStaffMember) => {
    setRevokingStaff(member);
  };

  const handleConfirmRevoke = async ({ reason, totp_code }: { reason: string; totp_code: string }) => {
    if (!revokingStaff) return;

    await revokeSuperAdminStaff(revokingStaff.id, {
      reason,
      totp_code,
    });

    showToast('Access revoked.');
    setRevokingStaff(null);
    await loadStaff();
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

      {/* Header with Add Staff button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-main">Platform Staff Access</h2>
          <p className="text-xs text-subtle mt-0.5">
            Manage Super Admins and scoped Support/Content administrators.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand text-surface rounded-input text-xs font-medium hover:bg-brand-strong transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add staff member
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
            onClick={loadStaff}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-neutral-subtle rounded-input text-main hover:bg-surface-raised font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Staff Table Card */}
      <div className="bg-surface border border-neutral-subtle rounded-card shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-neutral-100 rounded-input animate-pulse" />
            ))}
          </div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center text-sm text-subtle">
            No staff members found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-raised border-b border-neutral-subtle text-xs font-medium text-subtle uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3">Staff member</th>
                  <th scope="col" className="px-5 py-3">Role</th>
                  <th scope="col" className="px-5 py-3">Last access</th>
                  <th scope="col" className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-subtle">
                {staff.map((member) => {
                  const isRevoked = Boolean(member.revoked_at);
                  const isOwnRow =
                    member.user_id === currentStaff?.user_id ||
                    (currentStaff?.email && member.email === currentStaff.email);

                  return (
                    <tr key={member.id} className="hover:bg-surface-raised transition-colors">
                      {/* Name & Email */}
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-main">
                          {member.full_name || member.email}
                        </div>
                        {member.full_name && (
                          <div className="text-xs text-subtle">{member.email}</div>
                        )}
                      </td>

                      {/* Role & Scopes */}
                      <td className="px-5 py-3.5">
                        {isRevoked ? (
                          <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-danger-subtle/30 text-danger-strong border border-danger-subtle rounded-pill">
                            Revoked
                          </span>
                        ) : member.role === 'super_admin' ? (
                          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 rounded-pill">
                            Super admin
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(member.scopes || []).map((scope) => (
                              <span
                                key={scope}
                                className="inline-block px-2 py-0.5 text-xs font-medium bg-surface-raised border border-neutral-subtle text-main rounded-pill capitalize"
                              >
                                {scope}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Last Access */}
                      <td className="px-5 py-3.5 text-xs text-subtle tabular-nums">
                        {formatTimestamp(member.last_login_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        {!isRevoked && !isOwnRow ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(member)}
                              className="px-2.5 py-1 text-xs font-medium text-subtle hover:text-main bg-surface border border-neutral-subtle rounded-input hover:bg-surface-raised transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRevoke(member)}
                              className="px-2.5 py-1 text-xs font-medium text-danger-strong bg-danger-subtle/20 border border-danger-subtle rounded-input hover:bg-danger-subtle/40 transition-colors"
                            >
                              Revoke
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <StaffActionDialog
          isOpen={true}
          title="Add Staff Member"
          actionButtonLabel="Add Staff"
          actionButtonVariant="primary"
          isSubmitDisabled={!isAddValid}
          onClose={() => setIsAddModalOpen(false)}
          onConfirm={handleConfirmAdd}
        >
          <div className="space-y-4">
            <div className="p-3 bg-brand-50 border border-brand-200 rounded-input text-xs text-brand-800 font-medium">
              They need a Cofoundaz account with an authenticator app turned on first. There&apos;s no emailed invite.
            </div>

            <div className="space-y-1">
              <label htmlFor="add-staff-email" className="text-xs font-medium text-main">
                Account email <span className="text-danger-strong">*</span>
              </label>
              <input
                id="add-staff-email"
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full px-3 py-2 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="add-staff-role" className="text-xs font-medium text-main">
                Role
              </label>
              <select
                id="add-staff-role"
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as 'admin' | 'super_admin')}
                className="w-full px-3 py-2 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="admin">Admin (Scoped)</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            {addRole === 'admin' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-main">
                  Scopes <span className="text-danger-strong">*</span> (select at least one)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {AVAILABLE_SCOPES.map((sc) => {
                    const isChecked = addScopes.includes(sc.id);
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => handleToggleAddScope(sc.id)}
                        className={`p-2 rounded-input border text-xs font-medium text-center transition-colors ${
                          isChecked
                            ? 'bg-brand-50 border-brand text-brand-700'
                            : 'bg-surface-raised border-neutral-subtle text-subtle hover:text-main'
                        }`}
                      >
                        {sc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </StaffActionDialog>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <StaffActionDialog
          isOpen={true}
          title={`Edit Staff Access for ${editingStaff.full_name || editingStaff.email}`}
          actionButtonLabel="Update Access"
          actionButtonVariant="primary"
          isSubmitDisabled={!isEditValid}
          onClose={() => setEditingStaff(null)}
          onConfirm={handleConfirmEdit}
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="edit-staff-role" className="text-xs font-medium text-main">
                Role
              </label>
              <select
                id="edit-staff-role"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as 'admin' | 'super_admin')}
                className="w-full px-3 py-2 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="admin">Admin (Scoped)</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            {editRole === 'admin' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-main">
                  Scopes <span className="text-danger-strong">*</span> (select at least one)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {AVAILABLE_SCOPES.map((sc) => {
                    const isChecked = editScopes.includes(sc.id);
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => handleToggleEditScope(sc.id)}
                        className={`p-2 rounded-input border text-xs font-medium text-center transition-colors ${
                          isChecked
                            ? 'bg-brand-50 border-brand text-brand-700'
                            : 'bg-surface-raised border-neutral-subtle text-subtle hover:text-main'
                        }`}
                      >
                        {sc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </StaffActionDialog>
      )}

      {/* Revoke Staff Confirmation Dialog */}
      {revokingStaff && (
        <StaffActionDialog
          isOpen={true}
          title="Revoke Staff Access"
          confirmCopy={`Revoke staff access for ${revokingStaff.email}? It stops on their next request.`}
          actionButtonLabel="Revoke Access"
          actionButtonVariant="danger"
          onClose={() => setRevokingStaff(null)}
          onConfirm={handleConfirmRevoke}
        />
      )}
    </div>
  );
}
