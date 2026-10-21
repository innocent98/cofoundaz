import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { RisksCard, OpportunitiesCard, RISKS_EMPTY_COPY, OPPORTUNITIES_EMPTY_COPY } from './risks-opportunities';
import { ActivityCard, UpcomingCard, formatDueDate, initialsOf, ACTIVITY_EMPTY_COPY, ACTIVITY_MORE_ERROR_COPY } from './activity-upcoming';
import { HealthCard, HEALTH_PENDING_COPY } from './health-card';
import { CalibrationBanner, CALIBRATION_COPY } from './calibration-banner';
import { GreetingHeader, greetingFor, greetingLine } from './greeting-header';
import { CardError, CardSkeleton } from './card-states';
import { Sparkline } from './sparkline';

describe('Risks and Opportunities rows', () => {
  it('risk rows: severity dot, text, Review -> href; no link when href is null', () => {
    render(
      <RisksCard
        status="ready"
        loading={false}
        onRetry={vi.fn()}
        items={[
          { id: '0', severity: 'high', description: 'Runway is short.', moduleLink: '/finance' },
          { id: '1', severity: 'low', description: 'No tasks done.', moduleLink: null },
        ]}
      />,
    );
    expect(screen.getByText('Runway is short.')).toBeTruthy();
    const links = screen.getAllByRole('link', { name: 'Review' });
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('/finance');
  });

  it('empty risks and opportunities show the PRD copy', () => {
    render(
      <>
        <RisksCard status="ready" loading={false} onRetry={vi.fn()} items={[]} />
        <OpportunitiesCard status="empty" loading={false} onRetry={vi.fn()} items={[]} />
      </>,
    );
    expect(screen.getByText(RISKS_EMPTY_COPY)).toBeTruthy();
    expect(screen.getByText(OPPORTUNITIES_EMPTY_COPY)).toBeTruthy();
  });

  it('opportunity rows link to their module; generating shows the busy label', () => {
    const { unmount } = render(
      <OpportunitiesCard
        status="ready"
        loading={false}
        onRetry={vi.fn()}
        items={[{ id: '0', description: 'Add a validation task.', moduleLink: '/validation' }]}
      />,
    );
    expect(screen.getByRole('link', { name: 'See fit' }).getAttribute('href')).toBe('/validation');
    unmount();
    render(<RisksCard status="generating" loading={false} onRetry={vi.fn()} items={[]} />);
    expect(screen.getByText('Analyzing')).toBeTruthy();
  });

  it('loading is a skeleton; no status (summary failed) is the PRD error with Retry', () => {
    const onRetry = vi.fn();
    const { unmount } = render(<RisksCard status="ready" loading onRetry={onRetry} items={[]} />);
    expect(screen.getByRole('status', { name: 'Loading Risks' })).toBeTruthy();
    unmount();
    render(<RisksCard status={undefined} loading={false} onRetry={onRetry} items={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /Retry/ }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('Team activity and Next 7 days', () => {
  const entry = (over = {}) => ({
    id: '1',
    actor: 'Victor Founder',
    summary: "Victor Founder added 'X' to today's mission",
    verb: '',
    entity: '',
    timestamp: '',
    relativeTime: '2h ago',
    ...over,
  });

  it('rows read "{summary} · {time}" with initials; empty copy when none', () => {
    const { unmount } = render(<ActivityCard items={[entry()]} loading={false} error={false} onRetry={vi.fn()} />);
    expect(screen.getByText("Victor Founder added 'X' to today's mission")).toBeTruthy();
    expect(screen.getByText('2h ago')).toBeTruthy();
    expect(screen.getByText('VF')).toBeTruthy();
    unmount();
    render(<ActivityCard items={[]} loading={false} error={false} onRetry={vi.fn()} />);
    expect(screen.getByText(ACTIVITY_EMPTY_COPY)).toBeTruthy();
  });

  it('a failed feed errors on its own with Retry', () => {
    const onRetry = vi.fn();
    render(<ActivityCard items={[]} loading={false} error onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /Retry/ }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('Load more shows only with more rows, disables while loading, and offers an inline retry on error', () => {
    const onLoadMore = vi.fn();
    const base = { items: [entry()], loading: false, error: false, onRetry: vi.fn(), onLoadMore };
    const { rerender } = render(<ActivityCard {...base} hasMore={false} />);
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();

    rerender(<ActivityCard {...base} hasMore />);
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rerender(<ActivityCard {...base} hasMore loadingMore />);
    const busy = screen.getByRole('button', { name: 'Loading...' }) as HTMLButtonElement;
    expect(busy.disabled).toBe(true);

    rerender(<ActivityCard {...base} hasMore moreError />);
    expect(screen.getByText(ACTIVITY_MORE_ERROR_COPY)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onLoadMore).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Victor Founder added 'X' to today's mission")).toBeTruthy();
  });

  it('upcoming rows show the due date and link to the roadmap', () => {
    render(
      <UpcomingCard
        loading={false}
        error={false}
        onRetry={vi.fn()}
        items={[{ id: '9797', title: 'Write your problem statement', dueOn: '2026-10-24' }]}
      />,
    );
    expect(screen.getByText('Due Oct 24, 2026')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Write your problem statement/ }).getAttribute('href')).toBe('/roadmap/milestones');
  });

  it('upcoming empty copy', () => {
    render(<UpcomingCard loading={false} error={false} onRetry={vi.fn()} items={[]} />);
    expect(screen.getByText('Nothing scheduled in the next 7 days.')).toBeTruthy();
  });

  it('formatDueDate is timezone-proof and tolerates a missing date; initialsOf handles one name', () => {
    expect(formatDueDate('2026-01-01')).toBe('Jan 1, 2026');
    expect(formatDueDate(null)).toBeNull();
    expect(formatDueDate('garbage')).toBeNull();
    expect(initialsOf('Amara')).toBe('AM');
    expect(initialsOf('Ada Lovelace Byron')).toBe('AB');
  });
});

describe('HealthCard', () => {
  it('scored: shows the score, weekly delta, and links to /health', async () => {
    render(
      <HealthCard
        loading={false}
        onRetry={vi.fn()}
        health={{ score: 93, deltaWeekly: 3, status: 'ok', summary: 'Your Health Score is 93.' }}
      />,
    );
    expect(await screen.findByText('93')).toBeTruthy();
    expect(screen.getByText('+3 this week')).toBeTruthy();
    expect(screen.getByRole('link', { name: /See what's driving it/ }).getAttribute('href')).toBe('/health');
  });

  it('pending assessment: never a fake 0; points to the assessment', () => {
    render(<HealthCard loading={false} onRetry={vi.fn()} health={{ score: 0, deltaWeekly: 0, status: 'pending_assessment' }} />);
    expect(screen.getByText(HEALTH_PENDING_COPY)).toBeTruthy();
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.getByRole('link', { name: /Start the assessment/ }).getAttribute('href')).toBe('/assessment');
  });

  it('skeleton while loading (not a 0 gauge) and error + Retry', () => {
    const { unmount } = render(<HealthCard loading onRetry={vi.fn()} health={undefined} />);
    expect(screen.getByRole('status', { name: 'Loading Startup Health' })).toBeTruthy();
    expect(screen.queryByText('of 100')).toBeNull();
    unmount();
    const onRetry = vi.fn();
    render(<HealthCard loading={false} onRetry={onRetry} health={{ score: 0, deltaWeekly: 0, error: true }} />);
    fireEvent.click(screen.getByRole('button', { name: /Retry/ }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('CalibrationBanner (PRD 01.6)', () => {
  it('shows the PRD copy and Complete assessment only when the assessment is explicitly incomplete', () => {
    const { unmount } = render(<CalibrationBanner assessmentComplete={false} />);
    expect(screen.getByText(CALIBRATION_COPY)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Complete assessment' }).getAttribute('href')).toBe('/assessment');
    unmount();
    const { container } = render(<CalibrationBanner assessmentComplete={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('unknown (errored or missing) calibration does not nag', () => {
    const { container } = render(<CalibrationBanner assessmentComplete={undefined} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('Greeting', () => {
  it('"Good evening, Victor." and an empty first_name gives "Good evening." (never "Good evening, .")', () => {
    expect(greetingLine('Good evening', 'Victor')).toBe('Good evening, Victor.');
    expect(greetingLine('Good evening', '')).toBe('Good evening.');
    expect(greetingLine('Good evening', null)).toBe('Good evening.');
    expect(greetingLine('Good evening', '   ')).toBe('Good evening.');
  });

  it('picks the salutation by hour', () => {
    expect(greetingFor(6)).toBe('Good morning');
    expect(greetingFor(13)).toBe('Good afternoon');
    expect(greetingFor(21)).toBe('Good evening');
  });

  it('renders the startup line, with a neutral fallback instead of a made-up name', () => {
    const now = new Date('2026-10-17T21:00:00');
    const { unmount } = render(<GreetingHeader firstName="" startupName="NovaPay" now={now} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Good evening.');
    expect(screen.getByText("Here's where NovaPay stands today.")).toBeTruthy();
    unmount();
    render(<GreetingHeader firstName="Victor" startupName={null} now={now} />);
    expect(screen.getByText("Here's where your startup stands today.")).toBeTruthy();
  });
});

describe('card states and sparkline', () => {
  it('CardError uses the PRD copy and calls Retry', () => {
    const onRetry = vi.fn();
    render(<CardError title="Risks" onRetry={onRetry} />);
    expect(screen.getByText('Couldn’t load this.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading Risks' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('CardSkeleton is announced', () => {
    render(<CardSkeleton label="Loading X" />);
    expect(screen.getByRole('status', { name: 'Loading X' })).toBeTruthy();
  });

  it('Sparkline needs two points', () => {
    const { container, rerender } = render(<Sparkline values={[1]} />);
    expect(container.querySelector('svg')).toBeNull();
    rerender(<Sparkline values={[4, 1.5, 2]} />);
    expect(container.querySelector('polyline')).toBeTruthy();
    rerender(<Sparkline values={[3, 3]} />);
    expect(container.querySelector('polyline')).toBeTruthy();
  });
});
