import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const p = vi.hoisted(() => {
  const state: { impl: (name: string) => Promise<unknown>; calls: string[] } = { impl: async () => ({}), calls: [] };
  return { state, updateProfileName: (name: string) => { state.calls.push(name); return state.impl(name); } };
});
vi.mock('@/lib/api/profile', () => ({ updateProfileName: p.updateProfileName }));

import { NamePrompt } from './name-prompt';

const me = { user: { id: 'u', email: 'placeholder@example.com' }, profile: { full_name: 'Rewalk Teammate', role_title: null, country: null, avatar_url: null }, memberships: [], active_workspace_id: null };

describe('NamePrompt', () => {
  beforeEach(() => { p.state.calls = []; });

  it('says the certificate name is permanent, saves, and hands back the normalised me', async () => {
    p.state.impl = async () => me;
    const onSaved = vi.fn();
    render(<NamePrompt onSaved={onSaved} onCancel={vi.fn()} />);
    expect(screen.getByText(/prints this name for good/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: '  Rewalk   Teammate  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save name and finish course' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(me));
    expect(p.state.calls).toEqual(['  Rewalk   Teammate  ']);
  });

  it('shows the 422 message under the input and does not continue', async () => {
    const { ApiError } = await import('@/lib/api/client');
    p.state.impl = async () => {
      throw new ApiError(422, '', { error: { code: 'VALIDATION_ERROR', message: 'Please check the highlighted fields.', field_errors: [{ field: 'full_name', message: 'Tell us your name.' }] } });
    };
    const onSaved = vi.fn();
    render(<NamePrompt onSaved={onSaved} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save name and finish course' }));
    expect(await screen.findByText('Tell us your name.')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('Not now cancels', () => {
    const onCancel = vi.fn();
    render(<NamePrompt onSaved={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
