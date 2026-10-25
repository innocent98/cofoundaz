import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SearchOverlay, SEARCH_PLACEHOLDER } from './search-overlay';
import * as searchApi from '@/lib/api/search';
import type { SearchResult } from '@/lib/api/search';

vi.mock('@/lib/api/search', async (orig) => ({
  ...(await orig<typeof import('@/lib/api/search')>()),
  searchAll: vi.fn(),
}));

const results: SearchResult[] = [
  { type: 'page', group: 'Pages', id: '/finance', title: 'Finance Hub', subtitle: null, href: '/finance' },
  { type: 'milestone', group: 'Roadmap', id: 'm1', title: 'Write your problem statement', subtitle: 'Milestone · due 2026-10-24', href: '/roadmap/milestones' },
  { type: 'roadmap_task', group: 'Roadmap', id: 't1', title: 'Describe the problem', subtitle: 'Task in Write your problem statement', href: '/roadmap' },
];

function setup(open = true) {
  const onClose = vi.fn();
  const onSelect = vi.fn();
  render(<SearchOverlay open={open} onClose={onClose} onSelect={onSelect} />);
  return { onClose, onSelect };
}

describe('SearchOverlay', () => {
  beforeEach(() => vi.mocked(searchApi.searchAll).mockReset());

  it('renders nothing when closed', () => {
    setup(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('the placeholder drops "contacts" and uses a comma, not a dash', () => {
    expect(SEARCH_PLACEHOLDER).toBe('Search anything, docs, tasks, conversations…');
    expect(SEARCH_PLACEHOLDER).not.toMatch(/contacts|—|–/);
    setup();
    expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDER)).toBeTruthy();
  });

  it('1 character shows the 2-character hint and does not call the API', async () => {
    setup();
    await userEvent.type(screen.getByRole('combobox'), 'a');
    expect(screen.getByText('Type at least 2 characters')).toBeTruthy();
    expect(searchApi.searchAll).not.toHaveBeenCalled();
  });

  it('shows results grouped by group, in arrival order', async () => {
    vi.mocked(searchApi.searchAll).mockResolvedValue(results);
    setup();
    await userEvent.type(screen.getByRole('combobox'), 'problem');
    expect(await screen.findByRole('group', { name: 'Pages' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Roadmap' })).toBeTruthy();
    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.getByText('Milestone · due 2026-10-24')).toBeTruthy();
  });

  it('keyboard: ArrowDown moves, Enter picks the highlighted result and closes', async () => {
    vi.mocked(searchApi.searchAll).mockResolvedValue(results);
    const { onSelect, onClose } = setup();
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'problem');
    await screen.findAllByRole('option');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledWith(results[1]);
    expect(onClose).toHaveBeenCalled();
  });

  it('ArrowUp wraps to the last result', async () => {
    vi.mocked(searchApi.searchAll).mockResolvedValue(results);
    const { onSelect } = setup();
    await userEvent.type(screen.getByRole('combobox'), 'problem');
    await screen.findAllByRole('option');
    await userEvent.keyboard('{ArrowUp}{Enter}');
    expect(onSelect).toHaveBeenCalledWith(results[2]);
  });

  it('clicking a result navigates; Escape closes', async () => {
    vi.mocked(searchApi.searchAll).mockResolvedValue(results);
    const { onSelect, onClose } = setup();
    await userEvent.type(screen.getByRole('combobox'), 'problem');
    fireEvent.click(await screen.findByRole('option', { name: /Finance Hub/ }));
    expect(onSelect).toHaveBeenCalledWith(results[0]);
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('no matches: "No results for \'q\'." and Enter does nothing', async () => {
    vi.mocked(searchApi.searchAll).mockResolvedValue([]);
    const { onSelect } = setup();
    await userEvent.type(screen.getByRole('combobox'), 'zzqq');
    expect(await screen.findByText(/No results for/)).toBeTruthy();
    expect(screen.getByText(/zzqq/)).toBeTruthy();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('an API failure shows an honest error with Retry that searches again', async () => {
    vi.mocked(searchApi.searchAll).mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce(results);
    setup();
    await userEvent.type(screen.getByRole('combobox'), 'problem');
    expect(await screen.findByRole('alert')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(3));
  });

  it('the close button closes', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Close search' }));
    expect(onClose).toHaveBeenCalled();
  });
});
