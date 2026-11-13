import { describe, expect, it } from 'vitest';
import { ApiError } from './client';
import { proofFileProblem, toLegalError } from './legal';

describe('legal api helpers', () => {
  it('maps a 403 to a forbidden error and keeps the API message otherwise', () => {
    const forbidden = toLegalError(new ApiError(403, 'Forbidden', { error: { code: 'FORBIDDEN', message: 'x', field_errors: [] } }));
    expect(forbidden.forbidden).toBe(true);
    const bad = toLegalError(
      new ApiError(422, 'Unprocessable', { error: { code: 'VALIDATION_ERROR', message: 'Proof must be a PNG, JPEG, or PDF.', field_errors: [{ field: 'proof', message: 'Proof must be a PNG, JPEG, or PDF.' }] } }),
    );
    expect(bad.message).toBe('Proof must be a PNG, JPEG, or PDF.');
    expect(bad.fieldErrors.proof).toBe('Proof must be a PNG, JPEG, or PDF.');
    expect(toLegalError(new ApiError(404, 'Not Found', { error: { code: 'NOT_FOUND', message: 'Not found.' } })).notFound).toBe(true);
  });

  it('checks a proof file before upload', () => {
    expect(proofFileProblem(new File(['x'], 'a.png', { type: 'image/png' }))).toBeNull();
    expect(proofFileProblem(new File(['x'], 'a.html', { type: 'text/html' }))).toBe('Proof must be a PNG, JPEG, or PDF.');
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'a.pdf', { type: 'application/pdf' });
    expect(proofFileProblem(big)).toBe('Proof exceeds the 10 MB limit.');
  });
});
