'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { SEARCH_MIN_CHARS, groupResults, type SearchResult } from '@/lib/api/search';

/** PRD 2.1 placeholder, with "contacts" dropped until Sales ships and the dash written as a comma. */
export const SEARCH_PLACEHOLDER = 'Search anything, docs, tasks, conversations…';

export function SearchOverlay({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  /** Navigate to a result (router.push(href)); the overlay closes itself afterwards. */
  onSelect: (result: SearchResult) => void;
}) {
  const [text, setText] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const { query, status, results, retry } = useGlobalSearch(open ? text : '');
  const groups = useMemo(() => groupResults(results), [results]);

  // Reset when the overlay closes so it reopens clean.
  useEffect(() => {
    if (!open) queueMicrotask(() => { setText(''); setActive(0); });
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const choose = (r: SearchResult) => {
    onSelect(r);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length) setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length) setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      const r = results[active];
      if (r) {
        e.preventDefault();
        choose(r);
      }
    }
  };

  const trimmedLength = text.trim().length;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-16 md:pt-24 px-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="relative w-full max-w-xl bg-white rounded-[24px] shadow-raised overflow-hidden border border-neutral-100 z-10 flex flex-col"
      >
        <div className="flex items-center px-5 py-3 border-b border-neutral-100 bg-white">
          <Search className="w-4 h-4 text-neutral-500 shrink-0 mr-3" aria-hidden="true" />
          <input
            type="text"
            autoFocus
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={results.length > 0 ? listId : undefined}
            aria-activedescendant={results.length ? `${listId}-${active}` : undefined}
            aria-label="Search"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={SEARCH_PLACEHOLDER}
            className="w-full text-sm text-neutral-x1c201d placeholder-neutral-500 focus:outline-hidden bg-transparent"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="p-1 rounded-input text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-3">
          {status === 'idle' && (
            <p className="px-2.5 py-6 text-sm text-neutral-500 text-center">
              {trimmedLength === 0 ? 'Search your workspace.' : `Type at least ${SEARCH_MIN_CHARS} characters`}
            </p>
          )}
          {status === 'loading' && (
            <p role="status" className="px-2.5 py-6 text-sm text-neutral-500 text-center">
              Searching…
            </p>
          )}
          {status === 'error' && (
            <div role="alert" className="px-2.5 py-6 text-center">
              <p className="text-sm text-neutral-600">Couldn’t search right now.</p>
              <button type="button" onClick={retry} className="mt-2 text-sm font-bold text-brand-x266b4e underline cursor-pointer">
                Retry
              </button>
            </div>
          )}
          {status === 'done' && results.length === 0 && (
            <p className="px-2.5 py-6 text-sm text-neutral-500 text-center">No results for &lsquo;{query}&rsquo;.</p>
          )}
          <div id={listId} role={results.length > 0 ? 'listbox' : undefined} aria-label={results.length > 0 ? 'Search results' : undefined}>
          {groups.map((g, gi) => (
            <div key={g.group} role="group" aria-label={g.group} className="mb-2 last:mb-0">
              <p className="px-2.5 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-neutral-500">{g.group}</p>
              {g.results.map((r, ri) => {
                const index = groups.slice(0, gi).reduce((n, prev) => n + prev.results.length, 0) + ri;
                const selected = index === active;
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    id={`${listId}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => choose(r)}
                    onMouseMove={() => setActive(index)}
                    className={`w-full flex flex-col items-start gap-0.5 px-2.5 py-2.5 rounded-modal text-left transition-colors cursor-pointer ${
                      selected ? 'bg-neutral-xf0f5f2' : 'hover:bg-neutral-xf7f8f6'
                    }`}
                  >
                    <span className="text-sm font-bold text-ink-deep leading-snug">{r.title}</span>
                    {r.subtitle ? <span className="text-xs text-neutral-500 font-medium">{r.subtitle}</span> : null}
                  </button>
                );
              })}
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}
