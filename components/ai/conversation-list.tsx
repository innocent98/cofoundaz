'use client';

import React from 'react';
import { Plus, Search } from 'lucide-react';
import { TOPICS } from '@/lib/api/aiChat';
import type { useAIConversationList } from '@/hooks/useAIConversationList';

type ListState = ReturnType<typeof useAIConversationList>;

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Left pane of the chat: New chat, server search, topic chips, Archived view, the list. */
export function ConversationList({
  list,
  activeId,
  onSelect,
  onNew,
}: {
  list: ListState;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const { items, loading, error, searchInput, setSearchInput, query, topic, setTopic, archived, setArchived, refresh } = list;
  const chip = (on: boolean) =>
    `px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
      on ? 'bg-brand-900 text-white border-brand-900' : 'bg-white text-ink-muted border-line-soft hover:bg-surface-faint'
    }`;

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="space-y-3 pb-3">
        <button
          type="button"
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-700 text-white font-semibold text-sm py-2.5 rounded-card transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New chat
        </button>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
            className="w-full bg-transparent text-xs text-ink placeholder-ink-subtle pl-8 pr-3 py-1.5 border border-line-soft rounded-card focus:outline-none focus:border-accent-600"
          />
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by topic">
          <button type="button" className={chip(topic === null && !archived)} aria-pressed={topic === null && !archived} onClick={() => { setArchived(false); setTopic(null); }}>
            All
          </button>
          {TOPICS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={chip(topic === t.key && !archived)}
              aria-pressed={topic === t.key && !archived}
              onClick={() => { setArchived(false); setTopic(topic === t.key ? null : t.key); }}
            >
              {t.label}
            </button>
          ))}
          <button type="button" className={chip(archived)} aria-pressed={archived} onClick={() => setArchived(!archived)}>
            Archived
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-xs text-center text-ink-subtle py-4" role="status">Loading conversations...</p>
        ) : error ? (
          <div className="text-xs text-center text-ink-muted py-4 space-y-2">
            <p>Couldn&apos;t load your conversations.</p>
            <button type="button" onClick={() => { void refresh(); }} className="font-semibold text-brand-700 hover:underline cursor-pointer">
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="text-xs text-center text-ink-subtle py-4">
            {query || topic || archived ? 'No conversations found.' : 'No conversations yet.'}
          </p>
        ) : (
          <ul className="space-y-1">
            {items.map((conv) => (
              <li key={conv.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conv.id)}
                  className={`w-full text-left p-3 rounded-modal transition-colors cursor-pointer ${
                    activeId === conv.id ? 'bg-surface-faint' : 'hover:bg-surface-faint'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink truncate">{conv.title ?? 'New conversation'}</span>
                    <span className="text-[10px] text-ink-subtle shrink-0">{formatShortDate(conv.updated_at)}</span>
                  </span>
                  {conv.match_snippet && (
                    <span className="mt-1 block text-[11px] text-ink-muted line-clamp-2">
                      <Highlight text={conv.match_snippet} term={query} />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Wraps case-insensitive matches of `term` in <mark>; plain React nodes, never HTML strings. */
export function Highlight({ text, term }: { text: string; term: string }) {
  const t = term.trim();
  if (!t) return <>{text}</>;
  const lower = text.toLowerCase();
  const needle = t.toLowerCase();
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const at = lower.indexOf(needle, i);
    if (at === -1) {
      out.push(text.slice(i));
      break;
    }
    if (at > i) out.push(text.slice(i, at));
    out.push(
      <mark key={key++} className="bg-accent-xf5eedc text-ink rounded-input px-0.5">
        {text.slice(at, at + needle.length)}
      </mark>
    );
    i = at + needle.length;
  }
  return <>{out}</>;
}
