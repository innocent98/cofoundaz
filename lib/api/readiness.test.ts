import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiClient, apiClientWithStatus } from './client';
import { readinessError, startDeckReview, getLatestCheck, answerQaSession } from './readiness';

vi.mock('./client', async () => {
  const actual = await vi.importActual<typeof import('./client')>('./client');
  return { ...actual, apiClient: vi.fn(), apiClientWithStatus: vi.fn() };
});

beforeEach(() => vi.clearAllMocks());

describe('readinessError', () => {
  it('reads code, message and field errors from the API envelope', () => {
    const err = new ApiError(422, 'Unprocessable', {
      error: { code: 'VALIDATION_ERROR', message: 'Please check the highlighted fields.', field_errors: [{ field: '', message: 'SAM cannot be larger than TAM.' }] },
    });
    const e = readinessError(err, 'fallback');
    expect(e.status).toBe(422);
    expect(e.code).toBe('VALIDATION_ERROR');
    expect(e.fieldErrors['']).toBe('SAM cannot be larger than TAM.');
    expect(e.forbidden).toBe(false);
  });

  it('flags 403 and falls back for non-API errors', () => {
    expect(readinessError(new ApiError(403, 'Forbidden', { error: { code: 'FORBIDDEN', message: 'No.' } }), 'x').forbidden).toBe(true);
    expect(readinessError(new Error('boom'), 'fallback').message).toBe('fallback');
  });
});

describe('endpoints', () => {
  it('startDeckReview returns the dedupe flag from the body', async () => {
    vi.mocked(apiClientWithStatus).mockResolvedValue({ status: 200, data: { data: { review: { id: 'r1' }, deduplicated: true } } } as never);
    const res = await startDeckReview('file-1');
    expect(res.deduplicated).toBe(true);
    expect(apiClientWithStatus).toHaveBeenCalledWith('/readiness/deck-reviews', expect.objectContaining({ method: 'POST', body: JSON.stringify({ file_id: 'file-1' }) }));
  });

  it('getLatestCheck unwraps a null check', async () => {
    vi.mocked(apiClient).mockResolvedValue({ data: { check: null } });
    expect(await getLatestCheck()).toBeNull();
  });

  it('answers send expected_turn', async () => {
    vi.mocked(apiClient).mockResolvedValue({ data: { session: {}, reply: 'q', ended: false } });
    await answerQaSession('s1', 'my answer', 3);
    expect(apiClient).toHaveBeenCalledWith('/readiness/qa-sessions/s1/messages', expect.objectContaining({ body: JSON.stringify({ content: 'my answer', expected_turn: 3 }) }));
  });
});
