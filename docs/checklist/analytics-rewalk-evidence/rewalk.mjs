// Lead's every-control RE-WALK of Analytics wave 1 on merged develop (FE :3011 -> scratch API :8031).
// Forked from analytics-fe-walk-evidence/walk.mjs; added: legal advisor, zero-analytics-request check for denied
// roles, sidebar-hidden check, saved downloads (contents checked by files.py), Load more, polling, API-equals-screen.
// Usage: node walk.mjs <evidenceDir> <usersJson> [roles,comma] [widths,comma]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(path.resolve('package.json')); // run from the FE repo root
const { chromium, expect } = require('@playwright/test');

const [evDir, usersPath, rolesArg, widthsArg] = process.argv.slice(2);
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
const BASE = 'http://localhost:3011';
const ROLES = (rolesArg || 'founder,team_member,accountant,mentor,business_consultant,investor,legal_advisor').split(',');
const WIDTHS = (widthsArg || '1440,375').split(',').map(Number);
fs.mkdirSync(path.join(evDir, 'downloads'), { recursive: true });
let CUR = {};
const results = [];
process.on('unhandledRejection', () => {});
const T = 20_000;

async function step(ctx, name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ ...ctx, step: name, ok: true, ms: Date.now() - t0, note: ctx.note }); delete ctx.note;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    results.push({ ...ctx, step: name, ok: false, error: String(e.message || e).split('\n').slice(0, 6).join(' ').slice(0, 600) });
    console.log(`  ✗ ${name}: ${String(e.message || e).split('\n')[0].slice(0, 200)}`);
  }
}

async function shot(page, ctx, name) {
  const f = `${ctx.role}-${ctx.width}-${name}.jpg`;
  await page.screenshot({ path: path.join(evDir, f), fullPage: true, type: 'jpeg', quality: 55, clip: undefined });
  return f;
}

async function login(page, role) {
  await page.goto(`${BASE}/login`);
  await page.getByPlaceholder('you@startup.com').fill(users[role].email);
  await page.getByPlaceholder('••••••••').fill(users[role].password);
  await page.keyboard.press('Enter');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: T });
}

async function gotoAnalytics(page, p = '') {
  await page.goto(`${BASE}/analytics-reports${p}`);
  await page.waitForLoadState('networkidle').catch(() => {});
}

const mobile = (w) => w < 640;
const narrow = (w) => w < 1024;

async function noHorizontalScroll(page) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (over > 1) throw new Error(`page scrolls sideways by ${over}px`);
}

async function waitExportReady(page) {
  // The menu turns into "Download XYZ" once the job is done.
  const dl = page.getByRole('button', { name: /^Download (PDF|XLSX|CSV)$/ }).filter({ visible: true }).first();
  await dl.waitFor({ timeout: 60_000 });
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: T }), dl.click()]);
  const name = download.suggestedFilename();
  if (!name) throw new Error('no filename');
  await download.saveAs(path.join(evDir, 'downloads', `${CUR.role}-${CUR.width}-${CUR.n = (CUR.n || 0) + 1}-${name}`));
  return name;
}

// ---------------------------------------------------------------- founder / team member

