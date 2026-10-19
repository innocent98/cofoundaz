import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const api = vi.hoisted(() => ({ getCanvas: vi.fn(), saveCanvas: vi.fn(), aiFillCanvas: vi.fn(), createSuggestion: vi.fn() }));
vi.mock('@/lib/api/business-builder', () => ({ businessBuilderApi: api }));
vi.mock('@/lib/api/bb-jobs', () => ({ waitForJob: vi.fn().mockResolvedValue({ state: 'succeeded', result: { status: 'ready', added: ['New idea'], block: 'partners' } }) }));
vi.mock('@/hooks/useBuilderAccess', () => ({ useBuilderAccess: () => ({ canEdit: true, canWrite: true, canComment: true, suggestMode: false }) }));
vi.mock('@/hooks/useAiStatus', () => ({ useAiStatus: () => ({ isOverBudget: false, formattedResetsAt: '' }) }));
vi.mock('@/hooks/useCommentCounts', () => ({ useCanvasCommentCounts: () => ({ counts: {}, refresh: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/business-builder/export-button', () => ({ ExportButton: () => null }));
vi.mock('@/components/business-builder/version-history-panel', () => ({ VersionHistoryPanel: () => null }));

import { CanvasFrame } from './canvas-frame';
import { useCanvasEditor } from '@/hooks/useCanvasEditor';

const base = {
  id: 'c1', type: 'business_model', blocks: { partners: ['A'] },
  block_defs: [{ key: 'partners', label: 'Key Partners', kind: 'list' }],
};

function Page() {
  const editor = useCanvasEditor('business_model');
  return (
    <CanvasFrame type={'business_model' as never} title="BMC" editor={editor}>
      {(tools) => (
        <div>
          {tools('partners', 'Key Partners', { ai: true })}
          <button onClick={() => editor.addItem('partners', 'Mine')}>add</button>
        </div>
      )}
    </CanvasFrame>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.getCanvas.mockResolvedValue({ ...base, version: 1, updated_at: new Date().toISOString(), updated_by: null });
});

describe('header after an AI write', () => {
  it('goes from the human editor to "AI" without a page reload', async () => {
    api.saveCanvas.mockResolvedValue({ ...base, version: 2, updated_at: new Date().toISOString(), updated_by: { id: 'u1', name: 'Victor Founder' } });
    api.aiFillCanvas.mockResolvedValue({ job_id: 'j1' });
    render(<Page />);
    await screen.findByText('add');
    await userEvent.click(screen.getByText('add'));
    expect(await screen.findByText(/Last edited by Victor Founder/, undefined, { timeout: 3000 })).toBeTruthy();

    api.getCanvas.mockResolvedValue({ ...base, version: 3, blocks: { partners: ['A', 'Mine', 'New idea'] }, updated_at: new Date().toISOString(), updated_by: null });
    await userEvent.click(screen.getByRole('button', { name: /with AI/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Draft it' }));
    await waitFor(() => expect(screen.getByText(/Last edited by AI/)).toBeTruthy());
  });
});
