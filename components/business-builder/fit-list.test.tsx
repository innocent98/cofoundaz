import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { FitList } from './fit-list';

const lists: Record<string, string[]> = {
  pain_relievers: ['Instant settlement'],
  gain_creators: ['One tap receipts'],
  pains: ['Slow settlement', 'Lost sales'],
  gains: ['Simple receipts'],
};
const listOf = (b: string) => lists[b] ?? [];

describe('FitList', () => {
  it('connects a pain reliever to a pain through the selects (the keyboard alternative)', async () => {
    const onChange = vi.fn();
    render(<FitList links={[]} listOf={listOf} canEdit onChange={onChange} error={null} />);
    const connect = screen.getByRole('button', { name: 'Connect' });
    expect(connect).toBeDisabled();
    await userEvent.selectOptions(screen.getByLabelText('From'), 'Pain reliever: Instant settlement');
    await userEvent.selectOptions(screen.getByLabelText('To'), 'Lost sales');
    await userEvent.click(connect);
    expect(onChange).toHaveBeenCalledWith([
      { from_block: 'pain_relievers', from_item: 'Instant settlement', to_block: 'pains', to_item: 'Lost sales' },
    ]);
  });

  it('only offers gains for a gain creator', async () => {
    render(<FitList links={[]} listOf={listOf} canEdit onChange={vi.fn()} error={null} />);
    await userEvent.selectOptions(screen.getByLabelText('From'), 'Gain creator: One tap receipts');
    const to = screen.getByLabelText('To') as HTMLSelectElement;
    expect([...to.options].map((o) => o.text)).toEqual(['Pick the gain', 'Simple receipts']);
  });

  it('lists existing lines with a Remove button, and hides editing from read-only roles', async () => {
    const link = { from_block: 'pain_relievers', from_item: 'Instant settlement', to_block: 'pains', to_item: 'Lost sales' };
    const onChange = vi.fn();
    const { rerender } = render(<FitList links={[link]} listOf={listOf} canEdit onChange={onChange} error={null} />);
    expect(screen.getByText(/answers the pain/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Remove the fit-line from Instant settlement/ }));
    expect(onChange).toHaveBeenCalledWith([]);
    rerender(<FitList links={[link]} listOf={listOf} canEdit={false} onChange={onChange} error={null} />);
    expect(screen.queryByRole('button', { name: 'Connect' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Remove the fit-line/ })).toBeNull();
  });

  it('shows a save error', () => {
    render(<FitList links={[]} listOf={listOf} canEdit onChange={vi.fn()} error="Could not save that fit-line." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save that fit-line.');
  });
});