async function overviewWriter(page, c, w) {
  await step(c, 'overview loads with cards', async () => {
    await gotoAnalytics(page);
    await expect(page.getByRole('heading', { name: 'How the business is doing' })).toBeVisible({ timeout: T });
    await expect(page.getByRole('article', { name: 'Revenue' }).first()).toBeVisible({ timeout: T });
  });
  await step(c, 'Revenue card equals API (777,700 kobo = ₦7,777)', async () => {
    await expect(page.getByRole('article', { name: 'Revenue' }).filter({ visible: true }).first()).toContainText('7,777');
  });
  await shot(page, c, 'overview');
  await step(c, 'no sideways scroll', () => noHorizontalScroll(page));
  for (const label of ['7 days', '90 days', '12 months', 'This month', 'Last month', '30 days']) {
    await step(c, `range pill ${label}`, async () => {
      const btn = page.getByRole('group', { name: 'Period' }).getByRole('button', { name: label, exact: true });
      const resp = page.waitForResponse((r) => r.url().includes('/analytics/overview'), { timeout: T });
      await btn.click();
      await resp;
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
    });
  }
  await step(c, 'custom range needs both dates, then refetches', async () => {
    await page.getByRole('group', { name: 'Period' }).getByRole('button', { name: 'Custom', exact: true }).click();
    await expect(page.getByText('Pick both dates to update the numbers.')).toBeVisible();
    await page.locator('#ov-from').fill('2026-10-01');
    const resp = page.waitForResponse((r) => r.url().includes('/analytics/overview') && r.url().includes('range=custom'), { timeout: T });
    await page.locator('#ov-to').fill('2026-11-15');
    await resp;
  });
  await step(c, 'compare select (year, then previous)', async () => {
    let resp = page.waitForResponse((r) => r.url().includes('compare=year'), { timeout: T });
    await page.locator('#ov-compare').selectOption('year');
    await resp;
    resp = page.waitForResponse((r) => r.url().includes('compare=previous'), { timeout: T });
    await page.locator('#ov-compare').selectOption('previous');
    await resp;
    await page.getByRole('group', { name: 'Period' }).getByRole('button', { name: '30 days', exact: true }).click();
    await page.waitForResponse((r) => r.url().includes('/analytics/overview') && r.url().includes('range=30d'), { timeout: T });
  });
  await step(c, 'definition tooltip button', async () => {
    const b = page.getByRole('button', { name: 'What Revenue means' }).filter({ visible: true }).first();
    await b.focus();
    await expect(page.getByRole('tooltip').filter({ visible: true }).first()).toBeVisible();
  });
  await step(c, 'chart "Show as a table"', async () => {
    await page.getByText('Show as a table').filter({ visible: true }).first().click();
    await expect(page.locator('table').filter({ visible: true }).first()).toBeVisible();
  });
  await step(c, 'insight source link goes to hub', async () => {
    const src = page.getByRole('link', { name: 'Source' }).filter({ visible: true }).first();
    if ((await src.count()) === 0) return; // no notes for this range
    await expect(src).toHaveAttribute('href', /^\/(finance|sales|marketing|validation|health|mission|roadmap)/);
  });
  await step(c, 'card hub link targets hub', async () => {
    await expect(page.getByRole('article', { name: 'Revenue' }).filter({ visible: true }).first().getByRole('link', { name: /Open Finance/ })).toHaveAttribute('href', '/finance');
  });
  await step(c, 'no link into hidden Funding', async () => {
    if ((await page.locator('a[href^="/funding"]').count()) > 0) throw new Error('found a /funding link');
  });
  for (const hub of ['Finance', 'Marketing', 'All hubs']) {
    await step(c, `by-hub pill ${hub}`, async () => {
      const resp = page.waitForResponse((r) => r.url().includes('/analytics/by-hub'), { timeout: T });
      await page.getByRole('group', { name: 'Filter by hub' }).getByRole('button', { name: hub, exact: true }).click();
      await resp;
    });
  }
  await step(c, 'custom metric: add, enter value, delete', async () => {
    const label = `Walk metric ${c.role} ${w}`;
    await page.getByRole('button', { name: 'Add a metric' }).click();
    await page.locator('#cm-label').fill(label);
    await page.locator('#cm-unit').selectOption('count');
    await page.getByRole('button', { name: 'Add metric' }).click();
    await expect(page.getByRole('dialog', { name: `Enter ${label}` })).toBeVisible({ timeout: T });
    await page.locator('#cv-value').fill('abc');
    await page.getByRole('button', { name: 'Save value' }).click();
    await expect(page.getByText('Enter a whole, non-negative number.')).toBeVisible();
    await page.locator('#cv-value').fill('42');
    await page.getByRole('button', { name: 'Save value' }).click();
    await expect(page.getByText(`42 in`)).toBeVisible({ timeout: T });
    await page.getByRole('button', { name: `Delete ${label}` }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: `Delete ${label}` }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('button', { name: `Delete ${label}` })).toHaveCount(0, { timeout: T });
  });
  await step(c, '"Edit values" on a custom card jumps to the panel', async () => {
    const a = page.getByRole('link', { name: 'Edit values' }).filter({ visible: true }).first();
    await expect(a).toHaveAttribute('href', '#custom-metrics');
  });
  await step(c, 'benchmarks card (Health cohort)', async () => {
    await expect(page.getByRole('heading', { name: 'Benchmarks' })).toBeVisible();
    await expect(page.getByText(/Not enough peers yet|percentile/)).toBeVisible({ timeout: T });
  });
  await step(c, 'Export data ▾ CSV → ready → download', async () => {
    await page.getByRole('button', { name: /Export data/ }).click();
    await page.getByRole('menuitem', { name: 'CSV' }).click();
    const name = await waitExportReady(page);
    if (!name.endsWith('.csv')) throw new Error(`got ${name}`);
  });
  await shot(page, c, 'overview-after');
}

