import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { RoadmapEmptyState } from './roadmap-empty-state';
import { MissionLoading } from './mission-loading';
import { MISSION_COPY } from './mission-copy';

describe('RoadmapEmptyState', () => {
  it('PRD copy, and the CTA generates the roadmap', () => {
    const onGenerate = vi.fn();
    render(<RoadmapEmptyState onGenerate={onGenerate} generating={false} />);
    expect(screen.getByText('Your mission comes from your roadmap.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Generate my roadmap' }));
    expect(onGenerate).toHaveBeenCalled();
  });

  it('disables the CTA while generating and tells the user when it failed', () => {
    const { rerender } = render(<RoadmapEmptyState onGenerate={vi.fn()} generating />);
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
    rerender(<RoadmapEmptyState onGenerate={vi.fn()} generating={false} failed />);
    expect(screen.getByRole('alert').textContent).toMatch(/couldn.t generate/);
  });
});

describe('MissionLoading + copy', () => {
  it('shows the PRD pending line', () => {
    render(<MissionLoading />);
    expect(screen.getByRole('status').textContent).toBe('Building today’s mission from your roadmap…');
  });

  it('rendered copy carries no em or en dashes', () => {
    for (const v of Object.values(MISSION_COPY)) expect(v).not.toMatch(/[–—]/);
  });
});
