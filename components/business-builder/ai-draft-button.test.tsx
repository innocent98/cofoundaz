import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const api = vi.hoisted(() => ({ aiFillCanvas: vi.fn() }));
const client = vi.hoisted(() => ({ apiClient: vi.fn() }));
const wait = vi.hoisted(() => ({ waitForJob: vi.fn() }));
vi.mock('@/lib/api/business-builder', () => ({ businessBuilderApi: api }));
vi.mock('@/lib/api/client', () => client);
vi.mock('@/lib/api/bb-jobs', () => wait);
vi.mock('@/hooks/useBuilderAccess', () => ({ useBuilderAccess: () => ({ canEdit: true }) }));
vi.mock('@/hooks/useAiStatus', () => ({ useAiStatus: () => ({ isOverBudget: false, formattedResetsAt: '' }) }));

import { AiDraftButton } from './ai-draft-button';
import { outcomeFromResult, OVER_BUDGET_MESSAGE } from '@/hooks/useBusinessAiFill';

const CANVAS_MSG = 'Every section already has content. Use the AI button on a section to add ideas.';
const RECORDS_MSG = 'Your list already has entries. Add more by hand, or use the AI buttons on a record.';

async function runCanvas(result: unknown) {
  api.aiFillCanvas.mockResolvedValue({ job_id: 'j1' });
  wait.waitForJob.mockResolvedValue({ state: 'succeeded', result });
  const onFilled = vi.fn();
  render(<AiDraftButton canvasType="value_prop" label="Fill with AI" onFilled={onFilled} />);
  await userEvent.click(screen.getByRole('button', { name: /Fill with AI/ }));
  await userEvent.click(await screen.findByRole('button', { name: 'Draft it' }));
  return onFilled;
}

async function runRecords(result: unknown) {
  client.apiClient.mockResolvedValue({ data: { job_id: 'j2' } });
  wait.waitForJob.mockResolvedValue({ state: 'succeeded', result });
  const onFilled = vi.fn();
  render(<AiDraftButton kind="competitors" label="Draft with AI" onFilled={onFilled} />);
  await userEvent.click(screen.getByRole('button', { name: /Draft with AI/ }));
  await userEvent.click(await screen.findByRole('button', { name: 'Draft it' }));
  return onFilled;
}

beforeEach(() => vi.clearAllMocks());

describe('AiDraftButton honest messages', () => {
  it('canvas ready: "AI draft added" and a refetch', async () => {
    const onFilled = await runCanvas({ status: 'ready', filled: ['problem'] });
    expect(await screen.findByText('AI draft added')).toBeTruthy();
    expect(onFilled).toHaveBeenCalled();
  });

  it('canvas nothing_new: says every section already has content, no refetch, no "added"', async () => {
    const onFilled = await runCanvas({ status: 'nothing_new', filled: [] });
    expect(await screen.findByText(CANVAS_MSG)).toBeTruthy();
    expect(screen.queryByText('AI draft added')).toBeNull();
    expect(onFilled).not.toHaveBeenCalled();
  });

  it('records nothing_new: says the list already has entries', async () => {
    await runRecords({ status: 'nothing_new', added: 0 });
    expect(await screen.findByText(RECORDS_MSG)).toBeTruthy();
    expect(screen.queryByText('AI draft added')).toBeNull();
  });

  it('records ready keeps "AI draft added"', async () => {
    const onFilled = await runRecords({ status: 'ready', added: 3 });
    expect(await screen.findByText('AI draft added')).toBeTruthy();
    expect(onFilled).toHaveBeenCalled();
  });

  it('over_budget shows the daily-limit copy', async () => {
    await runCanvas({ status: 'over_budget', filled: [] });
    expect(await screen.findByText(OVER_BUDGET_MESSAGE)).toBeTruthy();
    expect(screen.queryByText('AI draft added')).toBeNull();
  });

  it('a job with no result (older API) keeps today’s behaviour', async () => {
    const onFilled = await runCanvas(null);
    await waitFor(() => expect(screen.getByText('AI draft added')).toBeTruthy());
    expect(onFilled).toHaveBeenCalled();
  });
});

describe('outcomeFromResult', () => {
  it('maps statuses per fill kind', () => {
    expect(outcomeFromResult({ status: 'nothing_new' }, 'records')).toMatchObject({ ok: true, status: 'skipped', message: RECORDS_MSG });
    expect(outcomeFromResult({ status: 'nothing_new' }, 'canvas')).toMatchObject({ message: CANVAS_MSG });
    expect(outcomeFromResult(undefined)).toEqual({ ok: true, status: 'succeeded' });
    expect(outcomeFromResult({ status: 'over_budget' })).toEqual({ ok: false, error: OVER_BUDGET_MESSAGE });
  });
});