async function savedWriter(page, c, w, reportName) {
  await step(c, 'reports list loads', async () => {
    await gotoAnalytics(page, '/saved');
    await expect(page.getByRole('heading', { name: 'Reports', exact: true })).toBeVisible({ timeout: T });
    await expect(page.getByText(reportName).filter({ visible: true }).first()).toBeVisible({ timeout: T });
  });
  await shot(page, c, 'saved');
  await step(c, 'no sideways scroll (list)', () => noHorizontalScroll(page));
  await step(c, 'search filters', async () => {
    const resp = page.waitForResponse((r) => r.url().includes('/analytics/reports?') && r.url().includes('q='), { timeout: T });
    await page.locator('#rep-q').fill('zzz-none');
    await resp;
    await expect(page.getByText('No reports match')).toBeVisible({ timeout: T });
    await page.locator('#rep-q').fill('');
    await expect(page.getByText(reportName).filter({ visible: true }).first()).toBeVisible({ timeout: T });
  });
  await step(c, 'sort select', async () => {
    const resp = page.waitForResponse((r) => r.url().includes('sort=name'), { timeout: T });
    await page.locator('#rep-sort').selectOption('name');
    await resp;
    await page.locator('#rep-sort').selectOption('updated');
  });
  const scope = mobile(w) ? page.locator('ul[aria-label="Reports"]') : page.locator('table');
  await step(c, 'duplicate a report', async () => {
    await scope.getByRole('button', { name: `Duplicate ${reportName}` }).filter({ visible: true }).first().click();
    await expect(page.getByText(`Copy of ${reportName}`).filter({ visible: true }).first()).toBeVisible({ timeout: T });
  });
  await step(c, 'delete: cancel, then delete the copy', async () => {
    await scope.getByRole('button', { name: `Delete Copy of ${reportName}` }).filter({ visible: true }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await scope.getByRole('button', { name: `Delete Copy of ${reportName}` }).filter({ visible: true }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete report' }).click();
    await expect(scope.getByRole('button', { name: `Delete Copy of ${reportName}` })).toHaveCount(0, { timeout: T });
  });
}

async function shareAll(page, c, w, reportName) {
  await step(c, 'share dialog: shows locked hubs, saves members', async () => {
    const scope = mobile(w) ? page.locator('ul[aria-label="Reports"]') : page.locator('table');
    await scope.getByRole('button', { name: `Share ${reportName}` }).filter({ visible: true }).first().click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.getByText(/Will see locked blocks: Finance/).filter({ visible: true }).first()).toBeVisible({ timeout: T });
    for (const box of await dlg.getByRole('checkbox').all()) if (!(await box.isChecked())) await box.check();
    await dlg.getByRole('button', { name: 'Save sharing' }).click();
    await expect(page.getByText(/Shared with \d/).filter({ visible: true }).first()).toBeVisible({ timeout: T });
  });
}

async function detailWriter(page, c, w, reportId, opts) {
  await step(c, 'report detail loads', async () => {
    await gotoAnalytics(page, `/saved/${reportId}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: T });
  });
  await step(c, 'Run now → frozen run shown', async () => {
    await page.getByRole('button', { name: /Run now/ }).filter({ visible: true }).first().click();
    await expect(page.getByText(/Numbers as of/)).toBeVisible({ timeout: 60_000 });
  });
  await shot(page, c, 'report-run');
  await step(c, 'no sideways scroll (detail)', () => noHorizontalScroll(page));
  await step(c, 'pick an older run in the list', async () => {
    const runs = page.getByRole('region', { name: 'Runs' }).getByRole('button');
    if ((await runs.count()) > 1) await runs.nth(1).click();
    await expect(page.getByText(/Numbers as of/)).toBeVisible({ timeout: T });
  });
  await step(c, 'Export ▾ PDF → ready → download', async () => {
    await page.getByRole('button', { name: /^Export/ }).click();
    await page.getByRole('menuitem', { name: /PDF/ }).click();
    const name = await waitExportReady(page);
    if (!name.endsWith('.pdf')) throw new Error(`got ${name}`);
  });
  if (opts.canShare) {
    await step(c, 'Share button on detail opens dialog', async () => {
      await page.getByRole('button', { name: 'Share', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    });
  } else {
    await step(c, 'no Share button', async () => expect(page.getByRole('button', { name: 'Share', exact: true })).toHaveCount(0));
  }
  if (opts.canShare) {
    await step(c, 'Edit link opens builder', async () => {
      await page.getByRole('link', { name: 'Edit' }).click();
      await page.waitForURL(/\/builder\//, { timeout: T });
    });
  } else {
    await step(c, "no Edit on the founder's report (can_edit false)", async () => expect(page.getByRole('link', { name: 'Edit' })).toHaveCount(0));
    await step(c, "builder URL of the founder's report is refused", async () => {
      await gotoAnalytics(page, `/builder/${reportId}`);
      await expect(page.getByText(/You can read this report but not change it/)).toBeVisible({ timeout: T });
    });
  }
}

async function builderWriter(page, c, w) {
  const name = `Walk report ${c.role} ${w}`;
  await step(c, 'builder new: template chips + empty copy', async () => {
    await gotoAnalytics(page, '/builder/new');
    await expect(page.getByText('Add a metric from the list to start.')).toBeVisible({ timeout: T });
    await expect(page.getByRole('button', { name: /Weekly operating review/ })).toBeVisible({ timeout: T });
  });
  await shot(page, c, 'builder-empty');
  await step(c, 'save without a name is refused', async () => {
    await page.getByRole('button', { name: 'Save report' }).click();
    await expect(page.getByText('Give the report a name.')).toBeVisible();
  });
  await step(c, 'template chip fills the canvas', async () => {
    await page.getByRole('button', { name: /Weekly operating review/ }).click();
    if (narrow(w)) await expect(page.getByRole('tab', { name: /2\. Canvas \(5\)/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('button', { name: /Move .* up/ })).toHaveCount(5);
  });
  await step(c, 'name and description inputs', async () => {
    await page.locator('#rep-name').fill(name);
    await page.locator('#rep-desc').fill('Walk test');
  });
  await step(c, 'catalog: search and add a metric', async () => {
    if (narrow(w)) await page.getByRole('tab', { name: '1. Metrics' }).click();
    await page.locator('#cat-q').fill('revenue');
    await page.getByRole('button', { name: /^Revenue/ }).filter({ visible: true }).first().click();
    await page.locator('#cat-q').fill('');
  });
  await step(c, 'catalog: add a text note → config opens', async () => {
    if (narrow(w)) await page.getByRole('tab', { name: '1. Metrics' }).click();
    await page.getByRole('button', { name: 'Add a text note' }).click();
    await page.locator('#tb-title').fill('Context');
    await page.locator('#tb-text').fill('Walk note.');
  });
  await step(c, 'block config: title, viz, period, compare', async () => {
    if (narrow(w)) await page.getByRole('tab', { name: /2\. Canvas/ }).click();
    await page.getByRole('button', { name: /^Revenue/ }).filter({ visible: true }).first().click();
    if (narrow(w)) await expect(page.getByRole('tab', { name: '3. Block settings' })).toHaveAttribute('aria-selected', 'true');
    await page.locator('#mb-title').fill('Revenue (walk)');
    await page.locator('#mb-viz').selectOption('line');
    await page.locator('#mb-range').selectOption('custom');
    await page.locator('#mb-from').fill('2026-10-01');
    await page.locator('#mb-to').fill('2026-11-15');
    await page.locator('#mb-range').selectOption('90d');
    await page.locator('#mb-compare').selectOption('year');
    await page.locator('#mb-metric').selectOption({ label: 'Revenue' });
  });
  await step(c, 'canvas: move up/down, duplicate, remove', async () => {
    if (narrow(w)) await page.getByRole('tab', { name: /2\. Canvas/ }).click();
    await page.getByRole('button', { name: 'Move Revenue (walk) up' }).click();
    await page.getByRole('button', { name: 'Move Revenue (walk) down' }).click();
    await page.getByRole('button', { name: 'Duplicate Revenue (walk)' }).click();
    await expect(page.getByRole('button', { name: 'Remove Revenue (walk)' })).toHaveCount(2);
    await page.getByRole('button', { name: 'Remove Revenue (walk)' }).filter({ visible: true }).first().click();
    await expect(page.getByRole('button', { name: 'Remove Revenue (walk)' })).toHaveCount(1);
  });
  await step(c, 'drag and drop reorders', async () => {
    if (narrow(w)) return; // touch layouts use the arrow buttons
    const items = page.locator('ol > li[draggable="true"]');
    const first = await items.nth(0).innerText();
    await items.nth(0).dragTo(items.nth(2));
    const after = await items.nth(0).innerText();
    if (after === first) throw new Error('order did not change');
  });
  await step(c, 'Preview shows live numbers', async () => {
    await page.getByRole('button', { name: 'Preview' }).click();
    await expect(page.getByRole('heading', { name: /^Preview ·/ })).toBeVisible({ timeout: T });
  });
  await shot(page, c, 'builder-preview');
  await step(c, 'close preview', async () => {
    await page.getByRole('button', { name: 'Close preview' }).click();
    await expect(page.getByRole('heading', { name: /^Preview ·/ })).toHaveCount(0);
  });
  await step(c, 'Export disabled until saved', async () => {
    await expect(page.getByRole('button', { name: /^Export/ })).toBeDisabled();
    await expect(page.getByText('Save the report first.')).toBeVisible();
  });
  await step(c, 'report period pills', async () => {
    await page.getByRole('group', { name: 'Report period' }).getByRole('button', { name: '90 days', exact: true }).click();
    await page.locator('#rep-compare').selectOption('none');
  });
  await step(c, 'Save creates the report', async () => {
    await page.getByRole('button', { name: 'Save report' }).click();
    await page.waitForURL(/\/builder\/[0-9a-f-]{36}$/, { timeout: T });
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible({ timeout: T });
  });
  await step(c, 'edit → unsaved hint → save again (PATCH)', async () => {
    await page.locator('#rep-desc').fill('Walk test, edited');
    await expect(page.getByText('You have unsaved changes.')).toBeVisible();
    await page.getByRole('button', { name: 'Save report' }).click();
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible({ timeout: T });
  });
  await step(c, 'Export ▾ XLSX from the builder', async () => {
    await page.getByRole('button', { name: /^Export/ }).click();
    await page.getByRole('menuitem', { name: /XLSX/ }).click();
    const n = await waitExportReady(page);
    if (!n.endsWith('.xlsx')) throw new Error(`got ${n}`);
  });
  await step(c, 'Back to the report link', async () => {
    await page.getByRole('link', { name: 'Back to the report' }).click();
    await page.waitForURL(/\/saved\/[0-9a-f-]{36}$/, { timeout: T });
  });
}

async function exportsWriter(page, c, w, opts) {
  await step(c, 'exports page loads with history', async () => {
    await gotoAnalytics(page, '/exports');
    await expect(page.getByRole('heading', { name: 'Export history' })).toBeVisible({ timeout: T });
  });
  await shot(page, c, 'exports');
  await step(c, 'no sideways scroll (exports)', () => noHorizontalScroll(page));
  await step(c, 'filter select (reports, data tables, everything)', async () => {
    for (const v of ['report', 'data_tables', 'all']) {
      const resp = page.waitForResponse((r) => r.url().includes('/analytics/exports?'), { timeout: T });
      await page.locator('#exp-filter').selectOption(v);
      await resp;
    }
  });
  await step(c, 'data tables: empty pick refused', async () => {
    await page.getByRole('button', { name: 'Make data tables' }).click();
    await expect(page.getByText('Pick at least one metric.')).toBeVisible();
  });
  await step(c, 'data tables: pick, period, format, metadata → ready', async () => {
    const boxes = page.locator('fieldset input[type="checkbox"]');
    await boxes.nth(0).check();
    if ((await boxes.count()) > 1) await boxes.nth(1).check();
    await page.getByRole('group', { name: 'Data tables period' }).getByRole('button', { name: '90 days', exact: true }).click();
    await page.locator('#dt-format').selectOption('csv');
    await page.locator('#dt-meta').uncheck();
    await page.locator('#dt-meta').check();
    const polls = [];
    const onReq = (r) => { if (/\/analytics\/exports\/[0-9a-f-]{36}$/.test(r.url())) polls.push(r.url()); };
    page.on('request', onReq);
    const created = page.waitForResponse((r) => r.url().endsWith('/analytics/exports/data-tables') && r.status() === 202, { timeout: T });
    await page.getByRole('button', { name: 'Make data tables' }).click();
    const newId = (await (await created).json()).data.id;
    const row = page.locator(mobile(w) ? `#exp-m-${newId}` : `#exp-t-${newId}`);
    await expect(row.getByText('Ready')).toBeVisible({ timeout: 60_000 });
    page.off('request', onReq);
    if (polls.length < 1) throw new Error('no GET /exports/{id} poll seen');
    c.note = `polled ${polls.length}x`;
  });
  if (c.role === 'founder') {
    await step(c, 'history Load more fetches offset=50 and adds rows', async () => {
      await page.locator('#exp-filter').selectOption('all');
      const scope = mobile(w) ? page.locator('ul[aria-label="Exports"] > li') : page.locator('table tbody tr');
      await expect(scope.first()).toBeVisible({ timeout: T });
      const before = await scope.count();
      const resp = page.waitForResponse((r) => r.url().includes('/analytics/exports?') && r.url().includes('offset=50'), { timeout: T });
      await page.getByRole('button', { name: /Load more/ }).click();
      await resp;
      await expect.poll(() => scope.count(), { timeout: T }).toBeGreaterThan(before);
    });
  }
  await step(c, 'history row Download (authorised fetch)', async () => {
    const scope = mobile(w) ? page.locator('ul[aria-label="Exports"]') : page.locator('table');
    const [d] = await Promise.all([page.waitForEvent('download', { timeout: T }), scope.getByRole('button', { name: /^Download / }).filter({ visible: true }).first().click()]);
    if (!d.suggestedFilename()) throw new Error('no filename');
  });
  for (const expiredId of opts.expired || []) {
    const opts2 = { expiredId };
    await step(c, `expired row (${expiredId.slice(0, 8)}) says "Expired. Generate it again." and regenerates`, async () => {
      await gotoAnalytics(page, `/exports?highlight=${opts2.expiredId}`);
      const row = page.locator(mobile(w) ? `#exp-m-${opts2.expiredId}` : `#exp-t-${opts2.expiredId}`);
      await expect(row.getByText('Expired. Generate it again.')).toBeVisible({ timeout: T });
      await row.getByRole('button', { name: 'Generate again' }).click();
      await expect(page.getByText('Generating it again')).toBeVisible({ timeout: T });
    });
  }
}

// ---------------------------------------------------------------- readers

async function readerShared(page, c, w, reportId, reportName, opts) {
  await step(c, 'Overview: ' + (opts.overview ? 'finance only' : 'redirects to shared reports'), async () => {
    await gotoAnalytics(page);
    if (opts.overview) {
      await expect(page.getByRole('article', { name: 'Revenue' }).first()).toBeVisible({ timeout: T });
      await expect(page.getByRole('article', { name: 'Open pipeline' })).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Entered by you' })).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Benchmarks' })).toHaveCount(0);
      const pills = await page.getByRole('group', { name: 'Filter by hub' }).getByRole('button').allInnerTexts();
      if (pills.join('|') !== 'All hubs|Finance') throw new Error(`pills: ${pills.join('|')}`);
    } else {
      await page.waitForURL(/\/analytics-reports\/saved$/, { timeout: T });
    }
  });
  await shot(page, c, 'landing');
  await step(c, 'no sideways scroll (landing)', () => noHorizontalScroll(page));
  await step(c, 'tabs match role', async () => {
    const nav = page.getByRole('navigation', { name: 'Analytics sections' });
    if (opts.overview) await expect(nav.getByRole('link')).toHaveText(['Overview', 'Reports', 'Exports']);
    else await expect(nav).toHaveCount(0);
  });
  await step(c, 'shared list: read-only, no New report', async () => {
    await gotoAnalytics(page, '/saved');
    await expect(page.getByRole('heading', { name: 'Reports shared with you' })).toBeVisible({ timeout: T });
    await expect(page.getByText(reportName).filter({ visible: true }).first()).toBeVisible({ timeout: T });
    await expect(page.getByRole('button', { name: /New report/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: new RegExp(`^(Share|Delete|Duplicate) `) })).toHaveCount(0);
  });
  await shot(page, c, 'shared-list');
  await step(c, 'open shared report: frozen run with locks, never numbers', async () => {
    await page.getByRole('link', { name: 'Open' }).filter({ visible: true }).first().click();
    await page.waitForURL(new RegExp(`/saved/${reportId}$`), { timeout: T });
    await expect(page.getByText(/Numbers as of/)).toBeVisible({ timeout: T });
    for (const lock of opts.locks) await expect(page.getByText(`${lock} access needed`).filter({ visible: true }).first()).toBeVisible();
    for (const v of opts.mustSee || []) await expect(page.getByText(v).filter({ visible: true }).first()).toBeVisible();
    for (const hidden of opts.mustNotSee) {
      if ((await page.getByText(hidden).count()) > 0) throw new Error(`leaked ${hidden}`);
    }
  });
  await shot(page, c, 'shared-report');
  await step(c, 'no sideways scroll (report)', () => noHorizontalScroll(page));
  await step(c, 'no Run, Edit or Share controls', async () => {
    await expect(page.getByRole('button', { name: /Run now/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Edit' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Share', exact: true })).toHaveCount(0);
  });
  if (opts.export) {
    await step(c, 'Export ▾ warns about locked blocks, PDF of the run → download', async () => {
      await page.getByRole('button', { name: /^Export/ }).click();
      await expect(page.getByText(/will be locked in the file/)).toBeVisible();
      await page.getByRole('menuitem', { name: /PDF of the selected run/ }).click();
      const n = await waitExportReady(page);
      if (!n.endsWith('.pdf')) throw new Error(`got ${n}`);
    });
  } else {
    await step(c, 'no Export menu', async () => expect(page.getByRole('button', { name: /^Export/ })).toHaveCount(0));
  }
  await step(c, 'builder is refused', async () => {
    await gotoAnalytics(page, '/builder/new');
    await expect(page.getByText(/Only founders and team members build reports/)).toBeVisible({ timeout: T });
  });
  await step(c, opts.export ? 'exports page: own exports + finance-only data tables' : 'exports page refused', async () => {
    await gotoAnalytics(page, '/exports');
    if (opts.export) {
      await expect(page.getByRole('heading', { name: 'Export history' })).toBeVisible({ timeout: T });
      const hubs = await page.locator('fieldset p').allInnerTexts();
      if (hubs.join('|') !== 'Finance') throw new Error(`data-table hubs: ${hubs.join('|')}`);
    } else {
      await expect(page.getByText(/Exports are for founders, team members and accountants/)).toBeVisible({ timeout: T });
    }
  });
  await shot(page, c, 'exports');
}

