import { apiClient, apiClientWithStatus } from './client';

// Documents library (BE-A + BE-B). Shapes are copied from the live captures in
// cofoundaz-api docs/fe-integration-guide-documents-library.md. Every /documents
// route except the four shared-with-me routes is founder + team member only.

export interface Person {
  id: string;
  name: string | null;
}

export interface DocSummary {
  id: string;
  type?: 'document';
  disclaimer?: string | null; // legal drafts only (D-DOC-4)
  kind: string;
  mime: string;
  title: string;
  status: string; // draft | final
  ai_generated: boolean;
  folder: string | null;
  tags: string[];
  template_key: string | null;
  version: number;
  owner: Person | null;
  share_count: number;
  updated_at: string;
  trashed_at: string | null;
  purges_at: string | null;
}

export interface FileSummary {
  id: string;
  type?: 'file';
  origin?: 'upload' | 'export' | 'executed';
  source_document_id?: string | null; // null once the source document is purged
  source_version?: number | null;
  filename: string;
  content_type: string;
  mime: string;
  size_bytes: number;
  folder: string | null;
  tags: string[];
  owner: Person | null;
  share_count: number;
  scan_status: string; // pending | clean | blocked
  uploaded_at: string;
  trashed_at: string | null;
  purges_at: string | null;
}

export interface FolderNode {
  id: string;
  name: string;
  path: string;
  parent_id: string | null;
  document_count: number;
  file_count: number;
  total_count: number;
}

export interface FolderTree {
  folders: FolderNode[];
  uncategorized: number;
  trash: number;
  total: number;
}

export interface DocSection {
  id?: string;
  heading: string;
  body: string;
}

export interface VersionRow {
  version: number;
  title: string;
  status: string;
  note: string | null;
  author: { id: string; name: string | null } | null;
  created_at: string;
  is_current: boolean;
}

export interface VersionDetail extends VersionRow {
  sections: DocSection[];
}

export type GrantPermission = 'view' | 'comment';

export interface Grant {
  id: string;
  document_id: string;
  grantee: { user_id: string | null; email: string; name: string | null };
  permission: GrantPermission;
  status: 'active' | 'pending' | 'revoked';
  granted_by: string;
  created_at: string;
  revoked_at: string | null;
}

export interface OwnerComment {
  id: string;
  body: string;
  author: { id: string; name: string | null };
  created_at: string;
  is_mine: boolean;
}

export interface SharedDoc {
  id: string;
  title: string;
  kind: string;
  status: string;
  version: number;
  updated_at: string;
  permission: GrantPermission;
  workspace: { id: string; name: string };
  shared_by: { id: string; name: string | null };
  shared_at: string;
}
export interface SharedDocFull extends SharedDoc {
  sections: DocSection[];
}
export interface SharedComment {
  id: string;
  body: string;
  author: { name: string | null };
  created_at: string;
  is_mine: boolean;
}

export type Viewer = 'pdf' | 'image' | 'text' | 'markdown' | 'csv' | 'docx' | 'xlsx' | 'pptx';
export interface ContentLink {
  url: string;
  expires_at: string;
  content_type: string;
  filename: string;
  viewer: Viewer;
}

type Env<T> = { data?: T };

/** Path segments come from the URL, so encode them: an id can never climb out of its route. */
const enc = encodeURIComponent;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string | null | undefined): v is string => !!v && UUID.test(v);

function qs(params: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v && v.trim()) p.set(k, v.trim());
  const s = p.toString();
  return s ? `?${s}` : '';
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

export interface ListFilters {
  q?: string;
  tag?: string;
  folder?: string;
}

export async function listDocuments(f: ListFilters = {}): Promise<DocSummary[]> {
  const res = await apiClient<Env<{ documents: DocSummary[] }>>(`/documents${qs({ ...f })}`);
  return res?.data?.documents ?? [];
}

export async function listFiles(f: ListFilters = {}): Promise<FileSummary[]> {
  const res = await apiClient<Env<{ files: FileSummary[] }>>(`/documents/files${qs({ ...f })}`);
  return res?.data?.files ?? [];
}

