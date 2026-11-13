import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import type { ComplianceItem, IpAsset } from '@/lib/api/legal';

// Below `md` the IP and Compliance lists render as stacked cards and the Compliance calendar as
// an agenda (re-walk gaps G1/G2). jsdom applies no CSS, so both layouts are in the DOM; these
// tests check that the phone layout carries every field and action the table / grid has.

const ws = vi.hoisted(() => ({ role: 'founder' as string }));
const api = vi.hoisted(() => ({ ip: [] as unknown[], compliance: [] as unknown[] }));

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('@/components/workspace-context', () => ({ useWorkspace: () => ({ role: ws.role, loading: false }) }));
vi.mock('./ToastContext', () => ({ useToast: () => ({ triggerToast: vi.fn() }) }));
vi.mock('@/lib/api/legal', async (orig) => ({
  ...(await orig<typeof import('@/lib/api/legal')>()),
  listIpAssets: vi.fn(async () => api.ip),
  listComplianceItems: vi.fn(async () => api.compliance),
}));

import IPTrackerPage from './ip/page';
import CompliancePage from './compliance/page';

const asset = (over: Partial<IpAsset>): IpAsset => ({
  id: 'a1',
  type: 'trademark',
  name: 'Kolo mark',
  jurisdiction: 'Nigeria',
  status: 'filed',
  derived_status: 'filed',
  renewal_on: null,
  created_by: null,
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
  ...over,
});

const iso = (d: Date) => d.toISOString().slice(0, 10);
const now = new Date();
const thisMonth = (day: number) => iso(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day)));
const nextMonth = iso(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 10)));

const filing = (over: Partial<ComplianceItem>): ComplianceItem =>
  ({
    id: 'c1',
    title: 'VAT return',
    authority: 'FIRS',
    due_on: thisMonth(21),
    status: 'open',
    derived_status: 'upcoming',
    done_at: null,
    proof_url: null,
    recurrence: 'monthly',
    previous_item_id: null,
    created_by: null,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
    ...over,
  }) as ComplianceItem;

beforeEach(() => {
  ws.role = 'founder';
  api.ip = [asset({}), asset({ id: 'a2', name: 'kolo.ng', type: 'domain', jurisdiction: 'Global' })];
  api.compliance = [
    filing({}),
    filing({ id: 'c2', title: 'Annual return', authority: 'CAC', due_on: thisMonth(5), recurrence: 'none' }),
    filing({ id: 'c3', title: 'PAYE', due_on: nextMonth }),
  ];
});

describe('IP tracker on phones', () => {
  it('stacks each asset as a card with its type, jurisdiction, status, renewal and actions', async () => {
    render(<IPTrackerPage />);
    const cards = await screen.findByRole('list', { name: 'IP assets' });
    const first = within(cards).getAllByRole('listitem')[0];
    expect(first).toHaveTextContent('Kolo mark');
    expect(first).toHaveTextContent('Trademark · Nigeria');
    expect(first).toHaveTextContent('Renewal:');
    expect(within(first).getByRole('button', { name: 'Edit Kolo mark' })).toBeInTheDocument();
    expect(within(first).getByRole('button', { name: 'Delete Kolo mark' })).toBeInTheDocument();
    // The table is still there for md and up, hidden below it.
    expect(screen.getByRole('table').parentElement).toHaveClass('hidden', 'md:block');
    expect(cards).toHaveClass('md:hidden');
  });

  it('shows no write actions on the cards for the legal advisor', async () => {
    ws.role = 'legal_advisor';
    render(<IPTrackerPage />);
    const cards = await screen.findByRole('list', { name: 'IP assets' });
    expect(within(cards).queryByRole('button')).toBeNull();
  });
});

describe('Compliance on phones', () => {
  it('stacks each filing as a card with authority, due date, status and every action', async () => {
    render(<CompliancePage />);
    const cards = await screen.findByRole('list', { name: 'Filings' });
    expect(cards).toHaveClass('md:hidden');
    const vat = within(cards).getAllByRole('listitem').find((li) => li.textContent?.includes('VAT return'))!;
    expect(vat).toHaveTextContent('FIRS · Repeats monthly');
    expect(vat).toHaveTextContent('Due');
    for (const name of ['Mark VAT return done', 'Attach proof for VAT return', 'Edit VAT return', 'Delete VAT return']) {
      expect(within(vat).getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('shows the calendar as an agenda of this month, earliest first, with 44px entries', async () => {
    render(<CompliancePage />);
    await screen.findByRole('list', { name: 'Filings' });
    fireEvent.click(screen.getByRole('button', { name: 'Calendar' }));
    const agenda = screen.getByRole('list', { name: /^Filings due in / });
    const entries = within(agenda).getAllByRole('button');
    expect(entries.map((b) => b.textContent)).toEqual([expect.stringContaining('Annual return'), expect.stringContaining('VAT return')]);
    for (const b of entries) expect(b).toHaveClass('min-h-11', 'w-full');
    // Next month's filing is not in this month's agenda; Next month shows it.
    expect(agenda).not.toHaveTextContent('PAYE');
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('list', { name: /^Filings due in / })).toHaveTextContent('PAYE');
  });

  it('says so when the month has no filings', async () => {
    api.compliance = [];
    render(<CompliancePage />);
    await screen.findByText('No filings yet');
    fireEvent.click(screen.getByRole('button', { name: 'Calendar' }));
    expect(screen.getByText(/^No filings due in /)).toBeInTheDocument();
  });
});
