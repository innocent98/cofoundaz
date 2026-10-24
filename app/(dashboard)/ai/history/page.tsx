'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useAICoFounder } from '../../../../hooks/useAICoFounder';

export default function HistoryPage() {
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const router = useRouter();
  const { conversations, conversationsLoading: loading, conversationsError, refreshConversations } =
    useAICoFounder({ withList: true });

  const titleOf = (title: string | null) => title ?? 'New conversation';
  const dateOf = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  };

  const filteredHistory = conversations.filter((item) =>
    titleOf(item.title).toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl w-full mx-auto flex flex-col gap-6">
      {/* Header section with search */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink tracking-tight mb-1">
            Conversation history
          </h2>
          <p className="text-xs text-ink-muted">
            Every chat you&apos;ve had with your co-founder. Only you can see these.
          </p>
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            type="text"
            value={historySearchQuery}
            onChange={(e) => setHistorySearchQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full bg-white text-xs text-ink placeholder-ink-subtle pl-9 pr-3 py-2 rounded-card border border-line-soft focus:border-accent-600 focus:outline-none transition-colors shadow-card"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-modal border border-line-soft shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-xf8f8f4 border-b border-line-soft text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                <th className="py-3.5 px-6">CONVERSATION</th>
                <th className="py-3.5 px-6">STARTED</th>
                <th className="py-3.5 px-6">LAST ACTIVE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-sm text-neutral-500">Loading...</td>
                </tr>
              ) : conversationsError ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-sm text-neutral-500">
                    Couldn&apos;t load your conversations.{' '}
                    <button
                      type="button"
                      onClick={() => { void refreshConversations(); }}
                      className="font-semibold text-brand-700 hover:underline cursor-pointer"
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-sm text-neutral-500">
                    {conversations.length === 0 ? 'No conversations yet.' : 'No conversations found.'}
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/ai?c=${item.id}`)}
                    className="group hover:bg-surface-faint transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 text-sm font-semibold text-ink group-hover:text-accent-600 transition-colors">
                      {titleOf(item.title)}
                    </td>
                    <td className="py-4 px-6 text-xs text-ink-subtle">{dateOf(item.created_at)}</td>
                    <td className="py-4 px-6 text-xs text-ink-subtle">{dateOf(item.updated_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