function normaliseTree(t: Partial<FolderTree> | null | undefined): FolderTree {
  return {
    folders: Array.isArray(t?.folders) ? t.folders : [],
    uncategorized: t?.uncategorized ?? 0,
    trash: t?.trash ?? 0,
    total: t?.total ?? 0,
  };
}
export async function getFolders(): Promise<FolderTree> {
  const res = await apiClient<Env<FolderTree>>('/documents/folders');
  return normaliseTree(res?.data);
}
export async function createFolder(name: string, parentId?: string): Promise<FolderTree> {
  const res = await apiClient<Env<FolderTree>>('/documents/folders', json('POST', { name, parent_id: parentId ?? null }));
  return res.data as FolderTree;
}
export async function renameFolder(id: string, name: string): Promise<FolderTree> {
  const res = await apiClient<Env<FolderTree>>(`/documents/folders/${enc(id)}`, json('PATCH', { name }));
  return res.data as FolderTree;
}
export async function deleteFolder(id: string): Promise<FolderTree> {
  const res = await apiClient<Env<FolderTree>>(`/documents/folders/${enc(id)}`, { method: 'DELETE' });
  return res.data as FolderTree;
}
export async function createStandardFolders(): Promise<FolderTree> {
  const res = await apiClient<Env<FolderTree>>('/documents/folders/standard', json('POST'));
  return res.data as FolderTree;
}

export async function createDocument(body: { title?: string; kind?: string; template_key?: string; folder?: string | null }): Promise<DocSummary> {
  const res = await apiClient<Env<DocSummary>>('/documents', json('POST', body));
  return res.data as DocSummary;
}

export interface DocPatch {
  title?: string;
  folder?: string | null;
  tags?: string[];
  status?: string;
}
export async function patchDocument(id: string, patch: DocPatch): Promise<DocSummary> {
  const res = await apiClient<Env<DocSummary>>(`/documents/${enc(id)}`, json('PATCH', patch));
  return res.data as DocSummary;
}
export interface FilePatch {
  filename?: string;
  folder?: string | null;
  tags?: string[];
}
export async function patchFile(id: string, patch: FilePatch): Promise<FileSummary> {
  const res = await apiClient<Env<FileSummary>>(`/documents/files/${enc(id)}`, json('PATCH', patch));
  return res.data as FileSummary;
}

export async function trashDocument(id: string): Promise<void> {
  await apiClient(`/documents/${enc(id)}`, { method: 'DELETE' });
}
export async function trashFile(id: string): Promise<void> {
  await apiClient(`/documents/files/${enc(id)}`, { method: 'DELETE' });
}
export async function getTrash(): Promise<{ documents: DocSummary[]; files: FileSummary[] }> {
  const res = await apiClient<Env<{ documents: DocSummary[]; files: FileSummary[] }>>('/documents/trash');
  return { documents: res?.data?.documents ?? [], files: res?.data?.files ?? [] };
}
export async function restoreDocument(id: string): Promise<void> {
  await apiClient(`/documents/${enc(id)}/restore`, json('POST'));
}
export async function restoreFile(id: string): Promise<void> {
  await apiClient(`/documents/files/${enc(id)}/restore`, json('POST'));
}
export async function deleteDocumentPermanently(id: string): Promise<void> {
  await apiClient(`/documents/${enc(id)}/permanent`, { method: 'DELETE' });
}
export async function deleteFilePermanently(id: string): Promise<void> {
  await apiClient(`/documents/files/${enc(id)}/permanent`, { method: 'DELETE' });
}

export async function listVersions(id: string): Promise<{ versions: VersionRow[]; current: number }> {
  const res = await apiClient<Env<{ versions: VersionRow[]; current: number }>>(`/documents/${enc(id)}/versions`);
  return { versions: res?.data?.versions ?? [], current: res?.data?.current ?? 0 };
}
export async function getVersion(id: string, n: number): Promise<VersionDetail> {
  const res = await apiClient<Env<VersionDetail>>(`/documents/${enc(id)}/versions/${n}`);
  return res.data as VersionDetail;
}
export async function restoreVersion(id: string, n: number): Promise<void> {
  await apiClient(`/documents/${enc(id)}/versions/${n}/restore`, json('POST'));
}

