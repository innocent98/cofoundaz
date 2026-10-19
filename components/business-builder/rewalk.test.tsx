import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CommentDrawer } from './comment-drawer';
import { RecordFormModal } from './record-form-modal';
import { MoveNote } from './move-note';
import { RegenerateSection } from './plan-regenerate';
import { opLabel } from './suggestions-panel';
import { recordFormFailure } from '@/hooks/useBusinessRecords';
import { ApiError } from '@/lib/api/client';

const api = vi.hoisted(() => ({
  createComment: vi.fn(),
  deleteComment: vi.fn(),
  editComment: vi.fn(),
  listComments: vi.fn(),
  listMembers: vi.fn(),
  resolveComment: vi.fn(),
}));
vi.mock('@/lib/api/comments', () => api);
vi.mock('@/hooks/useBuilderAccess', () => ({ useBuilderAccess: () => ({ canComment: true, canEdit: true, canWrite: true }) }));
const aiStatus = vi.hoisted(() => ({ isOverBudget: false }));
vi.mock('@/hooks/useAiStatus', () => ({ useAiStatus: () => ({ isOverBudget: aiStatus.isOverBudget, formattedResetsAt: '1:00 AM' }) }));

beforeEach(() => {
  vi.clearAllMocks();
  aiStatus.isOverBudget = false;
  api.listComments.mockResolvedValue([]);
  api.listMembers.mockResolvedValue([
    { user_id: 'u-ada', name: 'Ada Lovelace', email: 'ada@example.com', role: 'mentor' },
    { user_id: 'u-bob', name: 'Bob Ross', email: 'bob@example.com', role: 'team_member' },
  ]);
  api.createComment.mockResolvedValue({ id: 'c1', body: '', author: { name: 'Me' }, created_at: new Date().toISOString(), mention_user_ids: [], is_mine: true, resolved_at: null });
});

describe('Comment drawer mentions (row 14)', () => {
  it('Enter picks the highlighted person instead of adding a newline, and the mention is sent', async () => {
    render(<CommentDrawer open title="Key Partners" entityType="canvas" entityId="e1" anchor="partners" onClose={vi.fn()} onChanged={vi.fn()} />);
    const box = await screen.findByRole('combobox', { name: 'Add a comment' });
    await waitFor(() => expect(api.listMembers).toHaveBeenCalled());
    await userEvent.type(box, 'hi @ad');
    const option = await screen.findByRole('option', { name: /Mention Ada Lovelace/ });
    expect(option).toBeTruthy();
    await userEvent.keyboard('{Enter}');
    expect((box as HTMLTextAreaElement).value).not.toContain('\n');
    expect((box as HTMLTextAreaElement).value).toContain('Ada');
    await userEvent.click(screen.getByRole('button', { name: 'Comment' }));
    await waitFor(() => expect(api.createComment).toHaveBeenCalled());
    expect(api.createComment.mock.calls[0][0].mentionUserIds).toEqual(['u-ada']);
  });

  it('arrow keys move the highlight and Tab picks it', async () => {
    render(<CommentDrawer open title="Key Partners" entityType="canvas" entityId="e1" onClose={vi.fn()} onChanged={vi.fn()} />);
    const box = await screen.findByRole('combobox', { name: 'Add a comment' });
    await waitFor(() => expect(api.listMembers).toHaveBeenCalled());
    await userEvent.type(box, '@');
    await screen.findAllByRole('option');
    await userEvent.keyboard('{ArrowDown}{Tab}');
    expect((box as HTMLTextAreaElement).value).toContain('Bob');
  });
});

describe('Record form (row 16)', () => {
  const fields = [
    { key: 'name', label: 'Name', type: 'text' as const, required: true },
    { key: 'threat_level', label: 'Threat level', type: 'select' as const, options: ['low', 'medium', 'high'] },
  ];

  it('labels are tied to their inputs', () => {
    render(<RecordFormModal title="Add competitor" fields={fields} onSubmit={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/Name/)).toBeTruthy();
    expect(screen.getByLabelText('Threat level')).toBeTruthy();
  });

  it('does not send a select left on "Select…"', async () => {
    const onSubmit = vi.fn();
    render(<RecordFormModal title="Add competitor" fields={fields} onSubmit={onSubmit} onClose={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/Name/), 'Acme');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Acme' });
  });

  it('shows API field errors under the right field', () => {
    render(<RecordFormModal title="Add competitor" fields={fields} fieldErrors={{ threat_level: 'Pick a threat level.' }} error="Check the highlighted fields." onSubmit={vi.fn()} onClose={vi.fn()} />);
    const select = screen.getByLabelText('Threat level');
    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Pick a threat level.')).toBeTruthy();
    expect(select.getAttribute('aria-describedby')).toBe(screen.getByText('Pick a threat level.').id);
  });

  it('splits a 422 into per-field messages', () => {
    const err = new ApiError(422, 'Unprocessable', { error: { code: 'VALIDATION', message: 'Invalid', field_errors: [{ field: 'data.threat_level', message: 'Not a valid choice.' }] } });
    expect(recordFormFailure(err, 'fallback')).toEqual({ message: 'Check the highlighted fields.', fields: { threat_level: 'Not a valid choice.' } });
    expect(recordFormFailure(new Error('boom'), 'fallback').message).toBe('boom');
  });
});

describe('Specific labels (row 17)', () => {
  it('the move picker names its note', () => {
    render(<MoveNote note="Sell to schools" fromKey="a" blocks={[{ key: 'a', label: 'A', kind: 'list' }, { key: 'b', label: 'B', kind: 'list' }] as never} onMove={vi.fn()} />);
    expect(screen.getByLabelText('Move note to another block: Sell to schools')).toBeTruthy();
  });
});

describe('Plan regenerate (row 18)', () => {
  it('explains why Regenerate is disabled when the AI budget is used up', () => {
    aiStatus.isOverBudget = true;
    render(<RegenerateSection onDone={vi.fn()} />);
    expect((screen.getByRole('button', { name: 'Regenerate' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('AI is at its daily limit, try again tomorrow.')).toBeTruthy();
  });
});

describe('Suggestion labels (row 19)', () => {
  it('uses the artifact label, not the raw canvas type', () => {
    const s = (canvas_type: string) => ({ op: 'canvas_update', target: { canvas_type } }) as never;
    expect(opLabel(s('swot'))).toBe('Update the SWOT');
    expect(opLabel(s('business_model'))).toBe('Update the Business Model Canvas');
    expect(opLabel(s('value_prop'))).toBe('Update the Value Proposition');
  });
});
