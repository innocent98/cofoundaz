'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  getAdminWorkspaces,
  getSuperAdminBilling,
  overrideRefund,
  overrideCompleteRefund,
  overrideCredit,
  overrideExtendTrial,
  overrideComp,
  AdminWorkspaceRow,
  SuperAdminBillingDetail,
  SuperAdminInvoice,
  SuperAdminOverride,
} from '@/lib/api/admin';
import { formatApiErrorMessage } from '@/lib/api/client';
import { StaffActionDialog } from '@/components/admin/staff-action-dialog';
import {
  Coins,
  Calendar,
  Gift,
  AlertCircle,
  RefreshCw,
  Building2,
  Search,
} from 'lucide-react';

export function SuperAdminBillingView(): React.JSX.Element {
  const [workspaceQuery, setWorkspaceQuery] = useState('');
  const [workspaceOptions, setWorkspaceOptions] = useState<AdminWorkspaceRow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<{ id: string; name: string } | null>(null);

  const [billing, setBilling] = useState<SuperAdminBillingDetail | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Overrides Dialog States
  // 1. Refund
  const [refundInvoice, setRefundInvoice] = useState<SuperAdminInvoice | null>(null);
  const [refundAmountNaira, setRefundAmountNaira] = useState<string>('');
  const refundRequestIdRef = useRef<string>('');

  // 2. Mark Refund Done
  const [completeRefundTarget, setCompleteRefundTarget] = useState<SuperAdminOverride | null>(null);

  // 3. Grant Credit
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState<string>('500');
  const creditRequestIdRef = useRef<string>('');

  // 4. Extend Trial
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [trialDays, setTrialDays] = useState<string>('14');
  const trialRequestIdRef = useRef<string>('');

  // 5. Comp Plan
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [compPlanKey, setCompPlanKey] = useState<string>('Growth');
  const [compDays, setCompDays] = useState<string>('30');
  const compRequestIdRef = useRef<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Search Workspaces Debounce
  useEffect(() => {
    if (!workspaceQuery.trim()) {
      queueMicrotask(() => {
        setWorkspaceOptions([]);
      });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await getAdminWorkspaces({ query: workspaceQuery.trim(), limit: 5 });
        setWorkspaceOptions(res.workspaces);
      } catch {
        setWorkspaceOptions([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [workspaceQuery]);

  // Load Billing for selected workspace
  const loadBilling = async (workspaceId: string) => {
    setIsLoadingBilling(true);
    setBillingError(null);
    try {
      const data = await getSuperAdminBilling(workspaceId);
      setBilling(data);
    } catch (err: unknown) {
      const msg = formatApiErrorMessage(err, 'Failed to load workspace billing details.');
      setBillingError(msg === 'Not Found' ? 'No such workspace.' : msg);
      setBilling(null);
    } finally {
      setIsLoadingBilling(false);
    }
  };

  const handleSelectWorkspace = (ws: AdminWorkspaceRow) => {
    setSelectedWorkspace({ id: ws.id, name: ws.name });
    setWorkspaceQuery(ws.name);
    setWorkspaceOptions([]);
    void loadBilling(ws.id);
  };

  // Format minor units (kobo) to Naira string
  const formatNaira = (minor?: number | null) => {
    if (minor == null) return '₦0';
    return `₦${(minor / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  // --- Handlers for Overrides ---

  // 1. Refund
  const handleOpenRefund = (invoice: SuperAdminInvoice) => {
    setRefundInvoice(invoice);
    setRefundAmountNaira(String(invoice.refundable_minor / 100));
    refundRequestIdRef.current = crypto.randomUUID();
  };

  const handleConfirmRefund = async ({ reason, totp_code }: { reason: string; totp_code: string }) => {
    if (!refundInvoice || !selectedWorkspace) return;
    const amountNum = parseFloat(refundAmountNaira);
    const amountMinor = Math.round(amountNum * 100);

    await overrideRefund(selectedWorkspace.id, {
      invoice_id: refundInvoice.id,
      amount_minor: amountMinor,
      request_id: refundRequestIdRef.current,
      reason,
      totp_code,
    });

    showToast('Recorded as pending. No money has been sent.');
    setRefundInvoice(null);
    await loadBilling(selectedWorkspace.id);
  };

  // 2. Mark Refund Done
  const handleOpenCompleteRefund = (override: SuperAdminOverride) => {
    setCompleteRefundTarget(override);
  };

  const handleConfirmCompleteRefund = async ({ reason, totp_code }: { reason: string; totp_code: string }) => {
    if (!completeRefundTarget || !selectedWorkspace) return;

    await overrideCompleteRefund(selectedWorkspace.id, completeRefundTarget.id, {
      reason,
      totp_code,
    });

    showToast('Refund marked as done.');
    setCompleteRefundTarget(null);
    await loadBilling(selectedWorkspace.id);
  };

  // 3. Credit
  const handleOpenCredit = () => {
    setIsCreditModalOpen(true);
    setCreditAmount('500');
    creditRequestIdRef.current = crypto.randomUUID();
  };

  const handleConfirmCredit = async ({ reason, totp_code }: { reason: string; totp_code: string }) => {
    if (!selectedWorkspace) return;
    const creditsNum = parseInt(creditAmount, 10);

    await overrideCredit(selectedWorkspace.id, {
      credits: creditsNum,
      request_id: creditRequestIdRef.current,
      reason,
      totp_code,
    });

    showToast(`${creditsNum.toLocaleString()} credits granted.`);
    setIsCreditModalOpen(false);
    await loadBilling(selectedWorkspace.id);
  };

  // 4. Extend Trial
  const handleOpenTrial = () => {
    setIsTrialModalOpen(true);
    setTrialDays('14');
    trialRequestIdRef.current = crypto.randomUUID();
  };

  const handleConfirmTrial = async ({ reason, totp_code }: { reason: string; totp_code: string }) => {
    if (!selectedWorkspace) return;
    const daysNum = parseInt(trialDays, 10);

    await overrideExtendTrial(selectedWorkspace.id, {
      days: daysNum,
      request_id: trialRequestIdRef.current,
      reason,
      totp_code,
    });

    showToast(`Trial extended by ${daysNum} days.`);
    setIsTrialModalOpen(false);
    await loadBilling(selectedWorkspace.id);
  };

  // 5. Comp Plan
  const handleOpenComp = () => {
    setIsCompModalOpen(true);
    setCompPlanKey('Growth');
    setCompDays('30');
    compRequestIdRef.current = crypto.randomUUID();
  };

  const handleConfirmComp = async ({ reason, totp_code }: { reason: string; totp_code: string }) => {
    if (!selectedWorkspace) return;
    const daysNum = parseInt(compDays, 10);

    await overrideComp(selectedWorkspace.id, {
      plan_key: compPlanKey,
      days: daysNum,
      request_id: compRequestIdRef.current,
      reason,
      totp_code,
    });

    showToast(`${compPlanKey} plan comped for ${daysNum} days.`);
    setIsCompModalOpen(false);
    await loadBilling(selectedWorkspace.id);
  };

  // Compute trial new end date preview
  const computeNewTrialDate = (daysStr: string) => {
    const days = parseInt(daysStr, 10) || 0;
    const base = billing?.subscription?.ends_at ? new Date(billing.subscription.ends_at) : new Date();
    base.setDate(base.getDate() + days);
    return base.toLocaleDateString();
  };

  // Compute comp end date preview
  const computeCompEndDate = (daysStr: string) => {
    const days = parseInt(daysStr, 10) || 0;
    const now = new Date();
    now.setDate(now.getDate() + days);
    return now.toLocaleDateString();
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

      {/* Top Search Workspace Bar */}
      <div className="bg-surface border border-neutral-subtle rounded-card p-5 shadow-card space-y-3">
        <label htmlFor="workspace-billing-search" className="text-sm font-semibold text-main block">
          Find Workspace
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-subtle absolute left-3 top-3" />
          <input
            id="workspace-billing-search"
            type="text"
            value={workspaceQuery}
            onChange={(e) => setWorkspaceQuery(e.target.value)}
            placeholder="Search workspace by name or identifier..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface-raised border border-neutral-subtle rounded-input text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
          />
          {isSearching && (
            <div className="absolute right-3 top-2.5 text-xs text-subtle animate-spin">
              <RefreshCw className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {workspaceOptions.length > 0 && (
          <div className="max-h-48 overflow-y-auto bg-surface border border-neutral-subtle rounded-input divide-y divide-neutral-subtle shadow-card">
            {workspaceOptions.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => handleSelectWorkspace(ws)}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-surface-raised transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-main">{ws.name}</div>
                  <div className="text-xs text-subtle">
                    Owner: {ws.owner?.name || ws.owner?.email || '-'}
                  </div>
                </div>
                <span className="text-xs text-brand font-medium">Select</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error State */}
      {billingError && (
        <div
          role="alert"
          className="p-4 bg-danger-subtle/20 border border-danger-subtle rounded-card flex items-center gap-2 text-sm text-danger-strong"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{billingError}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoadingBilling && (
        <div className="p-8 bg-surface border border-neutral-subtle rounded-card space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-neutral-100 rounded-input" />
          <div className="h-24 bg-neutral-100 rounded-card" />
        </div>
      )}

      {/* Selected Workspace Billing Content */}
      {!isLoadingBilling && billing && selectedWorkspace && (
        <div className="space-y-6">
          {/* Workspace Title & Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-subtle">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-brand" />
              <div>
                <h2 className="text-base font-bold text-main">
                  {selectedWorkspace.name}
                </h2>
                <span className="text-xs text-subtle">ID: {selectedWorkspace.id}</span>
              </div>
            </div>

            {/* Quick Action Overrides Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Grant Credit */}
              <button
                type="button"
                onClick={handleOpenCredit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-neutral-subtle hover:bg-surface-raised rounded-input text-xs font-medium text-main transition-colors"
              >
                <Coins className="w-3.5 h-3.5 text-brand" />
                Grant credit
              </button>

              {/* Extend Trial (Enabled only if trialing) */}
              <button
                type="button"
                disabled={billing.subscription?.status !== 'trialing'}
                onClick={handleOpenTrial}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-neutral-subtle hover:bg-surface-raised rounded-input text-xs font-medium text-main transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title={
                  billing.subscription?.status !== 'trialing'
                    ? 'Only available when workspace is in trialing status'
                    : undefined
                }
              >
                <Calendar className="w-3.5 h-3.5 text-brand" />
                Extend trial
              </button>

              {/* Comp Plan */}
              <button
                type="button"
                onClick={handleOpenComp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-neutral-subtle hover:bg-surface-raised rounded-input text-xs font-medium text-main transition-colors"
              >
                <Gift className="w-3.5 h-3.5 text-brand" />
                Comp plan
              </button>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="p-5 bg-surface border border-neutral-subtle rounded-card shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-subtle uppercase tracking-wider">
                Current Subscription
              </span>
              {billing.subscription?.comped && (
                <span className="px-2 py-0.5 text-xs font-bold bg-accent-100 text-accent-800 border border-accent-200 rounded-pill">
                  Comped
                </span>
              )}
            </div>

            {!billing.subscription ? (
              <div className="text-sm font-medium text-main">Starter, free</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                <div>
                  <div className="text-xs text-subtle">Plan</div>
                  <div className="text-sm font-semibold text-main">
                    {billing.subscription.plan || 'Free'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-subtle">Status</div>
                  <div className="text-sm font-semibold text-main capitalize">
                    {billing.subscription.status}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-subtle">Price</div>
                  <div className="text-sm font-semibold text-main tabular-nums">
                    {formatNaira(billing.subscription.price_minor)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-subtle">
                    {billing.subscription.ends_at ? 'Ends on' : 'Renews on'}
                  </div>
                  <div className="text-sm font-semibold text-main tabular-nums">
                    {formatDate(billing.subscription.ends_at || billing.subscription.renews_at)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Invoices Table */}
          <div className="bg-surface border border-neutral-subtle rounded-card shadow-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-neutral-subtle">
              <h3 className="text-sm font-semibold text-main">Invoices</h3>
            </div>

            {billing.invoices.length === 0 ? (
              <div className="p-6 text-center text-xs text-subtle">
                No invoices recorded for this workspace.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-raised border-b border-neutral-subtle text-subtle uppercase font-medium tracking-wider">
                    <tr>
                      <th scope="col" className="px-4 py-2.5">Number</th>
                      <th scope="col" className="px-4 py-2.5">Description</th>
                      <th scope="col" className="px-4 py-2.5">Amount</th>
                      <th scope="col" className="px-4 py-2.5">Paid At</th>
                      <th scope="col" className="px-4 py-2.5">Status</th>
                      <th scope="col" className="px-4 py-2.5">Refunded</th>
                      <th scope="col" className="px-4 py-2.5">Pending</th>
                      <th scope="col" className="px-4 py-2.5">Refundable</th>
                      <th scope="col" className="px-4 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-subtle">
                    {billing.invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-surface-raised transition-colors">
                        <td className="px-4 py-3 font-semibold text-main">{inv.number}</td>
                        <td className="px-4 py-3 text-subtle">{inv.description}</td>
                        <td className="px-4 py-3 text-main font-medium tabular-nums">
                          {formatNaira(inv.amount_minor)}
                        </td>
                        <td className="px-4 py-3 text-subtle tabular-nums">{formatDate(inv.paid_at)}</td>
                        <td className="px-4 py-3 capitalize text-subtle">{inv.status}</td>
                        <td className="px-4 py-3 text-subtle tabular-nums">
                          {formatNaira(inv.refunded_minor)}
                        </td>
                        <td className="px-4 py-3 text-subtle tabular-nums">
                          {formatNaira(inv.pending_refund_minor)}
                        </td>
                        <td className="px-4 py-3 text-main font-semibold tabular-nums">
                          {formatNaira(inv.refundable_minor)}
                        </td>
                        <td className="px-4 py-3">
                          {inv.refundable_minor > 0 && (
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => handleOpenRefund(inv)}
                                className="px-2.5 py-1 bg-danger-subtle/30 text-danger-strong border border-danger-subtle rounded-input hover:bg-danger-subtle font-medium text-xs transition-colors"
                              >
                                Refund
                              </button>
                              <div className="text-[10px] text-muted max-w-[150px] leading-tight">
                                Record a refund only when you&apos;re about to make it in Paystack.
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Overrides History Table */}
          <div className="bg-surface border border-neutral-subtle rounded-card shadow-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-neutral-subtle flex items-center justify-between">
              <h3 className="text-sm font-semibold text-main">Overrides History</h3>
              <span className="text-xs text-subtle">
                Credits granted in total:{' '}
                <span className="font-semibold text-main tabular-nums">
                  {billing.credits_granted_total?.toLocaleString() ?? 0}
                </span>
              </span>
            </div>

            {billing.overrides.length === 0 ? (
              <div className="p-6 text-center text-xs text-subtle">
                No billing overrides executed yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-raised border-b border-neutral-subtle text-subtle uppercase font-medium tracking-wider">
                    <tr>
                      <th scope="col" className="px-4 py-2.5">Kind</th>
                      <th scope="col" className="px-4 py-2.5">Details</th>
                      <th scope="col" className="px-4 py-2.5">Reason</th>
                      <th scope="col" className="px-4 py-2.5">Actor</th>
                      <th scope="col" className="px-4 py-2.5">Time</th>
                      <th scope="col" className="px-4 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-subtle">
                    {billing.overrides.map((ovr) => (
                      <tr key={ovr.id} className="hover:bg-surface-raised transition-colors">
                        <td className="px-4 py-3 font-semibold text-main capitalize">
                          {ovr.kind.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3 text-subtle">
                          {ovr.kind === 'refund' && (
                            <span>
                              {formatNaira(ovr.amount_minor)} on {ovr.invoice_number || 'invoice'} (
                              {ovr.provider_refund === 'pending' ? 'Pending' : 'Done'})
                            </span>
                          )}
                          {ovr.kind === 'credit' && (
                            <span>{ovr.credits?.toLocaleString()} AI credits</span>
                          )}
                          {ovr.kind === 'extend_trial' && <span>{ovr.days} days</span>}
                          {ovr.kind === 'comp' && (
                            <span>
                              {ovr.plan_key} ({ovr.days} days)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-subtle max-w-xs truncate">{ovr.reason}</td>
                        <td className="px-4 py-3 text-subtle">{ovr.actor_email}</td>
                        <td className="px-4 py-3 text-subtle tabular-nums">{formatDate(ovr.created_at)}</td>
                        <td className="px-4 py-3">
                          {ovr.provider_refund === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleOpenCompleteRefund(ovr)}
                              className="px-2.5 py-1 bg-brand text-surface rounded-input hover:bg-brand-strong font-medium text-xs transition-colors"
                            >
                              Mark refund done
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. Refund Dialog */}
      {refundInvoice && selectedWorkspace && (
        <StaffActionDialog
          isOpen={true}
          title={`Record Refund for Invoice ${refundInvoice.number}`}
          confirmCopy={`Records a refund of ₦${refundAmountNaira || '0'} on ${refundInvoice.number}. No money is sent. Make the refund in the Paystack dashboard, then mark it done here.`}
          actionButtonLabel="Record Refund"
          actionButtonVariant="danger"
          onClose={() => setRefundInvoice(null)}
          onConfirm={handleConfirmRefund}
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="refund-amount-input" className="text-xs font-medium text-main">
                Refund amount in ₦ (Max: {formatNaira(refundInvoice.refundable_minor)})
              </label>
              <input
                id="refund-amount-input"
                type="number"
                step="any"
                min="1"
                max={refundInvoice.refundable_minor / 100}
                value={refundAmountNaira}
                onChange={(e) => setRefundAmountNaira(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
        </StaffActionDialog>
      )}

      {/* 2. Mark Refund Done Dialog */}
      {completeRefundTarget && selectedWorkspace && (
        <StaffActionDialog
          isOpen={true}
          title="Confirm Paystack Refund Complete"
          confirmCopy={`Confirm the refund of ${formatNaira(completeRefundTarget.amount_minor)} for ${completeRefundTarget.invoice_number || 'invoice'} was made in Paystack. The founder will see the invoice as refunded.`}
          actionButtonLabel="Confirm Done"
          actionButtonVariant="primary"
          onClose={() => setCompleteRefundTarget(null)}
          onConfirm={handleConfirmCompleteRefund}
        />
      )}

      {/* 3. Grant Credit Dialog */}
      {isCreditModalOpen && selectedWorkspace && (
        <StaffActionDialog
          isOpen={true}
          title={`Grant AI Credits to ${selectedWorkspace.name}`}
          confirmCopy={`Gives ${selectedWorkspace.name} ${parseInt(creditAmount, 10) || 0} AI credits. They never expire.`}
          actionButtonLabel="Grant Credits"
          actionButtonVariant="primary"
          onClose={() => setIsCreditModalOpen(false)}
          onConfirm={handleConfirmCredit}
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="credit-amount-input" className="text-xs font-medium text-main">
                Credits to grant (1 to 100,000)
              </label>
              <input
                id="credit-amount-input"
                type="number"
                min="1"
                max="100000"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
        </StaffActionDialog>
      )}

      {/* 4. Extend Trial Dialog */}
      {isTrialModalOpen && selectedWorkspace && (
        <StaffActionDialog
          isOpen={true}
          title={`Extend Trial for ${selectedWorkspace.name}`}
          confirmCopy={`Moves the trial end from ${formatDate(billing?.subscription?.ends_at)} to ${computeNewTrialDate(trialDays)}.`}
          actionButtonLabel="Extend Trial"
          actionButtonVariant="primary"
          onClose={() => setIsTrialModalOpen(false)}
          onConfirm={handleConfirmTrial}
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="trial-days-input" className="text-xs font-medium text-main">
                Days to extend (1 to 60)
              </label>
              <input
                id="trial-days-input"
                type="number"
                min="1"
                max="60"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
        </StaffActionDialog>
      )}

      {/* 5. Comp Plan Dialog */}
      {isCompModalOpen && selectedWorkspace && (
        <StaffActionDialog
          isOpen={true}
          title={`Comp Complimentary Plan for ${selectedWorkspace.name}`}
          confirmCopy={`Gives ${selectedWorkspace.name} the ${compPlanKey} plan free until ${computeCompEndDate(compDays)}. No card, no charge. It ends by itself.`}
          actionButtonLabel="Comp Plan"
          actionButtonVariant="primary"
          onClose={() => setIsCompModalOpen(false)}
          onConfirm={handleConfirmComp}
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="comp-plan-select" className="text-xs font-medium text-main">
                Plan
              </label>
              <select
                id="comp-plan-select"
                value={compPlanKey}
                onChange={(e) => setCompPlanKey(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="Growth">Growth</option>
                <option value="Scale">Scale</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="comp-days-input" className="text-xs font-medium text-main">
                Days free (1 to 365)
              </label>
              <input
                id="comp-days-input"
                type="number"
                min="1"
                max="365"
                value={compDays}
                onChange={(e) => setCompDays(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface-raised border border-neutral-subtle rounded-input text-main focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
        </StaffActionDialog>
      )}
    </div>
  );
}
