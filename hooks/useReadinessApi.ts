import { useState } from "react";

export type QAIntensity = 'Friendly angel' | 'Skeptical VC' | 'Term-sheet grilling';

export interface ReadinessScore {
  overall: number;
  dimensions: {
    team: number;
    traction: number;
    market: number;
    product: number;
    financials: number;
    story: number;
  };
  gaps: Array<{ dimension: string; note: string; actionRoute: string }>;
}

export interface DeckReview {
  version: number;
  narrativeScore: number;
  designScore: number;
  dataScore: number;
  topFixes: string[];
  slideNotes: Array<{ slide: number; title: string; feedback: string }>;
}

export interface SessionLog {
  id: string;
  date: string;
  focus: string;
  intensity: QAIntensity;
  durationMinutes: number;
  rating: string;
}

export function useReadinessApi() {
  const [score] = useState<ReadinessScore>({
    overall: 64,
    dimensions: {
      team: 85,
      traction: 40,
      market: 70,
      product: 75,
      financials: 45,
      story: 68,
    },
    gaps: [
      { dimension: "Financials", note: "Your projections lack a bottom-up CAC build.", actionRoute: "/investor-readiness/narrative" },
      { dimension: "Traction", note: "Early engagement metrics are flat month-over-month.", actionRoute: "/dashboard" },
    ]
  });

  const [deckReview] = useState<DeckReview | null>({
    version: 2,
    narrativeScore: 7,
    designScore: 8,
    dataScore: 5,
    topFixes: [
      "Slide 4 (Market Size) needs source citations.",
      "Slide 7 (Traction) should use a cumulative graph, not monthly.",
      "Slide 12 (Ask) doesn't specify use of funds breakdown."
    ],
    slideNotes: [
      { slide: 1, title: "Title", feedback: "Strong hook. Keep it." },
      { slide: 4, title: "Market Size", feedback: "SAM vs SOM is unclear. Be specific on who you can realistically capture in year 1." },
      { slide: 7, title: "Traction", feedback: "Too many numbers. Highlight the 3 most impressive metrics." },
      { slide: 12, title: "The Ask", feedback: "Need a clear pie chart or table for use of funds." }
    ]
  });

  const [history] = useState<SessionLog[]>([
    { id: "s-1", date: "Sep 10, 2026", focus: "Financials", intensity: "Skeptical VC", durationMinutes: 24, rating: "Needs Work" },
    { id: "s-2", date: "Aug 22, 2026", focus: "General", intensity: "Friendly angel", durationMinutes: 15, rating: "Good" }
  ]);

  return {
    score,
    deckReview,
    history
  };
}
