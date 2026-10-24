import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const pub = vi.hoisted(() => ({ getUnsubscribeStatus: vi.fn(), confirmUnsubscribe: vi.fn() }));
vi.mock('next/navigation', () => ({ useParams: () => ({ token: 'tok' }) }));
vi.mock('@/lib/api/sales', () => {
  class PublicUnsubscribeError extends Error {
    constructor(public status: number) {
      super(String(status));
    }
  }
  return { ...pub, PublicUnsubscribeError };
});

import { PublicUnsubscribeError } from '@/lib/api/sales';
import UnsubscribePage from './page';

const status = (unsubscribed: boolean) => ({ email: 'a***@prospect.example', sender: 'NovaPay', unsubscribed });

beforeEach(() => vi.clearAllMocks());

describe('public unsubscribe page', () => {
  it('only reads on load, then unsubscribes on the button and confirms', async () => {
    pub.getUnsubscribeStatus.mockResolvedValue(status(false));
    pub.confirmUnsubscribe.mockResolvedValue(status(true));
    render(<UnsubscribePage />);
    expect(await screen.findByRole('heading', { name: 'Unsubscribe from NovaPay?' })).toBeTruthy();
    expect(pub.confirmUnsubscribe).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }));
    expect(await screen.findByRole('heading', { name: "You won't hear from NovaPay again" })).toBeTruthy();
    expect(pub.confirmUnsubscribe).toHaveBeenCalledWith('tok');
  });

  it('says already unsubscribed without offering the button', async () => {
    pub.getUnsubscribeStatus.mockResolvedValue(status(true));
    render(<UnsubscribePage />);
    expect(await screen.findByRole('heading', { name: "You're already unsubscribed" })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Unsubscribe' })).toBeNull();
  });

  it('shows a plain invalid-link page for a forged token and a retry message for other failures', async () => {
    pub.getUnsubscribeStatus.mockRejectedValue(new PublicUnsubscribeError(404));
    const { unmount } = render(<UnsubscribePage />);
    expect(await screen.findByRole('heading', { name: 'This link does not work' })).toBeTruthy();
    unmount();
    pub.getUnsubscribeStatus.mockRejectedValue(new PublicUnsubscribeError(0));
    render(<UnsubscribePage />);
    expect(await screen.findByText(/could not check this link/i)).toBeTruthy();
  });

  it('keeps the button and shows an error when the POST fails', async () => {
    pub.getUnsubscribeStatus.mockResolvedValue(status(false));
    pub.confirmUnsubscribe.mockRejectedValue(new PublicUnsubscribeError(503));
    render(<UnsubscribePage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Unsubscribe' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/did not go through/));
    expect(screen.getByRole('button', { name: 'Unsubscribe' })).toBeTruthy();
  });
});
