/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';

export type DimensionCategory = 'Product' | 'Market' | 'Money' | 'Legal' | 'Team';
export type QuestionType = 'single_choice' | 'multi_choice' | 'scale' | 'numeric' | 'short_text';

export interface AssessmentQuestion {
  id: string;
  sectionNumber: number;
  sectionName: DimensionCategory;
  title: string;
  type: QuestionType;
  options?: Array<{ label: string; value: string }>;
  currencyPrefix?: string;
  helperText?: string;
}

export interface AssessmentSession {
  id: string;
  startupId: string;
  type: 'initial' | 'quarterly';
  status: 'in_progress' | 'completed';
  progressPct: number;
  currentQuestionIndex: number;
  answers: Record<string, any>;
  newScore?: number;
}

export interface AssessmentHistoryItem {
  id: string;
  completedAt: string;
  resultingScore: number;
  stage: string;
  dimensionScores: Record<DimensionCategory, number>;
}

// MOCK QUESTIONS
export const MOCK_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "q_prod_1",
    sectionNumber: 1,
    sectionName: "Product",
    title: "How far along is your product?",
    type: "single_choice",
    options: [
      { label: "Just an idea", value: "idea" },
      { label: "A prototype", value: "prototype" },
      { label: "An MVP that is live", value: "mvp" },
      { label: "In market with users", value: "market" }
    ]
  },
  {
    id: "q_prod_2",
    sectionNumber: 1,
    sectionName: "Product",
    title: "How confident are you in your core feature set?",
    type: "scale"
  },
  {
    id: "q_mkt_1",
    sectionNumber: 2,
    sectionName: "Market",
    title: "Which of these have you validated with real people?",
    type: "multi_choice",
    options: [
      { label: "The problem", value: "problem" },
      { label: "Willingness to pay", value: "wtp" },
      { label: "A channel that works", value: "channel" },
      { label: "Your pricing", value: "pricing" }
    ]
  },
  {
    id: "q_mkt_2",
    sectionNumber: 2,
    sectionName: "Market",
    title: "How well do you know your target customer?",
    type: "single_choice",
    options: [
      { label: "Still guessing", value: "guessing" },
      { label: "A rough idea", value: "rough" },
      { label: "A clear persona", value: "persona" },
      { label: "Deeply, from interviews", value: "deeply" }
    ]
  },
  {
    id: "q_money_1",
    sectionNumber: 3,
    sectionName: "Money",
    title: "Roughly how much cash do you have on hand?",
    type: "numeric",
    currencyPrefix: "₦"
  },
  {
    id: "q_money_2",
    sectionNumber: 3,
    sectionName: "Money",
    title: "What is your monthly net burn?",
    type: "numeric",
    currencyPrefix: "₦"
  },
  {
    id: "q_legal_1",
    sectionNumber: 4,
    sectionName: "Legal",
    title: "Is your company incorporated?",
    type: "single_choice",
    options: [
      { label: "Not yet", value: "no" },
      { label: "In progress", value: "progress" },
      { label: "Yes, fully formed", value: "yes" }
    ]
  },
  {
    id: "q_team_1",
    sectionNumber: 5,
    sectionName: "Team",
    title: "How well are your key skill areas covered?",
    type: "scale"
  },
  {
    id: "q_team_2",
    sectionNumber: 5,
    sectionName: "Team",
    title: "Anything else about your team I should factor in?",
    type: "short_text"
  }
];

// MOCK HISTORY
export const MOCK_HISTORY: AssessmentHistoryItem[] = [
  {
    id: "hist_1",
    completedAt: "Jul 20, 2026",
    resultingScore: 74,
    stage: "Validation stage",
    dimensionScores: {
      Product: 80,
      Market: 75,
      Money: 60,
      Legal: 90,
      Team: 65
    }
  },
  {
    id: "hist_2",
    completedAt: "Apr 18, 2026",
    resultingScore: 72,
    stage: "Validation stage",
    dimensionScores: {
      Product: 70,
      Market: 65,
      Money: 60,
      Legal: 90,
      Team: 75
    }
  },
  {
    id: "hist_3",
    completedAt: "Jan 10, 2026",
    resultingScore: 63,
    stage: "Idea stage",
    dimensionScores: {
      Product: 50,
      Market: 45,
      Money: 80,
      Legal: 10,
      Team: 130 // using scale appropriately maybe later
    }
  }
];

export function useAssessmentApi() {
  const [history, setHistory] = useState<AssessmentHistoryItem[]>(MOCK_HISTORY);
  const [activeSession, setActiveSession] = useState<AssessmentSession | null>(() => {
    // Look for an unfinished session in localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem('assessment_active_session');
      if (stored) return JSON.parse(stored);
    }
    return null;
  });

  const getAssessmentHistory = useCallback(() => {
    return history;
  }, [history]);

  const startAssessment = useCallback(() => {
    const newSession: AssessmentSession = {
      id: `session_${Date.now()}`,
      startupId: "startup_1",
      type: "quarterly",
      status: "in_progress",
      progressPct: 10,
      currentQuestionIndex: 0,
      answers: {}
    };
    setActiveSession(newSession);
    if (typeof window !== "undefined") {
      localStorage.setItem('assessment_active_session', JSON.stringify(newSession));
    }
    return newSession.id;
  }, []);

  const resumeAssessment = useCallback(() => {
    return activeSession;
  }, [activeSession]);

  const saveAnswer = useCallback((id: string, answer: unknown) => {
    setActiveSession(prev => {
      if (!prev) return null;
      
      const newAnswers = { ...prev.answers, [id]: answer };
      const currentQuestionIndex = MOCK_QUESTIONS.findIndex(q => q.id === id);
      const nextIndex = currentQuestionIndex + 1;
      const progressPct = Math.min(100, Math.floor((nextIndex / MOCK_QUESTIONS.length) * 100));

      const updated = {
        ...prev,
        answers: newAnswers,
        currentQuestionIndex: nextIndex,
        progressPct
      };

      if (typeof window !== "undefined") {
        localStorage.setItem('assessment_active_session', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const completeAssessment = useCallback(async () => {
    if (!activeSession) return;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newScore = 78; // Mock recalibrated score

    const newItem: AssessmentHistoryItem = {
      id: `hist_${Date.now()}`,
      completedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      resultingScore: newScore,
      stage: "Validation stage",
      dimensionScores: {
        Product: 85,
        Market: 80,
        Money: 65,
        Legal: 90,
        Team: 70
      }
    };

    setHistory(prev => [newItem, ...prev]);
    setActiveSession(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem('assessment_active_session');
    }
    return newScore;
  }, [activeSession]);

  return {
    questions: MOCK_QUESTIONS,
    activeSession,
    getAssessmentHistory,
    startAssessment,
    resumeAssessment,
    saveAnswer,
    completeAssessment
  };
}
