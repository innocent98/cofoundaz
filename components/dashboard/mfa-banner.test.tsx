import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MfaBanner } from './mfa-banner';

const apiClient = vi.fn();
vi.mock('@/lib/api/client', () => ({ apiClient: (...a: unknown[]) => apiClient(...a) }));

describe('MfaBanner', () => {
  beforeEach(() => {
    apiClient.mockReset();
    sessionStorage.clear();
  });

  it('shows while 2FA is off and links to the setup page', async () => {
    apiClient.mockResolvedValue({ data: { enabled: false } });
    render(<MfaBanner />);
    expect(await screen.findByRole('link', { name: 'Turn on 2FA' })).toHaveAttribute('href', '/setup/mfa');
  });

  it('stays hidden when 2FA is on, or when the status is unknown', async () => {
    apiClient.mockResolvedValue({ data: { enabled: true } });
    const { container, unmount } = render(<MfaBanner />);
    await waitFor(() => expect(apiClient).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    unmount();
    apiClient.mockRejectedValue(new Error('x'));
    const again = render(<MfaBanner />);
    await waitFor(() => expect(apiClient).toHaveBeenCalledTimes(2));
    expect(again.container).toBeEmptyDOMElement();
  });

  it('"Not now" hides it for the session', async () => {
    apiClient.mockResolvedValue({ data: { enabled: false } });
    render(<MfaBanner />);
    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('link', { name: 'Turn on 2FA' })).toBeNull();
  });
});
