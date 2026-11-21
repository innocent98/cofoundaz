// Bodies copied verbatim from the live captures in cofoundaz-api/docs (ids, names and times are the
// captures' placeholders). Guide B = fe-integration-guide-analytics-reports.md (e2e/_captures/analytics_reports/),
// guide C = fe-integration-guide-analytics-exports.md (e2e/_captures/analytics_exports/). Only `data` / `error`
// envelopes are kept; nothing is retyped from schemas.
import type { ExportRow, Report, Run } from '@/lib/api/analytics';

/** Guide B: get_mentor.json `data` (first block locked behind Finance). */
export const getMentor = {
  id: '1cdb9c97-21d5-4c24-b4e1-297935df8fe4',
  name: 'Board pack Q4',
  description: 'For the board',
  owner: { id: '08ce6af3-2a2f-4d46-8551-61491778a7ac', name: 'Ada F' },
  template_key: null,
  default_range: { to: null, from: null, range: '30d', compare: 'previous' },
  block_count: 3,
  version: 2,
  can_edit: false,
  can_share: false,
  is_owner: false,
  shared_with_me: true,
  last_run: {
    id: '4af80920-1d48-45c0-b9ac-6a1301da8520',
    status: 'ready',
    as_of: '2026-11-13T16:29:26.309754+00:00',
    error: null,
    created_at: '2026-11-13T16:29:24.392255+00:00',
  },
  created_at: '2026-11-13T16:29:24.328305+00:00',
  updated_at: '2026-11-13T16:29:24.368782+00:00',
  blocks: [
    { id: '64c3aafd', type: 'metric', locked: true, needs: 'finance', needs_label: 'Finance' },
    { id: 'a73f8eca', hub: 'marketing', viz: 'number', type: 'metric', range: null, title: null, metric: 'marketing.clicks', compare: null },
    { id: 'a1ae7466', text: 'Clicks are paid plus organic.', type: 'text', title: 'Note' },
  ],
} as unknown as Report;

/** Guide B: runs_list.json `data.runs`. */
export const runsList = [
  {
    id: '4af80920-1d48-45c0-b9ac-6a1301da8520',
    report_id: '1cdb9c97-21d5-4c24-b4e1-297935df8fe4',
    status: 'ready',
    triggered_by: 'manual',
    period: { from: '2026-10-15', to: '2026-11-13' },
    tz: 'UTC',
    run_by: { id: '08ce6af3-2a2f-4d46-8551-61491778a7ac', name: 'Ada F' },
    as_of: '2026-11-13T16:29:26.309754+00:00',
    error: null,
    created_at: '2026-11-13T16:29:24.392255+00:00',
  },
] as unknown as Run[];

