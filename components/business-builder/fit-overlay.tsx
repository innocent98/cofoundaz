'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { FitLink } from '@/lib/api/business-builder';
import { chipId, curvePath } from '@/lib/fit-links';

interface Line {
  key: string;
  link: FitLink;
  d: string;
}

/**
 * SVG fit-lines laid over the Value Proposition columns (large screens only; the
 * list below is the keyboard and phone alternative). A line runs from a reliever
 * or creator chip on the right to its pain or gain chip on the left. Positions are
 * measured from the chips' `data-chip` attributes after every layout change.
 */
export function FitOverlay({
  containerRef,
  links,
  measureKey,
  canRemove,
  onRemove,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  links: FitLink[];
  /** Changes whenever the chips change, so lines are re-measured. */
  measureKey: string;
  canRemove: boolean;
  onRemove: (link: FitLink) => void;
}) {
  const [lines, setLines] = useState<Line[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const box = el.getBoundingClientRect();
      const chips = new Map<string, DOMRect>();
      el.querySelectorAll<HTMLElement>('[data-chip]').forEach((c) => chips.set(c.dataset.chip as string, c.getBoundingClientRect()));
      const next: Line[] = [];
      for (const link of links) {
        const from = chips.get(chipId(link.from_block, link.from_item));
        const to = chips.get(chipId(link.to_block, link.to_item));
        if (!from || !to) continue;
        // from = chip in the value map (right), to = chip in the customer profile (left)
        const x1 = from.left - box.left;
        const y1 = from.top - box.top + from.height / 2;
        const x2 = to.right - box.left;
        const y2 = to.top - box.top + to.height / 2;
        next.push({ key: `${link.from_block}:${link.from_item}>${link.to_block}:${link.to_item}`, link, d: curvePath(x1, y1, x2, y2) });
      }
      setLines(next);
      setSize({ w: box.width, h: box.height });
    };

    const schedule = () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(measure);
    };

    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    window.addEventListener('resize', schedule);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', schedule);
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [containerRef, links, measureKey]);

  if (lines.length === 0) return null;

  return (
    <svg
      className="hidden lg:block absolute inset-0 pointer-events-none"
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w} ${size.h}`}
      aria-hidden="true"
    >
      {lines.map((l) => {
        const gain = l.link.to_block === 'gains';
        const color = gain ? 'var(--color-brand-strong)' : 'var(--color-accent-600)';
        return (
          <g key={l.key}>
            <path d={l.d} fill="none" stroke={color} strokeWidth={2} strokeOpacity={0.65} />
            {canRemove && (
              <path
                d={l.d}
                fill="none"
                stroke="transparent"
                strokeWidth={12}
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onClick={() => onRemove(l.link)}
              >
                <title>Remove this fit-line</title>
              </path>
            )}
          </g>
        );
      })}
    </svg>
  );
}
