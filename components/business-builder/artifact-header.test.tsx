import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ArtifactHeader } from './artifact-header';

const NOW = Date.now();
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();

describe('ArtifactHeader', () => {
  it('shows the autosave state as "Saved", the editor and time, and a version link', async () => {
    const onOpenHistory = vi.fn();
    render(
      <ArtifactHeader
        title="SWOT"
        saveStatus="saved"
        updatedAt={minutesAgo(5)}
        updatedBy={{ id: 'u1', name: 'Ada Founder' }}
        onOpenHistory={onOpenHistory}
      />
    );
    expect(screen.getByRole('heading', { name: 'SWOT' })).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.queryByText(/Saved to cloud/)).toBeNull();
    expect(screen.getByText('Last edited by Ada Founder, 5 minutes ago')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Version history/ }));
    expect(onOpenHistory).toHaveBeenCalled();
  });

  it('credits an AI fill and hides the version link on record pages', () => {
    render(<ArtifactHeader title="Personas" updatedAt={minutesAgo(2)} updatedBy={null} />);
    expect(screen.getByText('Last edited by AI, 2 minutes ago')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Version history/ })).toBeNull();
  });

  it('shows nothing about edits for an untouched artifact', () => {
    render(<ArtifactHeader title="Personas" />);
    expect(screen.queryByText(/Last edited/)).toBeNull();
  });

  it('reports a failed save without a dash', () => {
    render(<ArtifactHeader title="SWOT" saveStatus="error" />);
    expect(screen.getByText(/Not saved/).textContent).not.toMatch(/[–—]/);
  });
});
