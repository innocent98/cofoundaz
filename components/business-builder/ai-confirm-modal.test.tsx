import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AI_CONFIRM_COPY, AiConfirmModal } from './ai-confirm-modal';

describe('AiConfirmModal', () => {
  it('renders nothing while closed', () => {
    render(<AiConfirmModal open={false} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the PRD copy with a Draft it button and no en or em dashes', () => {
    render(<AiConfirmModal open onConfirm={vi.fn()} onCancel={vi.fn()} detail="This adds up to 3 ideas to Strengths." />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(
      "I'll draft this from your profile, assessment, and market data. You edit, nothing is final until you say so."
    );
    expect(screen.getByRole('button', { name: 'Draft it' })).toBeInTheDocument();
    expect(AI_CONFIRM_COPY).not.toMatch(/[–—]/);
    expect(dialog.textContent).not.toMatch(/[–—]/);
  });

  it('confirms on Draft it and cancels on Cancel or Escape', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<AiConfirmModal open onConfirm={onConfirm} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Draft it' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
