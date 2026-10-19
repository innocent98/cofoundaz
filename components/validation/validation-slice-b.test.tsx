import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { ScriptEditor } from './ScriptEditor';
import { InsightReport } from './InsightReport';
import type { RawInsight, RawScript } from '@/lib/api/validation';
import { ApiError } from '@/lib/api/client';

beforeEach(() => vi.clearAllMocks());

const script: RawScript = {
  id: 's1',
  title: 'Payout pain interviews',
  assumption_ids: ['a1'],
  questions: [
    { id: 'q1aaaaaaaaaa', question: 'Tell me about the last payout.', tip: 'Last time, not hypotheticals.' },
    { id: 'q2bbbbbbbbbb', question: 'What did you do next?', tip: 'Stay quiet.' },
  ],
};

describe('ScriptEditor', () => {
  it('reorders, adds and removes, then saves the whole list keeping ids', async () => {
    const onSave = vi.fn().mockResolvedValue({
      ...script,
      questions: [
        { id: 'q2bbbbbbbbbb', question: 'What did you do next?', tip: 'Stay quiet.' },
        { id: 'q1aaaaaaaaaa', question: 'Tell me about the last payout.', tip: 'Last time, not hypotheticals.' },
        { id: 'newidcccccc', question: 'Who else is involved?', tip: '' },
      ],
    });
    render(<ScriptEditor script={script} onSave={onSave} onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText('Move question 1 down'));
    fireEvent.click(screen.getByRole('button', { name: /add question/i }));
    fireEvent.change(screen.getByLabelText('Question 3 text'), { target: { value: 'Who else is involved?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save script' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toEqual({
      title: 'Payout pain interviews',
      questions: [
        { id: 'q2bbbbbbbbbb', question: 'What did you do next?', tip: 'Stay quiet.' },
        { id: 'q1aaaaaaaaaa', question: 'Tell me about the last payout.', tip: 'Last time, not hypotheticals.' },
        { question: 'Who else is involved?', tip: '' },
      ],
    });
    expect(await screen.findByText('Saved')).toBeTruthy();
  });

  it('blocks an empty list and shows the API 422 message inline', async () => {
    const onSave = vi.fn().mockRejectedValue(
      new ApiError(422, 'Unprocessable', { error: { code: 'VALIDATION_ERROR', message: 'Each question needs text.', field_errors: [] } })
    );
    render(<ScriptEditor script={script} onSave={onSave} onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText('Remove question 1'));
    fireEvent.click(screen.getByLabelText('Remove question 1'));
    fireEvent.click(screen.getByRole('button', { name: 'Save script' }));
    expect((await screen.findByRole('alert')).textContent).toBe('A script needs at least one question.');
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /add question/i }));
    fireEvent.change(screen.getByLabelText('Question 1 text'), { target: { value: 'x' } });
    onSave.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Save script' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Each question needs text.');
  });

  it('shows the static hint', () => {
    render(<ScriptEditor script={script} onSave={vi.fn()} onClose={() => {}} />);
    expect(screen.getByText('Tip: Ask about the last time it happened, not hypotheticals.')).toBeTruthy();
  });
});

const insight: RawInsight = {
  id: 'i1',
  source: 'all',
  inputs: { interviews: 3, open_answers: 3 },
  patterns: [
    { id: 'p1', theme: 'Same-day cash urgency', summary: 'Traders need cash fast.', quotes: ['Friday is when I need the money'] },
    { id: 'p2', theme: 'No quotes here', summary: 'Paraphrased only.', quotes: [] },
  ],
  contradictions: [],
  suggestions: [
    {
      id: 's1',
      assumption_id: 'a1',
      assumption_statement: 'Associations will promote us',
      from_status: 'untested',
      to_status: 'invalidated',
      reason: 'The secretary said no.',
      applied_at: null,
    },
    {
      id: 's2',
      assumption_id: 'a2',
      assumption_statement: 'Traders pay 0.5%',
      from_status: 'untested',
      to_status: 'testing',
      reason: 'Two traders agreed.',
      applied_at: '2026-10-19T20:00:00+00:00',
    },
  ],
  created_at: '2026-10-19T20:55:37+00:00',
};

describe('InsightReport', () => {
  it('shows the inputs line, AI label, quotes only when present, and hides empty contradictions', () => {
    render(<InsightReport insight={insight} applyingId={null} goneIds={new Set()} onApply={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('Based on 3 interviews and 3 survey answers')).toBeTruthy();
    expect(screen.getByText(/AI-generated/)).toBeTruthy();
    expect(screen.getByText('“Friday is when I need the money”')).toBeTruthy();
    expect(screen.queryByLabelText('Contradictions')).toBeNull();
    const patterns = screen.getByLabelText('Patterns');
    expect(within(patterns).getAllByRole('listitem')).toHaveLength(1);
  });

  it('Apply fires per suggestion; applied and gone ones are disabled', () => {
    const onApply = vi.fn();
    const { rerender } = render(
      <InsightReport insight={insight} applyingId={null} goneIds={new Set()} onApply={onApply} onDelete={() => {}} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Apply: Associations will promote us' }));
    expect(onApply).toHaveBeenCalledWith('s1');
    expect((screen.getByRole('button', { name: /Applied: Traders pay/ }) as HTMLButtonElement).disabled).toBe(true);
    rerender(<InsightReport insight={insight} applyingId={null} goneIds={new Set(['s1'])} onApply={onApply} onDelete={() => {}} />);
    expect(screen.getByText('That assumption no longer exists.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Apply: Associations will promote us' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('renders model text as plain text, not HTML', () => {
    const evil = { ...insight, patterns: [{ id: 'p', theme: '<img src=x onerror=alert(1)>', summary: '<b>hi</b>', quotes: [] }] };
    const { container } = render(<InsightReport insight={evil} applyingId={null} goneIds={new Set()} onApply={() => {}} onDelete={() => {}} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(screen.getByText('<b>hi</b>')).toBeTruthy();
  });
});
