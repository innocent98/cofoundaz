import React from 'react';
import { Ban, CheckSquare, Flag, Globe, Lock, Megaphone, ShieldAlert, Video, type LucideIcon } from 'lucide-react';
import type { FeedItem, FeedLayer } from '@/lib/api/calendar';
import { LAYER_STYLE, isSpanContinuation, itemTimeLabel } from '@/lib/calendar-format';

export const LAYER_ICON: Record<FeedLayer, LucideIcon> = {
  milestone: Flag,
  compliance: ShieldAlert,
  meeting: Video,
  team: CheckSquare,
  marketing: Megaphone,
  external: Globe,
  busy: Ban,
};

/** One item as a chip: icon + title, so a layer is never told apart by colour alone. */
export function ItemChip({
  item,
  dayKey,
  onOpen,
  showTime = false,
  block = false,
}: {
  item: FeedItem;
  dayKey: string;
  onOpen: (item: FeedItem) => void;
  showTime?: boolean;
  block?: boolean;
}) {
  const Icon = LAYER_ICON[item.layer];
  const cont = isSpanContinuation(item, dayKey);
  const time = itemTimeLabel(item);
  const body = (
    <>
      <Icon size={block ? 12 : 10} className="shrink-0" aria-hidden />
      <span className={block ? 'font-semibold leading-tight' : 'truncate'}>{cont ? `${item.title} (cont.)` : item.title}</span>
      {item.private && item.layer !== 'busy' && item.layer !== 'external' && <Lock size={9} className="shrink-0" aria-label="Private" />}
      {showTime && <span className="ml-auto pl-2 text-[10px] opacity-80 shrink-0">{time}</span>}
    </>
  );
  const cls = `w-full flex items-center gap-1.5 px-2 py-1 rounded text-left ${block ? 'text-[11px]' : 'text-[10px]'} font-medium ${LAYER_STYLE[item.layer].chip}`;
  if (item.layer === 'busy') {
    return <div className={cls} aria-label={`Busy, ${time}`}>{body}</div>;
  }
  return (
    <button type="button" onClick={() => onOpen(item)} aria-label={`${item.title}, ${time}`} className={`${cls} hover:opacity-90 transition-opacity`}>
      {body}
    </button>
  );
}
