import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { KPIStrip } from './kpi-strip';
import { mapKpis } from '@/hooks/useDashboardApi';

const base = { tasks_done_this_week: 2 };
const pipeline = { status: 'not_built', value_minor: null, currency: null };
const emptyMetrics = {
  revenue: { status: 'no_data', value_minor: null, currency: null },
  runway: { status: 'no_data', months: null, is_low: false, currency: null },
  pipeline,
  campaign_ctr: { status: 'no_data', ctr_percent: null, impressions: null, clicks: null },
};

function renderStrip(kpis: unknown) {
  return render(<KPIStrip kpis={mapKpis(kpis)} onRefetch={vi.fn()} />);
}

describe('KPIStrip', () => {
  it('no_data tiles show an empty state and a CTA link into the module; only pipeline says Coming Soon', () => {
    renderStrip({ ...base, metrics: emptyMetrics });
    expect(screen.getAllByText('No data yet')).toHaveLength(3);
    expect(screen.getAllByText('Coming Soon')).toHaveLength(1);
    expect(screen.queryByText(/₦0/)).toBeNull();
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/finance', '/finance', '/sales', '/marketing', '/mission']);
    expect(screen.getByText('Open Marketing')).toBeTruthy();
  });

  it('ok values render in naira with the honest revenue hint', () => {
    renderStrip({
      ...base,
      metrics: {
        revenue: { status: 'ok', value_minor: 1000000, currency: 'NGN' },
        runway: { status: 'ok', months: 27.0, is_low: false, currency: 'NGN' },
        pipeline,
        campaign_ctr: { status: 'ok', ctr_percent: 2.5, impressions: 2000, clicks: 50 },
      },
    });
    expect(screen.getByText('₦10.0K')).toBeTruthy();
    expect(screen.getByText('Avg. monthly money in, last 3 months')).toBeTruthy();
    expect(screen.getByText('27 mo')).toBeTruthy();
    expect(screen.getByText('2.5%')).toBeTruthy();
  });

  it('out_of_cash and is_low render the alert border; healthy runway does not', () => {
    const { container, unmount } = renderStrip({
      ...base,
      metrics: { ...emptyMetrics, runway: { status: 'out_of_cash', months: 0, is_low: true } },
    });
    expect(screen.getByText('Out of cash')).toBeTruthy();
    expect(container.querySelectorAll('a.border-danger-600')).toHaveLength(1);
    unmount();

    const low = renderStrip({
      ...base,
      metrics: { ...emptyMetrics, runway: { status: 'ok', months: 4.2, is_low: true } },
    });
    expect(low.container.querySelectorAll('a.border-danger-600')).toHaveLength(1);
    low.unmount();

    const fine = renderStrip({
      ...base,
      metrics: { ...emptyMetrics, runway: { status: 'not_burning', months: null, is_low: false } },
    });
    expect(screen.getByText('Not burning')).toBeTruthy();
    expect(fine.container.querySelectorAll('a.border-danger-600')).toHaveLength(0);
  });

  it('restricted tiles are hidden and the grid reflows', () => {
    const { container } = renderStrip({
      ...base,
      metrics: {
        revenue: { status: 'restricted' },
        runway: { status: 'restricted', is_low: false },
        pipeline,
        campaign_ctr: { status: 'restricted' },
      },
    });
    expect(screen.queryByText('Monthly Revenue')).toBeNull();
    expect(screen.queryByText('Runway')).toBeNull();
    expect(screen.getByText('Pipeline Value')).toBeTruthy();
    expect(screen.getByText('Tasks This Week')).toBeTruthy();
    expect(container.querySelector('section')?.className).toContain('xl:grid-cols-2');
  });

  it('a role that cannot open /sales gets the Pipeline tile without a link; others keep it', () => {
    const { unmount } = render(<KPIStrip kpis={mapKpis({ ...base, metrics: emptyMetrics })} onRefetch={vi.fn()} role="mentor" />);
    expect(screen.getByText('Pipeline Value')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Pipeline Value/ })).toBeNull();
    unmount();
    render(<KPIStrip kpis={mapKpis({ ...base, metrics: emptyMetrics })} onRefetch={vi.fn()} role="founder" />);
    expect(screen.getByRole('link', { name: /Pipeline Value/ }).getAttribute('href')).toBe('/sales');
  });

  it('missionRestricted drops the Tasks tile (it counts mission tasks)', () => {
    render(<KPIStrip kpis={mapKpis({ ...base, metrics: emptyMetrics })} onRefetch={vi.fn()} role="mentor" missionRestricted />);
    expect(screen.queryByText('Tasks This Week')).toBeNull();
  });

  it('a per-tile error shows the PRD error copy + Retry for that tile only', () => {
    const onRefetch = vi.fn();
    render(
      <KPIStrip
        kpis={mapKpis({ ...base, metrics: { ...emptyMetrics, campaign_ctr: { error: true } } })}
        onRefetch={onRefetch}
      />,
    );
    expect(screen.getAllByText('Couldn’t load this.')).toHaveLength(1);
    fireEvent.click(screen.getByText('Retry'));
    expect(onRefetch).toHaveBeenCalled();
  });

  it('shows the week-over-week chip and a sparkline from trend (runway capture), red when it fell', () => {
    renderStrip({
      ...base,
      tasks_trend: { delta: 1, series: [{ period: '2026-10-16', value: 0 }, { period: '2026-10-17', value: 1 }] },
      metrics: {
        ...emptyMetrics,
        runway: {
          status: 'ok',
          months: 1.5,
          is_low: true,
          monthly_burn_minor: 2000000,
          cash_on_hand_minor: 3000000,
          currency: 'NGN',
          trend: { delta: -2.5, series: [{ period: '2026-10-16', value: 4.0 }, { period: '2026-10-17', value: 1.5 }] },
        },
      },
    });
    expect(screen.getByText('-2.5 mo vs last week').className).toContain('text-danger-deep');
    expect(screen.getByText('+1 vs last week').className).toContain('text-brand-900');
    expect(screen.getAllByRole('img', { name: /Trend over the last 2 days/ })).toHaveLength(2);
  });

  it('no chip and no sparkline while there is no history (first week)', () => {
    renderStrip({
      ...base,
      tasks_trend: { delta: null, series: [{ period: '2026-10-17', value: 0 }] },
      metrics: emptyMetrics,
    });
    expect(screen.queryByText(/vs last week/)).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
  });
});
