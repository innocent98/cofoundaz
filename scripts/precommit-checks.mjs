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
  'gray|slate|zinc|neutral|stone|orange|amber|yellow|lime|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const PROPS =
  'bg|text|border|ring|from|to|via|divide|fill|stroke|placeholder|caret|outline|decoration|accent';

// [label, regex] — kept in sync with ui/tokens.test.ts.
const RULES = [
  ['default palette — use sage / green / copper / red tokens', new RegExp(`\\b(?:${PROPS})-(?:${DEFAULT_HUES})-\\d+\\b`)],
  ['sm: prefix — base styles ARE the small-screen design; use md:', /\bsm:/],
  ['cleared radius — use rounded-input/card/modal/pill (or rounded-[Npx])', /\brounded-(?:sm|md|lg|xl|2xl|3xl|4xl)\b/],
  ['cleared shadow — use shadow-card/raised/accent', /\bshadow-(?:sm|md|lg|xl|2xl|inner)\b/],
  ['cleared font — use font-display / font-body', /\bfont-(?:sans|serif|mono)\b/],
];

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
if (files.length === 0) process.exit(0);

let violations = 0;
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

// ESLint on the staged files (array args → safe with (parens) and & in paths).
const eslint = spawnSync('npx', ['--no-install', 'eslint', ...files], { stdio: 'inherit', shell: true });

if (violations > 0 || eslint.status !== 0) {
  console.error(
    `\nCommit blocked (${violations} token violation(s)${
      eslint.status !== 0 ? ' + ESLint errors' : ''
    }). Fix the above, or bypass with: git commit --no-verify\n`
  );
  process.exit(1);
}
