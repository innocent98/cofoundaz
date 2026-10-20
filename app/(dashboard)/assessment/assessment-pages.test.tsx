import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import AssessmentStartPage from './page';
import AssessmentInProgressPage from './in-progress/page';
import AssessmentResultsPage from './results/page';
import AssessmentRunnerPage from './run/[id]/page';
import AssessmentLayout from './layout';
import { ToastProvider } from './ToastContext';

const push = vi.hoisted(() => vi.fn());
let pathname = '/assessment';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}));
vi.mock('@/components/shell-top-bar', () => ({ ShellTopBar: ({ title }: { title: string }) => <div data-testid="shell-top-bar">{title}</div> }));

let role: string | null = 'founder';
let workspaceName: string | null = 'NovaPay';
vi.mock('@/components/workspace-context', () => ({
  useWorkspace: () => ({ role, workspaceName, loading: false }),
}));

const refreshHealthScore = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useHealthScore', () => ({ refreshHealthScore }));

const api = vi.hoisted(() => ({
  fetchAssessmentList: vi.fn(),
  startAssessment: vi.fn(),
  getNextStep: vi.fn(),
  submitAnswerStep: vi.fn(),
  completeAssessment: vi.fn(),
  getAssessment: vi.fn(),
}));
vi.mock('@/lib/api/assessment', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/assessment')>('@/lib/api/assessment');
  return { ...actual, ...api };
});

const ID = '7e7286ef-d15f-4dc4-a76d-df4bbf35721d';
const completedRow = (over: Record<string, unknown> = {}) => ({
  id: ID,
  type: 'initial',
  status: 'completed',
  started_at: '2026-10-01T10:00:00Z',
  completed_at: '2026-10-02T10:00:00Z',
  overall_provisional: 80,
  stage_at_time: 'build',
  progress: null,
  ...over,
});
const inProgressRow = {
  id: 'b1b1b1b1-d15f-4dc4-a76d-df4bbf35721d',
  type: 'quarterly',
  status: 'in_progress',
  started_at: '2026-10-20T10:00:00Z',
  completed_at: null,
  overall_provisional: null,
  stage_at_time: null,
  progress: { answered: 4, remaining: 4, pct: 50 },
};

beforeEach(() => {
  vi.clearAllMocks();
  role = 'founder';
  workspaceName = 'NovaPay';
  pathname = '/assessment';
  api.fetchAssessmentList.mockResolvedValue({ items: [], quarterlyDue: false });
});

describe('Assessment layout (row 1)', () => {
  it('mounts the shared top bar titled Startup Assessment, with the In progress tab for founders', () => {
    render(<AssessmentLayout>x</AssessmentLayout>);
    expect(screen.getByTestId('shell-top-bar').textContent).toBe('Startup Assessment');
    expect(screen.getByRole('button', { name: 'In progress' })).toBeTruthy();
  });

  it('gives team members results and compare only', () => {
    role = 'team_member';
    render(<AssessmentLayout>x</AssessmentLayout>);
    expect(screen.queryByRole('button', { name: 'In progress' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Past results' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Compare' })).toBeTruthy();
  });
});

