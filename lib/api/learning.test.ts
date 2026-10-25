import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as clientModule from './client';
import {
  enroll,
  getRecommendations,
  isForbiddenError,
  isNotReadyError,
  learningErrorMessage,
  listArticles,
  saveProgress,
  saveNote,
  verifyCredential,
} from './learning';

const spy = vi.spyOn(clientModule, 'apiClient');
const err = (status: number, code: string, message: string) =>
  new clientModule.ApiError(status, '', { error: { code, message, field_errors: [] } });

beforeEach(() => {
  spy.mockReset();
  spy.mockResolvedValue({ data: {} });
});

describe('learning api client', () => {
  it('unwraps the envelope', async () => {
    spy.mockResolvedValue({ data: { stage: 'idea', hero: null, recommended: [], continue_watching: [], recommendation_reason: 'x' }, meta: null });
    expect((await getRecommendations()).stage).toBe('idea');
    expect(spy).toHaveBeenCalledWith('/learning/recommendations');
  });

  it('sends the documented bodies', async () => {
    spy.mockResolvedValue({ data: {} });
    await enroll('c1');
    expect(spy).toHaveBeenLastCalledWith('/learning/enrollments', { method: 'POST', body: JSON.stringify({ course_id: 'c1' }) });
    await saveProgress('l1', { completed: true });
    expect(spy).toHaveBeenLastCalledWith('/learning/lessons/l1/progress', { method: 'PATCH', body: JSON.stringify({ completed: true }) });
    await saveNote('l1', 'hi');
    expect(spy).toHaveBeenLastCalledWith('/learning/lessons/l1/notes', { method: 'PUT', body: JSON.stringify({ body: 'hi' }) });
  });

  it('builds the article query string and encodes the verify code', async () => {
    spy.mockResolvedValue({ data: { articles: [] } });
    await listArticles({ q: 'run way', tag: 'money' });
    expect(spy).toHaveBeenLastCalledWith('/learning/articles?q=run+way&tag=money');
    await listArticles();
    expect(spy).toHaveBeenLastCalledWith('/learning/articles');
    spy.mockResolvedValue({ data: { valid: true } });
    await verifyCredential('CFZ-A/B');
    expect(spy).toHaveBeenLastCalledWith('/verify/CFZ-A%2FB');
  });

  it('classifies errors', () => {
    expect(isForbiddenError(err(403, 'FORBIDDEN', 'x'))).toBe(true);
    expect(isNotReadyError(err(409, 'CERTIFICATE_NOT_READY', 'x'))).toBe(true);
    expect(isNotReadyError(err(409, 'OTHER', 'x'))).toBe(false);
    expect(learningErrorMessage(err(429, 'RATE_LIMITED', 'Too many requests. Slow down a moment.'))).toBe('Too many requests. Slow down a moment.');
    expect(learningErrorMessage(err(403, 'FORBIDDEN', 'x'))).toBe('The Academy is not available for your role.');
  });
});
