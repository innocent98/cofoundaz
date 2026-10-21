import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { axe } from 'jest-axe';
import type { CalendarEntry, CampaignReadout, ReadoutFigure, ReadoutFigures, ReadoutMetric } from '@/lib/api/marketing';
import { CharCounter } from './char-counter';
import { ConfirmDialog } from './confirm-dialog';
import { Drawer } from './drawer';
import { Agenda, Legend, MonthGrid, PostChip, WeekGrid } from './calendar-views';
import { ReadoutCard } from './readout-card';
import { MediaSlot } from './media-slot';

const api = vi.hoisted(() => ({ uploadMedia: vi.fn(), fetchMediaBlob: vi.fn() }));
vi.mock('@/lib/api/marketing', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/marketing')>('@/lib/api/marketing');
  return { ...actual, uploadMedia: api.uploadMedia, fetchMediaBlob: api.fetchMediaBlob };
});
vi.mock('@/hooks/useMarketingApi', () => ({
  useMedia: () => ({ media: [], status: 'ready', error: null, remove: vi.fn() }),
}));

const entry = (over: Partial<CalendarEntry> = {}): CalendarEntry => ({
  id: 'e1',
  startup_id: 's1',
  created_by: null,
  title: 'Waitlist teaser',
  channel: 'organic_social',
  status: 'scheduled',
  body: null,
  media_ref: null,
  media_id: null,
  media: null,
  campaign_id: null,
  scheduled_at: new Date(2026, 9, 21, 14, 30).toISOString(),
  published_at: null,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe('CharCounter', () => {
  it('shows n / limit and stays neutral under the limit', () => {
    render(<CharCounter count={19} limit={280} platformLabel="X" />);
    expect(screen.getByText('19 / 280')).toBeInTheDocument();
  });

  it('says how far over it is in words, not only red', () => {
    render(<CharCounter count={300} limit={280} kind="hard" platformLabel="X" />);
    expect(screen.getByText(/20 over, the platform will reject it/)).toBeInTheDocument();
    expect(screen.getByLabelText('300 of 280 characters for X, 20 over')).toBeInTheDocument();
  });

  it('calls a recommended limit a cut-off, and shows a plain count with no limit', () => {
    const { rerender } = render(<CharCounter count={70} limit={60} kind="recommended" />);
    expect(screen.getByText(/10 over, may be cut off/)).toBeInTheDocument();
    rerender(<CharCounter count={12} limit={null} />);
    expect(screen.getByText('12 characters')).toBeInTheDocument();
  });
});

describe('ConfirmDialog', () => {
  it('starts on the safe button, cancels on Escape, and confirms on the action', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<ConfirmDialog title="Complete it?" body="Final." confirmLabel="Complete campaign" onCancel={onCancel} onConfirm={onConfirm} />);
    expect(screen.getByRole('alertdialog', { name: 'Complete it?' })).toHaveAccessibleDescription('Final.');
    expect(screen.getByRole('button', { name: 'Keep it' })).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Complete campaign' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('Drawer', () => {
  it('moves focus in, keeps Tab inside, closes on Escape and gives focus back', () => {
    const onClose = vi.fn();
    const Host = () => {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open drawer</button>
          {open && (
            <Drawer title="Edit post" onClose={() => { onClose(); setOpen(false); }} footer={<button>Save</button>}>
              <input aria-label="Title" />
            </Drawer>
          )}
        </>
      );
    };
    render(<Host />);
    const opener = screen.getByRole('button', { name: 'Open drawer' });
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Edit post' });
    expect(screen.getByLabelText('Title')).toHaveFocus();
    // Tab from the last control wraps to the first.
    screen.getByRole('button', { name: 'Save' }).focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
    expect(opener).toHaveFocus();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Drawer title="Edit post" onClose={() => {}}><label>Title<input /></label></Drawer>);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('calendar views', () => {
  const noop = () => {};

  it('puts a channel icon and the channel name on every chip, never colour alone', () => {
    const { container } = render(<PostChip entry={entry()} onOpen={noop} />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(screen.getByText('Organic social, Scheduled')).toBeInTheDocument();
  });

  it('marks a published post as published in text and blocks dragging it', () => {
    render(<PostChip entry={entry({ status: 'published' })} onOpen={noop} onMove={vi.fn()} />);
    expect(screen.getByText('Organic social, Marked published')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('draggable', 'false');
  });

  it('moves a post a day with Alt + arrow, a week with Alt + down', () => {
    const onMove = vi.fn();
    render(<PostChip entry={entry()} onOpen={noop} onMove={onMove} />);
    const chip = screen.getByRole('button');
    fireEvent.keyDown(chip, { key: 'ArrowRight', altKey: true });
    expect(onMove.mock.calls[0][0].entryId).toBe('e1');
    expect(onMove.mock.calls[0][0].target.getDate()).toBe(22);
    fireEvent.keyDown(chip, { key: 'ArrowDown', altKey: true });
    expect(onMove.mock.calls[1][0].target.getDate()).toBe(28);
    fireEvent.keyDown(chip, { key: 'ArrowRight' });
    expect(onMove).toHaveBeenCalledTimes(2);
  });

  it('reschedules by dropping a chip on another day of the month grid', () => {
    const onMove = vi.fn();
    const e = entry();
    const byDay = new Map([['2026-10-21', [e]]]);
    render(<MonthGrid anchor={new Date(2026, 9, 1)} byDay={byDay} onOpenPost={noop} onAddOnDay={noop} onMove={onMove} />);
    const data: Record<string, string> = {};
    const dataTransfer = {
      types: ['application/x-cofoundaz-post'],
      setData: (k: string, v: string) => { data[k] = v; },
      getData: (k: string) => data[k] ?? '',
      effectAllowed: '',
      dropEffect: '',
    };
    fireEvent.dragStart(screen.getByRole('button', { name: /Waitlist teaser/ }), { dataTransfer });
    const target = screen.getByRole('button', { name: 'Add a post on October 28' }).parentElement as HTMLElement;
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove.mock.calls[0][0].entryId).toBe('e1');
    expect(onMove.mock.calls[0][0].target.getDate()).toBe(28);
  });

  it('shows seven days with times in the week view', () => {
    const e = entry();
    render(<WeekGrid anchor={new Date(2026, 9, 21)} byDay={new Map([['2026-10-21', [e]]])} onOpenPost={noop} onAddOnDay={noop} onMove={noop} />);
    expect(screen.getByRole('group', { name: 'Week view' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Add a post on/ })).toHaveLength(7);
    expect(screen.getByText(/2:30/)).toBeInTheDocument();
  });

  it('lists a dated agenda for a phone, and says so when nothing is planned', () => {
    const open = vi.fn();
    const e = entry();
    const { rerender } = render(<Agenda byDay={new Map([['2026-10-21', [e]]])} onOpenPost={open} emptyLabel="Nothing planned for October 2026." />);
    expect(screen.getByRole('list', { name: 'Agenda' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Waitlist teaser/ }));
    expect(open).toHaveBeenCalledWith(e);
    rerender(<Agenda byDay={new Map()} onOpenPost={open} emptyLabel="Nothing planned for October 2026." />);
    expect(screen.getByText('Nothing planned for October 2026.')).toBeInTheDocument();
  });

  it('names every channel in the legend', () => {
    render(<Legend channels={['email', 'search']} />);
    const list = screen.getByRole('list', { name: 'Channels in this view' });
    expect(within(list).getByText('Email')).toBeInTheDocument();
    expect(within(list).getByText('Search')).toBeInTheDocument();
    expect(list.querySelectorAll('svg')).toHaveLength(2);
  });
});

describe('ReadoutCard', () => {
  const readout = (over: Partial<CampaignReadout> = {}): CampaignReadout => ({
    id: 'r1',
    campaign_id: 'c1',
    week_start: '2026-10-19',
    status: 'ready',
    output: { headline: 'Clicks are up', summary: 'Email drove most of it.', wins: ['CTR 5%'], watch: ['Spend is high'], next_step: 'Shift budget to email.' },
    error: null,
    created_at: '2026-10-20T18:32:44Z',
    ...over,
  });

  it('shows the newest ready readout with its week and the AI label', () => {
    render(<ReadoutCard readouts={[readout()]} loading={false} />);
    expect(screen.getByText('Clicks are up')).toBeInTheDocument();
    expect(screen.getByText(/Week of October 19, 2026/)).toBeInTheDocument();
    expect(screen.getByText('Shift budget to email.')).toBeInTheDocument();
    expect(screen.getByText(/Written by AI from the numbers you recorded/)).toBeInTheDocument();
  });

  it('treats an empty list as a normal state, not an error', () => {
    render(<ReadoutCard readouts={[]} loading={false} />);
    expect(screen.getByText(/No readout yet/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('says a failed readout is unavailable and a running one is being written', () => {
    const { rerender } = render(<ReadoutCard readouts={[readout({ status: 'failed', output: null, error: 'over_budget' })]} loading={false} />);
    expect(screen.getByText('Readout unavailable this week.')).toBeInTheDocument();
    rerender(<ReadoutCard readouts={[readout({ status: 'generating', output: null })]} loading={false} />);
    expect(screen.getByRole('status')).toHaveTextContent("Writing this week's readout");
  });

  const fig = (display: string): ReadoutFigure => ({ value: null, display });
  const metrics = (f: (m: ReadoutMetric) => string) =>
    Object.fromEntries((['spend', 'impressions', 'clicks', 'ctr', 'conversions', 'cac'] as ReadoutMetric[]).map((m) => [m, fig(f(m))])) as ReadoutFigures['this_week'];
  const figures: ReadoutFigures = {
    this_week: { ...metrics((m) => `tw-${m}`), spend: fig('\u20a61,500.00') },
    last_week: metrics((m) => `lw-${m}`),
    all_time: metrics((m) => `at-${m}`),
    change: { ...metrics((m) => `ch-${m}`), clicks: fig('+56.3%'), cac: fig('n/a') },
    windows: { this_week: { start: '2026-10-14', end: '2026-10-21' }, last_week: { start: '2026-10-07', end: '2026-10-14' } },
    days_live: fig('12 days'),
    currency: 'NGN',
  };

  it('renders every figure from the API display strings, not from the prose', () => {
    render(<ReadoutCard readouts={[readout({ figures, output: { headline: 'H', summary: 'Spend was 999 this week.' } })]} loading={false} />);
    const table = screen.getByRole('table', { name: 'Readout figures' });
    expect(within(table).getByText('\u20a61,500.00')).toBeInTheDocument();
    expect(within(table).getByText('+56.3%')).toBeInTheDocument();
    expect(within(table).getByText('n/a')).toBeInTheDocument();
    expect(within(table).getByText('lw-ctr')).toBeInTheDocument();
    expect(within(table).getByText('at-conversions')).toBeInTheDocument();
    expect(screen.getByText(/Live for 12 days/)).toBeInTheDocument();
  });

  it('shows the prose without a figures block when figures is null (old rows) or absent', () => {
    const { rerender } = render(<ReadoutCard readouts={[readout({ figures: null })]} loading={false} />);
    expect(screen.getByText('Email drove most of it.')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Readout figures' })).toBeNull();
    rerender(<ReadoutCard readouts={[readout()]} loading={false} />);
    expect(screen.queryByRole('table', { name: 'Readout figures' })).toBeNull();
  });

  it('keeps older weeks behind a disclosure', () => {
    render(<ReadoutCard readouts={[readout(), readout({ id: 'r0', week_start: '2026-10-12', output: { headline: 'Old week', summary: 'Quiet.' } })]} loading={false} />);
    expect(screen.getByText('Earlier weeks (1)')).toBeInTheDocument();
  });
});

describe('MediaSlot', () => {
  const png = (size = 4, type = 'image/png') => new File([new Uint8Array(size)], 'hero.png', { type });

  it('rejects a wrong type and an oversize file before uploading', async () => {
    render(<MediaSlot media={null} onChange={vi.fn()} />);
    const input = document.getElementById('cal-media-file') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [png(4, 'image/svg+xml')] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Upload a PNG, JPEG, GIF or WebP image.');
    fireEvent.change(input, { target: { files: [png(6 * 1024 * 1024)] } });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('over 5 MB'));
    expect(api.uploadMedia).not.toHaveBeenCalled();
  });

  it('uploads and hands the media up, and shows the API error when it is refused', async () => {
    const onChange = vi.fn();
    const media = { id: 'a1', filename: 'hero.png', content_type: 'image/png', size_bytes: 4, url: 'https://cdn.example/hero.png', created_at: '2026-10-20T00:00:00Z' };
    api.uploadMedia.mockResolvedValueOnce(media);
    render(<MediaSlot media={null} onChange={onChange} />);
    const input = document.getElementById('cal-media-file') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [png()] } });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(media));
  });

  const media = { id: 'a1', filename: 'hero.png', content_type: 'image/png', size_bytes: 4, url: 'var/storage/hero.png', created_at: '2026-10-20T00:00:00Z' };

  describe('preview', () => {
    const created: string[] = [];
    const revoked: string[] = [];
    beforeEach(() => {
      created.length = 0;
      revoked.length = 0;
      api.fetchMediaBlob.mockReset();
      vi.stubGlobal('URL', Object.assign(URL, {
        createObjectURL: vi.fn(() => {
          const u = `blob:test/${created.length}`;
          created.push(u);
          return u;
        }),
        revokeObjectURL: vi.fn((u: string) => revoked.push(u)),
      }));
    });

    it('shows the image from a blob fetched with auth, and revokes the object URL on unmount', async () => {
      api.fetchMediaBlob.mockResolvedValueOnce(new Blob(['x'], { type: 'image/png' }));
      const { unmount } = render(<MediaSlot media={media} onChange={vi.fn()} />);
      const img = await screen.findByAltText('hero.png');
      expect(img).toHaveAttribute('src', 'blob:test/0');
      expect(api.fetchMediaBlob).toHaveBeenCalledWith('a1', expect.any(AbortSignal));
      expect(revoked).toEqual([]);
      unmount();
      expect(revoked).toEqual(['blob:test/0']);
    });

    it('revokes the old object URL when a different image is chosen', async () => {
      api.fetchMediaBlob.mockResolvedValue(new Blob(['x'], { type: 'image/png' }));
      const { rerender } = render(<MediaSlot media={media} onChange={vi.fn()} />);
      await screen.findByAltText('hero.png');
      rerender(<MediaSlot media={{ ...media, id: 'a2', filename: 'two.png' }} onChange={vi.fn()} />);
      await screen.findByAltText('two.png');
      expect(revoked).toEqual(['blob:test/0']);
    });

    it('shows a file chip, not a broken box, when the file cannot be fetched, and can remove it', async () => {
      api.fetchMediaBlob.mockRejectedValueOnce(new Error('nope'));
      const onChange = vi.fn();
      render(<MediaSlot media={media} onChange={onChange} />);
      expect(await screen.findByText('Preview unavailable')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Remove from this post' }));
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('falls back to the chip when the image itself fails to decode', async () => {
      api.fetchMediaBlob.mockResolvedValueOnce(new Blob(['x'], { type: 'image/png' }));
      render(<MediaSlot media={media} onChange={vi.fn()} />);
      fireEvent.error(await screen.findByAltText('hero.png'));
      expect(screen.getByText('Preview unavailable')).toBeInTheDocument();
    });
  });
});
