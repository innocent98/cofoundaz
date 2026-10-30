import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AiPreferencesPanel } from './ai-preferences-panel';
import { ApiError } from '@/lib/api/client';
import * as api from '@/lib/api/settings';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/api/settings', () => ({ getAiSettings: vi.fn(), updateAiSettings: vi.fn() }));

const defaults = { proactive_suggestions: true, daily_briefing: true, tone: 'encouraging' as const };

describe('AiPreferencesPanel', () => {
  beforeEach(() => {
    vi.mocked(api.getAiSettings).mockReset().mockResolvedValue(defaults);
    vi.mocked(api.updateAiSettings).mockReset();
  });

  it('shows the saved values and no memory section', async () => {
    vi.mocked(api.getAiSettings).mockResolvedValue({ ...defaults, daily_briefing: false, tone: 'straight_shooter' });
    render(<AiPreferencesPanel />);
    await screen.findByRole('switch', { name: 'Daily briefing' });
    expect(screen.getByRole('switch', { name: 'Daily briefing' }).getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('switch', { name: 'Proactive suggestions' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: /Straight shooter/ }).getAttribute('aria-checked')).toBe('true');
    expect(screen.queryByText(/What I remember|Forget this|Clear all memory/)).toBeNull();
  });

  it('sends only the changed field and shows the server response', async () => {
    vi.mocked(api.updateAiSettings).mockResolvedValue({ ...defaults, proactive_suggestions: false });
    render(<AiPreferencesPanel />);
    fireEvent.click(await screen.findByRole('switch', { name: 'Proactive suggestions' }));
    await waitFor(() => expect(api.updateAiSettings).toHaveBeenCalledWith({ proactive_suggestions: false }));
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Proactive suggestions' }).getAttribute('aria-checked')).toBe('false'));
  });

  it('rolls back when the save fails', async () => {
    vi.mocked(api.updateAiSettings).mockRejectedValue(new ApiError(500, 'x', {}));
    render(<AiPreferencesPanel />);
    fireEvent.click(await screen.findByRole('radio', { name: /Straight shooter/ }));
    await waitFor(() => expect(api.updateAiSettings).toHaveBeenCalledWith({ tone: 'straight_shooter' }));
    await waitFor(() => expect(screen.getByRole('radio', { name: /Encouraging/ }).getAttribute('aria-checked')).toBe('true'));
  });

  it('says it is for founders and team members on 403', async () => {
    vi.mocked(api.getAiSettings).mockRejectedValue(new ApiError(403, 'x', { error: { code: 'FORBIDDEN', message: 'no' } }));
    render(<AiPreferencesPanel />);
    expect(await screen.findByText('AI preferences are for founders and team members.')).toBeTruthy();
  });
});
