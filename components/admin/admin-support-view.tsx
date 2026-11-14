'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy,
  Search,
  AlertCircle,
  Send,
  ShieldAlert,
  Lock,
  User,
  MessageSquare,
  FileText,
  X,
} from 'lucide-react';
import {
  getAdminSupportCounts,
  getAdminSupportTickets,
  getAdminSupportTicket,
  getAdminSupportAssignees,
  getAdminCannedResponses,
  replyAdminSupportTicket,
  addAdminSupportNote,
  updateAdminSupportPriority,
  assignAdminSupportTicket,
  escalateAdminSupportTicket,
  resolveAdminSupportTicket,
  reopenAdminSupportTicket,
  type AdminSupportCounts,
  type AdminTicketItem,
  type AdminTicketDetail,
  type AdminSupportAssignee,
  type AdminCannedResponse,
  type TicketTab,
  type TicketPriority,
  type SlaState,
  ApiError,
} from '@/lib/api/admin-tickets';
import { type AdminMeResponse } from '@/lib/api/admin';
import { formatApiErrorMessage } from '@/lib/api/client';
import { StaffActionDialog } from '@/components/admin/staff-action-dialog';
import { CannedResponsesDialog } from '@/components/admin/canned-responses-dialog';

export interface AdminSupportViewProps {
  adminMe: AdminMeResponse;
  initialTicketId?: string | null;
}

