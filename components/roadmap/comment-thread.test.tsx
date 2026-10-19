import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CommentThread } from './comment-thread';
import * as api from '@/lib/api/comments';

const workspace = vi.hoisted(() => ({ role: 'founder' as string | null }));
vi.mock('@/components/workspace-context', () => ({ useWorkspace: () => ({ role: workspace.role }) }));
vi.mock('@/lib/api/comments', async (orig) => ({
  ...(await orig<typeof import('@/lib/api/comments')>()),
  listComments: vi.fn(),
  createComment: vi.fn(),
  editComment: vi.fn(),
  deleteComment: vi.fn(),
  resolveComment: vi.fn(),
}));

const members = [
  { user_id: 'u-ada', name: 'Ada F', email: 'ada@example.com', role: 'founder' },
  { user_id: 'u-tm', name: null, email: 'tm@example.com', role: 'team_member' },
];

const comment = (over: Partial<api.Comment> = {}): api.Comment => ({
  id: 'c1',
  entity_type: 'roadmap_milestone',
  entity_id: 'm1',
  author: { id: 'u-ada', name: 'Ada F' },
  body: 'Can you own the interviews?',
  mention_user_ids: [],
  created_at: new Date().toISOString(),
  edited_at: null,
  resolved_at: null,
  is_mine: true,
  ...over,
});

const setup = () => render(<CommentThread entityType="roadmap_milestone" entityId="m1" members={members} />);

describe('CommentThread', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    workspace.role = 'founder';
    vi.mocked(api.listComments).mockResolvedValue([]);
  });

  it('shows the empty state, then posts a comment with the @-picked member id', async () => {
    vi.mocked(api.createComment).mockResolvedValue(comment({ body: 'Hi @tm@example.com', mention_user_ids: ['u-tm'] }));
    setup();
    await screen.findByText(/No comments yet/);
    const box = screen.getByRole('combobox', { name: 'Add a comment' });
    expect(box.getAttribute('placeholder')).toBe('Add a comment… @ to mention');

    fireEvent.change(box, { target: { value: 'Hi @tm', selectionStart: 6 } });
    fireEvent.select(box, { target: { selectionStart: 6 } });
    const option = await screen.findByRole('option', { name: 'tm@example.com' });
    fireEvent.mouseDown(option);
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));

    await waitFor(() => expect(api.createComment).toHaveBeenCalled());
    expect(api.createComment).toHaveBeenCalledWith({
      entityType: 'roadmap_milestone',
      entityId: 'm1',
      body: 'Hi @tm@example.com',
      mentionUserIds: ['u-tm'],
    });
    await screen.findByText(/Hi/, { selector: 'p' });
  });

  it('offers edit and delete only on your own comments, and resolve to founders and authors', async () => {
    vi.mocked(api.listComments).mockResolvedValue([
      comment({ id: 'mine', is_mine: true }),
      comment({ id: 'theirs', is_mine: false, author: { id: 'u-tm', name: null }, body: 'Other note' }),
    ]);
    setup();
    await screen.findByText('Other note');
    expect(screen.getAllByRole('button', { name: 'Edit comment' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Delete comment' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Resolve thread' })).toHaveLength(2); // founder can resolve any
    expect(screen.getByText('Teammate')).toBeTruthy(); // null author name
  });

  it('toggles resolve through the API and shows the resolved state', async () => {
    vi.mocked(api.listComments).mockResolvedValue([comment()]);
    vi.mocked(api.resolveComment).mockResolvedValue(comment({ resolved_at: '2026-10-18T03:00:00Z' }));
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Resolve thread' }));
    await screen.findByRole('button', { name: 'Reopen thread' });
    expect(api.resolveComment).toHaveBeenCalledWith('c1', true);
  });

  it('deletes after an inline confirm', async () => {
    vi.mocked(api.listComments).mockResolvedValue([comment()]);
    vi.mocked(api.deleteComment).mockResolvedValue();
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Delete comment' }));
    expect(api.deleteComment).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(api.deleteComment).toHaveBeenCalledWith('c1'));
    await screen.findByText(/No comments yet/);
  });

  it('surfaces a rejected edit instead of closing the editor', async () => {
    vi.mocked(api.listComments).mockResolvedValue([comment()]);
    vi.mocked(api.editComment).mockRejectedValue(new Error('nope'));
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit comment' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Edit comment' }), { target: { value: 'Changed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('alert').textContent).toMatch(/Couldn't save that edit/);
    expect(screen.getByRole('textbox', { name: 'Edit comment' })).toBeTruthy();
  });

  it('is read-only for investors', async () => {
    workspace.role = 'investor';
    vi.mocked(api.listComments).mockResolvedValue([comment({ is_mine: false })]);
    setup();
    await screen.findByText('Can you own the interviews?');
    expect(screen.queryByRole('combobox', { name: 'Add a comment' })).toBeNull();
    expect(screen.getByText('Investors can read comments but not post.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Resolve thread' })).toBeNull();
  });

  it('offers a retry when the thread cannot load', async () => {
    vi.mocked(api.listComments).mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce([comment()]);
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    await screen.findByText('Can you own the interviews?');
  });
});