/** Guide B: founder_run_as_mentor.json `data` (the founder's run read by the mentor: revenue locked). */
export const founderRunAsMentor = {
  id: '4af80920-1d48-45c0-b9ac-6a1301da8520',
  report_id: '1cdb9c97-21d5-4c24-b4e1-297935df8fe4',
  status: 'ready',
  triggered_by: 'manual',
  period: { from: '2026-10-15', to: '2026-11-13' },
  tz: 'UTC',
  run_by: { id: '08ce6af3-2a2f-4d46-8551-61491778a7ac', name: 'Ada F' },
  as_of: '2026-11-13T16:29:26.309754+00:00',
  error: null,
  created_at: '2026-11-13T16:29:24.392255+00:00',
  snapshot: {
    report: {
      name: 'Board pack Q4',
      range: { to: '2026-11-13', from: '2026-10-15', range: 'custom', compare: 'previous' },
      blocks: [
        { id: '64c3aafd', type: 'metric', locked: true, needs: 'finance', needs_label: 'Finance' },
        { id: 'a73f8eca', hub: 'marketing', viz: 'number', type: 'metric', range: null, title: null, metric: 'marketing.clicks', compare: null },
        { id: 'a1ae7466', text: 'Clicks are paid plus organic.', type: 'text', title: 'Note' },
      ],
      description: 'For the board',
    },
    results: [
      { id: '64c3aafd', type: 'metric', locked: true, needs: 'finance', needs_label: 'Finance' },
      {
        hub: 'marketing',
        viz: 'number',
        type: 'metric',
        title: null,
        result: {
          hub: 'marketing',
          key: 'marketing.clicks',
          good: 'up',
          kind: 'flow',
          unit: 'count',
          as_of: '2026-11-13T16:29:24.303790+00:00',
          label: 'Clicks',
          value: 50,
          period: { to: '2026-11-13', from: '2026-10-15' },
          series: [],
          status: 'ok',
          compare: { delta: null, value: null, period: { to: '2026-10-14', from: '2026-09-15' }, delta_pct: null },
          currency: null,
          hub_path: '/marketing',
          definition: 'Recorded clicks across channels.',
          source_note: 'Marketing metrics',
        },
        block_id: 'a73f8eca',
      },
      { text: 'Clicks are paid plus organic.', type: 'text', title: 'Note', block_id: 'a1ae7466' },
    ],
  },
} as unknown as Run;

/** Guide B: accountant_run.json `data.snapshot.results` (marketing locked, revenue 500000 kobo). */
export const accountantRunResults = [
  {
    hub: 'finance',
    viz: 'line',
    type: 'metric',
    title: null,
    result: {
      hub: 'finance',
      key: 'finance.revenue',
      good: 'up',
      kind: 'flow',
      unit: 'money',
      as_of: '2026-11-13T16:29:24.291697+00:00',
      label: 'Revenue',
      value: 500000,
      period: { to: '2026-11-13', from: '2026-10-15' },
      series: [
        { to: '2026-10-21', from: '2026-10-15', value: 0 },
        { to: '2026-10-28', from: '2026-10-22', value: 0 },
        { to: '2026-11-04', from: '2026-10-29', value: 0 },
        { to: '2026-11-11', from: '2026-11-05', value: 500000 },
        { to: '2026-11-13', from: '2026-11-12', value: 0 },
      ],
      status: 'ok',
      compare: { delta: 500000, value: 0, period: { to: '2026-10-14', from: '2026-09-15' }, delta_pct: null },
      currency: 'NGN',
      hub_path: '/finance',
      definition: 'Money in from customers over the period. Funding and payout transfers are excluded.',
      source_note: 'Finance ledger',
    },
    block_id: '64c3aafd',
  },
  { id: 'a73f8eca', type: 'metric', locked: true, needs: 'marketing', needs_label: 'Marketing' },
  { text: 'Clicks are paid plus organic.', type: 'text', title: 'Note', block_id: 'a1ae7466' },
] as unknown as NonNullable<Run['snapshot']>['results'];

/** Guide B: patch.json `data` (an editable report, version 2). */
export const patchedReport = {
  id: '1cdb9c97-21d5-4c24-b4e1-297935df8fe4',
  name: 'Board pack Q4',
  description: 'For the board',
  owner: { id: '08ce6af3-2a2f-4d46-8551-61491778a7ac', name: 'Ada F' },
  template_key: null,
  default_range: { to: null, from: null, range: '30d', compare: 'previous' },
  block_count: 3,
  version: 2,
  can_edit: true,
  can_share: true,
  is_owner: true,
  shared_with_me: false,
  last_run: null,
  created_at: '2026-11-13T16:29:24.328305+00:00',
  updated_at: '2026-11-13T16:29:24.368782+00:00',
  share_count: 0,
  blocks: [
    { id: '64c3aafd', hub: 'finance', viz: 'line', type: 'metric', range: null, title: null, metric: 'finance.revenue', compare: null },
    { id: 'a73f8eca', hub: 'marketing', viz: 'number', type: 'metric', range: null, title: null, metric: 'marketing.clicks', compare: null },
    { id: 'a1ae7466', text: 'Clicks are paid plus organic.', type: 'text', title: 'Note' },
  ],
} as unknown as Report;

