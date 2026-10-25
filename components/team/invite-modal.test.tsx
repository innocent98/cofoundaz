import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { InviteModal } from './invite-modal';
import { InviteError } from '@/lib/api/team';

function setup(send = vi.fn(), open = true) {
  const onClose = vi.fn();
  render(<InviteModal open={open} onClose={onClose} startupName="NovaPay" send={send} />);
  return { send, onClose };
}

describe('InviteModal', () => {
  it('closed renders nothing; open titles itself with the startup', () => {
    const { unmount } = render(<InviteModal open={false} onClose={vi.fn()} startupName="NovaPay" send={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    unmount();
    setup();
    expect(screen.getByRole('heading', { name: 'Invite to NovaPay' })).toBeTruthy();
  });

  it('sends the role VALUE, not the label (Co-Founder -> founder), trimming the email', async () => {
    const send = vi.fn().mockResolvedValue({ created: ['a@example.com'], skipped: [], undelivered: [] });
    setup(send);
    await userEvent.type(screen.getByLabelText('Email 1'), '  a@example.com ');
    await userEvent.selectOptions(screen.getByLabelText('Role'), 'Co-Founder');
    expect(screen.getByText('Co-Founders get full access.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));
    expect(send).toHaveBeenCalledWith([{ email: 'a@example.com', role: 'founder' }]);
  });

  it('defaults to least privilege (Team Member)', () => {
    setup();
    expect((screen.getByLabelText('Role') as HTMLSelectElement).value).toBe('team_member');
  });

  it('shows created and skipped separately, never a generic success when everything was skipped', async () => {
    const send = vi.fn().mockResolvedValue({ created: [], skipped: ['throwaway-founder@example.com'], undelivered: [] });
    setup(send);
    await userEvent.type(screen.getByLabelText('Email 1'), 'throwaway-founder@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));
    expect(await screen.findByText(/No new invitations were sent/)).toBeTruthy();
    expect(screen.getByText('Skipped throwaway-founder@example.com')).toBeTruthy();
  });

  it('mixed outcome: Invited 1 and Skipped 1, with the email lists', async () => {
    const send = vi.fn().mockResolvedValue({ created: ['m@example.com'], skipped: ['f@example.com'], undelivered: [] });
    setup(send);
    await userEvent.type(screen.getByLabelText('Email 1'), 'm@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));
    expect(await screen.findByText('Invited 1.')).toBeTruthy();
    expect(screen.getByText('Skipped 1 (already a member or already invited).')).toBeTruthy();
    expect(screen.getByText('Invited m@example.com')).toBeTruthy();
  });

  it('undelivered emails are called out: the invitation exists but the email failed', async () => {
    const send = vi.fn().mockResolvedValue({ created: ['m@example.com'], skipped: [], undelivered: ['m@example.com'] });
    setup(send);
    await userEvent.type(screen.getByLabelText('Email 1'), 'm@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));
    expect(await screen.findByText('We couldn’t email m@example.com. Check the address.')).toBeTruthy();
  });

  it('422 shows friendly copy per row, never the raw validator text', async () => {
    const raw = 'value is not a valid email address: An email address must have an @-sign.';
    const send = vi.fn().mockRejectedValue(
      new InviteError(raw, 'validation', [{ row: 0, field: 'email', message: raw }]),
    );
    setup(send);
    await userEvent.type(screen.getByLabelText('Email 1'), 'a@b.co');
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Check the highlighted fields.');
    expect(screen.queryByText(/@-sign/)).toBeNull();
    expect((screen.getByLabelText('Email 1') as HTMLInputElement).value).toBe('a@b.co');
    expect(screen.getByLabelText('Email 1').getAttribute('aria-invalid')).toBe('true');
  });

  it('rejects an invalid email client-side without calling the API', async () => {
    const { send } = setup();
    await userEvent.type(screen.getByLabelText('Email 1'), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));
    expect(send).not.toHaveBeenCalled();
    expect(screen.getAllByText('Enter a valid email address.')).toHaveLength(1);
    expect(screen.getByLabelText('Email 1').getAttribute('aria-invalid')).toBe('true');
  });

  it('requires at least one email when everything is empty', async () => {
    const { send } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));
    expect(send).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
  });

  it('ignores a fully empty extra row and sends only the filled ones', async () => {
    const send = vi.fn().mockResolvedValue({ created: ['a@example.com'], skipped: [], undelivered: [] });
    setup(send);
    await userEvent.type(screen.getByLabelText('Email 1'), 'a@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Add another person' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send invites' }));
    expect(send).toHaveBeenCalledWith([{ email: 'a@example.com', role: 'team_member' }]);
  });

  it('flags only the bad row when one of two emails is invalid', async () => {
    const { send } = setup();
    await userEvent.type(screen.getByLabelText('Email 1'), 'a@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Add another person' }));
    await userEvent.type(screen.getByLabelText('Email 2'), 'oops');
    await userEvent.click(screen.getByRole('button', { name: 'Send invites' }));
    expect(send).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Email 1').getAttribute('aria-invalid')).toBeNull();
    expect(screen.getByLabelText('Email 2').getAttribute('aria-invalid')).toBe('true');
  });

  it('daily limit message is shown and the form is kept', async () => {
    const send = vi.fn().mockRejectedValue(new InviteError("You've sent a lot of invitations today. Try again tomorrow.", 'daily_limit'));
    setup(send);
    await userEvent.type(screen.getByLabelText('Email 1'), 'a@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Try again tomorrow');
    expect(screen.getByRole('button', { name: 'Send invite' })).toBeTruthy();
  });

  it('supports several rows (Add another person / remove) and sends them together', async () => {
    const send = vi.fn().mockResolvedValue({ created: ['a@example.com', 'b@example.com'], skipped: [], undelivered: [] });
    setup(send);
    await userEvent.type(screen.getByLabelText('Email 1'), 'a@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Add another person' }));
    await userEvent.type(screen.getByLabelText('Email 2'), 'b@example.com');
    await userEvent.selectOptions(screen.getAllByLabelText('Role')[1], 'Mentor');
    await userEvent.click(screen.getByRole('button', { name: 'Send invites' }));
    expect(send).toHaveBeenCalledWith([
      { email: 'a@example.com', role: 'team_member' },
      { email: 'b@example.com', role: 'mentor' },
    ]);
  });

  it('Escape and Cancel close it', async () => {
    const { onClose } = setup();
    fireEvent.keyDown(window, { key: 'Escape' });
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
