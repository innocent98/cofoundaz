import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const uiRoot = path.resolve(__dirname)
const repoRoot = path.resolve(__dirname, '..')

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walk(full))
      continue
    }
    // Production source only. Some co-located tests deliberately render the
    // app page that composes the sections under test (e.g.
    // ui/marketing/about/about-sections.test.tsx imports the /about page), and
    // a test importing its own consumer is not a runtime coupling.
    if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(full)
  }
  return out
}

const files = walk(uiRoot)

/**
 * Spec §5: "`ui/` and `content/` must not import anything app-specific ...
 * promoting them is a `git mv`."
 *
 * The class-merge helper used to live at `lib/cn.ts`, outside the moved set, so
 * sixteen files under `ui/` would have broken the moment anyone ran
 * `git mv ui packages/ui`. It now lives at `ui/lib/cn.ts`, with `lib/cn.ts`
 * re-exporting it for app-side callers.
 */
describe('ui/ is git-mv portable', () => {
  it('scans every ui/ source file', () => {
    expect(files.length).toBeGreaterThan(30)
  })

  it('never imports from @/lib', () => {
    const hits: string[] = []
    for (const file of files) {
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (/from\s+['"]@\/lib\//.test(line) || /import\(['"]@\/lib\//.test(line)) {
          hits.push(`${path.relative(repoRoot, file)}:${i + 1}  ${line.trim()}`)
        }
      })
    }
    expect(hits).toEqual([])
  })

  it('never imports from app/', () => {
    const hits: string[] = []
    for (const file of files) {
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (/from\s+['"]@\/app\//.test(line)) {
          hits.push(`${path.relative(repoRoot, file)}:${i + 1}  ${line.trim()}`)
        }
      })
    }
    expect(hits).toEqual([])
  })
})
