import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as clientModule from './client';
import {
  PublicUnsubscribeError,
  archiveSequence,
  confirmUnsubscribe,
  createSequence,
  enrollInSequence,
  enrollSummary,
  followUpSendMessage,
  getUnsubscribeStatus,
  listEnrollments,
  listSequences,
  markEnrollmentReplied,
  previewTemplate,
  replyRateLabel,
  requestStepDraft,
  resumeSending,
  sendFollowUp,
  unknownTags,
  updateSequence,
  waitLabel,
} from './sales';

vi.mock('./client', () => {
  class ApiError extends Error {
    constructor(
      public status: number,
      public statusText: string,
      public data: unknown
    ) {
      super(`API Error ${status}: ${statusText}`);
    }
  }
  return { apiClient: vi.fn(), ApiError, API_BASE: '/api/v1' };
});

const api = () => vi.mocked(clientModule.apiClient);
const ApiErr = clientModule.ApiError;
const ok = <T,>(data: T) => ({ data, meta: null });
const init = (call: number) => api().mock.calls[call][1] as RequestInit;

beforeEach(() => vi.clearAllMocks());

describe('sequence requests', () => {
  it('lists, creates, patches and archives under /sales/sequences', async () => {
    api().mockResolvedValue(ok({ items: [], total: 0, limit: 100, offset: 0 }));
    await listSequences({ limit: 100 });
    expect(api().mock.calls[0][0]).toBe('/sales/sequences?limit=100');

    api().mockResolvedValue(ok({ id: 's1' }));
    const input = { name: 'Cold intro', stop_on_stage_change: true, steps: [{ wait_days: 0, subject: 's', body: 'b' }] };
    await createSequence(input);
    expect(api().mock.calls[1][0]).toBe('/sales/sequences');
    expect(init(1).method).toBe('POST');
    expect(JSON.parse(init(1).body as string)).toEqual(input);

    await updateSequence('s1', { status: 'paused' });
    expect(init(2).method).toBe('PATCH');
    expect(JSON.parse(init(2).body as string)).toEqual({ status: 'paused' });

    await archiveSequence('s1');
    expect(api().mock.calls[3][0]).toBe('/sales/sequences/s1');
    expect(init(3).method).toBe('DELETE');
  });

  it('enrols leads and contacts, marks replied, and filters enrollments by status', async () => {
    api().mockResolvedValue(ok({ enrolled: 1, enrollments: [], skipped: [] }));
    await enrollInSequence('s1', { lead_ids: ['l1'] });
    expect(api().mock.calls[0][0]).toBe('/sales/sequences/s1/enroll');
    expect(JSON.parse(init(0).body as string)).toEqual({ lead_ids: ['l1'] });
    await markEnrollmentReplied('e1');
    expect(api().mock.calls[1][0]).toBe('/sales/enrollments/e1/replied');
    await listEnrollments('s1', { status: 'bounced', limit: 20, offset: 0 });
    expect(api().mock.calls[2][0]).toBe('/sales/sequences/s1/enrollments?status=bounced&limit=20&offset=0');
  });

  it('asks for a step draft with optional instructions and resumes sending with POST', async () => {
    api().mockResolvedValue(ok({}));
    await requestStepDraft('s1', 1);
    expect(api().mock.calls[0][0]).toBe('/sales/sequences/s1/steps/1/write');
    expect(JSON.parse(init(0).body as string)).toEqual({});
    await requestStepDraft('s1', 0, 'Short');
    expect(JSON.parse(init(1).body as string)).toEqual({ instructions: 'Short' });
    await resumeSending();
    expect(api().mock.calls[2][0]).toBe('/sales/sending/resume');
    expect(init(2).method).toBe('POST');
  });

  it('sends a follow-up with draft id, subject and body', async () => {
    api().mockResolvedValue(ok({ sent: true }));
    await sendFollowUp('d1', { draft_id: 'x', subject: 'S', body: 'B' });
    expect(api().mock.calls[0][0]).toBe('/sales/deals/d1/follow-up/send');
    expect(JSON.parse(init(0).body as string)).toEqual({ draft_id: 'x', subject: 'S', body: 'B' });
  });
});

describe('public unsubscribe', () => {
  const fetchMock = vi.fn();
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));

  it('GETs the status with a JSON Accept header and no auth', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ok({ email: 'a***@prospect.example', sender: 'NovaPay', unsubscribed: false }) });
    const s = await getUnsubscribeStatus('tok/en');
    expect(s.sender).toBe('NovaPay');
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/public/sales/unsubscribe/tok%2Fen');
    expect(opts).toMatchObject({ method: 'GET', headers: { Accept: 'application/json' } });
  });

  it('POSTs the confirmation and surfaces a 404 as PublicUnsubscribeError', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ok({ email: 'a***@p.example', sender: 'N', unsubscribed: true }) });
    expect((await confirmUnsubscribe('t')).unsubscribed).toBe(true);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
    const failure = await getUnsubscribeStatus('forged').catch((e) => e);
    expect(failure).toBeInstanceOf(PublicUnsubscribeError);
    expect(failure.status).toBe(404);
  });
});

describe('sequence helpers', () => {
  it('finds merge tags the API would reject', () => {
    expect(unknownTags('Hi {{first_name}} at {{ company }} {{nope}} {{x1}}')).toEqual(['nope', 'x1']);
    expect(unknownTags('Hi {{first_name}}')).toEqual([]);
  });

  it('previews known tags and leaves unknown ones alone; missing values render empty', () => {
    const sample = { first_name: 'Ada', last_name: 'Test', company: 'Acme', sender_name: 'You' };
    expect(previewTemplate('Hi {{first_name}} from {{company}} {{other}}', sample)).toBe('Hi Ada from Acme {{other}}');
    expect(previewTemplate('Quick idea for {{company}}', { ...sample, company: '' })).toBe('Quick idea for ');
  });

  it('words waits, reply rate and enrol summaries', () => {
    expect(waitLabel(0, true)).toBe('Sends as soon as they are enrolled');
    expect(waitLabel(0, false)).toBe('Sends the same day as the step before');
    expect(waitLabel(1, false)).toBe('Sends 1 day after the step before');
    expect(waitLabel(3, false)).toBe('Sends 3 days after the step before');
    expect(replyRateLabel(0.3333)).toBe('33.3% reply rate');
    expect(replyRateLabel(0)).toBe('0% reply rate');
    expect(enrollSummary({ enrolled: 1, enrollments: [], skipped: [] })).toBe('1 person enrolled');
    expect(enrollSummary({ enrolled: 3, enrollments: [], skipped: [{ id: 'x', reason: 'no_email' }] })).toBe('3 people enrolled, 1 skipped');
  });

  it('turns send failures into what the member should do', () => {
    const err = (status: number, code: string, message: string) =>
      new ApiErr(status, 'x', { error: { code, message, field_errors: [] } });
    expect(followUpSendMessage(err(503, 'SEND_UNCERTAIN', 'm'))).toMatch(/may have been delivered/);
    expect(followUpSendMessage(err(409, 'SENDING_NOT_CONFIGURED', "Sending isn't set up yet."))).toBe("Sending isn't set up yet.");
    expect(followUpSendMessage(err(429, 'SEND_LIMIT_REACHED', 'Daily limit reached.'))).toBe('Daily limit reached.');
  });
});
