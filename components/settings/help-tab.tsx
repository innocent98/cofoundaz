'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LifeBuoy,
  Plus,
  ArrowLeft,
  Send,
  AlertCircle,
  RotateCcw,
  X,
  MessageSquare,
} from 'lucide-react';
import {
  getFounderTickets,
  createFounderTicket,
  getFounderTicket,
  sendFounderMessage,
  FOUNDER_CATEGORY_LABELS,
  type FounderTicketItem,
  type FounderTicketDetail,
  type SupportCategory,
  ApiError,
} from '@/lib/api/support';
import { formatApiErrorMessage } from '@/lib/api/client';

export interface HelpTabProps {
  initialTicketId?: string | null;
}

export function HelpTab({ initialTicketId }: HelpTabProps): React.JSX.Element {
  const router = useRouter();

  // Navigation / View State
  const [activeTicketId, setActiveTicketId] = useState<string | null>(initialTicketId || null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');

  // List State
  const [tickets, setTickets] = useState<FounderTicketItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // New Ticket Modal State
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<SupportCategory>('bug');
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [newTicketError, setNewTicketError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Thread Detail State
  const [threadDetail, setThreadDetail] = useState<FounderTicketDetail | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [isTicketClosedMoreThan14Days, setIsTicketClosedMoreThan14Days] = useState(false);

  // Reply State
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Fetch tickets list
  const fetchTickets = useCallback(async (reset = true, cursor?: string) => {
    if (reset) {
      setLoadingList(true);
      setListError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const statusParam = filterStatus === 'all' ? undefined : filterStatus;
      const res = await getFounderTickets({
        status: statusParam,
        cursor,
      });

      if (reset) {
        setTickets(res.tickets);
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
  }, [filterStatus]);

  useEffect(() => {
    if (!activeTicketId) {
      queueMicrotask(() => {
        void fetchTickets(true);
      });
    }
  }, [fetchTickets, activeTicketId]);

  // Fetch thread detail when activeTicketId changes
  const fetchThread = useCallback(async (ticketId: string) => {
    setLoadingThread(true);
    setThreadError(null);
    setIsTicketClosedMoreThan14Days(false);
    setReplyError(null);

    try {
      const detail = await getFounderTicket(ticketId);
      setThreadDetail(detail);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        setThreadError('Ticket not found.');
      } else {
        setThreadError(formatApiErrorMessage(err, 'Failed to load ticket thread.'));
      }
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      if (activeTicketId) {
        void fetchThread(activeTicketId);
      } else {
        setThreadDetail(null);
      }
    });
  }, [activeTicketId, fetchThread]);

  // Open ticket thread
  const handleSelectTicket = (id: string) => {
    setActiveTicketId(id);
    router.push(`/settings/help/${id}`);
  };

  const handleBackToList = () => {
    setActiveTicketId(null);
    setThreadDetail(null);
    router.push('/settings?tab=help');
  };

  // Submit New Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewTicketError(null);
    setFieldErrors({});

    const trimmedSubject = newSubject.trim();
    const trimmedMessage = newMessage.trim();

    const localErrors: Record<string, string> = {};
    if (trimmedSubject.length < 3 || trimmedSubject.length > 200) {
      localErrors.subject = 'Subject must be between 3 and 200 characters.';
    }
    if (trimmedMessage.length < 1 || trimmedMessage.length > 5000) {
      localErrors.message = 'Message must be between 1 and 5000 characters.';
    }

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    setSubmittingTicket(true);

    try {
      const res = await createFounderTicket({
        category: newCategory,
        subject: trimmedSubject,
        message: trimmedMessage,
      });

      setIsNewTicketOpen(false);
      setNewSubject('');
      setNewMessage('');
      setNewCategory('bug');

      // Navigate to created ticket
      if (res.id) {
        handleSelectTicket(res.id);
      } else {
        void fetchTickets(true);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const data = err.data as { field_errors?: Record<string, string>; message?: string; error?: { message?: string } } | null;
        if (err.status === 422 && data?.field_errors) {
          setFieldErrors(data.field_errors);
        } else if (err.status === 429) {
          setNewTicketError(formatApiErrorMessage(err, 'Rate limit reached. Please try again later.'));
        } else {
          setNewTicketError(formatApiErrorMessage(err, 'Failed to create ticket.'));
        }
      } else {
        setNewTicketError(formatApiErrorMessage(err, 'Failed to create ticket.'));
      }
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Submit Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId) return;

    const trimmed = replyText.trim();
    if (trimmed.length < 1 || trimmed.length > 5000) return;

    setSendingReply(true);
    setReplyError(null);

    try {
      const newMessageObj = await sendFounderMessage(activeTicketId, { body: trimmed });
      setReplyText('');

      // Add to messages in state and update status to open
      setThreadDetail((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ticket: {
            ...prev.ticket,
            status: 'open',
          },
          messages: [...prev.messages, newMessageObj],
        };
      });
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        const data = err.data as { error?: { code?: string } } | null;
        if (data?.error?.code === 'TICKET_CLOSED') {
          setIsTicketClosedMoreThan14Days(true);
          return;
        }
      }
      setReplyError(formatApiErrorMessage(err, 'Failed to send reply.'));
    } finally {
      setSendingReply(false);
    }
  };

  // Format relative timestamp
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // =========================================================================
  // VIEW: THREAD DETAIL
  // =========================================================================
  if (activeTicketId) {
    if (loadingThread) {
      return (
        <div className="bg-surface border border-neutral-subtle rounded-card p-8 text-center space-y-4">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-subtle font-body">Loading ticket thread...</p>
        </div>
      );
    }

    if (threadError || !threadDetail) {
      return (
        <div className="bg-surface border border-neutral-subtle rounded-card p-8 text-center space-y-4 font-body">
          <AlertCircle className="w-10 h-10 text-danger-strong mx-auto" />
          <h3 className="text-base font-semibold text-main">
            {threadError || 'Ticket not found.'}
          </h3>
          <p className="text-sm text-subtle">
            This ticket may have been moved or you may not have permission to view it.
          </p>
          <button
            type="button"
            onClick={handleBackToList}
            className="px-4 py-2 bg-brand text-white rounded-input text-sm font-medium hover:bg-brand-hover transition-colors shadow-card inline-flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to tickets
          </button>
        </div>
      );
    }

    const { ticket, messages } = threadDetail;
    const isResolved = ticket.status === 'resolved';

    return (
      <div className="space-y-6 font-body">
        {/* Header / Nav */}
        <div className="bg-surface border border-neutral-subtle rounded-card p-6 shadow-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={handleBackToList}
                className="inline-flex items-center gap-1.5 text-xs text-subtle hover:text-main font-medium mb-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to all tickets
              </button>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="tabular-nums font-semibold text-sm text-subtle bg-surface-raised px-2.5 py-0.5 rounded-[6px] border border-neutral-subtle">
                  {ticket.number}
                </span>
                <h2 className="text-lg font-bold text-main">{ticket.subject}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-subtle">
                <span className="font-medium text-main">
                  {FOUNDER_CATEGORY_LABELS[ticket.category] || ticket.category}
                </span>
                <span>•</span>
                <span>Created {formatTime(ticket.created_at)}</span>
              </div>
            </div>

            {/* Status Chip */}
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-pill border ${
                  isResolved
                    ? 'bg-neutral-subtle text-subtle border-neutral-subtle'
                    : 'bg-brand-subtle text-brand-strong border-brand-subtle'
                }`}
              >
                {isResolved ? 'Resolved' : 'Open'}
              </span>
            </div>
          </div>
        </div>

        {/* Message Thread */}
        <div className="bg-surface border border-neutral-subtle rounded-card p-6 shadow-card space-y-6">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-sm text-subtle text-center py-6">No messages in this ticket yet.</p>
            ) : (
              messages.map((msg) => {
                const isFounderMsg = msg.author_type === 'founder';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isFounderMsg ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-semibold text-main">
                        {isFounderMsg ? msg.author_name || 'You' : 'Cofoundaz Support'}
                      </span>
                      <span className="text-[11px] text-muted">{formatTime(msg.created_at)}</span>
                    </div>
                    <div
                      className={`max-w-xl p-4 rounded-card text-sm leading-relaxed whitespace-pre-wrap ${
                        isFounderMsg
                          ? 'bg-brand-subtle text-main border border-brand-subtle shadow-card'
                          : 'bg-surface-raised text-main border border-neutral-subtle shadow-card'
                      }`}
                    >
                      {msg.body}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Reply Area */}
          <div className="pt-6 border-t border-neutral-subtle">
            {isTicketClosedMoreThan14Days ? (
              <div className="p-4 bg-surface-raised border border-neutral-subtle rounded-input text-center space-y-3">
                <p className="text-sm text-subtle font-medium">
                  This ticket was resolved more than 14 days ago.
                </p>
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(true)}
                  className="px-4 py-2 bg-brand text-white rounded-input text-sm font-semibold hover:bg-brand-hover shadow-card inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Open a new ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendReply} className="space-y-3">
                {replyError && (
                  <div
                    role="alert"
                    className="p-3 bg-danger-subtle/30 border border-danger-subtle text-danger-strong text-xs rounded-input flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{replyError}</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-subtle">
                    <label htmlFor="founder-reply-input" className="font-medium text-main">
                      Your reply
                    </label>
                    <span className="tabular-nums text-muted">{replyText.length} / 5000</span>
                  </div>
                  <textarea
                    id="founder-reply-input"
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={sendingReply}
                    maxLength={5000}
                    placeholder="Type your reply here..."
                    className="w-full px-3.5 py-2.5 text-sm bg-surface-raised border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main placeholder:text-muted resize-none disabled:opacity-60"
                  />
                  {isResolved && (
                    <p className="text-xs text-brand font-medium">
                      Replying reopens this ticket.
                    </p>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sendingReply || replyText.trim().length === 0}
                    className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-input hover:bg-brand-hover shadow-card disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    {sendingReply ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: TICKETS LIST
  // =========================================================================
  return (
    <div className="space-y-6 font-body">
      {/* Top Banner & Action */}
      <div className="bg-surface border border-neutral-subtle rounded-card p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-modal bg-brand-subtle flex items-center justify-center text-brand-strong shrink-0">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-main">Help & Support</h2>
            <p className="text-xs text-subtle">
              Have questions or run into an issue? Create a support ticket and our team will assist you.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsNewTicketOpen(true)}
          className="px-4 py-2 bg-brand text-white rounded-input text-xs md:text-sm font-semibold hover:bg-brand-hover transition-colors shadow-card inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New ticket</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-subtle pb-2">
        {(['all', 'open', 'resolved'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-colors cursor-pointer capitalize border ${
              filterStatus === st
                ? 'bg-neutral-x1c211f text-white border-neutral-x1c211f shadow-card'
                : 'text-subtle hover:text-main hover:bg-surface-raised border-transparent'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Tickets List Card */}
      <div className="bg-surface border border-neutral-subtle rounded-card shadow-card overflow-hidden">
        {loadingList ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-7 h-7 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-subtle">Loading your support tickets...</p>
          </div>
        ) : listError ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-danger-strong mx-auto" />
            <p className="text-sm font-medium text-main">{listError}</p>
            <button
              type="button"
              onClick={() => void fetchTickets(true)}
              className="px-3.5 py-1.5 bg-surface-raised border border-neutral-subtle rounded-input text-xs font-medium hover:bg-neutral-subtle text-main transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-modal bg-surface-raised border border-neutral-subtle flex items-center justify-center mx-auto text-muted">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-main">No tickets yet</h3>
              <p className="text-xs text-subtle max-w-sm mx-auto">
                {filterStatus === 'all'
                  ? 'You have not submitted any support tickets yet. Need help with anything?'
                  : `No ${filterStatus} tickets found.`}
              </p>
            </div>
            {filterStatus === 'all' && (
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(true)}
                className="px-4 py-2 bg-brand text-white rounded-input text-xs font-semibold hover:bg-brand-hover shadow-card inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New ticket
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-neutral-subtle">
            {tickets.map((t) => {
              const isOpen = t.status === 'open';
              const isWaitingForYou = t.last_author === 'staff' && isOpen;

              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTicket(t.id)}
                  className="p-4 md:px-6 hover:bg-surface-raised transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="tabular-nums font-semibold text-xs text-subtle bg-surface-raised px-2 py-0.5 rounded-[6px] border border-neutral-subtle">
                        {t.number}
                      </span>
                      <h4 className="text-sm font-semibold text-main truncate hover:text-brand transition-colors">
                        {t.subject}
                      </h4>
                      {isWaitingForYou && (
                        <span className="bg-warning-subtle text-warning-strong border border-warning-subtle text-[11px] font-semibold px-2 py-0.5 rounded-pill">
                          Waiting for you
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-subtle">
                      <span>{FOUNDER_CATEGORY_LABELS[t.category] || t.category}</span>
                      <span>•</span>
                      <span>Last reply {formatTime(t.last_message_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-pill border ${
                        isOpen
                          ? 'bg-brand-subtle text-brand-strong border-brand-subtle'
                          : 'bg-neutral-subtle text-subtle border-neutral-subtle'
                      }`}
                    >
                      {isOpen ? 'Open' : 'Resolved'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {nextCursor && !loadingList && (
          <div className="p-4 border-t border-neutral-subtle text-center bg-surface-raised">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => void fetchTickets(false, nextCursor)}
              className="px-4 py-2 bg-surface border border-neutral-subtle rounded-input text-xs font-semibold text-main hover:bg-neutral-subtle shadow-card transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loadingMore ? 'Loading...' : 'Load more tickets'}
            </button>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {isNewTicketOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-ticket-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            className="relative w-full max-w-lg bg-surface border border-neutral-subtle rounded-modal shadow-raised overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-subtle bg-surface-raised">
              <div className="flex items-center gap-2 text-brand">
                <LifeBuoy className="w-5 h-5" />
                <h3 id="new-ticket-modal-title" className="text-base font-bold text-main">
                  Create Support Ticket
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(false)}
                disabled={submittingTicket}
                className="text-subtle hover:text-main p-1 rounded-[6px] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              {newTicketError && (
                <div
                  role="alert"
                  className="p-3 bg-danger-subtle/30 border border-danger-subtle text-danger-strong text-xs rounded-input flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{newTicketError}</span>
                </div>
              )}

              {/* Category */}
              <div className="space-y-1.5">
                <label htmlFor="ticket-category-select" className="text-xs font-medium text-subtle">
                  Category <span className="text-danger-strong">*</span>
                </label>
                <select
                  id="ticket-category-select"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as SupportCategory)}
                  disabled={submittingTicket}
                  className="w-full px-3.5 py-2 text-sm bg-surface-raised border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main"
                >
                  <option value="billing">Billing</option>
                  <option value="account">Account</option>
                  <option value="bug">Something is broken</option>
                  <option value="how_to">How do I...</option>
                  <option value="feature_request">Feature request</option>
                  <option value="other">Other</option>
                </select>
                {fieldErrors.category && (
                  <p className="text-xs text-danger-strong">{fieldErrors.category}</p>
                )}
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-subtle">
                  <label htmlFor="ticket-subject-input" className="font-medium text-main">
                    Subject <span className="text-danger-strong">*</span>
                  </label>
                  <span className="tabular-nums text-muted">{newSubject.length} / 200</span>
                </div>
                <input
                  id="ticket-subject-input"
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  disabled={submittingTicket}
                  placeholder="Summary of the issue..."
                  maxLength={200}
                  className="w-full px-3.5 py-2 text-sm bg-surface-raised border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main placeholder:text-muted"
                />
                {fieldErrors.subject && (
                  <p className="text-xs text-danger-strong">{fieldErrors.subject}</p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-subtle">
                  <label htmlFor="ticket-message-input" className="font-medium text-main">
                    Message <span className="text-danger-strong">*</span>
                  </label>
                  <span className="tabular-nums text-muted">{newMessage.length} / 5000</span>
                </div>
                <textarea
                  id="ticket-message-input"
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={submittingTicket}
                  placeholder="Provide as much detail as possible..."
                  maxLength={5000}
                  className="w-full px-3.5 py-2 text-sm bg-surface-raised border border-neutral-subtle rounded-input focus:outline-none focus:ring-1 focus:ring-brand-strong text-main placeholder:text-muted resize-none"
                />
                {fieldErrors.message && (
                  <p className="text-xs text-danger-strong">{fieldErrors.message}</p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-subtle">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  disabled={submittingTicket}
                  className="px-4 py-2 text-xs md:text-sm font-medium text-subtle hover:text-main rounded-input transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="px-4 py-2 bg-brand text-white text-xs md:text-sm font-semibold rounded-input hover:bg-brand-hover shadow-card disabled:opacity-50 transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  {submittingTicket ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    'Submit ticket'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

