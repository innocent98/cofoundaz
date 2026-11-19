import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { ApiError } from '@/lib/api/client';
import type { Catalog, ExportRow } from '@/lib/api/analytics';
import {
  accountantRunResults,
  downloadExpired410,
  exportListEnvelope,
  founderRunAsMentor,
  getExpired,
  getMentor,
  patchStale409,
  patchedReport,
  reportPdfReady,
  reportPdfStart,
  runsList,
} from './__fixtures__/captures';

// Render and flow tests for the review's must-haves, fed with the API guides' CAPTURED bodies
// (./__fixtures__/captures.ts). A regression that shows a number on a locked block, swallows the
// 409, leaves an expired export saying "Ready", polls forever, or lets a denied role call Analytics
// fails here, not only in a live walk.

const ws = vi.hoisted(() => ({ role: 'founder' as string }));
const nav = vi.hoisted(() => ({ params: { id: 'x' } as Record<string, string>, pathname: '/analytics-reports' }));
const api = vi.hoisted(() => ({
  getReport: vi.fn(),
  listRuns: vi.fn(),
  getRun: vi.fn(),
  getCatalog: vi.fn(),
  patchReport: vi.fn(),
  listExports: vi.fn(),
  getExport: vi.fn(),
  downloadExport: vi.fn(),
  getOverview: vi.fn(),
  getByHub: vi.fn(),
  listCustomMetrics: vi.fn(),
  listTemplates: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: () => nav.params,
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/components/workspace-context', () => ({ useWorkspace: () => ({ role: ws.role, loading: false }) }));
vi.mock('./ToastContext', () => ({ useToast: () => ({ triggerToast: vi.fn() }) }));
vi.mock('@/hooks/useHealthDetails', () => ({ useHealthBenchmarks: () => ({ benchmarks: null, loading: false, error: null, refetch: vi.fn() }) }));
vi.mock('@/lib/api/analytics', async (orig) => ({ ...(await orig<typeof import('@/lib/api/analytics')>()), ...api }));
// recharts needs layout; the table alternative is what these tests read.
vi.mock('recharts', async (orig) => {
  const real = await orig<typeof import('recharts')>();
  return { ...real, ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div> };
});

import ReportDetailPage from './saved/[id]/page';
import BuilderPage from './builder/[id]/page';
import ExportsPage from './exports/page';
import AnalyticsOverviewPage from './page';
import { RunResults } from './_components/run-view';
import { RouteGuard } from '@/components/route-guard';
import { useExportWatch } from '@/hooks/useExportWatch';

beforeEach(() => {
  ws.role = 'founder';
  nav.pathname = '/analytics-reports';
  for (const fn of Object.values(api)) fn.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('(a) locked blocks never show a number', () => {
  it('accountant_run: the Marketing block is a lock tile; Revenue shows', () => {
    render(<RunResults results={accountantRunResults} />);
    expect(screen.getByText('Marketing access needed')).toBeInTheDocument();
    expect(screen.queryByText('Marketing metrics')).toBeNull();
    expect(screen.queryByText('Clicks')).toBeNull();
    expect(screen.getAllByText('₦5,000').length).toBeGreaterThan(0); // card + chart table
  });

  it('get_mentor + founder_run_as_mentor: the mentor sees the Finance lock and no money at all', async () => {
    ws.role = 'mentor';
    nav.params = { id: getMentor.id };
    api.getReport.mockResolvedValue(getMentor);
    api.listRuns.mockResolvedValue(runsList);
    api.getRun.mockResolvedValue(founderRunAsMentor);
    const { container } = render(<ReportDetailPage />);
    // Wait for the frozen run itself (before it loads, the page lists the locked blocks as tiles).
    expect(await screen.findByText('Clicks')).toBeInTheDocument();
    expect(screen.getByText('Finance access needed')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/₦|Revenue|Finance ledger/);
    // A mentor gets no Run, Edit, Share or Export controls.
    expect(screen.queryByRole('button', { name: /Run now/ })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Export/ })).toBeNull();
    // ...and no link into Marketing, which a mentor's role can't open.
    expect(screen.queryByRole('link', { name: /Open Marketing/ })).toBeNull();
  });
});

describe('(b) 409 VERSION_CONFLICT on save', () => {
  it('patch_stale_409 shows the reload banner and is not retried', async () => {
    nav.params = { id: patchedReport.id };
    api.getReport.mockResolvedValue(patchedReport);
    api.getCatalog.mockResolvedValue({
      currency: 'NGN',
      hubs: [
        {
          hub: 'finance',
          label: 'Finance',
          locked: false,
          // Metric entry copied from guide A §3.5 (catalog_founder).
          metrics: [
            {
              key: 'finance.revenue',
              label: 'Revenue',
              unit: 'money',
              hub: 'finance',
              kind: 'flow',
              definition: 'Money in from customers over the period. Funding and payout transfers are excluded.',
              source_note: 'Finance ledger',
              good: 'up',
              group_by: [],
              entered_by_you: false,
            },
          ],
        },
      ],
    } satisfies Catalog);
    api.patchReport.mockRejectedValue(new ApiError(409, 'Conflict', patchStale409));
    render(<BuilderPage />);
    const desc = await screen.findByLabelText('Description');
    fireEvent.change(desc, { target: { value: 'My change' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save report' }));
    expect(await screen.findByText('Someone else changed this report. Reload it and apply your change again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    expect(api.patchReport).toHaveBeenCalledTimes(1);
    expect(api.patchReport.mock.calls[0][1]).toBe(2); // the version that was loaded
  });

  it('refuses to save a draft holding locked blocks (saving would drop them)', async () => {
    nav.params = { id: patchedReport.id };
    api.getReport.mockResolvedValue({ ...patchedReport, blocks: getMentor.blocks });
    api.getCatalog.mockResolvedValue({ currency: 'NGN', hubs: [] } satisfies Catalog);
    render(<BuilderPage />);
    expect(await screen.findByText(/can't be saved from here without losing them/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'x' } });
    expect(screen.getByRole('button', { name: 'Save report' })).toBeDisabled();
    expect(api.patchReport).not.toHaveBeenCalled();
  });
});

describe('(c) 410 EXPORT_EXPIRED on download', () => {
  it('download_expired_410 turns the "Ready" row into "Expired. Generate it again."', async () => {
    api.listExports.mockResolvedValue({ ...exportListEnvelope, exports: [reportPdfReady], total: 1 });
    api.getCatalog.mockResolvedValue({ currency: 'NGN', hubs: [] } satisfies Catalog);
    api.downloadExport.mockRejectedValue(new ApiError(410, 'Gone', downloadExpired410));
    api.getExport.mockResolvedValue(getExpired);
    render(<ExportsPage />);
    const buttons = await screen.findAllByRole('button', { name: `Download ${reportPdfReady.filename}` });
    expect(screen.queryAllByText('Expired. Generate it again.')).toHaveLength(0);
    fireEvent.click(buttons[0]);
    await waitFor(() => expect(screen.getAllByText('Expired. Generate it again.').length).toBeGreaterThan(0));
    expect(api.getExport).toHaveBeenCalledWith(reportPdfReady.id);
    expect(screen.queryAllByRole('button', { name: `Download ${reportPdfReady.filename}` })).toHaveLength(0);
  });

  it('offers "Load more" while total exceeds what is shown, using offset', async () => {
    const page1 = { ...exportListEnvelope, exports: [reportPdfReady], total: 2 };
    const second = { ...getExpired, id: '00000000-0000-4000-8000-000000000002' } as ExportRow;
    api.listExports.mockResolvedValueOnce(page1).mockResolvedValueOnce({ ...exportListEnvelope, exports: [second], total: 2, offset: 1 });
    api.getCatalog.mockResolvedValue({ currency: 'NGN', hubs: [] } satisfies Catalog);
    render(<ExportsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Load more' }));
    await waitFor(() => expect(api.listExports).toHaveBeenLastCalledWith(undefined, 1));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull());
  });
});

describe('(d) useExportWatch', () => {
  beforeEach(() => vi.useFakeTimers());

  it('report_pdf_start → report_pdf_ready: one poll, then it stops', async () => {
    api.getExport.mockResolvedValue(reportPdfReady);
    const settled = vi.fn();
    const { result } = renderHook(() => useExportWatch(settled));
    act(() => result.current.watch(reportPdfStart));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(api.getExport).toHaveBeenCalledTimes(1);
    expect(result.current.rows[reportPdfStart.id].status).toBe('ready');
    expect(settled).toHaveBeenCalledWith(reportPdfReady);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(api.getExport).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['failed', { ...reportPdfStart, status: 'failed', error: 'The report could not be run. Try again.' }],
    ['expired', getExpired],
  ])('stops when the export is %s', async (_label, next) => {
    api.getExport.mockResolvedValue(next);
    const { result } = renderHook(() => useExportWatch());
    act(() => result.current.watch(reportPdfStart));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(api.getExport).toHaveBeenCalledTimes(1);
  });

  it('keeps polling while pending, and an unmount stops it even with a request in flight', async () => {
    let release: (v: ExportRow) => void = () => {};
    api.getExport.mockResolvedValueOnce(reportPdfStart).mockImplementationOnce(() => new Promise<ExportRow>((r) => (release = r)));
    const { result, unmount } = renderHook(() => useExportWatch());
    act(() => result.current.watch(reportPdfStart));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(api.getExport).toHaveBeenCalledTimes(2); // second call is in flight
    unmount();
    await act(async () => {
      release(reportPdfStart);
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(api.getExport).toHaveBeenCalledTimes(2);
  });

  it('gives up at 2 minutes and does not restart for the same id', async () => {
    api.getExport.mockResolvedValue(reportPdfStart);
    const { result } = renderHook(() => useExportWatch());
    act(() => result.current.watch(reportPdfStart));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(130_000);
    });
    expect(result.current.stale.has(reportPdfStart.id)).toBe(true);
    const calls = api.getExport.mock.calls.length;
    act(() => result.current.watch(reportPdfStart)); // a list reload hands the same pending row back
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(api.getExport.mock.calls.length).toBe(calls);
  });
});

describe('(e) a denied role', () => {
  it.each(['investor', 'legal_advisor'])('%s gets the denial page and no Analytics request', async (role) => {
    ws.role = role;
    nav.pathname = '/analytics-reports';
    render(
      <RouteGuard>
        <AnalyticsOverviewPage />
      </RouteGuard>,
    );
    expect(screen.getByText("You don't have access to this page.")).toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
    });
    for (const fn of Object.values(api)) expect(fn).not.toHaveBeenCalled();
  });
});
