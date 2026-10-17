import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  startAssessment,
  getNextQuestion,
  submitAnswer,
  completeAssessment,
  listAssessments,
  compareAssessments,
  sectionProgress,
} from './assessment';
import * as clientModule from './client';

vi.mock('./client', () => ({
  apiClient: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(public status: number, public statusText: string, public data: unknown) {
      super(`API Error ${status}: ${statusText}`);
    }
  },
}));

const question = {
  key: 'product_stage',
  dimension: 'product',
  section: 'Product',
  qtype: 'single_choice',
  prompt: 'How far along is your product?',
  options: [{ value: 'idea', label: 'Just an idea' }],
  helper: null,
};

describe('Assessment API client (lib/api/assessment.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('startAssessment POSTs /assessments and unwraps the envelope', async () => {
    const data = { assessment_id: 'a1', type: 'initial', status: 'in_progress', next_question: question };
    vi.mocked(clientModule.apiClient).mockResolvedValueOnce({ data, meta: null });

    const res = await startAssessment();

    expect(clientModule.apiClient).toHaveBeenCalledWith('/assessments', { method: 'POST' });
    expect(res).toEqual(data);
  });

  it('getNextQuestion returns the question, or null when none remain', async () => {
    vi.mocked(clientModule.apiClient).mockResolvedValueOnce({ data: { next_question: question } });
    expect(await getNextQuestion('a1')).toEqual(question);
    expect(clientModule.apiClient).toHaveBeenCalledWith('/assessments/a1/next-question');

    vi.mocked(clientModule.apiClient).mockResolvedValueOnce({ data: { next_question: null } });
    expect(await getNextQuestion('a1')).toBeNull();
  });

  it('submitAnswer sends question_key + value and returns the next question', async () => {
    vi.mocked(clientModule.apiClient).mockResolvedValueOnce({ data: { next_question: null } });

    const next = await submitAnswer('a1', 'mrr', 500000);

    expect(next).toBeNull();
    expect(clientModule.apiClient).toHaveBeenCalledWith('/assessments/a1/answers', {
      method: 'POST',
      body: JSON.stringify({ question_key: 'mrr', value: 500000 }),
    });
  });

  it('completeAssessment POSTs /complete and returns the result', async () => {
    const data = {
      assessment_id: 'a1',
      status: 'completed',
      dimension_scores: { product: 89, market: 88, money: 86, legal: 100, team: 88 },
      overall_provisional: 90,
      narrative: 'Your strongest area is legal (100). Focus next on money (86).',
    };
    vi.mocked(clientModule.apiClient).mockResolvedValueOnce({ data, meta: null });

    expect(await completeAssessment('a1')).toEqual(data);
    expect(clientModule.apiClient).toHaveBeenCalledWith('/assessments/a1/complete', { method: 'POST' });
  });

  it('listAssessments returns the array, and [] for a malformed body', async () => {
    const rows = [
      { id: 'a1', type: 'initial', status: 'completed', started_at: 'x', completed_at: 'y', overall_provisional: 90 },
    ];
    vi.mocked(clientModule.apiClient).mockResolvedValueOnce({ data: rows, meta: null });
    expect(await listAssessments()).toEqual(rows);

    vi.mocked(clientModule.apiClient).mockResolvedValueOnce({ data: null });
    expect(await listAssessments()).toEqual([]);
  });

  it('compareAssessments joins ids into the query string', async () => {
    vi.mocked(clientModule.apiClient).mockResolvedValueOnce({ data: [] });
    await compareAssessments(['a', 'b']);
    expect(clientModule.apiClient).toHaveBeenCalledWith('/assessments/compare?ids=a,b');
  });

  it('sectionProgress maps a dimension to its position among the 5 sections', () => {
    expect(sectionProgress('product')).toEqual({ sectionNumber: 1, totalSections: 5, pct: 0 });
    expect(sectionProgress('legal')).toEqual({ sectionNumber: 4, totalSections: 5, pct: 60 });
  });
});
