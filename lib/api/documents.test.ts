import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, apiClientWithStatus } from './client';
import {
  createGrant,
  exportDocument,
  instantiateTemplate,
  listExports,
  getFolders,
  getSharedWithMe,
  isUuid,
  hasFullLibrary,
  listDocuments,
  listFiles,
  restoreVersion,
  uploadProblem,
} from './documents';

vi.mock('./client', async () => {
  const actual = await vi.importActual<typeof import('./client')>('./client');
  return { ...actual, apiClient: vi.fn(), apiClientWithStatus: vi.fn() };
});

beforeEach(() => {
  vi.mocked(apiClient).mockReset();
  vi.mocked(apiClientWithStatus).mockReset();
});

describe('documents api', () => {
  it('sends search, tag and folder as query params and skips blanks', async () => {
    vi.mocked(apiClient).mockResolvedValue({ data: { documents: [] } });
    await listDocuments({ q: '  seed pitch ', tag: '', folder: 'Legal/NDAs' });
    expect(vi.mocked(apiClient).mock.calls[0][0]).toBe('/documents?q=seed+pitch&folder=Legal%2FNDAs');
    await listFiles();
    expect(vi.mocked(apiClient).mock.calls[1][0]).toBe('/documents/files');
  });

  it('survives an empty folder payload', async () => {
    vi.mocked(apiClient).mockResolvedValue({ data: [] });
    expect(await getFolders()).toEqual({ folders: [], uncategorized: 0, trash: 0, total: 0 });
  });

  it('creates a grant by email with the chosen permission', async () => {
    vi.mocked(apiClient).mockResolvedValue({ data: { id: 'g1' } });
    await createGrant('d1', 'mentor@example.com', 'comment');
    const [path, init] = vi.mocked(apiClient).mock.calls[0] as [string, { method: string; body: string }];
    expect(path).toBe('/documents/d1/grants');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ email: 'mentor@example.com', permission: 'comment' });
  });

  it('restores a version with a POST and no body', async () => {
    vi.mocked(apiClient).mockResolvedValue({});
    await restoreVersion('d1', 3);
    const [path, init] = vi.mocked(apiClient).mock.calls[0] as [string, { method: string }];
    expect(path).toBe('/documents/d1/versions/3/restore');
    expect(init.method).toBe('POST');
  });

  it('rejects bad uploads before any request', () => {
    expect(uploadProblem({ name: 'virus.exe', size: 10 })).toMatch(/isn’t allowed/);
    expect(uploadProblem({ name: 'deck.pdf', size: 15 * 1024 * 1024 + 1 })).toMatch(/15 MB limit/);
    expect(uploadProblem({ name: 'empty.pdf', size: 0 })).toMatch(/empty/);
    expect(uploadProblem({ name: 'notes.MD', size: 100 })).toBeNull();
  });

  it('encodes ids taken from the URL so they cannot climb out of their route', async () => {
    vi.mocked(apiClient).mockResolvedValue({ data: {} });
    await getSharedWithMe('../../auth/me');
    expect(vi.mocked(apiClient).mock.calls[0][0]).toBe('/documents/shared-with-me/..%2F..%2Fauth%2Fme');
    expect(isUuid('c1f3192a-aca9-4bcf-88ff-27e8ca511ed6')).toBe(true);
    expect(isUuid('../x')).toBe(false);
  });

  it('only founders and team members get the full library', () => {
    expect(hasFullLibrary('founder')).toBe(true);
    expect(hasFullLibrary('team_member')).toBe(true);
    for (const r of ['mentor', 'investor', 'legal_advisor', 'accountant', 'business_consultant', null, undefined]) {
      expect(hasFullLibrary(r)).toBe(false);
    }
  });

  it('instantiates a template with only the values and AI choice given', async () => {
    vi.mocked(apiClient).mockResolvedValue({ data: { document: { id: 'd1' }, form: {}, ai: { status: 'queued', job_id: 'j1', sections: ['go_to_market'] } } });
    const res = await instantiateTemplate('business_plan', { ai_draft: true, ai_sections: ['go_to_market'] });
    const [path, init] = vi.mocked(apiClient).mock.calls[0] as [string, { method: string; body: string }];
    expect(path).toBe('/documents/templates/business_plan/instantiate');
    expect(JSON.parse(init.body)).toEqual({ ai_draft: true, ai_sections: ['go_to_market'] });
    expect(res.ai.job_id).toBe('j1');
  });

  it('tells a new export (201) from an existing one (200)', async () => {
    vi.mocked(apiClientWithStatus).mockResolvedValueOnce({ status: 201, data: { data: { id: 'f1' } } });
    vi.mocked(apiClientWithStatus).mockResolvedValueOnce({ status: 200, data: { data: { id: 'f1' } } });
    expect((await exportDocument('d1', 'pdf')).existing).toBe(false);
    const again = await exportDocument('d1', 'pdf');
    expect(again.existing).toBe(true);
    const [path, init] = vi.mocked(apiClientWithStatus).mock.calls[0] as [string, { body: string }];
    expect(path).toBe('/documents/d1/export');
    expect(JSON.parse(init.body)).toEqual({ format: 'pdf' });
  });

  it('lists only the exports made from one document', async () => {
    vi.mocked(apiClient).mockResolvedValue({
      data: {
        files: [
          { id: 'a', origin: 'export', source_document_id: 'd1' },
          { id: 'b', origin: 'upload', source_document_id: null },
          { id: 'c', origin: 'export', source_document_id: 'd2' },
        ],
      },
    });
    expect((await listExports('d1')).map((f) => f.id)).toEqual(['a']);
  });
});
