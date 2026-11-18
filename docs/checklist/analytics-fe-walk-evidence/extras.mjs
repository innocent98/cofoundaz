// 409 VERSION_CONFLICT and 429 RATE_LIMITED states, founder, 1440 + 375. Local scratch stack only.
// Usage: node extras.mjs <evidenceDir> <usersJson> <reportId>   (run with the limiter-clearing loop STOPPED)
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(path.resolve('package.json')); // run from the FE repo root
const { chromium, expect } = require('@playwright/test');
const [evDir, usersPath, reportId] = process.argv.slice(2);
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
const S = path.dirname(usersPath);
const results = [];
const T = 20_000;

function api(method, p, body) {
  const py = process.env.PY;
  return execFileSync(py, ['-I', path.join(S, 'afe_api.py'), 'founder', method, p, JSON.stringify(body)], { encoding: 'utf8' });
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const width of [1440, 375]) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 640 ? 812 : 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3005/login');
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

  await rec('409: stale save shows "Someone else changed this report", Reload loads the new version', async () => {
    await page.goto(`http://localhost:3005/analytics-reports/builder/${reportId}`);
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible({ timeout: T });
    const current = JSON.parse(api('GET', `/analytics/reports/${reportId}`, null).replace(/^\d+ /, '')).data;
    api('PATCH', `/analytics/reports/${reportId}`, { version: current.version, description: `Changed in another tab ${width}` });
    await page.locator('#rep-desc').fill('My local change');
    await page.getByRole('button', { name: 'Save report' }).click();
    await expect(page.getByText('Someone else changed this report. Reload it and apply your change again.')).toBeVisible({ timeout: T });
    await page.screenshot({ path: path.join(evDir, `founder-${width}-builder-409.png`), fullPage: false });
    await page.getByRole('button', { name: 'Reload' }).click();
    await expect(page.locator('#rep-desc')).toHaveValue(`Changed in another tab ${width}`, { timeout: T });
    await expect(page.getByText('Someone else changed this report.')).toHaveCount(0);
  });

  await rec('429: heavy-read limit shows the API message with Retry', async () => {
    const ws = users._workspace;
    const minute = Math.floor(Date.now() / 1000 / 60);
    for (const m of [minute, minute + 1]) {
      execFileSync('docker', ['exec', 'afe-redis', 'redis-cli', 'set', `analytics:rl:${ws}:${m}`, '1000', 'EX', '120']);
    }
    await page.goto('http://localhost:3005/analytics-reports');
    await expect(page.getByText('Too many report requests. Try again in a minute.').first()).toBeVisible({ timeout: T });
    await expect(page.getByRole('button', { name: 'Retry' }).first()).toBeVisible();
    await page.screenshot({ path: path.join(evDir, `founder-${width}-overview-429.png`), fullPage: false });
    for (const m of [minute, minute + 1]) execFileSync('docker', ['exec', 'afe-redis', 'redis-cli', 'del', `analytics:rl:${ws}:${m}`]);
    await page.getByRole('button', { name: 'Retry' }).first().click();
    await expect(page.getByRole('article', { name: 'Revenue' }).first()).toBeVisible({ timeout: T });
  });
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(evDir, 'results-extras.json'), JSON.stringify(results, null, 2));