export async function fileContentLink(id: string): Promise<ContentLink> {
  const res = await apiClient<Env<ContentLink>>(`/documents/files/${enc(id)}/content`);
  return res.data as ContentLink;
}
export async function fileDownloadLink(id: string): Promise<{ url: string }> {
  const res = await apiClient<Env<{ url: string }>>(`/documents/files/${enc(id)}/download`);
  return res.data as { url: string };
}

export async function listGrants(documentId: string): Promise<Grant[]> {
  const res = await apiClient<Env<{ grants: Grant[] }>>(`/documents/${enc(documentId)}/grants`);
  return res?.data?.grants ?? [];
}
export async function listAllGrants(): Promise<Grant[]> {
  const res = await apiClient<Env<{ grants: Grant[] }>>('/documents/grants');
  return res?.data?.grants ?? [];
}
export async function createGrant(documentId: string, email: string, permission: GrantPermission): Promise<Grant> {
  const res = await apiClient<Env<Grant>>(`/documents/${enc(documentId)}/grants`, json('POST', { email, permission }));
  return res.data as Grant;
}
export async function updateGrant(documentId: string, grantId: string, permission: GrantPermission): Promise<Grant> {
  const res = await apiClient<Env<Grant>>(`/documents/${enc(documentId)}/grants/${enc(grantId)}`, json('PATCH', { permission }));
  return res.data as Grant;
}
export async function revokeGrant(documentId: string, grantId: string): Promise<void> {
  await apiClient(`/documents/${enc(documentId)}/grants/${enc(grantId)}`, { method: 'DELETE' });
}

export async function listOwnerComments(documentId: string): Promise<OwnerComment[]> {
  const res = await apiClient<Env<{ comments: OwnerComment[] }>>(`/documents/${enc(documentId)}/comments`);
  return res?.data?.comments ?? [];
}
export async function addOwnerComment(documentId: string, body: string): Promise<void> {
  await apiClient(`/documents/${enc(documentId)}/comments`, json('POST', { body }));
}

export async function listSharedWithMe(): Promise<SharedDoc[]> {
  const res = await apiClient<Env<{ documents: SharedDoc[] }>>('/documents/shared-with-me');
  return res?.data?.documents ?? [];
}
export async function getSharedWithMe(id: string): Promise<SharedDocFull> {
  const res = await apiClient<Env<SharedDocFull>>(`/documents/shared-with-me/${enc(id)}`);
  return res.data as SharedDocFull;
}
export async function listSharedComments(id: string): Promise<SharedComment[]> {
  const res = await apiClient<Env<{ comments: SharedComment[] }>>(`/documents/shared-with-me/${enc(id)}/comments`);
  return res?.data?.comments ?? [];
}
export async function addSharedComment(id: string, body: string): Promise<void> {
  await apiClient(`/documents/shared-with-me/${enc(id)}/comments`, json('POST', { body }));
}

/** Roles that get the full library; everyone else lands on Shared with me. */
export function hasFullLibrary(role: string | null | undefined): boolean {
  return role === 'founder' || role === 'team_member';
}

/** Which file types the upload dialog accepts (BE-A allowlist + text/markdown). */
export const UPLOAD_ACCEPT = '.pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.txt,.csv,.md';
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = '15 MB';

// Link shares (BE-D): a link emailed to one person, or "anyone with the link" (no email). Documents and files.
// Editors get the link back on every list ("copy again"), except shares made before BE-D (`link: null`).
export interface ShareLink {
  id: string;
  kind?: 'document' | 'file';
  email: string | null;
  anyone_with_link?: boolean;
  access_level: 'view' | 'comment';
  expires_at: string | null;
  revoked_at: string | null;
  last_viewed_at: string | null;
  created_at: string;
  status: string; // active | revoked | expired
  link?: string | null;
  document_id?: string; // only on the workspace overview
  file_id?: string;
}
export type ShareTarget = { kind: 'document' | 'file'; id: string };
const sharesPath = (t: ShareTarget) => (t.kind === 'file' ? `/documents/files/${enc(t.id)}/shares` : `/documents/${enc(t.id)}/shares`);

