import { useState, useCallback } from 'react';

export type DimensionKey = 'product' | 'market' | 'financial' | 'legal' | 'team';

export interface HealthDimension {
  key: DimensionKey;
  label: string;
  score: number;
  trend: number[]; // sparkline data
  status: 'strong' | 'neutral' | 'lagging';
}

export interface HealthSignal {
  id: string;
  name: string;
  currentValue: string;
  targetValue: string;
  contribution: number;
  sourceUrl: string;
}

export interface HealthRecommendation {
  id: string;
  title: string;
  rationale: string;
  estimatedLift: number;
  effort: 'Low' | 'Medium' | 'High';
  actionUrl: string;
  dimension: string;
}

export interface HealthScoreData {
  score: number;
  weeklyDelta: number;
  stage: string;
  summary: string;
  dimensions: Record<DimensionKey, HealthDimension>;
  topRecommendations: HealthRecommendation[];
}

const mockData: HealthScoreData = {
  score: 72,
  weeklyDelta: 4,
  stage: 'Validation',
  summary: "You're strong for Validation stage. Team is carrying you; financials are holding you back.",
  dimensions: {
    product: {
      key: 'product',
      label: 'Product',
      score: 78,
      trend: [60, 65, 70, 75, 78],
      status: 'strong',
    },
    market: {
      key: 'market',
      label: 'Market',
      score: 74,
      trend: [65, 68, 70, 72, 74],
      status: 'strong',
    },
    financial: {
      key: 'financial',
      label: 'Financial',
      score: 58,
      trend: [65, 60, 58, 55, 58],
      status: 'lagging',
    },
    legal: {
      key: 'legal',
      label: 'Legal',
      score: 66,
      trend: [66, 66, 66, 66, 66],
      status: 'neutral',
    },
    team: {
      key: 'team',
      label: 'Team',
      score: 80,
      trend: [70, 75, 78, 80, 80],
      status: 'strong',
    },
  },
  topRecommendations: [
    {
      id: 'rec-1',
      title: 'Extend runway past 9 months',
      rationale: 'Model a small price increase and trim your two largest variable costs. Both lift financials fast.',
      estimatedLift: 5,
      effort: 'Medium',
      actionUrl: '/finance',
      dimension: 'Financial',
    },
    {
      id: 'rec-2',
      title: 'Show revenue momentum',
      rationale: 'Close two pilot deals this month to move revenue growth off flat.',
      estimatedLift: 4,
      effort: 'High',
      actionUrl: '/finance',
      dimension: 'Financial',
    },
    {
      id: 'rec-3',
      title: 'Finish entity formation',
      rationale: 'Complete the last two incorporation steps to remove the legal drag.',
      estimatedLift: 3,
      effort: 'Low',
      actionUrl: '/legal',
      dimension: 'Legal',
    },
    {
      id: 'rec-4',
      title: 'Validate two more assumptions',
      rationale: 'Run a survey and three interviews to lift market evidence.',
      estimatedLift: 3,
      effort: 'Medium',
      actionUrl: '/validation',
      dimension: 'Market',
    },
    {
      id: 'rec-5',
      title: 'Complete IP assignment',
      rationale: 'Get founders and contractors to sign IP assignment agreements.',
      estimatedLift: 2,
      effort: 'Low',
      actionUrl: '/legal',
      dimension: 'Legal',
    },
  ],
};

export const mockDimensionSignals: Record<DimensionKey, HealthSignal[]> = {
  product: [
    { id: 's1', name: 'MVP progress', currentValue: '40% built', targetValue: 'Working prototype', contribution: 6, sourceUrl: '/roadmap' },
    { id: 's2', name: 'User feedback logged', currentValue: '18 notes', targetValue: '≥ 10', contribution: 4, sourceUrl: '/validation' },
    { id: 's3', name: 'Feature focus', currentValue: 'Narrow', targetValue: 'Narrow', contribution: 3, sourceUrl: '/business-builder' },
  ],
  market: [
    { id: 's4', name: 'Assumptions validated', currentValue: '3 of 7', targetValue: '≥ 3', contribution: 5, sourceUrl: '/validation' },
    { id: 's5', name: 'Segment clarity', currentValue: 'Defined', targetValue: 'Defined', contribution: 4, sourceUrl: '/business-builder' },
    { id: 's6', name: 'Competitive map', currentValue: 'Complete', targetValue: 'Complete', contribution: 2, sourceUrl: '/business-builder' },
  ],
  financial: [
    { id: 's7', name: 'Runway', currentValue: '8.4 months', targetValue: '≥ 9 months', contribution: -3, sourceUrl: '/finance-hub' },
    { id: 's8', name: 'Revenue growth', currentValue: 'Flat', targetValue: '+10% / mo', contribution: -4, sourceUrl: '/finance-hub' },
    { id: 's9', name: 'Budget set', currentValue: 'Yes', targetValue: 'Yes', contribution: 2, sourceUrl: '/finance-hub' },
    { id: 's10', name: 'Burn discipline', currentValue: 'On plan', targetValue: 'On plan', contribution: 2, sourceUrl: '/finance-hub' },
  ],
  legal: [
    { id: 's11', name: 'Entity formed', currentValue: 'In progress', targetValue: 'Formed', contribution: -2, sourceUrl: '/legal' },
    { id: 's12', name: 'Founder agreements', currentValue: 'Signed', targetValue: 'Signed', contribution: 4, sourceUrl: '/legal' },
    { id: 's13', name: 'IP assignment', currentValue: 'Pending', targetValue: 'Complete', contribution: -1, sourceUrl: '/legal' },
  ],
  team: [
    { id: 's14', name: 'Active members', currentValue: '4', targetValue: '≥ 2', contribution: 5, sourceUrl: '/team' },
    { id: 's15', name: 'Advisors engaged', currentValue: '2', targetValue: '≥ 1', contribution: 3, sourceUrl: '/team' },
    { id: 's16', name: 'Weekly activity', currentValue: 'High', targetValue: 'Steady', contribution: 2, sourceUrl: '/team' },
  ],
};

export function useHealthScore() {
  const [data, setData] = useState<HealthScoreData>(mockData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const dismissRecommendation = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      topRecommendations: prev.topRecommendations.filter((r) => r.id !== id),
    }));
    
    // In a real app, this would be a POST request
    // fetch(`/api/v1/health-score/recommendations/${id}/dismiss`, { method: 'POST' });
  }, []);

  return { data, loading, error, dismissRecommendation };
}
