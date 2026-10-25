#!/usr/bin/env node
/**
 * Pre-commit guard. Runs on staged .ts/.tsx under app/ ui/ components/ and:
 *   1. Scans for design-token violations (mirrors ui/tokens.test.ts, but
 *      staged-only and with inline file:line output so you fix it before it
 *      ever reaches CI or review).
 *   2. Runs ESLint on the same files (fails on errors).
 *
 * The design system (app/globals.css) clears Tailwind's defaults, so these
 * classes compile to nothing — they are always bugs. See docs/dashboard-styling.md.
 *
 * Bypass (discouraged): git commit --no-verify
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const DEFAULT_HUES =
  'gray|slate|zinc|stone|orange|amber|yellow|lime|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const PROPS =
  'bg|text|border|ring|from|to|via|divide|fill|stroke|placeholder|caret|outline|decoration|accent';

// [label, regex] — kept in sync with ui/tokens.test.ts. (The sm: lookahead skips object keys named `sm`, e.g. Button's SIZES.)
const RULES = [
  ['default palette — use neutral / brand / accent / danger tokens', new RegExp(`\\b(?:${PROPS})-(?:${DEFAULT_HUES})-\\d+\\b`)],
  ['sm: prefix — base styles ARE the small-screen design; use md:', /\bsm:(?=[a-z[!-])/],
  ['cleared radius — use rounded-input/card/modal/pill (or rounded-[Npx])', /\brounded-(?:sm|md|lg|xl|2xl|3xl|4xl)\b/],
  ['cleared shadow — use shadow-card/raised/accent', /\bshadow-(?:sm|md|lg|xl|2xl|inner)\b/],
  ['cleared font — use font-display / font-body', /\bfont-(?:sans|serif|mono)\b/],
];

// Colour literals: the only home for a hex / rgb() / hsl() is styles/colour-tokens.css (D38).
// A line that cannot use a token carries `colour-ok: <reason>`; a file can opt out with `colour-ok-file`.
const COLOUR_LITERAL =
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9A-Za-z_-])|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/g;
const COLOUR_FILE = /^(app|ui|components|hooks|lib|styles|content|types)\/.*\.(ts|tsx|css)$/;

function stagedFiles() {
  const out = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM'], {
    encoding: 'utf8',
  });
  return out
    .split('\n')
    .map((f) => f.trim())
    .filter((f) => /^(app|ui|components)\/.*\.(ts|tsx)$/.test(f))
    // Test/spec files legitimately contain these patterns as regex strings.
    .filter((f) => !/\.(test|spec)\.(ts|tsx)$/.test(f))
    .filter((f) => existsSync(f));
}

const files = stagedFiles();

let violations = 0;

const stagedColourFiles = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM'], {
  encoding: 'utf8',
})
  .split('\n')
  .map((f) => f.trim())
  .filter((f) => COLOUR_FILE.test(f) && f !== 'styles/colour-tokens.css')
  .filter((f) => !/\.(test|spec)\.(ts|tsx)$/.test(f))
  .filter((f) => existsSync(f));
for (const file of stagedColourFiles) {
  const text = readFileSync(file, 'utf8');
  if (text.includes('colour-ok-file')) continue;
  text.split('\n').forEach((line, i) => {
    if (line.includes('colour-ok')) return;
    for (const m of line.matchAll(COLOUR_LITERAL)) {
      if (violations === 0) {
        console.error('\n✖ Design-token violations (see docs/dashboard-styling.md):\n');
      }
      violations++;
      console.error(
        `  ${file}:${i + 1}  ${m[0]}  — hard-coded colour; use a token from styles/colour-tokens.css (e.g. text-ink, border-line, bg-brand-700)`
      );
    }
  });
}

if (files.length === 0 && violations === 0) process.exit(0);
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const [label, re] of RULES) {
      const m = line.match(re);
      if (m) {
        if (violations === 0) {
          console.error('\n✖ Design-token violations (see docs/dashboard-styling.md):\n');
        }
        violations++;
        console.error(`  ${file}:${i + 1}  ${m[0]}  — ${label}`);
      }
    }
  });
}

// ESLint on the staged files. Run per-file to prevent V8 zone allocation
// crashes on Windows when analyzing multiple large ASTs in a single invocation.
let eslintStatus = 0;
const eslintPath = './node_modules/eslint/bin/eslint.js';
for (const file of files) {
  const res = existsSync(eslintPath)
    ? spawnSync(process.execPath, [eslintPath, file], { stdio: 'inherit' })
    : spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--no-install', 'eslint', file], {
        stdio: 'inherit',
        shell: process.platform === 'win32',
      });
  if (res.status !== 0) {
    eslintStatus = res.status || 1;
  }
}

if (violations > 0 || eslintStatus !== 0) {
  console.error(
    `\nCommit blocked (${violations} token violation(s)${
      eslintStatus !== 0 ? ' + ESLint errors' : ''
    }). Fix the above, or bypass with: git commit --no-verify\n`
  );
  process.exit(1);
}
