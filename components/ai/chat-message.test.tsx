import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ChatMessage } from './chat-message';
import type { ChatMessage as Msg } from '@/lib/api/aiChat';

const base: Msg = {
  id: 'm1', role: 'assistant', status: 'ready', content: 'Here is my take.', created_at: 't',
  agent: { key: 'finance', name: 'Finance Advisor' },
  reasoning_summary: 'Answered by the Finance Advisor because it is about finance.',
  disclaimer: 'Not financial advice.', actions: [], feedback: null,
};
const handlers = () => ({ onRegenerate: vi.fn(), onFeedback: vi.fn(), onAction: vi.fn().mockResolvedValue(undefined) });
const setup = (m: Partial<Msg> = {}, opts: { isLatest?: boolean; busy?: boolean } = {}) => {
  const h = handlers();
  render(<ChatMessage message={{ ...base, ...m }} isLatest={opts.isLatest ?? true} busy={opts.busy ?? false} handlers={h} />);
  return h;
};

describe('ChatMessage', () => {
  it('labels the specialist and shows the disclaimer as its own block', () => {
    setup();
    expect(screen.getByText('Finance Advisor via Co-Founder')).toBeTruthy();
    expect(screen.getByText('Not financial advice.')).toBeTruthy();
  });

  it('falls back to Co-Founder with no agent', () => {
    setup({ agent: null, disclaimer: null });
    expect(screen.getByText('Co-Founder')).toBeTruthy();
  });

  it('"Why I said this" expands the reasoning summary', () => {
    setup();
    expect(screen.queryByText(/Answered by the Finance Advisor/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Why I said this' }));
    expect(screen.getByText(/Answered by the Finance Advisor/)).toBeTruthy();
  });

  it('thumbs and regenerate call their handlers; thumb shows the pressed state', () => {
    const h = setup({ feedback: 'up' });
    expect(screen.getByRole('button', { name: 'Good reply' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Bad reply' }));
    expect(h.onFeedback).toHaveBeenCalledWith('m1', 'down');
    fireEvent.click(screen.getByRole('button', { name: /Regenerate/ }));
    expect(h.onRegenerate).toHaveBeenCalledWith('m1');
  });

  it('hides Regenerate once a reply made a change, or when it is not the latest', () => {
    const exec = { id: 'a1', kind: 'add_task' as const, label: 'Add', status: 'executed' as const, undoable: true, href: '/roadmap', result_label: 'Task added' };
    setup({ actions: [exec] });
    expect(screen.queryByRole('button', { name: /Regenerate/ })).toBeNull();
  });

  it('a failed reply shows Retry, no thumbs', () => {
    const h = setup({ status: 'failed', content: '' });
    expect(screen.queryByRole('button', { name: 'Good reply' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Retry/ }));
    expect(h.onRegenerate).toHaveBeenCalledWith('m1');
  });

  it('a cancelled reply says Cancelled and offers Retry', () => {
    setup({ status: 'cancelled', content: '' });
    expect(screen.getByText('Cancelled.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Retry/ })).toBeTruthy();
  });

  it('proposed chips confirm and dismiss; an executed chip offers Open it and Undo', async () => {
    const proposed = { id: 'a1', kind: 'add_task' as const, label: 'Add as task: Call five customers', status: 'proposed' as const, undoable: false, href: null, result_label: null };
    const h = setup({ actions: [proposed] });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(h.onAction).toHaveBeenCalledWith('m1', 'a1', 'confirm'));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(h.onAction).toHaveBeenCalledWith('m1', 'a1', 'dismiss'));
  });

  it('executed chip: Open it links to href and Undo calls undo', async () => {
    const exec = { id: 'a1', kind: 'add_task' as const, label: 'Add', status: 'executed' as const, undoable: true, href: '/roadmap', result_label: 'Task added' };
    const h = setup({ actions: [exec] });
    expect(screen.getByText('Done: Task added')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open it' }).getAttribute('href')).toBe('/roadmap');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(h.onAction).toHaveBeenCalledWith('m1', 'a1', 'undo'));
  });
});
