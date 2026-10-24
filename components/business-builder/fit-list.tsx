'use client';

import React, { useState } from 'react';
import { Link2, X } from 'lucide-react';
import type { FitLink } from '@/lib/api/business-builder';
import { FIT_PAIRS, makeLink, sameLink } from '@/lib/fit-links';

const FROM_LABEL: Record<string, string> = { pain_relievers: 'Pain reliever', gain_creators: 'Gain creator' };
const TO_LABEL: Record<string, string> = { pains: 'pain', gains: 'gain' };

/**
 * The list view of the fit-lines: it works with a keyboard and on a phone, where
 * the drawn lines are hidden. Pick a pain reliever or gain creator, pick the pain
 * or gain it answers, connect. Each line has a Remove button.
 */
export function FitList({
  links,
  listOf,
  canEdit,
  onChange,
  error,
}: {
  links: FitLink[];
  listOf: (block: string) => string[];
  canEdit: boolean;
  onChange: (next: FitLink[]) => void;
  error: string | null;
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const sources = Object.keys(FIT_PAIRS).flatMap((block) => listOf(block).map((item) => ({ block, item })));
  const picked = from ? sources[Number(from)] : null;
  const targetBlock = picked ? FIT_PAIRS[picked.block] : null;
  const targets = targetBlock ? listOf(targetBlock) : [];
  const link = picked && to !== '' ? makeLink(picked, { block: targetBlock as string, item: targets[Number(to)] }) : null;
  const exists = !!link && links.some((l) => sameLink(l, link));

  return (
    <section aria-labelledby="fit-title" className="bg-white rounded-modal border border-line-soft shadow-card p-6 flex flex-col gap-4">
      <div>
        <h3 id="fit-title" className="text-sm font-bold text-ink">Fit</h3>
        <p className="text-xs text-ink-soft mt-0.5">Join each pain reliever to the pain it answers, and each gain creator to the gain it delivers.</p>
      </div>

      {links.length === 0 ? (
        <p className="text-xs text-ink-soft">No fit-lines yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {links.map((l) => (
            <li key={`${l.from_block}:${l.from_item}>${l.to_block}:${l.to_item}`} className="flex items-center gap-3 text-xs bg-surface-subtle rounded-card px-3 py-2">
              <Link2 className={`w-3.5 h-3.5 shrink-0 ${l.to_block === 'gains' ? 'text-brand-strong' : 'text-accent-600'}`} />
              <span className="flex-1 min-w-0">
                <span className="font-semibold text-ink">{l.from_item}</span>
                <span className="text-ink-soft"> answers the {TO_LABEL[l.to_block] ?? 'item'} </span>
                <span className="font-semibold text-ink">{l.to_item}</span>
              </span>
              {canEdit && (
                <button type="button" onClick={() => onChange(links.filter((x) => !sameLink(x, l)))} className="text-ink-soft hover:text-danger-text p-1" aria-label={`Remove the fit-line from ${l.from_item} to ${l.to_item}`}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <div className="flex flex-col md:flex-row md:items-end gap-3 border-t border-line-soft pt-4">
          <label className="flex flex-col gap-1 flex-1 text-[11px] font-bold tracking-wider text-ink-soft uppercase">
            From
            <select
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setTo('');
              }}
              className="border border-line-strong rounded-input px-3 py-2 text-xs normal-case tracking-normal text-ink bg-white"
            >
              <option value="">Pick a pain reliever or gain creator</option>
              {sources.map((s, i) => (
                <option key={`${s.block}:${i}`} value={i}>{FROM_LABEL[s.block]}: {s.item}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 flex-1 text-[11px] font-bold tracking-wider text-ink-soft uppercase">
            To
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={!picked}
              className="border border-line-strong rounded-input px-3 py-2 text-xs normal-case tracking-normal text-ink bg-white disabled:opacity-50"
            >
              <option value="">{picked ? `Pick the ${TO_LABEL[targetBlock as string]}` : 'Pick a source first'}</option>
              {targets.map((t, i) => (
                <option key={`${t}:${i}`} value={i}>{t}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!link || exists}
            onClick={() => {
              if (!link) return;
              onChange([...links, link]);
              setFrom('');
              setTo('');
            }}
            className="px-4 py-2 bg-brand-strong hover:bg-brand-rail-ink disabled:opacity-50 text-white rounded-card text-xs font-bold"
          >
            {exists ? 'Already connected' : 'Connect'}
          </button>
        </div>
      )}
      {error && <p role="alert" className="text-[11px] font-semibold text-danger-600">{error}</p>}
    </section>
  );
}
