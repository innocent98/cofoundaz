import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { PositioningMap } from './positioning-map';
import type { BusinessRecord } from '@/lib/api/business-builder';

const axes = { x: { label: 'Price', low: 'Low', high: 'High' }, y: { label: 'Quality', low: 'Low', high: 'High' } };
const rec = (id: string, name: string, x: number | null, y: number | null): BusinessRecord => ({
  id,
  kind: 'competitor',
  position: 0,
  data: { name, map_x: x, map_y: y },
});

afterEach(() => vi.useRealTimers());

describe('PositioningMap', () => {
  it('moves a focused dot with the arrow keys and saves once the presses settle', async () => {
    vi.useFakeTimers();
    const onMove = vi.fn().mockResolvedValue(undefined);
    const a = rec('a', 'Moniepoint', 0.3, 0.7);
    render(<PositioningMap records={[a]} axes={axes} canMove onMove={onMove} />);
    const dot = screen.getByRole('slider');
    dot.focus();
    fireEvent.keyDown(dot, { key: 'ArrowRight' });
    fireEvent.keyDown(dot, { key: 'ArrowRight' });
    fireEvent.keyDown(dot, { key: 'ArrowUp' });
    expect(onMove).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith(a, { x: 0.4, y: 0.75 });
  });

  it('is not draggable or focusable for read-only roles', () => {
    render(<PositioningMap records={[rec('a', 'Moniepoint', 0.3, 0.7)]} axes={axes} canMove={false} onMove={vi.fn()} />);
    expect(screen.queryByRole('slider')).toBeNull();
    expect(screen.getByRole('img', { name: 'Moniepoint' })).toBeInTheDocument();
    expect(screen.queryByText(/Not on the map yet/)).toBeNull();
  });

  it('offers unplaced competitors a Place button that drops them in the middle', async () => {
    const onMove = vi.fn().mockResolvedValue(undefined);
    const p = rec('p', 'Paystack', null, null);
    render(<PositioningMap records={[p]} axes={axes} canMove onMove={onMove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Place Paystack' }));
    expect(onMove).toHaveBeenCalledWith(p, { x: 0.5, y: 0.5 });
  });

  it('tells the user when a move could not be saved', async () => {
    const onMove = vi.fn().mockRejectedValue(new Error('nope'));
    render(<PositioningMap records={[rec('p', 'Paystack', null, null)]} axes={axes} canMove onMove={onMove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Place Paystack' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save that position');
  });
});
