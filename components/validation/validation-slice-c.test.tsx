import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { FeedbackInbox } from './FeedbackInbox';
import { FeedbackThemes } from './FeedbackThemes';
import { SurveyAnswersPanel } from './SurveyAnswersPanel';
import { ShareLinkCard } from './ShareLinkCard';
import type { FeedbackItem, FeedbackThemes as ThemeSet, FeedbackTheme } from '@/lib/api/validation';

vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,AAAA') } }));

beforeEach(() => vi.clearAllMocks());

const item = (over: Partial<FeedbackItem>): FeedbackItem => ({
  id: 'i1',
  source: 'in_app',
  text: 'The app froze',
  origin: { type: 'manual', id: null, label: 'Added by hand' },
  imported: false,
  dismissed: false,
  received_on: '2026-10-19',
  created_at: '2026-10-19T10:00:00Z',
  ...over,
});
const imported = item({
  id: 'i2',
  source: 'interview',
  text: 'I wait three days for my money',
  origin: { type: 'interview', id: 'iv1', label: 'Interview, Market traders' },
  imported: true,
});
const counts = { interview: 1, survey: 0, in_app: 1, email: 0 };

function renderInbox(over: Partial<React.ComponentProps<typeof FeedbackInbox>> = {}) {
  const props: React.ComponentProps<typeof FeedbackInbox> = {
    items: [item({}), imported],
    counts,
    loading: false,
    error: null,
    showDismissed: false,
    onShowDismissed: vi.fn(),
    onRetry: vi.fn(),
    onAdd: vi.fn().mockResolvedValue(undefined),
    onEdit: vi.fn().mockResolvedValue(undefined),
    onRemove: vi.fn().mockResolvedValue('deleted'),
    onRestore: vi.fn().mockResolvedValue(undefined),
    notify: vi.fn(),
    ...over,
  };
  render(<FeedbackInbox {...props} />);
  return props;
}

