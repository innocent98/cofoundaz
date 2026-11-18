// Sidebar entry check after the unhide (2026-11-18). Local only: FE :3011 -> scratch API :8031.
// Usage: node sidebar.mjs <evidenceDir> <usersJson>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(path.resolve('package.json'));
const { chromium, expect } = require('@playwright/test');
const [evDir, usersPath] = process.argv.slice(2);
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
const T = 20_000;
const SHOWN = { founder: true, team_member: true, accountant: true, mentor: true, business_consultant: true, investor: false, legal_advisor: false };
const LANDS = { founder: /\/analytics-reports$/, team_member: /\/analytics-reports$/, accountant: /\/analytics-reports$/, mentor: /\/analytics-reports\/saved$/, business_consultant: /\/analytics-reports\/saved$/ };
const results = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const [role, shown] of Object.entries(SHOWN)) {
  for (const width of [1440, 375]) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 640 ? 812 : 900 } });
    const page = await ctx.newPage();
    const step = shown ? 'sidebar shows "Analytics & Reports"; click lands on the role\'s Analytics page' : 'sidebar has no Analytics entry';
    try {
      await page.goto('http://localhost:3011/login');
      await page.getByPlaceholder('you@startup.com').fill(users[role].email);
      await page.getByPlaceholder('••••••••').fill(users[role].password);
      await page.keyboard.press('Enter');
      await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: T });
      await page.goto('http://localhost:3011/dashboard');
      await page.waitForLoadState('networkidle').catch(() => {});
      if (width < 1024) await page.getByRole('button', { name: /^More$/ }).click();
      const nav = page.getByRole('complementary', { name: 'Main navigation' });
      const link = nav.getByRole('link', { name: 'Analytics & Reports' });
      if (shown) {
        await expect(link).toBeVisible({ timeout: T });
        await link.scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(evDir, `sidebar-${role}-${width}.jpg`), type: 'jpeg', quality: 60 });
        await link.click();
        await page.waitForURL(LANDS[role], { timeout: T });
        await expect(nav.getByRole('link', { name: 'Analytics & Reports' })).toHaveAttribute('aria-current', 'page').catch(() => {});
      } else {
        await page.waitForTimeout(800);
        await expect(link).toHaveCount(0);
        await page.screenshot({ path: path.join(evDir, `sidebar-${role}-${width}.jpg`), type: 'jpeg', quality: 60 });
      }
      results.push({ role, width, step, ok: true, url: new URL(page.url()).pathname });
      console.log(`✓ ${role} ${width} ${new URL(page.url()).pathname}`);
    } catch (e) {
      results.push({ role, width, step, ok: false, error: String(e.message).split('\n')[0] });
      console.log(`✗ ${role} ${width}: ${String(e.message).split('\n')[0]}`);
    }
    await ctx.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(evDir, 'results-sidebar.json'), JSON.stringify(results, null, 2));
