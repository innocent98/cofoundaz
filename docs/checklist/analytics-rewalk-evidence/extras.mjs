// Hand-set states for the re-walk, founder, 1440 + 375. Local scratch stack only (FE :3011 -> API :8031).
// Usage: node extras.mjs <evidenceDir> <usersJson>   (run with the limiter-clearing loop STOPPED)
//  - 409 VERSION_CONFLICT: a PATCH through the API between load and save.
//  - 429 RATE_LIMITED: fill the scratch Redis window keys.
//  - locked-block save refusal: STUBBED. No live role can open the builder on a report holding locked blocks
//    (founder and team member see every hub), so the report GET is intercepted and one locked block appended,
//    exactly the shape the API returns to a reader (`{id,type,locked,needs,needs_label}`).
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(path.resolve('package.json')); // run from the FE repo root
const { chromium, expect } = require('@playwright/test');
const [evDir, usersPath] = process.argv.slice(2);
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
const reportId = users._report;
const API = 'http://127.0.0.1:8031/api/v1';
const results = [];
const T = 20_000;

async function api(method, p, body) {
  const login = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: users.founder.email, password: users.founder.password }) });
  const tok = (await login.json()).data.access_token;
  const r = await fetch(`${API}${p}`, { method, headers: { authorization: `Bearer ${tok}`, 'x-workspace-id': users._workspace, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json() };
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const width of [1440, 375]) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 640 ? 812 : 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3011/login');
  await page.getByPlaceholder('you@startup.com').fill(users.founder.email);
  await page.getByPlaceholder('••••••••').fill(users.founder.password);
  await page.keyboard.press('Enter');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: T });
  const rec = async (step, fn) => {
    try {
      await fn();
      results.push({ role: 'founder', width, step, ok: true });
      console.log(`✓ ${width} ${step}`);
    } catch (e) {
      results.push({ role: 'founder', width, step, ok: false, error: String(e.message).split('\n').slice(0, 4).join(' ') });
      console.log(`✗ ${width} ${step}: ${String(e.message).split('\n')[0]}`);
    }
  };

  await rec('409: stale save shows "Someone else changed this report", no silent retry, Reload loads the new version', async () => {
    await page.goto(`http://localhost:3011/analytics-reports/builder/${reportId}`);
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible({ timeout: T });
    const cur = (await api('GET', `/analytics/reports/${reportId}`)).body.data;
    const p = await api('PATCH', `/analytics/reports/${reportId}`, { version: cur.version, description: `Changed in another tab ${width}` });
    if (p.status !== 200) throw new Error(`patch ${p.status}`);
    const patches = [];
    page.on('request', (r) => r.method() === 'PATCH' && r.url().includes(`/reports/${reportId}`) && patches.push(r.url()));
    await page.locator('#rep-desc').fill('My local change');
    await page.getByRole('button', { name: 'Save report' }).click();
    await expect(page.getByText('Someone else changed this report. Reload it and apply your change again.')).toBeVisible({ timeout: T });
    await page.waitForTimeout(1500);
    if (patches.length !== 1) throw new Error(`expected 1 PATCH, saw ${patches.length}`);
    await page.screenshot({ path: path.join(evDir, `founder-${width}-builder-409.jpg`), type: 'jpeg', quality: 60 });
    await page.getByRole('button', { name: 'Reload' }).click();
    await expect(page.locator('#rep-desc')).toHaveValue(`Changed in another tab ${width}`, { timeout: T });
  });

  await rec('locked-block save refusal (stubbed GET): Save disabled, message shown, no PATCH', async () => {
    await page.route(new RegExp(`/api/v1/analytics/reports/${reportId}$`), async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      const res = await route.fetch();
      const j = await res.json();
      j.data.blocks.push({ id: 'lockstub', type: 'metric', locked: true, needs: 'sales', needs_label: 'Sales' });
      await route.fulfill({ response: res, json: j });
    });
    const patches = [];
    page.on('request', (r) => r.method() === 'PATCH' && r.url().includes(`/reports/${reportId}`) && patches.push(1));
    await page.goto(`http://localhost:3011/analytics-reports/builder/${reportId}`);
    await expect(page.getByText(/Sales block/).filter({ visible: true }).first()).toBeVisible({ timeout: T });
    await page.locator('#rep-desc').fill('Try to save with a lock');
    const save = page.getByRole('button', { name: /Save report|Saved/ });
    await expect(save).toBeDisabled();
    await expect(page.getByText(/can.t be saved|locked blocks/i).filter({ visible: true }).first()).toBeVisible();
    if (patches.length) throw new Error('a PATCH was sent');
    await page.screenshot({ path: path.join(evDir, `founder-${width}-builder-locked-save.jpg`), type: 'jpeg', quality: 60 });
    await page.unroute(new RegExp(`/api/v1/analytics/reports/${reportId}$`));
  });

  await rec('429: heavy-read limit shows the API message with Retry; Retry recovers', async () => {
    const ws = users._workspace;
    const minute = Math.floor(Date.now() / 1000 / 60);
    for (const m of [minute, minute + 1]) execFileSync('docker', ['exec', 'anrw-redis', 'redis-cli', 'set', `analytics:rl:${ws}:${m}`, '1000', 'EX', '120']);
    await page.goto('http://localhost:3011/analytics-reports');
    await expect(page.getByText('Too many report requests. Try again in a minute.').first()).toBeVisible({ timeout: T });
    await page.screenshot({ path: path.join(evDir, `founder-${width}-overview-429.jpg`), type: 'jpeg', quality: 60 });
    for (const m of [minute, minute + 1]) execFileSync('docker', ['exec', 'anrw-redis', 'redis-cli', 'del', `analytics:rl:${ws}:${m}`]);
    await page.getByRole('button', { name: 'Retry' }).first().click();
    await expect(page.getByRole('article', { name: 'Revenue' }).first()).toBeVisible({ timeout: T });
  });
  await ctx.close();
}
for (const width of [1440, 375]) {
  // Accountant: Spreadsheet (XLSX) of the selected run, through the UI; contents checked by files.py.
  const ctx = await browser.newContext({ viewport: { width, height: width < 640 ? 812 : 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const step = 'accountant: Export ▾ XLSX of the selected run → download (contents: files.py)';
  try {
    await page.goto('http://localhost:3011/login');
    await page.getByPlaceholder('you@startup.com').fill(users.accountant.email);
    await page.getByPlaceholder('••••••••').fill(users.accountant.password);
    await page.keyboard.press('Enter');
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: T });
    await page.goto(`http://localhost:3011/analytics-reports/saved/${reportId}`);
    await expect(page.getByText(/Numbers as of/)).toBeVisible({ timeout: T });
    await page.getByRole('button', { name: /^Export/ }).click();
    await page.getByRole('menuitem', { name: /Spreadsheet \(XLSX\) of the selected run/ }).click();
    const dl = page.getByRole('button', { name: /^Download XLSX$/ }).filter({ visible: true }).first();
    await dl.waitFor({ timeout: 60_000 });
    const [d] = await Promise.all([page.waitForEvent('download', { timeout: T }), dl.click()]);
    await d.saveAs(path.join(evDir, 'downloads', `accountant-${width}-x-${d.suggestedFilename()}`));
    results.push({ role: 'accountant', width, step, ok: true });
    console.log(`✓ ${width} ${step}`);
  } catch (e) {
    results.push({ role: 'accountant', width, step, ok: false, error: String(e.message).split('\n')[0] });
    console.log(`✗ ${width} ${step}: ${String(e.message).split('\n')[0]}`);
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(evDir, 'results-extras.json'), JSON.stringify(results, null, 2));