export async function listShareLinks(documentId: string): Promise<ShareLink[]> {
  return listLinkShares({ kind: 'document', id: documentId });
}
export async function listLinkShares(t: ShareTarget): Promise<ShareLink[]> {
  const res = await apiClient<Env<{ shares: ShareLink[] }>>(sharesPath(t));
  return res?.data?.shares ?? [];
}
export async function listAllShareLinks(): Promise<ShareLink[]> {
  const res = await apiClient<Env<{ shares: ShareLink[] }>>('/documents/shares');
  return res?.data?.shares ?? [];
}
export interface LinkShareBody {
  /** Omit for "anyone with the link": nothing is emailed. */
  email?: string;
  access_level?: GrantPermission;
  /** ISO date-time in the future, at most 365 days ahead. Wins over expires_in_days. */
  expires_at?: string;
  /** 1 to 365; null never expires; omitted means 30. */
  expires_in_days?: number | null;
}
export async function createLinkShare(t: ShareTarget, body: LinkShareBody): Promise<ShareLink> {
  const res = await apiClient<Env<ShareLink>>(sharesPath(t), json('POST', body));
  return res.data as ShareLink;
}
export async function createShareLink(
  documentId: string,
  email: string,
  accessLevel: GrantPermission,
  expiresInDays: number | null,
): Promise<string | undefined> {
  const s = await createLinkShare({ kind: 'document', id: documentId }, { email, access_level: accessLevel, expires_in_days: expiresInDays });
  return s?.link ?? undefined;
}
export async function setShareExpiry(t: ShareTarget, shareId: string, expiresAt: string | null): Promise<ShareLink> {
  const res = await apiClient<Env<ShareLink>>(`${sharesPath(t)}/${enc(shareId)}`, json('PATCH', { expires_at: expiresAt }));
  return res.data as ShareLink;
}
export async function revokeLinkShare(t: ShareTarget, shareId: string): Promise<void> {
  await apiClient(`${sharesPath(t)}/${enc(shareId)}`, { method: 'DELETE' });
}
export async function revokeShareLink(documentId: string, shareId: string): Promise<void> {
  await revokeLinkShare({ kind: 'document', id: documentId }, shareId);
}

export interface DocFull extends DocSummary {
  sections: DocSection[];
}
export async function getDocument(id: string): Promise<DocFull> {
  const res = await apiClient<Env<DocFull>>(`/documents/${enc(id)}`);
  return res.data as DocFull;
}

export async function uploadFile(file: File, folder?: string | null): Promise<FileSummary> {
  const form = new FormData();
  form.append('file', file);
  if (folder) form.append('folder', folder);
  const res = await apiClient<Env<FileSummary>>('/documents/files', { method: 'POST', body: form });
  return res.data as FileSummary;
}

const ALLOWED_EXT = new Set(['pdf', 'docx', 'xlsx', 'pptx', 'png', 'jpg', 'jpeg', 'txt', 'csv', 'md']);

/** Client-side gate before an upload: returns the problem, or null when the file is fine. */
export function uploadProblem(file: { name: string; size: number }): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXT.has(ext)) {
    return 'That file type isn’t allowed. Upload a PDF, Office doc, image, text, CSV or Markdown file.';
  }
  if (file.size > MAX_UPLOAD_BYTES) return `${file.name} is over the ${MAX_UPLOAD_LABEL} limit.`;
  if (file.size === 0) return `${file.name} is empty.`;
  return null;
}


// ---------------------------------------------------------------------------
// Templates, AI drafts and export (BE-C). Shapes copied from
// cofoundaz-api docs/fe-integration-guide-documents-templates-export.md.
// ---------------------------------------------------------------------------

export type TemplateCategory = 'Legal' | 'Financial' | 'Pitch' | 'Operational';
export const TEMPLATE_CATEGORIES: TemplateCategory[] = ['Legal', 'Financial', 'Pitch', 'Operational'];

