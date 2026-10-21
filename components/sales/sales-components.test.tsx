import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/sales';
import { ToastProvider } from '@/app/(dashboard)/sales/ToastContext';
import { LostReasonModal } from './deal-drawer';
import { StageEditor } from './stage-editor';
import { LeadImportModal } from './lead-import';
import { StallBadge } from './shared';

vi.mock('@/lib/api/sales', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/sales')>('@/lib/api/sales');
  return { ...actual, saveStages: vi.fn(), previewLeadImport: vi.fn(), commitLeadImport: vi.fn() };
});

const wrap = (ui: React.ReactNode) => render(<ToastProvider>{ui}</ToastProvider>);

beforeEach(() => vi.clearAllMocks());

describe('LostReasonModal', () => {
  it('cannot be confirmed without a reason, then sends reason and trimmed note', async () => {
    const onConfirm = vi.fn();
    wrap(<LostReasonModal dealName="Acme" onConfirm={onConfirm} onCancel={vi.fn()} />);
    const confirm = screen.getByRole('button', { name: 'Mark as lost' });
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(screen.getByRole('radio', { name: 'No budget' }));
    await userEvent.type(screen.getByLabelText('Note (optional)'), '  frozen  ');
    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith('no_budget', 'frozen');
  });

  it('Cancel leaves without confirming', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    wrap(<LostReasonModal dealName="Acme" onConfirm={onConfirm} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe('StageEditor', () => {
  const stages: api.Stage[] = [
    { id: 'a', name: 'New', position: 0, kind: 'open', win_probability: 10 },
    { id: 'b', name: 'Qualified', position: 1, kind: 'open', win_probability: 40 },
    { id: 'w', name: 'Closed Won', position: 2, kind: 'won', win_probability: 100 },
    { id: 'l', name: 'Closed Lost', position: 3, kind: 'lost', win_probability: 0 },
  ];
  const counts = stages.map((s) => ({ stage_id: s.id, name: s.name, kind: s.kind, deal_count: s.id === 'a' ? 2 : 0, value_minor: 0 }));
  const open = () => {
    const onSaved = vi.fn();
    const onClose = vi.fn();
    wrap(<StageEditor stages={stages} counts={counts} onSaved={onSaved} onClose={onClose} />);
    return { onSaved, onClose };
  };

  it('disables delete for Won, Lost and any stage that still has deals', () => {
    open();
    expect((screen.getByRole('button', { name: 'Delete Closed Won' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Delete Closed Lost' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Delete New' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Delete Qualified' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('saves the ordered list: reordered, renamed, an omitted (deleted) stage, a new stage with no id', async () => {
    vi.mocked(api.saveStages).mockResolvedValue(stages);
    const { onSaved, onClose } = open();
    await userEvent.click(screen.getByRole('button', { name: 'Delete Qualified' }));
    await userEvent.click(screen.getByRole('button', { name: '+ Add stage' }));
    const names = screen.getAllByLabelText(/^Stage \d+ name$/);
    fireEvent.change(names[0], { target: { value: 'Lead' } });
    fireEvent.change(names[1], { target: { value: 'Demo' } });
    await userEvent.click(screen.getByRole('button', { name: 'Save stages' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
    const sent = vi.mocked(api.saveStages).mock.calls[0][0];
    expect(sent.map((s) => s.name)).toEqual(['Lead', 'Demo', 'Closed Won', 'Closed Lost']);
    expect(sent[1]).not.toHaveProperty('id'); // new stage
    expect(sent.find((s) => s.id === 'b')).toBeUndefined(); // deleted by omission
    expect(sent[0]).toMatchObject({ id: 'a', name: 'Lead', win_probability: 10 });
  });

  it('rejects a blank name and a bad win chance before calling the API', async () => {
    open();
    fireEvent.change(screen.getByLabelText('New win chance percent'), { target: { value: '150' } });
    await userEvent.click(screen.getByRole('button', { name: 'Save stages' }));
    expect(screen.getByRole('alert').textContent).toMatch(/whole number from 0 to 100/);
    fireEvent.change(screen.getByLabelText('New win chance percent'), { target: { value: '10' } });
    fireEvent.change(screen.getAllByLabelText(/^Stage \d+ name$/)[0], { target: { value: ' ' } });
    await userEvent.click(screen.getByRole('button', { name: 'Save stages' }));
    expect(screen.getByRole('alert').textContent).toMatch(/needs a name/);
    expect(api.saveStages).not.toHaveBeenCalled();
  });

  it('shows the API message when it refuses (nothing is saved)', async () => {
    const { ApiError } = await import('@/lib/api/client');
    vi.mocked(api.saveStages).mockRejectedValue(
      new ApiError(422, 'x', { error: { code: 'VALIDATION_ERROR', message: 'Move the deals out of New first.', field_errors: [{ field: 'stages', message: 'Move the deals out of New first.' }] } })
    );
    const { onSaved } = open();
    await userEvent.click(screen.getByRole('button', { name: 'Save stages' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Move the deals out of New first.');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('caps the pipeline at 10 stages', async () => {
    open();
    const add = screen.getByRole('button', { name: '+ Add stage' });
    for (let i = 0; i < 6; i++) await userEvent.click(add);
    expect((add as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getAllByLabelText(/^Stage \d+ name$/)).toHaveLength(10);
  });
});

describe('LeadImportModal', () => {
  const preview: api.ImportPreview = {
    upload_id: 'u1',
    headers: ['Full Name', 'Company', 'E-mail', 'Source'],
    sample_rows: [['Kemi', 'Bello', 'kemi@bello.example', 'event']],
    suggested_mapping: { name: 'Full Name', company: 'Company', email: 'E-mail', source: 'Source' },
    row_count: 5,
  };
  const csv = () => new File(['Full Name\nA'], 'leads.csv', { type: 'text/csv' });

  it('uploads, pre-fills the suggested mapping (never offers Source), commits, and lists the invalid rows', async () => {
    vi.mocked(api.previewLeadImport).mockResolvedValue(preview);
    vi.mocked(api.commitLeadImport).mockResolvedValue({
      added: 2,
      duplicates_skipped: 1,
      invalid_rows: [{ row: 4, error: 'Email is not valid.' }],
      invalid_total: 1,
    });
    const onImported = vi.fn();
    wrap(<LeadImportModal onClose={vi.fn()} onImported={onImported} />);
    await userEvent.upload(screen.getByLabelText('CSV file'), csv());
    expect(((await screen.findByLabelText('Name')) as HTMLSelectElement).value).toBe('Full Name');
    expect(screen.queryByLabelText('Source')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Import 5 rows' }));
    await waitFor(() => expect(onImported).toHaveBeenCalled());
    expect(api.commitLeadImport).toHaveBeenCalledWith('u1', { name: 'Full Name', company: 'Company', email: 'E-mail' });
    expect(screen.getByText('2 added, 1 duplicate skipped, 1 invalid')).toBeTruthy();
    expect(screen.getByText('Row 4: Email is not valid.')).toBeTruthy();
  });

  it('needs a Name or Company column before it commits', async () => {
    vi.mocked(api.previewLeadImport).mockResolvedValue(preview);
    wrap(<LeadImportModal onClose={vi.fn()} onImported={vi.fn()} />);
    await userEvent.upload(screen.getByLabelText('CSV file'), csv());
    fireEvent.change(await screen.findByLabelText('Name'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Company'), { target: { value: '' } });
    await userEvent.click(screen.getByRole('button', { name: 'Import 5 rows' }));
    expect(screen.getByRole('alert').textContent).toBe('Map at least a Name or a Company column.');
    expect(api.commitLeadImport).not.toHaveBeenCalled();
  });

  it('an expired upload (404) sends the user back to choose the file again', async () => {
    const { ApiError } = await import('@/lib/api/client');
    vi.mocked(api.previewLeadImport).mockResolvedValue(preview);
    vi.mocked(api.commitLeadImport).mockRejectedValue(new ApiError(404, 'Not Found', { error: { code: 'NOT_FOUND', message: 'Not found.', field_errors: [] } }));
    wrap(<LeadImportModal onClose={vi.fn()} onImported={vi.fn()} />);
    await userEvent.upload(screen.getByLabelText('CSV file'), csv());
    await userEvent.click(await screen.findByRole('button', { name: 'Import 5 rows' }));
    expect((await screen.findByRole('alert')).textContent).toBe('That upload expired. Choose the file again.');
    expect(screen.getByLabelText('CSV file')).toBeTruthy();
  });

  it('rejects a non-CSV file without calling the API', async () => {
    wrap(<LeadImportModal onClose={vi.fn()} onImported={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('CSV file'), { target: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] } });
    expect((await screen.findByRole('alert')).textContent).toBe('Choose a .csv file.');
    expect(api.previewLeadImport).not.toHaveBeenCalled();
  });
});

describe('StallBadge', () => {
  it('renders from the API flags only', () => {
    const { container, rerender } = render(<StallBadge deal={{ is_stalled: false, days_inactive: 40 }} />);
    expect(container.textContent).toBe('');
    rerender(<StallBadge deal={{ is_stalled: true, days_inactive: 20 }} long />);
    expect(within(container).getByText(/Stalled, 20 days/)).toBeTruthy();
  });
});
