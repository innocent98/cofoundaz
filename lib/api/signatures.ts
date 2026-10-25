import { apiClient, API_BASE } from './client';

// E-sign v2 (BE-D). Shapes copied from cofoundaz-api docs/fe-integration-guide-documents-esign-v2.md.
// Editor routes are founder + team member only; the /sign/{token} routes are public.

export type SignerStatus = 'waiting' | 'pending' | 'viewed' | 'signed';
export type RequestStatus = 'awaiting' | 'complete' | 'cancelled' | 'expired';

export interface LinkCopy {
  at: string;
  via: 'created' | 'copied';
  name: string | null;
  email: string | null;
  user_id: string | null;
}
export interface Signer {
  id: string;
  email: string;
  name: string | null;
  position: number;
  status: SignerStatus;
  notified_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  signed_name: string | null;
  signed_ip: string | null;
  signed_user_agent: string | null;
  link_copies: LinkCopy[];
}
export type Executed =
  | null
  | { state: 'pending'; file_id: null; filename: null; size_bytes: null }
  | { state: 'legacy'; file_id: null; filename: null; size_bytes: null }
  | { state: 'ready'; file_id: string; filename: string; size_bytes: number; sha256: string };

export interface SignatureRequest {
  id: string;
  title: string;
  status: RequestStatus;
  file_id: string;
  filename: string;
  signed_count: number;
  total: number;
  sequential: boolean;
  message: string | null;
  sent_at: string | null;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  document_hash: string | null;
  executed: Executed;
  legal_caveat: string;
  signers: Signer[];
  /** Create response only; aligned with `signers`, null = not released yet. */
  signer_links?: (string | null)[];
}

export interface SendBody {
  signers: { email: string; name?: string }[];
  title?: string;
  /** 1 to 365; null = never expires. */
  expires_in_days: number | null;
  sequential: boolean;
  /** Blank means the server's default sentence. */
  message?: string;
}

type Env<T> = { data?: T };
const enc = encodeURIComponent;
const json = (method: string, body?: unknown): RequestInit => ({ method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

/** Fills the BE-D fields a pre-BE-D response lacks, so a half-deployed API shows plain rows instead of crashing the page. */
export function normaliseRequest(r: SignatureRequest): SignatureRequest {
  return {
    ...r,
    sequential: r.sequential ?? false,
    message: r.message ?? null,
    sent_at: r.sent_at ?? r.created_at,
    document_hash: r.document_hash ?? null,
    executed: r.executed ?? null,
    legal_caveat: r.legal_caveat ?? '',
    signers: (r.signers ?? []).map((sg) => ({
      ...sg,
      notified_at: sg.notified_at ?? null,
      viewed_at: sg.viewed_at ?? null,
      link_copies: sg.link_copies ?? [],
    })),
  };
}

export async function listRequests(): Promise<SignatureRequest[]> {
  const res = await apiClient<Env<{ requests: SignatureRequest[] }>>('/documents/signature-requests');
  return (res?.data?.requests ?? []).map(normaliseRequest);
}
export async function getRequest(id: string): Promise<SignatureRequest> {
  const res = await apiClient<Env<SignatureRequest>>(`/documents/signature-requests/${enc(id)}`);
  return normaliseRequest(res.data as SignatureRequest);
}
export async function sendForSignature(fileId: string, body: SendBody): Promise<SignatureRequest> {
  const res = await apiClient<Env<SignatureRequest>>(`/documents/files/${enc(fileId)}/signature-requests`, json('POST', body));
  const created = normaliseRequest(res.data as SignatureRequest);
  return { ...created, signer_links: (res.data as SignatureRequest).signer_links };
}
export async function remindRequest(id: string): Promise<number> {
  const res = await apiClient<Env<{ reminded: number }>>(`/documents/signature-requests/${enc(id)}/remind`, json('POST'));
  return res?.data?.reminded ?? 0;
}
export async function cancelRequest(id: string): Promise<void> {
  await apiClient(`/documents/signature-requests/${enc(id)}/cancel`, json('POST'));
}
export async function copySignerLink(requestId: string, signerId: string): Promise<string> {
  const res = await apiClient<Env<{ signer_id: string; link: string }>>(
    `/documents/signature-requests/${enc(requestId)}/signers/${enc(signerId)}/link`,
  );
  return res.data?.link ?? '';
}
export async function executedLink(requestId: string): Promise<{ url: string; filename: string }> {
  const res = await apiClient<Env<{ url: string; filename: string }>>(`/documents/signature-requests/${enc(requestId)}/executed`);
  return res.data as { url: string; filename: string };
}

// Public signer routes (the token is the credential).
export interface SignView {
  request: { title: string; status: string; message: string | null; sent_by: string | null; sequential: boolean; expires_at: string | null };
  file: { filename: string; content_type: string; size_bytes: number; download_url: string };
  signer: { email: string; name: string | null };
  legal_caveat: string;
}
export interface SignResult {
  id: string;
  title: string;
  status: string;
  signed_count: number;
  total: number;
  completed_at: string | null;
  sequential?: boolean;
  /** Only when this signature completed the request. */
  executed_url?: string;
}
export async function getSignView(token: string): Promise<SignView> {
  const res = await apiClient<Env<SignView>>(`/sign/${enc(token)}`);
  return res.data as SignView;
}
export async function sign(token: string, typedName: string): Promise<SignResult> {
  const res = await apiClient<Env<SignResult>>(`/sign/${enc(token)}`, json('POST', { typed_name: typedName }));
  return res.data as SignResult;
}

/**
 * The signer's own executed copy. Returns a blob when ready, `not_ready` while the worker builds it (409),
 * `gone` for any other 404/410 state. Fetched with the same base as every API call, so the dev proxy applies.
 */
export async function fetchSignerExecuted(token: string): Promise<{ state: 'ready'; blob: Blob; filename: string } | { state: 'not_ready' | 'gone' | 'error' }> {
  try {
    const res = await fetch(`${API_BASE}/sign/${enc(token)}/executed`);
    if (res.status === 409) return { state: 'not_ready' };
    if (res.status === 404) return { state: 'gone' };
    if (!res.ok) return { state: 'error' };
    const cd = res.headers.get('content-disposition') ?? '';
    const m = /filename\*=UTF-8''([^;]+)/i.exec(cd) ?? /filename="([^"]+)"/i.exec(cd);
    const filename = m ? decodeURIComponent(m[1]) : 'signed.pdf';
    return { state: 'ready', blob: await res.blob(), filename };
  } catch {
    return { state: 'error' };
  }
}