/** Guide B: patch_stale_409.json. */
export const patchStale409 = {
  error: { code: 'VERSION_CONFLICT', message: 'Someone else changed this report. Reload it and apply your change again.', field_errors: [] },
};

/** Guide C: report_pdf_start.json `data`. */
export const reportPdfStart = {
  id: '3d735a2c-c0b4-4e11-9ded-593f451909ec',
  name: 'Board pack',
  artifact_type: 'report',
  format: 'pdf',
  status: 'pending',
  report_id: '4c077691-ad9b-4d89-8650-6458b0792c87',
  run_id: '41927536-2aca-4687-97d1-35e66bd0463c',
  period: { to: '2026-11-13', from: '2026-10-15' },
  metrics: null,
  filename: null,
  size_bytes: null,
  download_count: 0,
  download_path: null,
  error: null,
  created_by: { id: '09061ddd-1de2-42a9-b61d-3b074b80a7cf', name: 'Ada F' },
  created_at: '2026-11-13T20:28:35.131924+00:00',
  ready_at: null,
  expires_at: '2026-12-13T20:28:35.141301+00:00',
} as unknown as ExportRow;

/** Guide C: report_pdf_ready.json `data`. */
export const reportPdfReady = {
  id: '3d735a2c-c0b4-4e11-9ded-593f451909ec',
  name: 'Board pack',
  artifact_type: 'report',
  format: 'pdf',
  status: 'ready',
  report_id: '4c077691-ad9b-4d89-8650-6458b0792c87',
  run_id: '41927536-2aca-4687-97d1-35e66bd0463c',
  period: { to: '2026-11-13', from: '2026-10-15' },
  metrics: null,
  filename: 'Board pack 2026-10-15 to 2026-11-13.pdf',
  size_bytes: 2202,
  download_count: 0,
  download_path: '/api/v1/analytics/exports/3d735a2c-c0b4-4e11-9ded-593f451909ec/download',
  error: null,
  created_by: { id: '09061ddd-1de2-42a9-b61d-3b074b80a7cf', name: 'Ada F' },
  created_at: '2026-11-13T20:28:35.131924+00:00',
  ready_at: '2026-11-13T20:28:36.593708+00:00',
  expires_at: '2026-12-13T20:28:35.141301+00:00',
} as unknown as ExportRow;

/** Guide C: get_expired.json `data`. */
export const getExpired = {
  id: '3d735a2c-c0b4-4e11-9ded-593f451909ec',
  name: 'Board pack',
  artifact_type: 'report',
  format: 'pdf',
  status: 'expired',
  report_id: '4c077691-ad9b-4d89-8650-6458b0792c87',
  run_id: '41927536-2aca-4687-97d1-35e66bd0463c',
  period: { to: '2026-11-13', from: '2026-10-15' },
  metrics: null,
  filename: null,
  size_bytes: null,
  download_count: 1,
  download_path: null,
  error: null,
  created_by: { id: '09061ddd-1de2-42a9-b61d-3b074b80a7cf', name: 'Ada F' },
  created_at: '2026-11-13T20:28:35.131924+00:00',
  ready_at: '2026-11-13T20:28:36.593708+00:00',
  expires_at: '2026-11-13T20:27:37.112999+00:00',
} as unknown as ExportRow;

/** Guide C: download_expired_410.json. */
export const downloadExpired410 = {
  error: { code: 'EXPORT_EXPIRED', message: 'This export expired. Generate it again.', field_errors: [] },
};

/** Guide C: list_empty.json `data`, used as the list envelope with captured rows. */
export const exportListEnvelope = { exports: [] as ExportRow[], total: 0, limit: 50, offset: 0, retention_days: 30 };
