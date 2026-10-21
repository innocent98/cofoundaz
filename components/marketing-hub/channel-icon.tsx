import React from 'react';
import {
  CalendarDays,
  FileText,
  Handshake,
  Mail,
  Megaphone,
  Search,
  Share2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { CHANNEL_LABELS, type ChannelKey } from '@/lib/api/marketing';

// PRD 1.1 principle 5: a channel is never told apart by colour alone. Every place that colours a
// channel (calendar chips, the legend) also shows this icon, and the label is in the text or aria-label.
const ICONS: Record<ChannelKey, LucideIcon> = {
  organic_social: Share2,
  paid_social: Megaphone,
  search: Search,
  email: Mail,
  content_seo: FileText,
  partnerships: Handshake,
  events: CalendarDays,
  referral: Users,
};

export const CHANNEL_COLOR: Record<ChannelKey, string> = {
  organic_social: 'bg-[#0e271f] text-white',
  paid_social: 'bg-[#9C5B34] text-white',
  search: 'bg-[#6E4326] text-white',
  email: 'bg-[#1e4836] text-white',
  content_seo: 'bg-[#46735e] text-white',
  partnerships: 'bg-[#266049] text-white',
  events: 'bg-[#522F1A] text-white',
  referral: 'bg-[#2E7256] text-white',
};

export function ChannelIcon({ channel, className = 'h-3.5 w-3.5' }: { channel: ChannelKey; className?: string }) {
  const Icon = ICONS[channel];
  return <Icon className={`${className} shrink-0`} aria-hidden="true" />;
}

/** Icon plus name, for lists and tables. */
export function ChannelLabel({ channel }: { channel: ChannelKey }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <ChannelIcon channel={channel} />
      <span>{CHANNEL_LABELS[channel]}</span>
    </span>
  );
}
