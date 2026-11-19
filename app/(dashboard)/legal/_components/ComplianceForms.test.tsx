import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ApiError } from '@/lib/api/client';
import type { ComplianceItem } from '@/lib/api/legal';
import { FilingDrawer, MarkDoneDialog, ProofDialog } from './ComplianceForms';

const api = vi.hoisted(() => ({
  updateComplianceItem: vi.fn(),
  createComplianceItem: vi.fn(),
  uploadComplianceProof: vi.fn(),
}));
vi.mock('@/lib/api/legal', async (importOriginal) => ({ ...(await importOriginal<object>()), ...api }));

const item = {
  id: 'item-1',
  title: 'VAT return',
  authority: 'FIRS',
  due_on: '2026-11-18',
  status: 'open',
  derived_status: 'due_soon',
  done_at: null,
  proof_url: null,
  recurrence: 'none',
  previous_item_id: null,
} as unknown as ComplianceItem;

const gone404 = () => new ApiError(404, 'Not Found', { error: { code: 'NOT_FOUND', message: 'Not found.' } });

describe('Legal compliance forms: a filing deleted elsewhere', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FilingDrawer hands a 404 to onGone instead of leaving the stale row behind', async () => {
    api.updateComplianceItem.mockRejectedValue(gone404());
    const onGone = vi.fn().mockResolvedValue(undefined);
    render(<FilingDrawer item={item} onClose={vi.fn()} onSaved={vi.fn()} onGone={onGone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onGone).toHaveBeenCalledTimes(1));
  });

  it('FilingDrawer still shows a non-404 error inline', async () => {
    api.updateComplianceItem.mockRejectedValue(new ApiError(500, 'Server Error', { error: { message: 'Boom.' } }));
    const onGone = vi.fn();
    render(<FilingDrawer item={item} onClose={vi.fn()} onSaved={vi.fn()} onGone={onGone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Boom.')).toBeInTheDocument();
    expect(onGone).not.toHaveBeenCalled();
  });

  it('MarkDoneDialog and ProofDialog hand a 404 to onGone', async () => {
    api.updateComplianceItem.mockRejectedValue(gone404());
    const goneDone = vi.fn().mockResolvedValue(undefined);
    const { unmount } = render(<MarkDoneDialog item={item} onClose={vi.fn()} onDone={vi.fn()} onGone={goneDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark done' }));
    await waitFor(() => expect(goneDone).toHaveBeenCalledTimes(1));
    unmount();

    api.uploadComplianceProof.mockRejectedValue(gone404());
    const goneProof = vi.fn().mockResolvedValue(undefined);
    render(<ProofDialog item={item} onClose={vi.fn()} onUploaded={vi.fn()} onGone={goneProof} />);
    const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'proof.png', { type: 'image/png' });
    fireEvent.change(document.getElementById('proof-file') as HTMLInputElement, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
    await waitFor(() => expect(goneProof).toHaveBeenCalledTimes(1));
  });

  it('ties a field error to its input for screen readers', () => {
    render(<FilingDrawer item={null} onClose={vi.fn()} onSaved={vi.fn()} onGone={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save filing' }));
    const title = screen.getByLabelText('Filing');
    expect(title).toHaveAttribute('aria-invalid', 'true');
    expect(title).toHaveAccessibleDescription('Enter what is being filed.');
  });
});
