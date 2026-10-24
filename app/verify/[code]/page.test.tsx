import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const v = vi.hoisted(() => ({ verifyCredential: vi.fn() }));
vi.mock('next/navigation', () => ({ useParams: () => ({ code: 'CFZ-AAAA-BBBB-CCCC' }) }));
vi.mock('@/lib/api/learning', async (orig) => ({ ...(await orig<typeof import('@/lib/api/learning')>()), ...v }));

import { ApiError } from '@/lib/api/client';
import VerifyCredentialPage from './page';

const fail = (status: number, message: string) =>
  new ApiError(status, '', { error: { code: 'X', message, field_errors: [] } });

describe('public verify page', () => {
  beforeEach(() => v.verifyCredential.mockReset());

  it('shows a valid credential', async () => {
    v.verifyCredential.mockResolvedValue({ valid: true, holder_name: 'Ada Founder', course_title: 'Scope the MVP', issued_on: '2026-10-22', issuer: 'Cofoundaz' });
    render(<VerifyCredentialPage />);
    expect(await screen.findByText('Valid credential')).toBeInTheDocument();
    expect(screen.getByText('Ada Founder')).toBeInTheDocument();
    expect(screen.getByText('22 October 2026')).toBeInTheDocument();
  });

  it('renders the holder name as text, not HTML', async () => {
    v.verifyCredential.mockResolvedValue({ valid: true, holder_name: '<img src=x onerror=alert(1)>', course_title: 'C', issued_on: '2026-10-22', issuer: 'Cofoundaz' });
    const { container } = render(<VerifyCredentialPage />);
    await screen.findByText('Valid credential');
    // The only image is the Cofoundaz logo; the injected <img> must stay text.
    expect(container.querySelector('img[onerror], img[src="x"]')).toBeNull();
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy();
  });

  it('handles a revoked credential', async () => {
    v.verifyCredential.mockResolvedValue({ valid: false });
    render(<VerifyCredentialPage />);
    expect(await screen.findByText(/no longer valid/)).toBeInTheDocument();
  });

  it('handles 404 and 429 with plain copy', async () => {
    v.verifyCredential.mockRejectedValueOnce(fail(404, 'Not found.'));
    const { unmount } = render(<VerifyCredentialPage />);
    expect(await screen.findByText(/could not find a credential/)).toBeInTheDocument();
    unmount();
    v.verifyCredential.mockRejectedValueOnce(fail(429, 'Too many requests. Slow down a moment.'));
    render(<VerifyCredentialPage />);
    expect(await screen.findByText('Too many requests. Slow down a moment.')).toBeInTheDocument();
  });
});