async function denied(page, c, analyticsReqs) {
  analyticsReqs.length = 0;
  for (const p of ['', '/saved', '/exports', '/builder/new']) {
    await step(c, `denied ${p || '/'}`, async () => {
      await gotoAnalytics(page, p);
      await expect(page.getByText("You don't have access to this page.")).toBeVisible({ timeout: T });
    });
  }
  await shot(page, c, 'denied');
  await step(c, 'zero /analytics requests in the network log', async () => {
    if (analyticsReqs.length) throw new Error(`saw ${analyticsReqs.length}: ${analyticsReqs.slice(0, 3).join(' ')}`);
  });
}

async function sidebarHidden(page, c) {
  await step(c, 'sidebar has no Analytics entry', async () => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle').catch(() => {});
    if (mobile(c.width)) {
      const menu = page.getByRole('button', { name: /open (the )?menu|menu/i }).first();
      if (await menu.count()) await menu.click().catch(() => {});
    }
    const n = await page.locator('a[href^="/analytics-reports"]').count();
    const t = await page.getByRole('link', { name: /Analytics/i }).count();
    if (n || t) throw new Error(`found ${n} analytics hrefs, ${t} Analytics links`);
  });
}

// ---------------------------------------------------------------- main

const cfg = JSON.parse(fs.readFileSync(path.join(path.dirname(usersPath), 'walk-config.json'), 'utf8'));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const role of ROLES) {
  for (const width of WIDTHS) {
    const c = { role, width };
    console.log(`\n== ${role} @ ${width}`);
    const context = await browser.newContext({ viewport: { width, height: width < 640 ? 812 : 900 }, acceptDownloads: true });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
    const analyticsReqs = [];
    page.on('request', (r) => r.url().includes('/api/v1/analytics') && analyticsReqs.push(`${r.method()} ${r.url()}`));
    CUR = { role, width };
    await step(c, 'login', () => login(page, role));
    await sidebarHidden(page, c);
    if (role === 'founder' || role === 'team_member') {
      await overviewWriter(page, c, width);
      await savedWriter(page, c, width, cfg.reportName);
      if (role === 'founder') await shareAll(page, c, width, cfg.reportName);
      else await step(c, 'no Share button for team member', async () => expect(page.getByRole('button', { name: /^Share / })).toHaveCount(0));
      await detailWriter(page, c, width, cfg.reportId, { canShare: role === 'founder' });
      await builderWriter(page, c, width);
      await exportsWriter(page, c, width, { expired: cfg.expired?.[role] });
    } else if (role === 'accountant') {
      await readerShared(page, c, width, cfg.reportId, cfg.reportName, { overview: true, export: true, locks: ['Marketing'], mustNotSee: ['Marketing metrics', 'Open Marketing', '4,321', '4321'], mustSee: ['7,777'] });
    } else if (role === 'mentor' || role === 'business_consultant') {
      await readerShared(page, c, width, cfg.reportId, cfg.reportName, { overview: false, export: false, locks: ['Finance'], mustNotSee: ['₦', '7,777', 'Finance ledger', 'Open Finance'], mustSee: ['4,321'] });
    } else {
      await denied(page, c, analyticsReqs);
    }
    const real = consoleErrors.filter((e) => !/favicon|Download the React DevTools|\[HMR\]|status of 40[34]/.test(e));
    results.push({ ...c, step: 'console errors', ok: real.length === 0, error: real.slice(0, 3).join(' | ') || undefined });
    await context.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(evDir, `results-${ROLES.join('_')}-${WIDTHS.join('_')}.json`), JSON.stringify(results, null, 2));
const fails = results.filter((r) => !r.ok);
console.log(`\n${results.length - fails.length}/${results.length} passed`);
for (const f of fails) console.log(`FAIL ${f.role}@${f.width} ${f.step}: ${f.error}`);