describe('FeedbackInbox', () => {
  it('shows counts per source and filters by tab', () => {
    renderInbox();
    expect(screen.getByRole('tab', { name: /^All 2/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Interview 1/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /^Interview/ }));
    expect(screen.getByText('I wait three days for my money')).toBeInTheDocument();
    expect(screen.queryByText('The app froze')).not.toBeInTheDocument();
  });

  it('imported items are read-only with Dismiss; manual items have Edit and Delete', async () => {
    const props = renderInbox();
    expect(screen.queryByLabelText('Edit: I wait three days for my money')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Delete: I wait three days for my money')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Edit: The app froze')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Dismiss: I wait three days for my money'));
    await waitFor(() => expect(props.onRemove).toHaveBeenCalledWith('i2'));
    expect(props.onRemove).toHaveBeenCalledTimes(1);
  });

  it('confirms before deleting a manual item', async () => {
    const props = renderInbox();
    fireEvent.click(screen.getByLabelText('Delete: The app froze'));
    expect(props.onRemove).not.toHaveBeenCalled();
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(props.onRemove).toHaveBeenCalledWith('i1'));
  });

  it('offers Restore on a dismissed item and the dismissed toggle', async () => {
    const props = renderInbox({ items: [{ ...imported, dismissed: true }], showDismissed: true });
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    await waitFor(() => expect(props.onRestore).toHaveBeenCalledWith('i2'));
    fireEvent.click(screen.getByRole('button', { name: 'Hide dismissed' }));
    expect(props.onShowDismissed).toHaveBeenCalledWith(false);
  });

  it('adds a manual entry with source and date, and rejects blank text', async () => {
    const props = renderInbox();
    fireEvent.click(screen.getByRole('button', { name: 'Add feedback' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add feedback' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Write what the customer said.');
    expect(props.onAdd).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText('What did they say?'), { target: { value: 'Please add USSD' } });
    fireEvent.change(within(dialog).getByLabelText('Where from'), { target: { value: 'email' } });
    fireEvent.change(within(dialog).getByLabelText('Date'), { target: { value: '2026-10-18' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add feedback' }));
    await waitFor(() =>
      expect(props.onAdd).toHaveBeenCalledWith({ text: 'Please add USSD', source: 'email', received_on: '2026-10-18' })
    );
  });

  it('edits a manual entry and offers no survey source', async () => {
    const props = renderInbox();
    fireEvent.click(screen.getByLabelText('Edit: The app froze'));
    const dialog = screen.getByRole('dialog');
    const options = within(dialog).getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['Interview', 'In-app', 'Email']);
    fireEvent.change(within(dialog).getByLabelText('What did they say?'), { target: { value: 'The app froze on withdraw' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    await waitFor(() =>
      expect(props.onEdit).toHaveBeenCalledWith('i1', { text: 'The app froze on withdraw', source: 'in_app', received_on: '2026-10-19' })
    );
  });

  it('shows the empty state with no feedback at all', () => {
    renderInbox({ items: [], counts: { interview: 0, survey: 0, in_app: 0, email: 0 } });
    expect(screen.getByTestId('feedback-empty')).toHaveTextContent('No feedback yet');
  });
});

const theme = (over: Partial<FeedbackTheme> = {}): FeedbackTheme => ({
  id: 't1',
  theme: 'Slow Payouts',
  label: 'Slow Payouts mentioned 4\u00d7 across 3 sources',
  summary: 'Customers need faster access to funds.',
  mention_count: 4,
  source_count: 3,
  sources: ['email', 'interview', 'survey'],
  items: [item({ id: 'q1', text: 'Settlement takes too long' })],
  roadmap_task_id: null,
  sent_at: null,
  ...over,
});
const set = (themes: FeedbackTheme[]): ThemeSet => ({
  run: { id: 'r1', item_count: 10, created_at: '2026-10-19T21:58:30Z' },
  themes,
});
const milestones = [
  { id: 'm0', title: 'Done one', done: true, taskIds: [] },
  { id: 'm1', title: 'Validate demand', done: false, taskIds: ['task9'] },
  { id: 'm2', title: 'Build MVP', done: false, taskIds: [] },
];

describe('FeedbackThemes', () => {
  it('titles the card with the label, labels it AI, and drills into quotes', async () => {
    render(<FeedbackThemes set={set([theme()])} clustering={false} message={null} loadMilestones={async () => milestones} onSend={vi.fn()} />);
    expect(screen.getByText('Slow Payouts mentioned 4\u00d7 across 3 sources')).toBeInTheDocument();
    expect(screen.getByText(/AI-generated/)).toBeInTheDocument();
    expect(screen.queryByText(/Settlement takes too long/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Show 1 quote/ }));
    expect(screen.getByText(/Settlement takes too long/)).toBeInTheDocument();
  });

  it('renders model text as plain text, never HTML', () => {
    render(
      <FeedbackThemes
        set={set([theme({ summary: '<img src=x onerror=alert(1)> bad' })])}
        clustering={false}
        message={null}
        loadMilestones={async () => milestones}
        onSend={vi.fn()}
      />
    );
    expect(screen.getByText(/<img src=x onerror=alert\(1\)> bad/)).toBeInTheDocument();
    expect(document.querySelector('img[src="x"]')).toBeNull();
  });

  it('sends to the first open milestone by default, then shows where it landed', async () => {
    const onSend = vi.fn().mockResolvedValue({ ok: true, milestoneTitle: 'Validate demand' });
    render(<FeedbackThemes set={set([theme()])} clustering={false} message={null} loadMilestones={async () => milestones} onSend={onSend} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send to roadmap' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Send to roadmap' }));
    const picker = screen.getByLabelText('Add it to which milestone?') as HTMLSelectElement;
    expect(picker.value).toBe('m1');
    expect(within(picker).queryByText('Done one')).not.toBeInTheDocument();
    fireEvent.change(picker, { target: { value: 'm2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add to roadmap' }));
    await waitFor(() => expect(onSend).toHaveBeenCalledWith('t1', 'm2'));
    expect(await screen.findByTestId('on-roadmap')).toHaveTextContent('On your roadmap: Validate demand');
    expect(screen.queryByRole('button', { name: 'Send to roadmap' })).not.toBeInTheDocument();
  });

  it('shows the milestone of an already-sent theme and shows server errors inline', async () => {
    render(
      <FeedbackThemes
        set={set([theme({ roadmap_task_id: 'task9', sent_at: '2026-10-19T22:00:00Z' })])}
        clustering={false}
        message={null}
        loadMilestones={async () => milestones}
        onSend={vi.fn()}
      />
    );
    await waitFor(() => expect(screen.getByTestId('on-roadmap')).toHaveTextContent('On your roadmap: Validate demand'));
  });

  it('shows a 422 message from the server', async () => {
    const onSend = vi.fn().mockResolvedValue({ ok: false, kind: 'no_milestone', message: 'Your roadmap has no open milestone to add this to. Add one on the Roadmap first.' });
    render(<FeedbackThemes set={set([theme()])} clustering={false} message={null} loadMilestones={() => Promise.reject(new Error('x'))} onSend={onSend} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send to roadmap' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add to roadmap' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('no open milestone');
  });

  it('blocks sending when the roadmap has no open milestone', async () => {
    render(
      <FeedbackThemes set={set([theme()])} clustering={false} message={null} loadMilestones={async () => [milestones[0]]} onSend={vi.fn()} />
    );
    expect(await screen.findByText(/has no open milestone/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send to roadmap' })).toBeDisabled();
  });

  it('shows the empty, working and message states', () => {
    const { rerender } = render(
      <FeedbackThemes set={{ run: null, themes: [] }} clustering={false} message={null} loadMilestones={async () => []} onSend={vi.fn()} />
    );
    expect(screen.getByText(/No themes yet/)).toBeInTheDocument();
    rerender(<FeedbackThemes set={{ run: null, themes: [] }} clustering message={null} loadMilestones={async () => []} onSend={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Reading every note');
    rerender(
      <FeedbackThemes set={{ run: null, themes: [] }} clustering={false} message="AI is at its daily limit, try again tomorrow." loadMilestones={async () => []} onSend={vi.fn()} />
    );
    expect(screen.getByTestId('themes-message')).toHaveTextContent('daily limit');
  });
});

describe('SurveyAnswersPanel', () => {
  it('lists answers per open question as plain text and notes truncation', () => {
    render(
      <SurveyAnswersPanel
        loading={false}
        error={null}
        answers={{
          survey_id: 's1',
          title: 'Payouts',
          questions: [
            { id: 'q1', prompt: 'What frustrates you?', answer_count: 600, answers: [{ text: '<b>slow</b>', submitted_at: '2026-10-19T21:57:25Z' }] },
          ],
        }}
      />
    );
    expect(screen.getByText('What frustrates you?')).toBeInTheDocument();
    expect(screen.getByText('<b>slow</b>')).toBeInTheDocument();
    expect(screen.getByText('Showing the newest 1 of 600.')).toBeInTheDocument();
  });

  it('handles the loading, error and no-open-question states', () => {
    const { rerender } = render(<SurveyAnswersPanel loading answers={null} error={null} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    rerender(<SurveyAnswersPanel loading={false} answers={null} error="Could not load the answers. Try again." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load');
    rerender(<SurveyAnswersPanel loading={false} error={null} answers={{ survey_id: 's', title: 't', questions: [] }} />);
    expect(screen.getByText('This survey has no open-text questions.')).toBeInTheDocument();
  });
});

describe('ShareLinkCard', () => {
  it('shows the link and a QR code, and copies the link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const onCopied = vi.fn();
    render(<ShareLinkCard url="http://localhost:3000/s/tok" onCopied={onCopied} />);
    expect(screen.getByTestId('share-url')).toHaveTextContent('http://localhost:3000/s/tok');
    expect(await screen.findByAltText('QR code for the survey link')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('http://localhost:3000/s/tok'));
    expect(onCopied).toHaveBeenCalled();
  });
});
