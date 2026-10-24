import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReceiptButton } from './ReceiptButton';

const toast = vi.fn();
vi.mock('../ToastContext', () => ({ useToast: () => ({ triggerToast: toast }) }));
vi.mock('@/lib/api/finance', () => ({
  getReceiptLink: vi.fn(async () => ({ url: 'http://api.test/api/v1/finance/receipts/download?token=t', expires_at: '', content_type: 'image/png' })),
  toFinanceError: (e: unknown) => e,
}));

afterEach(() => {
  vi.unstubAllGlobals();
  toast.mockReset();
});

function stubTab() {
  const tab = { opener: {}, close: vi.fn(), location: { href: '' } };
  vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
  return tab;
}

describe('ReceiptButton', () => {
  it('shows a message and closes the blank tab when the file is gone', async () => {
    const tab = stubTab();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
    render(<ReceiptButton expenseId="e1" vendor="Notion" />);
    fireEvent.click(screen.getByRole('button', { name: /View receipt for Notion/ }));
    await waitFor(() => expect(toast).toHaveBeenCalled());
    expect(toast.mock.calls[0][0]).toMatch(/no longer available/);
    expect(toast.mock.calls[0][1]).toBe('error');
    expect(tab.close).toHaveBeenCalled();
    expect(tab.location.href).toBe('');
  });

  it('points the tab at the link when the file is there', async () => {
    const tab = stubTab();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200 })));
    render(<ReceiptButton expenseId="e1" vendor="Notion" />);
    fireEvent.click(screen.getByRole('button', { name: /View receipt for Notion/ }));
    await waitFor(() => expect(tab.location.href).toContain('receipts/download'));
    expect(tab.close).not.toHaveBeenCalled();
  });

  it('still opens the link when the check itself cannot run', async () => {
    const tab = stubTab();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    render(<ReceiptButton expenseId="e1" vendor="Notion" />);
    fireEvent.click(screen.getByRole('button', { name: /View receipt for Notion/ }));
    await waitFor(() => expect(tab.location.href).toContain('receipts/download'));
  });
});