describe('Start page (rows 2, 3, 4, 7, 13)', () => {
  it('names the startup and offers Begin on first run', async () => {
    render(<AssessmentStartPage />);
    expect(screen.getByRole('heading', { name: "Let's calibrate NovaPay" })).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Begin' })).toBeTruthy();
  });

  it('offers "Start a check-in" once a result exists', async () => {
    api.fetchAssessmentList.mockResolvedValue({ items: [completedRow()], quarterlyDue: false });
    render(<AssessmentStartPage />);
    expect(await screen.findByRole('button', { name: 'Start a check-in' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Quarterly re-assessment due' })).toBeNull();
  });

  it('Begin starts and opens the runner', async () => {
    api.startAssessment.mockResolvedValue({ assessment_id: ID });
    render(<AssessmentStartPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Begin' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith(`/assessment/run/${ID}`));
  });

  it('shows "You\'re {pct}% through. Pick up where you left off." from progress', async () => {
    api.fetchAssessmentList.mockResolvedValue({ items: [inProgressRow, completedRow()], quarterlyDue: false });
    render(<AssessmentStartPage />);
    expect(await screen.findByText("You're 50% through. Pick up where you left off.")).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(push).toHaveBeenCalledWith('/assessment/in-progress');
  });

  it('shows the quarterly banner with "Start re-assessment" when meta.quarterly_due', async () => {
    api.fetchAssessmentList.mockResolvedValue({ items: [completedRow()], quarterlyDue: true });
    api.startAssessment.mockResolvedValue({ assessment_id: ID });
    render(<AssessmentStartPage />);
    const banner = await screen.findByRole('region', { name: 'Quarterly re-assessment due' });
    fireEvent.click(within(banner).getByRole('button', { name: 'Start re-assessment' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith(`/assessment/run/${ID}`));
  });

  it('is read-only for a team member: no start, resume, banner or in-progress card', async () => {
    role = 'team_member';
    api.fetchAssessmentList.mockResolvedValue({ items: [inProgressRow, completedRow()], quarterlyDue: true });
    render(<AssessmentStartPage />);
    expect(screen.getByText(/Only founders can take the assessment/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View past results' }).getAttribute('href')).toBe('/assessment/results');
    expect(screen.getByRole('link', { name: 'Compare' }).getAttribute('href')).toBe('/assessment/compare');
    await waitFor(() => expect(api.fetchAssessmentList).toHaveBeenCalled());
    for (const name of ['Begin', 'Start a check-in', 'Continue', 'Resume', 'Start re-assessment']) {
      expect(screen.queryByRole('button', { name })).toBeNull();
    }
    expect(screen.queryByText(/through\. Pick up/)).toBeNull();
  });
});

describe('In progress page (rows 4, 7)', () => {
  it('reads the percentage from the server progress', async () => {
    api.fetchAssessmentList.mockResolvedValue({ items: [inProgressRow], quarterlyDue: false });
    api.getNextStep.mockResolvedValue({
      question: { key: 'k', dimension: 'money', section: 'Money', qtype: 'scale_1_5', prompt: 'p', options: null, helper: null },
      progress: { answered: 5, remaining: 3, pct: 62 },
    });
    render(<AssessmentInProgressPage />);
    expect(await screen.findByRole('heading', { name: "You're 62% through." })).toBeTruthy();
    expect(screen.getByText('Pick up where you left off.')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('62');
    expect(api.fetchAssessmentList).toHaveBeenCalledWith('in_progress');
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(push).toHaveBeenCalledWith(`/assessment/run/${inProgressRow.id}`);
  });

  it('hides the in-progress card from team members', () => {
    role = 'team_member';
    render(<AssessmentInProgressPage />);
    expect(screen.getByRole('heading', { name: 'Only founders can take the assessment' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Resume' })).toBeNull();
  });
});

// React's use() reads a pre-resolved thenable synchronously, so no Suspense round trip is needed.
const params = Object.assign(Promise.resolve({ id: ID }), { status: 'fulfilled', value: { id: ID } }) as Promise<{ id: string }>;

const dims = ['product', 'market', 'money', 'legal', 'team'] as const;
function health(deltas: Array<number | null>, over: Record<string, unknown> = {}) {
  return {
    score: 95,
    previous_score: 88,
    delta: 7,
    dimensions: dims.map((key, i) => ({ key, score: 90 + i, previous: deltas[i] === null ? null : 90 + i - (deltas[i] as number), delta: deltas[i] })),
    ...over,
  };
}
function completion(over: Record<string, unknown> = {}) {
  return {
    assessment_id: ID,
    status: 'completed',
    dimension_scores: { product: 78, market: 75, money: 71, legal: 100, team: 75 },
    overall_provisional: 80,
    narrative: 'Your strongest area is legal (100). Focus next on money (71).',
    health: health([4, -3, 0, 7, 1]),
    ...over,
  };
}
async function renderRunner() {
  api.getNextStep.mockResolvedValue({ question: null, progress: { answered: 8, remaining: 0, pct: 100 } });
  render(
    <ToastProvider>
      <AssessmentRunnerPage params={params} />
    </ToastProvider>
  );
}

describe('Runner completion (rows 9, 10)', () => {
  it('says the Health Score and what changed, per dimension, and refreshes the header health', async () => {
    api.completeAssessment.mockResolvedValue(completion());
    await renderRunner();
    expect(await screen.findByRole('heading', { name: 'Your Health Score is now 95.' })).toBeTruthy();
    expect(screen.getByText("Here's what changed.")).toBeTruthy();
    expect(screen.getByTestId('health-delta').textContent).toBe('+7 from 88');
    expect(screen.getByLabelText('Product change +4')).toBeTruthy();
    expect(screen.getByLabelText('Market change -3')).toBeTruthy();
    expect(screen.getByLabelText('Money change 0')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'See my dashboard' })).toBeTruthy();
    expect(screen.getByText(/Your strongest area is legal/)).toBeTruthy();
    expect(refreshHealthScore).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'See my dashboard' }));
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('shows a drop honestly', async () => {
    api.completeAssessment.mockResolvedValue(
      completion({ health: health([-53, -37, -28, -100, -25], { score: 31, previous_score: 80, delta: -49 }) })
    );
    await renderRunner();
    expect((await screen.findByTestId('health-delta')).textContent).toBe('-49 from 80');
  });

  it('first completion has no deltas to show', async () => {
    api.completeAssessment.mockResolvedValue(
      completion({ health: health([null, null, null, null, null], { previous_score: null, delta: null }) })
    );
    await renderRunner();
    await screen.findByRole('heading', { name: 'Your Health Score is now 95.' });
    expect(screen.queryByTestId('health-delta')).toBeNull();
    expect(screen.queryByLabelText(/change/)).toBeNull();
  });

  it('drops the strongest/focus line when every score ties', async () => {
    api.completeAssessment.mockResolvedValue(
      completion({
        dimension_scores: { product: 100, market: 100, money: 100, legal: 100, team: 100 },
        narrative: 'Your strongest area is product (100). Focus next on product (100).',
      })
    );
    await renderRunner();
    await screen.findByRole('heading', { name: 'Your Health Score is now 95.' });
    expect(screen.queryByText(/strongest area/)).toBeNull();
  });

  it('a replayed complete (health null) neither claims a health score nor refreshes the header', async () => {
    api.completeAssessment.mockResolvedValue(completion({ health: null }));
    await renderRunner();
    expect(await screen.findByRole('heading', { name: 'Your assessment is complete.' })).toBeTruthy();
    expect(refreshHealthScore).not.toHaveBeenCalled();
  });
});

describe('Runner progress (row 7)', () => {
  it('drives the bar from server progress', async () => {
    api.getNextStep.mockResolvedValue({
      question: { key: 'k', dimension: 'market', section: 'Market', qtype: 'scale_1_5', prompt: 'How clear?', options: null, helper: null },
      progress: { answered: 3, remaining: 5, pct: 37 },
    });
    render(
      <ToastProvider>
        <AssessmentRunnerPage params={params} />
      </ToastProvider>
    );
    expect(await screen.findByText('How clear?')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('37');
    expect(screen.getByText('Section 2 of 5: Market')).toBeTruthy();
  });
});

describe('Results (rows 11, 12)', () => {
  const prev = completedRow({ id: 'c2c2c2c2-d15f-4dc4-a76d-df4bbf35721d', completed_at: '2026-07-02T10:00:00Z', stage_at_time: null, overall_provisional: 60 });
  const detail = (id: string, groups: unknown) => ({
    id,
    type: 'quarterly',
    status: 'completed',
    answers_by_dimension: {},
    answers: groups,
    result: {
      dimension_scores: { product: 25, market: 38, money: 43, legal: 0, team: 50 },
      overall_provisional: 31,
      narrative: 'n',
    },
  });

  it('shows "Stage at time" per row and "not recorded" for null', async () => {
    api.fetchAssessmentList.mockResolvedValue({ items: [completedRow(), prev], quarterlyDue: false });
    render(<AssessmentResultsPage />);
    await screen.findAllByText(/Stage at time:/);
    const rows = screen.getAllByText(/Stage at time:/);
    expect(rows[0].textContent).toBe('Stage at time: Build');
    expect(rows[1].textContent).toBe('Stage at time: not recorded');
  });

  it('groups answers by dimension and highlights changed ones with their old value', async () => {
    api.fetchAssessmentList.mockResolvedValue({ items: [completedRow(), prev], quarterlyDue: false });
    api.getAssessment.mockImplementation(async (id: string) =>
      detail(id, [
        {
          dimension: 'product',
          questions: [
            { question_key: 'product_stage', prompt: 'How far along is your product?', qtype: 'single_choice', value: 'idea', answer_label: 'Just an idea', changed: true, changed_from: 'Live with users' },
          ],
        },
        {
          dimension: 'market',
          questions: [
            { question_key: 'market_clarity', prompt: 'How clearly do you understand your target market?', qtype: 'scale_1_5', value: 3, answer_label: '3', changed: false, changed_from: null },
          ],
        },
      ])
    );
    render(<AssessmentResultsPage />);
    const toggles = await screen.findAllByRole('button', { expanded: false });
    fireEvent.click(toggles[0]);
    const productSection = await screen.findByRole('region', { name: 'Product answers' });
    expect(within(productSection).getByText('Just an idea')).toBeTruthy();
    expect(within(productSection).getByText('Changed from: Live with users')).toBeTruthy();
    expect(productSection.querySelector('[data-changed="true"]')).toBeTruthy();
    const marketSection = screen.getByRole('region', { name: 'Market answers' });
    expect(marketSection.querySelector('[data-changed="true"]')).toBeNull();
    expect(within(marketSection).queryByText(/Changed from/)).toBeNull();
    expect(screen.getByText('1 answer changed since your previous check-in.')).toBeTruthy();
  });

  it('does not claim changes for the very first assessment', async () => {
    api.fetchAssessmentList.mockResolvedValue({ items: [completedRow()], quarterlyDue: false });
    api.getAssessment.mockImplementation(async (id: string) =>
      detail(id, [
        { dimension: 'product', questions: [{ question_key: 'a', prompt: 'P?', qtype: 'single_choice', value: 'x', answer_label: 'X', changed: false, changed_from: null }] },
      ])
    );
    render(<AssessmentResultsPage />);
    fireEvent.click((await screen.findAllByRole('button', { expanded: false }))[0]);
    await screen.findByRole('region', { name: 'Product answers' });
    expect(screen.queryByText(/since your previous check-in/)).toBeNull();
  });
});
