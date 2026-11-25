import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportDialog } from './report-dialog';
import * as reportsApi from '@/lib/api/reports';
import { ApiError } from '@/lib/api/client';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ReportDialog', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const onNotFound = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    onClose.mockClear();
    onSuccess.mockClear();
    onNotFound.mockClear();
  });

  it('renders dialog when isOpen is true', () => {
    render(
      <ReportDialog
        isOpen={true}
        itemType="ai_message"
        itemId="msg-1"
        onClose={onClose}
        onSuccess={onSuccess}
        onNotFound={onNotFound}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Report AI Co-Founder Reply')).toBeInTheDocument();
    expect(screen.getByLabelText('Spam')).toBeInTheDocument();
    expect(screen.getByLabelText('Abusive or harassing')).toBeInTheDocument();
    expect(screen.getByLabelText('Harmful or unsafe')).toBeInTheDocument();
    expect(screen.getByLabelText('Wrong or misleading')).toBeInTheDocument();
    expect(screen.getByLabelText('Shares private information')).toBeInTheDocument();
    expect(screen.getByLabelText('Something else')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ReportDialog
        isOpen={false}
        itemType="ai_message"
        itemId="msg-1"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('disables submit when no reason selected', () => {
    render(
      <ReportDialog
        isOpen={true}
        itemType="comment"
        itemId="cmt-1"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const submitBtn = screen.getByRole('button', { name: 'Submit Report' });
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit when a standard reason is selected', () => {
    render(
      <ReportDialog
        isOpen={true}
        itemType="comment"
        itemId="cmt-1"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    fireEvent.click(screen.getByLabelText('Harmful or unsafe'));
    const submitBtn = screen.getByRole('button', { name: 'Submit Report' });
    expect(submitBtn).not.toBeDisabled();
  });

  it('requires note when "Something else" is selected', () => {
    render(
      <ReportDialog
        isOpen={true}
        itemType="comment"
        itemId="cmt-1"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    fireEvent.click(screen.getByLabelText('Something else'));
    const submitBtn = screen.getByRole('button', { name: 'Submit Report' });
    expect(submitBtn).toBeDisabled();

    const noteInput = screen.getByPlaceholderText(/Please describe the issue/i);
    fireEvent.change(noteInput, { target: { value: 'Inappropriate content' } });
    expect(submitBtn).not.toBeDisabled();
  });

  it('calls reportItem and on 201 closes, toasts, and triggers onSuccess', async () => {
    const reportItemSpy = vi.spyOn(reportsApi, 'reportItem').mockResolvedValue(undefined);

    render(
      <ReportDialog
        isOpen={true}
        itemType="ai_message"
        itemId="msg-1"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    fireEvent.click(screen.getByLabelText('Wrong or misleading'));
    const noteInput = screen.getByLabelText(/Note/i);
    fireEvent.change(noteInput, { target: { value: 'Factually inaccurate calculation' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Report' }));

    await waitFor(() => {
      expect(reportItemSpy).toHaveBeenCalledWith({
        item_type: 'ai_message',
        item_id: 'msg-1',
        reason: 'inaccurate',
        note: 'Factually inaccurate calculation',
      });
      expect(toast.success).toHaveBeenCalledWith("Thanks, we'll take a look");
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles 409 ALREADY_REPORTED as success', async () => {
    vi.spyOn(reportsApi, 'reportItem').mockRejectedValue(
      new ApiError(409, 'Conflict', { error: { code: 'ALREADY_REPORTED', message: 'Already reported' } })
    );

    render(
      <ReportDialog
        isOpen={true}
        itemType="ai_message"
        itemId="msg-1"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    fireEvent.click(screen.getByLabelText('Spam'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Report' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Thanks, we'll take a look");
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles 429 RATE_LIMITED by keeping dialog open and showing message', async () => {
    vi.spyOn(reportsApi, 'reportItem').mockRejectedValue(
      new ApiError(429, 'Too Many Requests', { error: { code: 'RATE_LIMITED', message: 'Maximum 10 reports per hour.' } })
    );

    render(
      <ReportDialog
        isOpen={true}
        itemType="comment"
        itemId="cmt-1"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    fireEvent.click(screen.getByLabelText('Spam'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Report' }));

    await waitFor(() => {
      expect(screen.getByText('Maximum 10 reports per hour.')).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('handles 404 NOT_FOUND by closing dialog and calling onNotFound', async () => {
    vi.spyOn(reportsApi, 'reportItem').mockRejectedValue(
      new ApiError(404, 'Not Found', { error: { code: 'NOT_FOUND', message: 'Comment not found.' } })
    );

    render(
      <ReportDialog
        isOpen={true}
        itemType="comment"
        itemId="cmt-1"
        onClose={onClose}
        onSuccess={onSuccess}
        onNotFound={onNotFound}
      />
    );

    fireEvent.click(screen.getByLabelText('Spam'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Report' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
      expect(onNotFound).toHaveBeenCalled();
    });
  });

  it('handles 422 validation error under note box when field is note or empty', async () => {
    vi.spyOn(reportsApi, 'reportItem').mockRejectedValue(
      new ApiError(422, 'Unprocessable Entity', { error: { code: 'VALIDATION_ERROR', message: 'A note is required when reason is Something else', field: '' } })
    );

    render(
      <ReportDialog
        isOpen={true}
        itemType="comment"
        itemId="cmt-1"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    fireEvent.click(screen.getByLabelText('Something else'));
    const noteInput = screen.getByPlaceholderText(/Please describe the issue/i);
    fireEvent.change(noteInput, { target: { value: 'Something' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Report' }));

    await waitFor(() => {
      expect(screen.getByText('A note is required when reason is Something else')).toBeInTheDocument();
    });
  });

  it('closes when Cancel is clicked', () => {
    render(
      <ReportDialog
        isOpen={true}
        itemType="ai_message"
        itemId="msg-1"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
