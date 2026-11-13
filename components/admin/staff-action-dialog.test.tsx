import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { StaffActionDialog } from './staff-action-dialog';
import { ApiError } from '@/lib/api/client';

describe('StaffActionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, confirm copy, permanent log notice, and inputs when open', () => {
    render(
      <StaffActionDialog
        isOpen={true}
        title="Suspend User"
        confirmCopy="Suspend test@example.com? They're signed out everywhere immediately."
        actionButtonLabel="Suspend"
        actionButtonVariant="danger"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Suspend User' })).toBeInTheDocument();
    expect(screen.getByText("Suspend test@example.com? They're signed out everywhere immediately.")).toBeInTheDocument();
    expect(screen.getByText('This action is permanently logged.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Reason/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Authenticator code/i)).toBeInTheDocument();
  });

  it('blocks submit when reason is under 10 characters or TOTP is not 6 digits', () => {
    render(
      <StaffActionDialog
        isOpen={true}
        title="Suspend User"
        confirmCopy="Confirm action?"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: 'Confirm' });
    const reasonInput = screen.getByLabelText(/Reason/i);
    const totpInput = screen.getByLabelText(/Authenticator code/i);

    expect(submitBtn).toBeDisabled();

    // Reason has 9 chars (under 10)
    fireEvent.change(reasonInput, { target: { value: '123456789' } });
    fireEvent.change(totpInput, { target: { value: '123456' } });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText(/9 \/ 500 chars/i)).toBeInTheDocument();

    // Reason has 10 chars, but TOTP only 5 digits
    fireEvent.change(reasonInput, { target: { value: '1234567890' } });
    fireEvent.change(totpInput, { target: { value: '12345' } });
    expect(submitBtn).toBeDisabled();

    // Valid 10 chars + 6 digits
    fireEvent.change(totpInput, { target: { value: '123456' } });
    expect(submitBtn).toBeEnabled();
  });

  it('submits valid reason and totp_code, calling onConfirm and onClose', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <StaffActionDialog
        isOpen={true}
        title="Suspend User"
        confirmCopy="Confirm action?"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    fireEvent.change(screen.getByLabelText(/Reason/i), {
      target: { value: 'Suspicious fraud activity reported.' },
    });
    fireEvent.change(screen.getByLabelText(/Authenticator code/i), {
      target: { value: '654321' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({
        reason: 'Suspicious fraud activity reported.',
        totp_code: '654321',
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles 403 STEP_UP_INVALID inline, never signs out, and clears the code field', async () => {
    const error = new ApiError(403, 'Forbidden', {
      error: { code: 'STEP_UP_INVALID', message: 'Invalid code' },
    });
    const onConfirm = vi.fn().mockRejectedValue(error);

    render(
      <StaffActionDialog
        isOpen={true}
        title="Suspend User"
        confirmCopy="Confirm action?"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    const reasonInput = screen.getByLabelText(/Reason/i);
    const totpInput = screen.getByLabelText(/Authenticator code/i);

    fireEvent.change(reasonInput, { target: { value: 'Valid reason here' } });
    fireEvent.change(totpInput, { target: { value: '111222' } });

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(
        screen.getByText("That code was already used or isn't right. Wait for the next code and try again.")
      ).toBeInTheDocument();
    });

    // Verify authenticator code was cleared after failure
    expect((totpInput as HTMLInputElement).value).toBe('');
  });

  it('handles 429 TOO_MANY_ATTEMPTS and disables submit', async () => {
    const error = new ApiError(429, 'Too Many Requests', {
      error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many step-up attempts. Locked for 15 minutes.' },
    });
    const onConfirm = vi.fn().mockRejectedValue(error);

    render(
      <StaffActionDialog
        isOpen={true}
        title="Suspend User"
        confirmCopy="Confirm action?"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    fireEvent.change(screen.getByLabelText(/Reason/i), { target: { value: 'Valid reason here' } });
    fireEvent.change(screen.getByLabelText(/Authenticator code/i), { target: { value: '111222' } });

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(screen.getByText('Too many step-up attempts. Locked for 15 minutes.')).toBeInTheDocument();
    });

    // Form inputs and button should now be disabled
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
    expect(screen.getByLabelText(/Reason/i)).toBeDisabled();
    expect(screen.getByLabelText(/Authenticator code/i)).toBeDisabled();
  });

  it('closes on Escape key press or Cancel click', () => {
    const onClose = vi.fn();
    render(
      <StaffActionDialog
        isOpen={true}
        title="Suspend User"
        confirmCopy="Confirm action?"
        onClose={onClose}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

