import { badges, parseBenchmarksByFile } from './lib/parse-bench-report.mjs'

const [, , basePath, currentPath, baseLabel = 'base', currentLabel = 'current'] = process.argv
if (!basePath || !currentPath) {
  console.error('Usage: node compare-bench-reports.mjs <base-report.json> <current-report.json> [baseLabel] [currentLabel]')
  process.exit(2)
}

// CI's comparison: both reports are produced by the same job, on the same
// runner, back to back - so unlike the local fixture flow (check-bench-regression.mjs),
// there's no cross-machine baseline problem here to begin with. Looser default
// tolerance than local (10%) since even within one job there's some scheduling noise.
const tolerance = Number(process.env.BENCH_TOLERANCE ?? '0.25')

const baseByFile = parseBenchmarksByFile(basePath)
const currentByFile = parseBenchmarksByFile(currentPath)

if (currentByFile.size === 0) {
  console.error(`No benchmark results found in ${currentPath}`)
  process.exit(2)
}

let anyFailed = false
let anyCompared = false

for (const [fileName, currentBenchmarks] of currentByFile) {
  const baseBenchmarks = baseByFile.get(fileName) ?? []
  const baseByName = new Map(baseBenchmarks.map((b) => [b.name, b]))

  for (const benchmark of currentBenchmarks) {
    const base = baseByName.get(benchmark.name)
    if (!base) {
      console.log(`${fileName} :: "${benchmark.name}" - new benchmark, no ${baseLabel} result to compare against`)
      continue
    }

    anyCompared = true
    const ratio = benchmark.mean / base.mean
    const percentChange = (ratio - 1) * 100
    const direction = percentChange >= 0 ? 'slower' : 'faster'
    const line =
      `${fileName} :: "${benchmark.name}": ${currentLabel} ${benchmark.mean.toFixed(4)}ms/op vs ${baseLabel} ${base.mean.toFixed(4)}ms/op ` +
      `(${Math.abs(percentChange).toFixed(1)}% ${direction}, tolerance ${(tolerance * 100).toFixed(0)}%)`

    if (ratio > 1 + tolerance) {
      console.error(`${badges.fail} ${line}`)
      anyFailed = true
    } else {
      console.log(`${badges.pass} ${line}`)
    }
  }
}

if (!anyCompared) {
  console.error(`No matching benchmarks found between ${baseLabel} and ${currentLabel} reports.`)
  process.exit(2)
}

if (anyFailed) {
  console.error(`\nOne or more benchmarks regressed beyond tolerance vs ${baseLabel}.`)
  process.exit(1)
}
