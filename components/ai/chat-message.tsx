'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, RefreshCw, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { ChatAction, ChatMessage as ChatMessageT } from '@/lib/api/aiChat';
import type { ActionVerb } from '@/lib/api/aiChat';
import { ChatMessageContent } from './chat-message-content';

export interface ChatMessageHandlers {
  onRegenerate: (messageId: string) => void;
  onFeedback: (messageId: string, rating: 'up' | 'down') => void;
  onAction: (messageId: string, actionId: string, verb: ActionVerb) => Promise<void> | void;
}

/** "Finance Advisor via Co-Founder" (the specialist), or plain "Co-Founder" before routing. */
export function agentLabel(agent: ChatMessageT['agent']): string {
  return agent?.name ? `${agent.name} via Co-Founder` : 'Co-Founder';
}

function ActionChips({
  message,
  onAction,
}: {
  message: ChatMessageT;
  onAction: ChatMessageHandlers['onAction'];
}) {
  const actions = message.actions ?? [];
  const [busy, setBusy] = useState<string | null>(null);
  if (actions.length === 0) return null;

  const run = async (a: ChatAction, verb: ActionVerb) => {
    setBusy(a.id);
    try {
      await onAction(message.id, a.id, verb);
    } finally {
      setBusy(null);
    }
  };

  return (
    <ul className="mt-3 space-y-2" aria-label="Suggested changes">
      {actions.map((a) => {
        const disabled = busy === a.id;
        if (a.status === 'executed') {
          return (
            <li key={a.id} className="rounded-card border border-line-soft bg-surface-faint px-3 py-2 text-xs">
              <p className="font-semibold text-ink">Done: {a.result_label ?? a.label}</p>
              <div className="mt-1.5 flex items-center gap-3">
                {a.href && (
                  <Link href={a.href} className="font-semibold text-brand-700 hover:underline">
                    Open it
                  </Link>
                )}
                {a.undoable && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => run(a, 'undo')}
                    className="font-semibold text-ink-muted hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    Undo
                  </button>
                )}
              </div>
            </li>
          );
        }
        if (a.status === 'proposed') {
          return (
            <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-card border border-line-soft bg-white px-3 py-2 text-xs">
              <span className="min-w-0 flex-1 font-medium text-ink">{a.label}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => run(a, 'confirm')}
                className="rounded-card bg-accent-600 px-3 py-1 font-semibold text-white hover:bg-accent-700 disabled:opacity-50 cursor-pointer"
              >
                Confirm
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => run(a, 'dismiss')}
                className="rounded-card border border-line-soft px-3 py-1 font-semibold text-ink-muted hover:bg-surface-faint disabled:opacity-50 cursor-pointer"
              >
                Dismiss
              </button>
            </li>
          );
        }
        const note = a.status === 'undone' ? 'Undone' : a.status === 'dismissed' ? 'Dismissed' : 'Failed';
        return (
          <li key={a.id} className="px-1 text-xs text-ink-subtle">
            {note}: {a.label}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * One chat message: specialist badge, the bubble, the fixed legal/financial
 * disclaimer as its own block, confirm-first action chips, "Why I said this",
 * and (on a finished reply) copy / regenerate / thumbs.
 */
export function ChatMessage({
  message,
  isLatest,
  busy,
  handlers,
  compact = false,
}: {
  message: ChatMessageT;
  isLatest: boolean;
  /** A reply is generating, so Regenerate/Retry would 409. */
  busy: boolean;
  handlers: ChatMessageHandlers;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  if (message.role === 'user') {
    return (
      <div className="flex flex-col items-end">
        <div className="text-sm px-5 py-4 rounded-[24px] shadow-card max-w-[85%] bg-brand-x1f4d3a text-white rounded-tr-sm">
          <ChatMessageContent message={message} />
        </div>
      </div>
    );
  }

  const finished = message.status === 'ready' && !message.removed_by_moderation;
  const executed = (message.actions ?? []).some((a) => a.status === 'executed' || a.status === 'undone');
  const canRegenerate = finished && isLatest && !busy && !executed;
  const canRetry = isLatest && !busy && (message.status === 'failed' || message.status === 'cancelled');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-input flex items-center justify-center shrink-0 bg-accent-600">
          <Sparkles className="w-3.5 h-3.5 fill-brand-x1f4d3a text-brand-x1f4d3a" />
        </div>
        <span className="text-xs font-bold text-ink">{agentLabel(message.agent)}</span>
      </div>

      <div
        className={`text-sm px-5 py-4 rounded-[24px] shadow-card bg-white border border-line-soft text-ink rounded-tl-sm ${
          compact ? 'max-w-full' : 'max-w-[85%] lg:max-w-[75%]'
        }`}
      >
        <ChatMessageContent message={message} />
        <ActionChips message={message} onAction={handlers.onAction} />
        {message.disclaimer && (
          <p className="mt-3 border-t border-line-soft pt-2 text-xs italic text-ink-muted">{message.disclaimer}</p>
        )}
      </div>

      {(finished || canRetry) && (
        <div className="flex flex-wrap items-center gap-1 pl-1 text-ink-subtle">
          {finished && (
            <>
              <button
                type="button"
                onClick={copy}
                aria-label="Copy reply"
                className="p-1.5 rounded-card hover:bg-surface-faint hover:text-ink cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => handlers.onFeedback(message.id, 'up')}
                aria-label="Good reply"
                aria-pressed={message.feedback === 'up'}
                className={`p-1.5 rounded-card hover:bg-surface-faint cursor-pointer ${message.feedback === 'up' ? 'text-accent-600' : 'hover:text-ink'}`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handlers.onFeedback(message.id, 'down')}
                aria-label="Bad reply"
                aria-pressed={message.feedback === 'down'}
                className={`p-1.5 rounded-card hover:bg-surface-faint cursor-pointer ${message.feedback === 'down' ? 'text-danger-700' : 'hover:text-ink'}`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {canRegenerate && (
            <button
              type="button"
              onClick={() => handlers.onRegenerate(message.id)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-card text-xs font-medium hover:bg-surface-faint hover:text-ink cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
          )}
          {canRetry && (
            <button
              type="button"
              onClick={() => handlers.onRegenerate(message.id)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-card text-xs font-semibold text-brand-700 hover:bg-surface-faint cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          )}
          {finished && message.reasoning_summary && (
            <button
              type="button"
              onClick={() => setShowWhy((v) => !v)}
              aria-expanded={showWhy}
              className="px-2 py-1.5 rounded-card text-xs font-medium hover:bg-surface-faint hover:text-ink cursor-pointer"
            >
              Why I said this
            </button>
          )}
        </div>
      )}

      {showWhy && message.reasoning_summary && (
        <p className="ml-1 max-w-[85%] rounded-card bg-surface-faint px-3 py-2 text-xs text-ink-muted">
          {message.reasoning_summary}
        </p>
      )}
    </div>
  );
}
