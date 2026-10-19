import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const push = vi.hoisted(() => vi.fn());
const shell = vi.hoisted(() => ({ triggerToast: vi.fn(), setPendingDraft: vi.fn(), pendingDraft: null }));
const draftHook = vi.hoisted(() => ({ design: vi.fn(), drafting: false }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/app/(dashboard)/validation/layout', () => ({ useValidationShell: () => shell }));
vi.mock('@/hooks/useExperimentDraft', () => ({ useExperimentDraft: () => draftHook }));

import { ApiError } from '@/lib/api/client';
import { RiskiestNudge } from './RiskiestNudge';
import { ConfirmDelete } from './ConfirmDelete';
import { SmokeBuilder, slugErrorFrom } from './SmokeBuilder';
import { SmokeResults } from './SmokeResults';
import type { SmokeTest, SmokeTestStats } from '@/hooks/useSmokeTests';

beforeEach(() => vi.clearAllMocks());

const riskiest = { id: 'a1', statement: 'Market associations will promote us', risk: 'high' as const };
const draft = {
  name: 'Same-day settlement',
  headline: 'Get paid the same day',
  subheadline: 'Instant settlement',
  cta_text: 'Join the waitlist',
  metric_type: 'email_signup',
  target_conversion: 10,
  slug_suggestion: 'novapay-same-day',
  rationale: 'A signup shows demand.',
  assumption_ids: ['a1'],
};

describe('RiskiestNudge', () => {
  it('renders nothing when there is no untested assumption', () => {
    const { container } = render(<RiskiestNudge riskiest={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the PRD copy and opens the builder with the draft', async () => {
    draftHook.design.mockResolvedValue({ ok: true, draft });
    render(<RiskiestNudge riskiest={riskiest} />);
    expect(screen.getByTestId('riskiest-nudge').textContent).toBe(
      "Your riskiest untested assumption: 'Market associations will promote us'. Want an experiment for it?"
    );
    fireEvent.click(screen.getByRole('button', { name: 'Design experiment' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/validation/smoke-tests'));
    expect(draftHook.design).toHaveBeenCalledWith('a1');
    expect(shell.setPendingDraft).toHaveBeenCalledWith(draft);
  });

  it('toasts the over-budget message and does not navigate', async () => {
    draftHook.design.mockResolvedValue({ ok: false, message: 'AI is at its daily limit, try again tomorrow.' });
    render(<RiskiestNudge riskiest={riskiest} />);
    fireEvent.click(screen.getByRole('button', { name: 'Design experiment' }));
    await waitFor(() => expect(shell.triggerToast).toHaveBeenCalledWith('AI is at its daily limit, try again tomorrow.'));
    expect(push).not.toHaveBeenCalled();
    expect(shell.setPendingDraft).not.toHaveBeenCalled();
  });
});

describe('ConfirmDelete', () => {
  it('only deletes after the confirm button, then closes', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<ConfirmDelete title="Delete this?" warning="This also deletes its waitlist of 3 emails." onConfirm={onConfirm} onClose={onClose} />);
    expect(screen.getByText('This also deletes its waitlist of 3 emails.')).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cancel does not delete, and a failure keeps the dialog open', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('x'));
    const onClose = vi.fn();
    render(<ConfirmDelete title="Delete this?" warning="w" onConfirm={onConfirm} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('slugErrorFrom', () => {
  it('reads the 422 field error and the 409 message', () => {
    const msg = 'Use 3 to 60 lowercase letters, numbers and dashes, not starting or ending with a dash.';
    expect(slugErrorFrom(new ApiError(422, 'x', { error: { code: 'VALIDATION_ERROR', message: msg, field_errors: [{ field: 'config.slug', message: msg }] } }))).toBe(msg);
    expect(slugErrorFrom(new ApiError(409, 'x', { error: { code: 'SLUG_TAKEN', message: 'That page address is taken. Try another.', field_errors: [] } }))).toBe('That page address is taken. Try another.');
    expect(slugErrorFrom(new ApiError(500, 'x', {}))).toBeNull();
  });
});

const fakeTest = (over: Partial<SmokeTest> = {}): SmokeTest => ({
  id: 'e1', name: 'Same-day settlement', status: 'draft', slug: 'novapay-same-day', targetConversion: 10,
  metricType: 'email_signup', manualVisits: 0, manualSignups: 0, config: {}, ...over,
});

describe('SmokeBuilder', () => {
  const goToStep3 = () => {
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
  };

  it('pre-fills from the AI draft, shows the rationale, and saves nothing until Publish', () => {
    const api = { create: vi.fn(), publish: vi.fn() };
    render(<SmokeBuilder draft={draft} origin="http://localhost:3000" api={api} onCancel={vi.fn()} onDone={vi.fn()} notify={vi.fn()} />);
    expect((screen.getByLabelText('Hero headline') as HTMLInputElement).value).toBe('Get paid the same day');
    expect((screen.getByLabelText('CTA button text') as HTMLInputElement).value).toBe('Join the waitlist');
    expect(screen.getByText(/A signup shows demand\./)).toBeTruthy();
    goToStep3();
    expect((screen.getByLabelText('Page address') as HTMLInputElement).value).toBe('novapay-same-day');
    expect(api.create).not.toHaveBeenCalled();
  });

  it('sends the config keys plus slug, then PATCHes live, and links the assumption', async () => {
    const api = { create: vi.fn().mockResolvedValue(fakeTest()), publish: vi.fn().mockResolvedValue(fakeTest({ status: 'live' })) };
    const onDone = vi.fn();
    render(<SmokeBuilder draft={draft} origin="http://localhost:3000" api={api} onCancel={vi.fn()} onDone={onDone} notify={vi.fn()} />);
    goToStep3();
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const body = api.create.mock.calls[0][0];
    expect(Object.keys(body.config).sort()).toEqual(
      ['cta_text', 'headline', 'metric_type', 'post_signup_message', 'require_email', 'show_pricing', 'slug', 'subheadline', 'target_conversion']
    );
    expect(body.config.slug).toBe('novapay-same-day');
    expect(body.assumption_ids).toEqual(['a1']);
    expect(api.publish).toHaveBeenCalledWith('e1');
    expect(onDone.mock.calls[0][1]).toBe(true);
  });

  it('shows a taken slug under the field and stays on the builder', async () => {
    const taken = new ApiError(409, 'Conflict', { error: { code: 'SLUG_TAKEN', message: 'That page address is taken. Try another.', field_errors: [] } });
    const api = { create: vi.fn().mockRejectedValue(taken), publish: vi.fn() };
    const onDone = vi.fn();
    render(<SmokeBuilder draft={draft} origin="http://localhost:3000" api={api} onCancel={vi.fn()} onDone={onDone} notify={vi.fn()} />);
    goToStep3();
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'That page address is taken. Try another.');
    expect(onDone).not.toHaveBeenCalled();
    expect(api.publish).not.toHaveBeenCalled();
  });

  it('asks for an address before publishing without one', async () => {
    const api = { create: vi.fn(), publish: vi.fn() };
    render(<SmokeBuilder draft={null} origin="http://localhost:3000" api={api} onCancel={vi.fn()} onDone={vi.fn()} notify={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Test name'), { target: { value: 'Idea' } });
    goToStep3();
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Choose a page address to publish.');
    expect(api.create).not.toHaveBeenCalled();
  });
});

describe('SmokeResults', () => {
  const stats: SmokeTestStats = {
    experiment_id: 'e1', name: 'x', status: 'live', slug: 'novapay-same-day', visits: 3, signups: 1, cta_clicks: 1,
    preorder_clicks: 0, metric_type: 'email_signup', conversion: 33.3, target_conversion: 10, sample_needed: 100, verdict: null,
  };
  const makeApi = (s: SmokeTestStats = stats) => ({
    getStats: vi.fn().mockResolvedValue(s),
    getSignups: vi.fn().mockResolvedValue([{ email: 'funke@example.com', signed_up_at: '2026-10-19T19:59:32+00:00' }]),
    updateMetrics: vi.fn(),
    setStatus: vi.fn(),
  });

  it('shows the public url with copy/open, the sample progress and the waitlist', async () => {
    render(<SmokeResults test={fakeTest({ status: 'live' })} origin="http://localhost:3000" api={makeApi()} onBack={vi.fn()} onDelete={vi.fn()} notify={vi.fn()} />);
    expect((await screen.findByTestId('public-url')).textContent).toBe('http://localhost:3000/p/novapay-same-day');
    expect(screen.getByRole('button', { name: /Copy link/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Open page/ }).getAttribute('href')).toBe('http://localhost:3000/p/novapay-same-day');
    expect(screen.getByTestId('signal-banner').textContent).toBe('3 of 100 visitors so far');
    expect(await screen.findByText('funke@example.com')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Download CSV/ })).toBeTruthy();
    expect(screen.queryByText('Record your numbers')).toBeNull();
  });

  it('shows the server verdict banner once present', async () => {
    const api = makeApi({ ...stats, visits: 120, conversion: 12.5, verdict: 'validated' });
    render(<SmokeResults test={fakeTest({ status: 'live' })} origin="http://localhost:3000" api={api} onBack={vi.fn()} onDelete={vi.fn()} notify={vi.fn()} />);
    expect((await screen.findByTestId('signal-banner')).textContent).toBe('Signal: 12.5% conversion against your 10% bar → looks validated.');
  });

  it('keeps the hand-entered numbers form for a test with no hosted page', async () => {
    render(<SmokeResults test={fakeTest({ slug: '', status: 'live' })} origin="http://localhost:3000" api={makeApi({ ...stats, slug: null })} onBack={vi.fn()} onDelete={vi.fn()} notify={vi.fn()} />);
    expect(await screen.findByText('Record your numbers')).toBeTruthy();
    expect(screen.queryByTestId('public-url')).toBeNull();
  });
});
