import { useState, useCallback } from 'react';

export type MarketingChannel = 'organic_social' | 'paid_social' | 'search' | 'email' | 'content_seo' | 'partnerships' | 'events' | 'referral';
export type PostStatus = 'draft' | 'scheduled' | 'published';
export type CampaignObjective = 'awareness' | 'leads' | 'sales' | 'launch';

export interface CalendarEntry {
  id: string;
  title: string;
  channel: MarketingChannel;
  status: PostStatus;
  body: string;
  scheduledAt: string;
  publishedAt?: string;
  mediaUrl?: string;
}

export interface Campaign {
  id: string;
  name: string;
  objective: CampaignObjective;
  budget: number;
  channels: MarketingChannel[];
  status: 'draft' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  metrics: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
  };
}

export interface CopyVariant {
  id: string;
  headline?: string;
  body: string;
  cta: string;
  charCount: number;
  charLimit: number;
}

export interface SEOKeyword {
  id: string;
  keyword: string;
  volume: string;
  difficulty: number;
  currentRank?: number;
  targetPage: string;
}

export interface AudienceSegment {
  id: string;
  name: string;
  tags: string[];
  sizeEstimate: number;
  linkedPersonaId: string;
}

// ============================
// MOCK DATA
// ============================

const initialCalendar: CalendarEntry[] = [
  {
    id: 'cal-1',
    title: 'Product Launch Teaser',
    channel: 'organic_social',
    status: 'published',
    body: 'We are building something that will change how gig workers save. Stay tuned! #Cofoundaz',
    scheduledAt: '2026-09-08T10:00:00Z',
    publishedAt: '2026-09-08T10:00:00Z',
  },
  {
    id: 'cal-2',
    title: 'Weekly Newsletter: Saving Tips',
    channel: 'email',
    status: 'scheduled',
    body: 'Here are 3 ways to automate your savings...',
    scheduledAt: '2026-09-14T09:00:00Z',
  },
  {
    id: 'cal-3',
    title: 'LinkedIn: The Founder Story',
    channel: 'organic_social',
    status: 'draft',
    body: 'When we started Cofoundaz, we realized...',
    scheduledAt: '2026-09-15T13:00:00Z',
  }
];

const initialCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Q3 Acquisition Drive',
    objective: 'leads',
    budget: 5000,
    channels: ['paid_social', 'search'],
    status: 'active',
    startDate: '2026-08-01',
    endDate: '2026-09-30',
    metrics: {
      spend: 2150,
      impressions: 45000,
      clicks: 3200,
      conversions: 154,
      ctr: 7.1,
    }
  },
  {
    id: 'camp-2',
    name: 'Brand Awareness Push',
    objective: 'awareness',
    budget: 1500,
    channels: ['organic_social', 'content_seo'],
    status: 'completed',
    startDate: '2026-06-01',
    endDate: '2026-07-31',
    metrics: {
      spend: 1500,
      impressions: 120000,
      clicks: 5600,
      conversions: 45,
      ctr: 4.6,
    }
  }
];

const initialKeywords: SEOKeyword[] = [
  { id: 'kw-1', keyword: 'best savings app for freelancers', volume: '2.4K', difficulty: 45, currentRank: 12, targetPage: '/freelancer-savings' },
  { id: 'kw-2', keyword: 'automated daily savings', volume: '1.2K', difficulty: 32, currentRank: 4, targetPage: '/features/daily-saving' },
  { id: 'kw-3', keyword: 'gig economy finance tools', volume: '800', difficulty: 25, currentRank: 2, targetPage: '/gig-economy' },
];

const initialSegments: AudienceSegment[] = [
  { id: 'seg-1', name: 'Active Gig Workers', tags: ['High Intent', 'Mobile First'], sizeEstimate: 12500, linkedPersonaId: 'p1' },
  { id: 'seg-2', name: 'Small Business Owners', tags: ['B2B', 'Desktop Heavy'], sizeEstimate: 4200, linkedPersonaId: 'p2' },
];

// ============================
// HOOK
// ============================

export function useMarketingApi() {
  const [calendar, setCalendar] = useState<CalendarEntry[]>(initialCalendar);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [keywords] = useState<SEOKeyword[]>(initialKeywords);
  const [segments] = useState<AudienceSegment[]>(initialSegments);

  // Stats for overview
  const stats = {
    scheduledPosts: calendar.filter(c => c.status === 'scheduled').length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    topChannel: 'SEO Content',
    topChannelConv: '6.4%',
    aiIdeasReady: 4,
  };

  // Actions
  const addCalendarEntry = useCallback((entry: CalendarEntry) => {
    setCalendar(prev => [...prev, entry]);
  }, []);

  const updateCalendarEntry = useCallback((id: string, updates: Partial<CalendarEntry>) => {
    setCalendar(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const addCampaign = useCallback((campaign: Campaign) => {
    setCampaigns(prev => [...prev, campaign]);
  }, []);

  return {
    calendar,
    campaigns,
    keywords,
    segments,
    stats,
    addCalendarEntry,
    updateCalendarEntry,
    addCampaign
  };
}
