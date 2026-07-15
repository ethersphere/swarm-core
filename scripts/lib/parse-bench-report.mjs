import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

// Groups a `vitest bench --outputJson` report by *source file basename*
// (not full path) - two reports produced from different checkouts (e.g. a
// git worktree for `master` vs the main checkout for a PR branch) will have
// different absolute paths for the same logical bench file.
export function parseBenchmarksByFile(reportPath) {
  const report = JSON.parse(readFileSync(reportPath, 'utf8'))
  const benchmarksByFile = new Map()

  for (const file of report.files ?? []) {
    for (const group of file.groups ?? []) {
      for (const benchmark of group.benchmarks ?? []) {
        const key = basename(file.filepath)
        const list = benchmarksByFile.get(key) ?? []
        list.push(benchmark)
        benchmarksByFile.set(key, list)
      }
    }
  }

  return benchmarksByFile
}

// Jest/Vitest-style solid badges: bold + inverse video (swaps fg/bg) + color.
export const badges = {
  fail: process.stderr.isTTY ? '\x1b[1;7;31m FAIL \x1b[0m' : 'FAIL',
  pass: process.stdout.isTTY ? '\x1b[1;7;32m PASS \x1b[0m' : 'PASS',
  warn: process.stderr.isTTY ? '\x1b[1;7;33m WARN \x1b[0m' : 'WARN',
}
