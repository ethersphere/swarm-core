import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { badges, parseBenchmarksByFile } from './lib/parse-bench-report.mjs'

const [, , reportPath] = process.argv
if (!reportPath) {
  console.error('Usage: node check-bench-regression.mjs <fresh-report.json>')
  process.exit(2)
}

const tolerance = Number(process.env.BENCH_TOLERANCE ?? '0.1')
const shouldUpdate = process.env.UPDATE_BENCH_BASELINE === '1'

// A baseline is only meaningful compared against the same kind of machine that
// recorded it - a laptop's numbers don't transfer to a CI runner or vice versa.
// (CI itself doesn't rely on this fixture at all - see compare-bench-reports.mjs,
// which diffs a fresh master run against a fresh branch run in the same job.)
const currentEnv = {
  platform: process.platform,
  arch: process.arch,
  ci: Boolean(process.env.CI),
}

function envsMatch(a, b) {
  return a && a.platform === b.platform && a.arch === b.arch && a.ci === b.ci
}

function describeEnv(env) {
  return `${env.platform}/${env.arch}${env.ci ? ' (CI)' : ' (local)'}`
}

// One baseline fixture per *.bench.ts file, so each component's perf contract
// is its own small, independently committed file rather than one shared blob.
function baselinePathFor(benchFileName) {
  const name = benchFileName.replace(/\.bench\.[cm]?[jt]s$/, '')
  return join('test', 'vectors', `${name}.bench-baseline.json`)
}

const benchmarksByFile = parseBenchmarksByFile(reportPath)
if (benchmarksByFile.size === 0) {
  console.error(`No benchmark results found in ${reportPath}`)
  process.exit(2)
}

let anyFailed = false

for (const [fileName, benchmarks] of benchmarksByFile) {
  const fixturePath = baselinePathFor(fileName)
  const baseline = existsSync(fixturePath) ? JSON.parse(readFileSync(fixturePath, 'utf8')) : {}
  const updated = { ...baseline, _env: currentEnv }

  if (baseline._env && !envsMatch(baseline._env, currentEnv) && !shouldUpdate) {
    console.error(
      `${badges.warn} ${fileName} :: baseline was recorded on ${describeEnv(baseline._env)}, ` +
        `this run is on ${describeEnv(currentEnv)} - percentages below are not a meaningful regression signal.`,
    )
  }

  for (const benchmark of benchmarks) {
    const current = { mean: benchmark.mean, hz: benchmark.hz }
    const previous = baseline[benchmark.name]

    if (!previous || shouldUpdate) {
      updated[benchmark.name] = current
      console.log(
        `${fileName} :: "${benchmark.name}" - ${previous ? 'updated' : 'recorded'} baseline at ` +
          `${current.mean.toFixed(4)}ms/op (${current.hz.toFixed(0)} ops/sec) on ${describeEnv(currentEnv)}`,
      )
      continue
    }

    const ratio = current.mean / previous.mean
    const percentChange = (ratio - 1) * 100
    const direction = percentChange >= 0 ? 'slower' : 'faster'
    const line =
      `${fileName} :: "${benchmark.name}": ${current.mean.toFixed(4)}ms/op vs baseline ${previous.mean.toFixed(4)}ms/op ` +
      `(${Math.abs(percentChange).toFixed(1)}% ${direction}, tolerance ${(tolerance * 100).toFixed(0)}%)`

    if (ratio > 1 + tolerance) {
      console.error(`${badges.fail} ${line}`)
      anyFailed = true
    } else {
      console.log(`${badges.pass} ${line}`)
    }
  }

  mkdirSync(dirname(fixturePath), { recursive: true })
  writeFileSync(fixturePath, JSON.stringify(updated, null, 2) + '\n')
}

if (anyFailed) {
  console.error(
    '\nOne or more benchmarks regressed beyond tolerance. Re-run with UPDATE_BENCH_BASELINE=1 if the slowdown is expected.',
  )
  process.exit(1)
}