export interface TemplateInfo {
  key: string;
  name: string;
  description: string;
  kind: string;
  category: TemplateCategory;
  sections: string[]; // heading strings (form.sections are objects)
  disclaimer: string | null;
}

export type FormSource = 'profile' | 'business_builder' | 'account' | 'system' | 'template' | 'you' | null;

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'longtext' | 'date';
  required: boolean;
  value: string;
  state: 'filled' | 'empty';
  source: FormSource;
  ai_draftable: boolean;
}
export interface FormSection {
  key: string;
  heading: string;
  value: string;
  state: 'filled' | 'empty';
  source: FormSource;
  ai_draftable: boolean;
}
export interface TemplateForm {
  template_key: string;
  fields: FormField[];
  sections: FormSection[];
  unfilled_required: string[];
  disclaimer: string | null;
  ai_available: boolean;
}
export interface TemplateDetail extends TemplateInfo {
  form: TemplateForm;
}

export type AiStatus = 'not_requested' | 'queued' | 'nothing_to_draft' | 'over_budget';
export interface AiRequest {
  status: AiStatus;
  job_id: string | null;
  sections: string[];
}
export interface InstantiateBody {
  title?: string;
  folder?: string | null;
  values?: Record<string, string>;
  ai_draft?: boolean;
  ai_sections?: string[];
}
export interface InstantiateResult {
  document: DocFull;
  form: TemplateForm;
  ai: AiRequest;
}

export async function listTemplates(): Promise<TemplateInfo[]> {
  const res = await apiClient<Env<{ templates: TemplateInfo[] }>>('/document-templates');
  return res?.data?.templates ?? [];
}
export async function getTemplate(key: string): Promise<TemplateDetail> {
  const res = await apiClient<Env<TemplateDetail>>(`/document-templates/${enc(key)}`);
  return res.data as TemplateDetail;
}
export async function instantiateTemplate(key: string, body: InstantiateBody): Promise<InstantiateResult> {
  const res = await apiClient<Env<InstantiateResult>>(`/documents/templates/${enc(key)}/instantiate`, json('POST', body));
  return res.data as InstantiateResult;
}
export async function requestAiDraft(documentId: string, sections?: string[]): Promise<AiRequest> {
  const res = await apiClient<Env<AiRequest>>(`/documents/${enc(documentId)}/ai-draft`, json('POST', sections ? { sections } : {}));
  return res.data as AiRequest;
}

export type DraftResultStatus = 'ready' | 'partial' | 'failed' | 'over_budget' | 'gone';
export interface DraftResult {
  status: DraftResultStatus;
  reason: string | null;
  drafted: string[];
  skipped: string[];
  failed: string[];
  document_version: number | null;
}
export interface JobView {
  id: string;
  type: string;
  status: string; // queued | running | succeeded | failed | cancelled
  result: DraftResult | null;
  error: string | null;
}
export async function getJob(id: string): Promise<JobView> {
  const res = await apiClient<Env<JobView>>(`/jobs/${enc(id)}`);
  return res.data as JobView;
}

export type ExportFormat = 'pdf' | 'docx';
export interface ExportResult {
  file: FileSummary;
  /** true when the API returned the file it already had (HTTP 200), false for a new export (201). */
  existing: boolean;
}
export async function exportDocument(documentId: string, format: ExportFormat): Promise<ExportResult> {
  const res = await apiClientWithStatus<Env<FileSummary>>(`/documents/${enc(documentId)}/export`, json('POST', { format }));
  return { file: res.data.data as FileSummary, existing: res.status === 200 };
}
export async function listExports(documentId: string): Promise<FileSummary[]> {
  const files = await listFiles();
  return files.filter((f) => f.origin === 'export' && f.source_document_id === documentId);
}

/** Human labels for where a prefilled value came from (guide section 2). */
export const SOURCE_LABEL: Record<string, string> = {
  profile: 'From your profile',
  business_builder: 'From Business Builder',
  account: 'From your account',
};
