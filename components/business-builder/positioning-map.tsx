'use client';

import React, { useEffect, useRef, useState } from 'react';
import { coordOf, nudge, pointToCoords, type Point } from '@/lib/map-geometry';
import type { PositioningAxes } from '@/hooks/useBusinessPositioningMap';
import type { BusinessRecord } from '@/lib/api/business-builder';

const DOT_COLORS = ['var(--color-brand-x1a422d)', 'var(--color-brand-x3b7a57)', 'var(--color-accent-600)', 'var(--color-brand-x75b29b)', 'var(--color-accent-xc08457)', 'var(--color-line-focus)'];

interface Props {
  records: BusinessRecord[];
  axes: PositioningAxes;
  /** Founders and team members drag; a consultant's drop becomes a suggestion; read-only roles just look. */
  canMove: boolean;
  /** Persist a new position (rejects on failure so the dot springs back). */
  onMove: (record: BusinessRecord, point: Point) => Promise<void>;
}

/**
 * The competitive positioning map. Dots are draggable (pointer events, so mouse,
 * touch and pen all work) and keyboard-movable: focus a dot and use the arrow
 * keys. A move PUTs the competitor's `map_x` / `map_y`, which are 0..1.
 */
export function PositioningMap({ records, axes, canMove, onMove }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState<Record<string, Point>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  const placed = records
    .map((rec, i) => ({ rec, x: coordOf(rec.data.map_x), y: coordOf(rec.data.map_y), color: DOT_COLORS[i % DOT_COLORS.length] }))
    .filter((m): m is { rec: BusinessRecord; x: number; y: number; color: string } => m.x !== null && m.y !== null);
  const unplaced = records.filter((r) => coordOf(r.data.map_x) === null || coordOf(r.data.map_y) === null);

  const commit = async (rec: BusinessRecord, point: Point) => {
    setError(null);
    try {
      await onMove(rec, point);
    } catch {
      setError('Could not save that position. It moved back.');
    } finally {
      setLive((prev) => {
        const next = { ...prev };
        delete next[rec.id];
        return next;
      });
    }
  };

  const onPointerDown = (e: React.PointerEvent, rec: BusinessRecord) => {
    if (!canMove) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(rec.id);
  };

  const onPointerMove = (e: React.PointerEvent, rec: BusinessRecord) => {
    if (dragging !== rec.id || !areaRef.current) return;
    setLive((prev) => ({ ...prev, [rec.id]: pointToCoords(e.clientX, e.clientY, areaRef.current!.getBoundingClientRect()) }));
  };

  const onPointerUp = (e: React.PointerEvent, rec: BusinessRecord) => {
    if (dragging !== rec.id) return;
    setDragging(null);
    const p = areaRef.current ? pointToCoords(e.clientX, e.clientY, areaRef.current.getBoundingClientRect()) : live[rec.id];
    if (p) void commit(rec, p);
  };

  const onKeyDown = (e: React.KeyboardEvent, rec: BusinessRecord, from: Point) => {
    if (!canMove) return;
    const next = nudge(live[rec.id] ?? from, e.key, e.shiftKey ? 0.1 : 0.05);
    if (!next) return;
    e.preventDefault();
    setLive((prev) => ({ ...prev, [rec.id]: next }));
    // Save once the key presses settle, not on every nudge.
    clearTimeout(timers.current[rec.id]);
    timers.current[rec.id] = setTimeout(() => void commit(rec, next), 500);
  };

  return (
    <div className="flex flex-col gap-3">
      <div ref={areaRef} className="relative w-full h-64 border-l border-b border-info-xa0aaba mt-2 mb-6">
        <span className="absolute top-0 left-2 text-[10px] font-medium text-ink-body">{axes.y.high} {axes.y.label}</span>
        <span className="absolute bottom-1 left-2 text-[10px] font-medium text-neutral-x6f7d72">{axes.y.low}</span>
        <span className="absolute -bottom-5 right-0 text-[10px] font-medium text-ink-body">{axes.x.high} {axes.x.label} →</span>
        <span className="absolute -bottom-5 left-0 text-[10px] font-medium text-neutral-x6f7d72">{axes.x.low}</span>
        {placed.length === 0 && (
          <span className="absolute inset-0 flex items-center justify-center text-[11px] text-neutral-x6f7d72 px-4 text-center pointer-events-none">
            {canMove ? 'Place a competitor below, then drag it into position.' : 'No competitor has been placed on the map yet.'}
          </span>
        )}
        {placed.map(({ rec, x, y, color }) => {
          const p = live[rec.id] ?? { x, y };
          const name = (rec.data.name as string) || 'Competitor';
          return (
            <div
              key={rec.id}
              className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${p.x * 100}%`, top: `${(1 - p.y) * 100}%`, zIndex: dragging === rec.id ? 10 : 1 }}
            >
              <div
                role={canMove ? 'slider' : 'img'}
                tabIndex={canMove ? 0 : undefined}
                aria-label={canMove ? `${name}: ${axes.x.label} ${Math.round(p.x * 100)} percent, ${axes.y.label} ${Math.round(p.y * 100)} percent. Use the arrow keys to move.` : name}
                aria-valuemin={canMove ? 0 : undefined}
                aria-valuemax={canMove ? 100 : undefined}
                aria-valuenow={canMove ? Math.round(p.x * 100) : undefined}
                onPointerDown={(e) => onPointerDown(e, rec)}
                onPointerMove={(e) => onPointerMove(e, rec)}
                onPointerUp={(e) => onPointerUp(e, rec)}
                onPointerCancel={() => { setDragging(null); setLive((prev) => { const n = { ...prev }; delete n[rec.id]; return n; }); }}
                onKeyDown={(e) => onKeyDown(e, rec, { x, y })}
                style={{ backgroundColor: color, touchAction: 'none' }}
                className={`w-4 h-4 rounded-full border-2 border-white shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-strong ${
                  canMove ? (dragging === rec.id ? 'cursor-grabbing scale-125' : 'cursor-grab') : ''
                }`}
              />
              <span className="text-[10px] font-bold text-ink mt-1 whitespace-nowrap select-none">{name}</span>
            </div>
          );
        })}
      </div>

      {canMove && unplaced.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold text-ink-body">Not on the map yet</p>
          <div className="flex flex-wrap gap-2">
            {unplaced.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => void commit(rec, { x: 0.5, y: 0.5 })}
                className="text-[11px] font-semibold bg-neutral-xf0f4f1 hover:bg-neutral-xe6efea text-brand-strong rounded-full px-3 py-1 transition-colors"
              >
                Place {(rec.data.name as string) || 'competitor'}
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-[11px] font-semibold text-danger-600">{error}</p>}
    </div>
  );
}
