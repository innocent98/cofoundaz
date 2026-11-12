'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAIConversationList } from '@/hooks/useAIConversationList';
import { Highlight } from '@/components/ai/conversation-list';
import { ModalDialog } from '@/components/modal-dialog';
import { TOPICS, type ChatConversationSummary } from '@/lib/api/aiChat';

const topicLabel = (t: ChatConversationSummary['topic']) => TOPICS.find((x) => x.key === t)?.label ?? null;
const titleOf = (title: string | null) => title ?? 'New conversation';
const dateOf = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
};

export default function HistoryPage() {
  const router = useRouter();
  const list = useAIConversationList();
  const {
    items, loading, error, actionError, searchInput, setSearchInput, query,
    topic, setTopic, archived, setArchived, refresh, archive, unarchive, remove,
  } = list;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<ChatConversationSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteOpenerRef = useRef<HTMLElement | null>(null);

  // Only ids currently in the list can be sent: the API is all-or-nothing on bad ids.
  const visibleSelected = items.filter((i) => selected.has(i.id)).map((i) => i.id);
  const allSelected = items.length > 0 && visibleSelected.length === items.length;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const bulk = async () => {
    const ids = visibleSelected;
    if (ids.length === 0) return;
    const ok = archived ? await unarchive(ids) : await archive(ids);
    if (ok) {
      setSelected(new Set());
      toast.success(
        archived
          ? `${ids.length} conversation${ids.length === 1 ? '' : 's'} unarchived.`
          : `${ids.length} conversation${ids.length === 1 ? '' : 's'} archived.`
      );
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const ok = await remove(toDelete.id);
    setDeleting(false);
    if (ok) {
      toast.success('Conversation deleted.');
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(toDelete.id);
        return next;
      });
      setToDelete(null);
    }
  };

  const chip = (on: boolean) =>
    `px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
      on ? 'bg-brand-900 text-white border-brand-900' : 'bg-white text-ink-muted border-line-soft hover:bg-surface-faint'
    }`;
  const colSpan = 5;

  return (
    <div className="max-w-5xl w-full min-w-0 mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink tracking-tight mb-1">Conversation history</h2>
          <p className="text-xs text-ink-muted">
            Every chat you&apos;ve had with your co-founder. Only you can see these.
          </p>
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
            className="w-full bg-white text-xs text-ink placeholder-ink-subtle pl-9 pr-3 py-2 rounded-card border border-line-soft focus:border-accent-600 focus:outline-none transition-colors shadow-card"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter">
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
        <button type="button" className={chip(archived)} aria-pressed={archived} onClick={() => { setArchived(!archived); setSelected(new Set()); }}>
          Archived
        </button>

        {visibleSelected.length > 0 && (
          <button
            type="button"
            onClick={() => { void bulk(); }}
            className="ml-auto px-3 py-1.5 rounded-card bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold cursor-pointer"
          >
            {archived ? 'Unarchive' : 'Archive'} {visibleSelected.length} selected
          </button>
        )}
      </div>

      {actionError && (
        <p role="alert" className="text-xs font-medium text-danger-700">{actionError}</p>
      )}

      <div className="bg-white rounded-modal border border-line-soft shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-xf8f8f4 border-b border-line-soft text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                <th className="py-3.5 pl-6 pr-2 w-8">
                  <input
                    type="checkbox"
                    aria-label="Select all conversations"
                    checked={allSelected}
                    disabled={items.length === 0}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)))}
                  />
                </th>
                <th className="py-3.5 px-4">CONVERSATION</th>
                <th className="py-3.5 px-2 md:px-4">TOPIC</th>
                <th className="py-3.5 px-4 hidden md:table-cell">LAST ACTIVE</th>
                <th className="py-3.5 px-4"><span className="sr-only">Delete</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {loading ? (
                <tr><td colSpan={colSpan} className="py-6 text-center text-sm text-neutral-500">Loading...</td></tr>
              ) : error ? (
                <tr>
                  <td colSpan={colSpan} className="py-6 text-center text-sm text-neutral-500">
                    Couldn&apos;t load your conversations.{' '}
                    <button type="button" onClick={() => { void refresh(); }} className="font-semibold text-brand-700 hover:underline cursor-pointer">
                      Try again
                    </button>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="py-6 text-center text-sm text-neutral-500">
                    {query || topic || archived ? 'No conversations found.' : 'No conversations yet.'}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/ai?c=${item.id}`)}
                    className="group hover:bg-surface-faint transition-colors cursor-pointer"
                  >
                    <td className="py-4 pl-6 pr-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${titleOf(item.title)}`}
                        checked={selected.has(item.id)}
                        onChange={() => toggle(item.id)}
                      />
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-ink group-hover:text-accent-600 transition-colors">
                      {titleOf(item.title)}
                      {item.match_snippet && (
                        <span className="mt-0.5 block text-xs font-normal text-ink-muted line-clamp-2">
                          <Highlight text={item.match_snippet} term={query} />
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {topicLabel(item.topic) && (
                        <span className="rounded-full bg-surface-faint border border-line-soft px-2.5 py-0.5 text-[11px] font-semibold text-ink-muted">
                          {topicLabel(item.topic)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs text-ink-subtle whitespace-nowrap hidden md:table-cell">{dateOf(item.updated_at)}</td>
                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        aria-label={`Delete forever: ${titleOf(item.title)}`}
                        onClick={(e) => { deleteOpenerRef.current = e.currentTarget; setToDelete(item); }}
                        className="p-1.5 rounded-card text-ink-subtle hover:text-danger-700 hover:bg-neutral-xfff5f5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toDelete && (
        <ModalDialog
          label="Delete conversation forever"
          onClose={() => { if (!deleting) setToDelete(null); }}
          returnFocusRef={deleteOpenerRef}
          overlayClassName="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4"
          className="w-full max-w-md rounded-modal bg-white p-6 shadow-raised outline-none"
        >
          <h3 className="text-base font-bold text-ink mb-2">Delete this conversation forever?</h3>
          <p className="text-sm text-ink-muted mb-1">&ldquo;{titleOf(toDelete.title)}&rdquo; and all its messages will be removed.</p>
          <p className="text-sm text-ink-muted mb-5">This can&apos;t be undone.</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={deleting}
              onClick={() => setToDelete(null)}
              className="px-4 py-2 rounded-card border border-line-soft text-sm font-semibold text-ink hover:bg-surface-faint cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => { void confirmDelete(); }}
              className="px-4 py-2 rounded-card bg-danger-700 text-white text-sm font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete forever'}
            </button>
          </div>
        </ModalDialog>
      )}
    </div>
  );
}