function renderPriorityBadge(priority: TicketPriority) {
  const map = {
    P1: 'bg-danger-subtle text-danger-strong border-danger-subtle',
    P2: 'bg-warning-subtle text-warning-strong border-warning-subtle',
    P3: 'bg-brand-subtle text-brand-strong border-brand-subtle',
    P4: 'bg-neutral-subtle text-subtle border-neutral-subtle',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-bold rounded-pill border ${map[priority] || map.P4}`}>
      {priority}
    </span>
  );
}

function renderSlaBadge(sla: { state: SlaState; due_at: string | null }) {
  if (sla.state === 'breached') {
    return (
      <span className="px-2 py-0.5 text-xs font-semibold rounded-pill bg-danger-subtle text-danger-strong border border-danger-subtle">
        Overdue
      </span>
    );
  }
  if (sla.state === 'met') {
    return (
      <span className="px-2 py-0.5 text-xs font-semibold rounded-pill bg-success-subtle text-success-strong border border-success-subtle">
        Met
      </span>
    );
  }
  if (sla.state === 'late') {
    return (
      <span className="px-2 py-0.5 text-xs font-semibold rounded-pill bg-neutral-subtle text-subtle border border-neutral-subtle">
        Answered late
      </span>
    );
  }

  // Countdown calculation for due_soon or ok
  let timeLabel = 'Due soon';
  if (sla.due_at) {
    try {
      const diff = new Date(sla.due_at).getTime() - Date.now();
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        timeLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      } else {
        timeLabel = 'Overdue';
      }
    } catch {
      timeLabel = 'Due soon';
    }
  }

  if (sla.state === 'due_soon') {
    return (
      <span className="px-2 py-0.5 text-xs font-semibold rounded-pill bg-warning-subtle text-warning-strong border border-warning-subtle">
        {timeLabel}
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 text-xs font-semibold rounded-pill bg-surface-raised text-subtle border border-neutral-subtle">
      {timeLabel}
    </span>
  );
}

function formatAge(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return dateStr;
  }
}

export function AdminSupportView({
  adminMe,
  initialTicketId,
}: AdminSupportViewProps): React.JSX.Element {
  // Tabs & Counts
  const [activeTab, setActiveTab] = useState<TicketTab>('open');
  const [counts, setCounts] = useState<AdminSupportCounts>({
    open: 0,
    mine: 0,
    resolved: 0,
    breached: 0,
    unassigned: 0,
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState<'all' | 'breached' | 'due_soon'>('all');
  const [escalatedOnly, setEscalatedOnly] = useState(false);
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  // Tickets List
  const [tickets, setTickets] = useState<AdminTicketItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Selected Ticket & Thread
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(initialTicketId || null);
  const [ticketDetail, setTicketDetail] = useState<AdminTicketDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Thread Sub-Tab: Conversation vs Internal Notes
  const [threadTab, setThreadTab] = useState<'conversation' | 'notes'>('conversation');

  // Assignees & Canned Responses
  const [assignees, setAssignees] = useState<AdminSupportAssignee[]>([]);
  const [cannedResponses, setCannedResponses] = useState<AdminCannedResponse[]>([]);
  const [isCannedManagerOpen, setIsCannedManagerOpen] = useState(false);

  // Reply & Note text states
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const [noteText, setNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Action Modals State
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalateError, setEscalateError] = useState<string | null>(null);

  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);

  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [isReopening, setIsReopening] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch counts
  const fetchCounts = useCallback(async () => {
    try {
      const data = await getAdminSupportCounts();
      setCounts(data);
    } catch {
      // Ignore count errors silently
    }
  }, []);

  // Fetch assignees
  const fetchAssignees = useCallback(async () => {
    try {
      const data = await getAdminSupportAssignees();
      setAssignees(data);
    } catch {
      // Ignore
    }
  }, []);

  // Fetch canned responses
  const fetchCanned = useCallback(async () => {
    try {
      const data = await getAdminCannedResponses();
      setCannedResponses(data);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchCounts();
      void fetchAssignees();
      void fetchCanned();
    });
  }, [fetchCounts, fetchAssignees, fetchCanned]);

  // Fetch Tickets List
  const fetchTickets = useCallback(
    async (reset = true, cursor?: string) => {
      if (reset) {
        setLoadingList(true);
        setListError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await getAdminSupportTickets({
          tab: activeTab,
          priority: priorityFilter,
          category: categoryFilter,
          sla: slaFilter,
          escalated: escalatedOnly,
          unassigned: unassignedOnly,
          query: debouncedQuery,
          cursor,
        });

        if (reset) {
          setTickets(res.tickets);
          // If no ticket selected yet and tickets exist, pick the first
          setSelectedTicketId((prev) => prev || (res.tickets.length > 0 ? res.tickets[0].id : null));
        } else {
          setTickets((prev) => [...prev, ...res.tickets]);
        }
        setNextCursor(res.next_cursor);
      } catch (err: unknown) {
        setListError(formatApiErrorMessage(err, 'Failed to load tickets.'));
      } finally {
        setLoadingList(false);
        setLoadingMore(false);
      }
    },
    [
      activeTab,
      priorityFilter,
      categoryFilter,
      slaFilter,
      escalatedOnly,
      unassignedOnly,
      debouncedQuery,
    ]
  );

  useEffect(() => {
    queueMicrotask(() => {
      void fetchTickets(true);
    });
  }, [fetchTickets]);

  // Fetch Ticket Detail
  const fetchDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    setDetailError(null);
    setReplyError(null);
    setNoteError(null);

    try {
      const detail = await getAdminSupportTicket(id);
      setTicketDetail(detail);
    } catch (err: unknown) {
      setDetailError(formatApiErrorMessage(err, 'Failed to load ticket thread.'));
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      if (selectedTicketId) {
        void fetchDetail(selectedTicketId);
      } else {
        setTicketDetail(null);
      }
    });
  }, [selectedTicketId, fetchDetail]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  // Select Canned Response
  const handleSelectCanned = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const item = cannedResponses.find((c) => c.id === id);
    if (item) {
      setReplyText((prev) => (prev ? `${prev}\n\n${item.body}` : item.body));
    }
    e.target.value = '';
  };

  // Send Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId) return;
    const body = replyText.trim();
    if (!body) return;

    setIsReplying(true);
    setReplyError(null);

    try {
      const message = await replyAdminSupportTicket(selectedTicketId, { body });
      setReplyText('');

      // Update thread detail locally
      setTicketDetail((prev) => {
        if (!prev) return null;
        // First reply assigns to current staff if unassigned
        const newAssignee = prev.ticket.assignee || {
          id: adminMe.user_id,
          name: adminMe.full_name || 'Staff',
          email: adminMe.email || '',
        };
        return {
          ...prev,
          ticket: {
            ...prev.ticket,
            assignee: newAssignee,
          },
          messages: [...prev.messages, message],
        };
      });

      void fetchCounts();
    } catch (err: unknown) {
      setReplyError(formatApiErrorMessage(err, 'Failed to send reply.'));
    } finally {
      setIsReplying(false);
    }
  };

  // Add Internal Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId) return;
    const body = noteText.trim();
    if (!body) return;

    setIsAddingNote(true);
    setNoteError(null);

    try {
      const note = await addAdminSupportNote(selectedTicketId, { body });
      setNoteText('');
      setTicketDetail((prev) => (prev ? { ...prev, notes: [...prev.notes, note] } : null));
    } catch (err: unknown) {
      setNoteError(formatApiErrorMessage(err, 'Failed to add internal note.'));
    } finally {
      setIsAddingNote(false);
    }
  };

  // Change Priority
  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!selectedTicketId || !ticketDetail) return;
    try {
      await updateAdminSupportPriority(selectedTicketId, newPriority);
      setTicketDetail((prev) => (prev ? { ...prev, ticket: { ...prev.ticket, priority: newPriority } } : null));
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicketId ? { ...t, priority: newPriority } : t))
      );
    } catch (err: unknown) {
      alert(formatApiErrorMessage(err, 'Failed to update priority.'));
    }
  };

  // Assign Ticket
  const handleAssignTicket = async (assigneeId: string | null) => {
    if (!selectedTicketId || !ticketDetail) return;
    try {
      await assignAdminSupportTicket(selectedTicketId, assigneeId);
      const assignedObj = assigneeId
        ? assignees.find((a) => a.id === assigneeId) || {
            id: assigneeId,
            name: adminMe.full_name || 'Staff',
            email: adminMe.email || '',
          }
        : null;

      setTicketDetail((prev) => (prev ? { ...prev, ticket: { ...prev.ticket, assignee: assignedObj } } : null));
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicketId ? { ...t, assignee: assignedObj } : t))
      );
      void fetchCounts();
    } catch (err: unknown) {
      alert(formatApiErrorMessage(err, 'Failed to assign ticket.'));
    }
  };

  // Escalate Ticket
  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId) return;
    const reason = escalateReason.trim();
    if (reason.length < 10 || reason.length > 500) return;

    setIsEscalating(true);
    setEscalateError(null);

    try {
      await escalateAdminSupportTicket(selectedTicketId, { reason });
      setIsEscalateModalOpen(false);
      setEscalateReason('');
      void fetchDetail(selectedTicketId);
      void fetchCounts();
      void fetchTickets(true);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        setEscalateError('This ticket has already been escalated.');
      } else {
        setEscalateError(formatApiErrorMessage(err, 'Failed to escalate ticket.'));
      }
    } finally {
      setIsEscalating(false);
    }
  };

  // Reopen Ticket
  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId) return;
    setIsReopening(true);
    setReopenError(null);

    try {
      await reopenAdminSupportTicket(selectedTicketId, {
        reason: reopenReason.trim() || undefined,
      });
      setIsReopenModalOpen(false);
      setReopenReason('');
      void fetchDetail(selectedTicketId);
      void fetchCounts();
      void fetchTickets(true);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        setReopenError(formatApiErrorMessage(err, 'Ticket state conflict. Refreshing ticket...'));
        void fetchDetail(selectedTicketId);
      } else {
        setReopenError(formatApiErrorMessage(err, 'Failed to reopen ticket.'));
      }
    } finally {
      setIsReopening(false);
    }
  };

  // Resolve Ticket via StaffActionDialog (Reason + fresh 6-digit TOTP)
  const handleConfirmResolve = async (payload: { reason: string; totp_code: string }) => {
    if (!selectedTicketId) return;
    await resolveAdminSupportTicket(selectedTicketId, {
      reason: payload.reason,
      totp_code: payload.totp_code,
    });
    // On success, refetch counts, reload list, and move to resolved tab or refetch detail
    void fetchCounts();
    void fetchTickets(true);
    if (selectedTicketId) {
      void fetchDetail(selectedTicketId);
    }
  };

  // -------------------------------------------------------------------------
  // Render Helpers
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6 font-body">
      {/* Header Tabs & Canned Manager Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-subtle pb-4">
        {/* Sub-Tabs */}
        <div className="flex items-center gap-2">
          {(
            [
              { id: 'open', label: 'Open', count: counts.open },
              { id: 'mine', label: 'Mine', count: counts.mine },
              { id: 'resolved', label: 'Resolved', count: counts.resolved },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedTicketId(null);
              }}
              className={`px-4 py-2 rounded-pill text-xs font-semibold transition-all inline-flex items-center gap-2 border cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-neutral-x1c211f text-white border-neutral-x1c211f shadow-card'
                  : 'text-subtle hover:text-main hover:bg-surface-raised border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`tabular-nums text-[11px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-surface-raised text-subtle'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}

          {/* Breached & Unassigned Quick Chips */}
          <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-neutral-subtle">
            {counts.breached > 0 && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-pill bg-danger-subtle text-danger-strong border border-danger-subtle">
                {counts.breached} overdue
              </span>
            )}
            {counts.unassigned > 0 && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-pill bg-surface-raised text-subtle border border-neutral-subtle">
                {counts.unassigned} unassigned
              </span>
            )}
          </div>
        </div>

        {/* Manage Canned Responses */}
        <button
          type="button"
          onClick={() => setIsCannedManagerOpen(true)}
          className="px-3.5 py-2 bg-surface-raised border border-neutral-subtle rounded-input text-xs font-semibold text-main hover:bg-neutral-subtle shadow-card transition-colors inline-flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <MessageSquare className="w-4 h-4 text-brand" />
          <span>Manage replies</span>
        </button>
      </div>

      {/* Filters Row */}
      <div className="bg-surface border border-neutral-subtle rounded-card p-4 shadow-card space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subject, T-1001, person, workspace..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-raised border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main placeholder:text-muted"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'all')}
            className="px-3 py-1.5 text-xs bg-surface-raised border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main"
          >
            <option value="all">All Priorities</option>
            <option value="P1">P1 - Critical</option>
            <option value="P2">P2 - High</option>
            <option value="P3">P3 - Medium</option>
            <option value="P4">P4 - Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-surface-raised border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main"
          >
            <option value="all">All Categories</option>
            <option value="billing">Billing</option>
            <option value="account">Account</option>
            <option value="bug">Something is broken</option>
            <option value="how_to">How do I...</option>
            <option value="feature_request">Feature request</option>
            <option value="other">Other</option>
          </select>

          {/* SLA Filter */}
          <select
            value={slaFilter}
            onChange={(e) => setSlaFilter(e.target.value as 'all' | 'breached' | 'due_soon')}
            className="px-3 py-1.5 text-xs bg-surface-raised border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main"
          >
            <option value="all">All SLA States</option>
            <option value="breached">Breached (Overdue)</option>
            <option value="due_soon">Due Soon</option>
          </select>

          {/* Toggles */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEscalatedOnly(!escalatedOnly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-pill border transition-colors cursor-pointer ${
                escalatedOnly
                  ? 'bg-danger-subtle text-danger-strong border-danger-subtle shadow-card'
                  : 'text-subtle border-neutral-subtle hover:bg-surface-raised'
              }`}
            >
              Escalated
            </button>
            <button
              type="button"
              onClick={() => setUnassignedOnly(!unassignedOnly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-pill border transition-colors cursor-pointer ${
                unassignedOnly
                  ? 'bg-brand-subtle text-brand-strong border-brand-subtle shadow-card'
                  : 'text-subtle border-neutral-subtle hover:bg-surface-raised'
              }`}
            >
              Unassigned
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Tickets List (Left) + Thread Pane (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-5 bg-surface border border-neutral-subtle rounded-card shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-subtle bg-surface-raised flex items-center justify-between">
            <h4 className="text-xs font-bold text-main uppercase tracking-wider">
              {activeTab} Tickets
            </h4>
            <span className="text-xs text-subtle font-medium tabular-nums">
              {tickets.length} loaded
            </span>
          </div>

          {loadingList ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-subtle">Loading tickets...</p>
            </div>
          ) : listError ? (
            <div className="p-6 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-danger-strong mx-auto" />
              <p className="text-xs font-medium text-main">{listError}</p>
              <button
                type="button"
                onClick={() => void fetchTickets(true)}
                className="px-3 py-1 bg-surface-raised border border-neutral-subtle rounded-input text-xs font-medium text-main hover:bg-neutral-subtle cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-subtle">
              Nothing matches that search.
            </div>
          ) : (
            <div className="divide-y divide-neutral-subtle max-h-[700px] overflow-y-auto">
              {tickets.map((t) => {
                const isSelected = t.id === selectedTicketId;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-4 transition-colors cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-brand-subtle/30 border-l-4 border-l-brand'
                        : 'hover:bg-surface-raised'
                    }`}
                  >
                    {/* Top Row: Number, Priority, Escalated, SLA */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="tabular-nums font-bold text-xs text-subtle bg-surface-raised px-1.5 py-0.5 rounded-[4px] border border-neutral-subtle">
                          {t.number}
                        </span>
                        {renderPriorityBadge(t.priority)}
                        {t.is_escalated && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold uppercase rounded-pill bg-danger text-white">
                            Escalated
                          </span>
                        )}
                      </div>
                      <div className="shrink-0">{renderSlaBadge(t.sla)}</div>
                    </div>

                    {/* Subject */}
                    <h5 className="text-sm font-semibold text-main line-clamp-1">{t.subject}</h5>

                    {/* Details: Founder, Workspace, Assignee, Age */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-subtle">
                      <span className="font-medium text-main">{t.founder.name || t.founder.email}</span>
                      <span>•</span>
                      <span>{t.workspace.name} ({t.workspace.plan_key})</span>
                      <span>•</span>
                      <span className="text-muted">{formatAge(t.created_at)}</span>
                    </div>

                    <div className="text-[11px] text-muted flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{t.assignee?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {nextCursor && !loadingList && (
            <div className="p-3 border-t border-neutral-subtle text-center bg-surface-raised">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void fetchTickets(false, nextCursor)}
                className="px-3.5 py-1.5 bg-surface border border-neutral-subtle rounded-input text-xs font-semibold text-main hover:bg-neutral-subtle shadow-card transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Thread Pane */}
        <div className="lg:col-span-7 bg-surface border border-neutral-subtle rounded-card shadow-card overflow-hidden">
          {!selectedTicketId ? (
            <div className="p-12 text-center text-xs text-subtle space-y-2">
              <LifeBuoy className="w-8 h-8 text-muted mx-auto" />
              <p>Select a ticket from the list to view conversation and take action.</p>
            </div>
          ) : loadingDetail ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-7 h-7 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-subtle">Loading ticket thread...</p>
            </div>
          ) : detailError || !ticketDetail ? (
            <div className="p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-danger-strong mx-auto" />
              <p className="text-sm font-semibold text-main">{detailError || 'Ticket not found.'}</p>
              <button
                type="button"
                onClick={() => void fetchDetail(selectedTicketId)}
                className="px-3.5 py-1.5 bg-surface-raised border border-neutral-subtle rounded-input text-xs font-medium text-main hover:bg-neutral-subtle cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Thread Header */}
              <div className="p-5 border-b border-neutral-subtle bg-surface-raised space-y-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums font-bold text-xs bg-surface px-2 py-0.5 rounded-[4px] border border-neutral-subtle text-subtle">
                        {ticketDetail.ticket.number}
                      </span>
                      <span className="text-xs text-subtle font-medium capitalize">
                        {ticketDetail.ticket.category}
                      </span>
                      {ticketDetail.ticket.is_escalated && (
                        <span className="px-2 py-0.5 text-xs font-bold uppercase rounded-pill bg-danger text-white">
                          Escalated
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-main">{ticketDetail.ticket.subject}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-subtle pt-0.5">
                      <span className="font-semibold text-main">
                        {ticketDetail.ticket.founder.name || ticketDetail.ticket.founder.email}
                      </span>
                      <span>({ticketDetail.ticket.founder.email})</span>
                      <span>•</span>
                      <span>
                        {ticketDetail.ticket.workspace.name} · {ticketDetail.ticket.workspace.plan_key}
                      </span>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-2 shrink-0">
                    {ticketDetail.ticket.status !== 'resolved' ? (
                      <>
                        {!ticketDetail.ticket.is_escalated && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEscalateModalOpen(true);
                              setEscalateReason('');
                              setEscalateError(null);
                            }}
                            className="px-3 py-1.5 bg-danger-subtle text-danger-strong border border-danger-subtle rounded-input text-xs font-semibold hover:bg-danger-subtle/80 shadow-card transition-colors cursor-pointer"
                          >
                            Escalate
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsResolveDialogOpen(true)}
                          className="px-3.5 py-1.5 bg-brand text-white rounded-input text-xs font-semibold hover:bg-brand-hover shadow-card transition-colors cursor-pointer"
                        >
                          Resolve ticket
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsReopenModalOpen(true);
                          setReopenReason('');
                          setReopenError(null);
                        }}
                        className="px-3.5 py-1.5 bg-surface border border-neutral-subtle rounded-input text-xs font-semibold text-main hover:bg-neutral-subtle shadow-card transition-colors cursor-pointer"
                      >
                        Reopen ticket
                      </button>
                    )}
                  </div>
                </div>

                {/* Priority & Assignee Selects */}
                <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-neutral-subtle text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-subtle font-medium">Priority:</span>
                    <select
                      value={ticketDetail.ticket.priority}
                      onChange={(e) => void handlePriorityChange(e.target.value as TicketPriority)}
                      className="px-2.5 py-1 text-xs bg-surface border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main font-semibold"
                    >
                      <option value="P1">P1 - Critical</option>
                      <option value="P2">P2 - High</option>
                      <option value="P3">P3 - Medium</option>
                      <option value="P4">P4 - Low</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-subtle font-medium">Assignee:</span>
                    <select
                      value={ticketDetail.ticket.assignee?.id || ''}
                      onChange={(e) => void handleAssignTicket(e.target.value || null)}
                      className="px-2.5 py-1 text-xs bg-surface border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main"
                    >
                      <option value="">Unassigned</option>
                      {assignees.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name || a.email}
                        </option>
                      ))}
                    </select>
                    {(!ticketDetail.ticket.assignee || ticketDetail.ticket.assignee.id !== adminMe.user_id) && (
                      <button
                        type="button"
                        onClick={() => void handleAssignTicket(adminMe.user_id)}
                        className="text-brand hover:underline font-semibold cursor-pointer"
                      >
                        Assign to me
                      </button>
                    )}
                  </div>
                </div>

                {/* Escalation Reason Banner (if escalated) */}
                {ticketDetail.ticket.is_escalated && (
                  <div className="p-3 bg-danger-subtle/40 border border-danger-subtle rounded-input text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-danger-strong font-bold">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Ticket Escalated to P1</span>
                    </div>
                    <p className="text-main leading-relaxed">
                      {ticketDetail.ticket.escalation_reason || 'Escalated by staff member.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Thread Tabs: Conversation vs Internal notes */}
              <div className="flex items-center gap-4 px-6 border-b border-neutral-subtle bg-surface">
                <button
                  type="button"
                  onClick={() => setThreadTab('conversation')}
                  className={`py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    threadTab === 'conversation'
                      ? 'border-brand text-brand'
                      : 'border-transparent text-subtle hover:text-main'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Conversation ({ticketDetail.messages.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThreadTab('notes')}
                  className={`py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    threadTab === 'notes'
                      ? 'border-brand text-brand'
                      : 'border-transparent text-subtle hover:text-main'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Internal notes ({ticketDetail.notes.length})</span>
                  <span className="text-[10px] bg-warning-subtle text-warning-strong px-1.5 py-0.2 rounded-full font-bold ml-1">
                    Staff only
                  </span>
                </button>
              </div>

              {/* Thread Messages Body */}
              <div className="p-6 overflow-y-auto space-y-4 max-h-[480px]">
                {threadTab === 'conversation' ? (
                  ticketDetail.messages.length === 0 ? (
                    <p className="text-xs text-subtle text-center py-8">No messages yet.</p>
                  ) : (
                    ticketDetail.messages.map((m) => {
                      const isFounder = m.author_type === 'founder';
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isFounder ? 'items-start' : 'items-end'}`}
                        >
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-xs font-semibold text-main">
                              {isFounder ? m.author_name || 'Founder' : 'Cofoundaz Support'}
                            </span>
                            <span className="text-[11px] text-muted">{formatAge(m.created_at)}</span>
                          </div>
                          <div
                            className={`max-w-lg p-3.5 rounded-card text-xs leading-relaxed whitespace-pre-wrap ${
                              isFounder
                                ? 'bg-surface-raised text-main border border-neutral-subtle shadow-card'
                                : 'bg-brand-subtle text-main border border-brand-subtle shadow-card'
                            }`}
                          >
                            {m.body}
                          </div>
                        </div>
                      );
                    })
                  )
                ) : ticketDetail.notes.length === 0 ? (
                  <div className="text-center py-8 text-xs text-subtle space-y-1">
                    <Lock className="w-5 h-5 text-muted mx-auto" />
                    <p>No internal notes added yet.</p>
                  </div>
                ) : (
                  ticketDetail.notes.map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 bg-warning-subtle/20 border border-warning-subtle rounded-card space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between text-subtle">
                        <span className="font-semibold text-warning-strong">
                          {n.author_name} (Staff Note)
                        </span>
                        <span className="text-[11px] text-muted">{formatAge(n.created_at)}</span>
                      </div>
                      <p className="text-main whitespace-pre-wrap leading-relaxed">{n.body}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Reply or Add Note Bottom Area */}
                <div className="p-5 border-t border-neutral-subtle bg-surface-raised">
                  {threadTab === 'conversation' ? (
                    <form onSubmit={handleSendReply} className="space-y-3">
                      {replyError && (
                        <div
                          role="alert"
                          className="p-2.5 bg-danger-subtle/30 border border-danger-subtle text-danger-strong text-xs rounded-input flex items-center gap-2"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{replyError}</span>
                        </div>
                      )}

                      {/* Canned Picker */}
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="admin-reply-box" className="font-semibold text-main">
                          Reply to Founder
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-subtle">Insert reply:</span>
                          <select
                            onChange={handleSelectCanned}
                            defaultValue=""
                            className="px-2 py-1 text-xs bg-surface border border-neutral-subtle rounded-input text-main"
                          >
                            <option value="" disabled>
                              Select canned response...
                            </option>
                            {cannedResponses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <textarea
                        id="admin-reply-box"
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        disabled={isReplying}
                        placeholder="Type reply to founder..."
                        className="w-full px-3 py-2 text-xs bg-surface border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main placeholder:text-muted resize-none"
                      />

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">
                          Sends an email to {ticketDetail.ticket.founder.email}
                        </span>
                        <button
                          type="submit"
                          disabled={isReplying || replyText.trim().length === 0}
                          className="px-4 py-2 bg-brand text-white rounded-input text-xs font-semibold hover:bg-brand-hover shadow-card disabled:opacity-50 transition-all inline-flex items-center gap-2 cursor-pointer"
                        >
                          {isReplying ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Send reply</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    // Add Internal Note Form
                    <form onSubmit={handleAddNote} className="space-y-3">
                      {noteError && (
                        <div
                          role="alert"
                          className="p-2.5 bg-danger-subtle/30 border border-danger-subtle text-danger-strong text-xs rounded-input flex items-center gap-2"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{noteError}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="admin-note-box" className="font-semibold text-main">
                          Add Internal Staff Note
                        </label>
                        <span className="text-warning-strong font-medium">
                          Only staff see this — never emailed
                        </span>
                      </div>

                      <textarea
                        id="admin-note-box"
                        rows={3}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        disabled={isAddingNote}
                        placeholder="Internal notes visible to staff only..."
                        className="w-full px-3 py-2 text-xs bg-surface border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main placeholder:text-muted resize-none"
                      />

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isAddingNote || noteText.trim().length === 0}
                          className="px-4 py-2 bg-neutral-x1c211f text-white rounded-input text-xs font-semibold hover:bg-neutral-x181c1a shadow-card disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {isAddingNote ? 'Saving note...' : 'Save internal note'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
          )}
        </div>
      </div>

      {/* Escalate Modal */}
      {isEscalateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div
            className="w-full max-w-md bg-surface border border-neutral-subtle rounded-modal shadow-raised overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-subtle bg-surface-raised">
              <div className="flex items-center gap-2 text-danger-strong">
                <ShieldAlert className="w-5 h-5" />
                <h4 className="text-base font-bold text-main">Escalate Ticket</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsEscalateModalOpen(false)}
                className="text-subtle hover:text-main p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEscalate} className="p-6 space-y-4">
              <div className="p-3 bg-danger-subtle/30 border border-danger-subtle rounded-input text-xs font-medium text-danger-strong">
                Escalating sets the ticket to P1 and cannot be undone here.
              </div>

              {escalateError && (
                <div className="p-2.5 bg-danger-subtle/30 border border-danger-subtle text-danger-strong text-xs rounded-input flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{escalateError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-subtle">
                  <label htmlFor="escalate-reason-input" className="font-medium text-main">
                    Reason <span className="text-danger-strong">*</span>
                  </label>
                  <span className="tabular-nums text-muted">{escalateReason.length} / 500 (min 10)</span>
                </div>
                <textarea
                  id="escalate-reason-input"
                  rows={3}
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  disabled={isEscalating}
                  placeholder="Explain why this ticket is being escalated (10-500 chars)..."
                  className="w-full px-3 py-2 text-sm bg-surface-raised border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main placeholder:text-muted resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-subtle">
                <button
                  type="button"
                  onClick={() => setIsEscalateModalOpen(false)}
                  disabled={isEscalating}
                  className="px-3.5 py-1.5 text-xs font-medium text-subtle hover:text-main cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEscalating || escalateReason.trim().length < 10}
                  className="px-4 py-1.5 bg-danger text-white text-xs font-semibold rounded-input hover:bg-danger-hover shadow-card disabled:opacity-50 cursor-pointer"
                >
                  {isEscalating ? 'Escalating...' : 'Confirm escalate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Action Dialog for Resolve Ticket (Requires 10+ char reason and 6-digit TOTP) */}
      <StaffActionDialog
        isOpen={isResolveDialogOpen}
        title={`Resolve Ticket ${ticketDetail?.ticket.number || ''}`}
        confirmCopy="This sends the founder a closing email."
        actionButtonLabel="Confirm resolution"
        actionButtonVariant="primary"
        onClose={() => setIsResolveDialogOpen(false)}
        onConfirm={handleConfirmResolve}
      />

      {/* Reopen Modal */}
      {isReopenModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div
            className="w-full max-w-md bg-surface border border-neutral-subtle rounded-modal shadow-raised overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-subtle bg-surface-raised">
              <h4 className="text-base font-bold text-main">Reopen Ticket</h4>
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="text-subtle hover:text-main p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReopen} className="p-6 space-y-4">
              {reopenError && (
                <div className="p-2.5 bg-danger-subtle/30 border border-danger-subtle text-danger-strong text-xs rounded-input flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{reopenError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="reopen-reason-input" className="text-xs font-medium text-subtle">
                  Reason (optional)
                </label>
                <textarea
                  id="reopen-reason-input"
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  disabled={isReopening}
                  placeholder="Optional reason for reopening..."
                  className="w-full px-3 py-2 text-sm bg-surface-raised border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main placeholder:text-muted resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-subtle">
                <button
                  type="button"
                  onClick={() => setIsReopenModalOpen(false)}
                  disabled={isReopening}
                  className="px-3.5 py-1.5 text-xs font-medium text-subtle hover:text-main cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReopening}
                  className="px-4 py-1.5 bg-brand text-white text-xs font-semibold rounded-input hover:bg-brand-hover shadow-card disabled:opacity-50 cursor-pointer"
                >
                  {isReopening ? 'Reopening...' : 'Confirm reopen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Canned Responses Manager Dialog */}
      <CannedResponsesDialog
        isOpen={isCannedManagerOpen}
        onClose={() => {
          setIsCannedManagerOpen(false);
          void fetchCanned();
        }}
        onSelect={(selected) => {
          setReplyText((prev) => (prev ? `${prev}\n\n${selected.body}` : selected.body));
        }}
      />
    </div>
  );
}

