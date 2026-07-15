import { existsSync, readFileSync } from 'node:fs'
import { build } from 'esbuild'

// package.json's `exports` map is the single source of truth for the public
// subpaths - it has to exist and stay accurate regardless (Node/consumers read
// it statically, with no build step), so entry points are derived from it here
// rather than maintained as a second, separately-hand-kept list.
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const allEntryPoints = Object.values(pkg.exports)
    .filter((target) => typeof target === 'object' && target.import)
    .map((target) => target.import.replace(/^\.\/dist\//, 'src/').replace(/\.js$/, '.ts'))

// Modules land incrementally - only build the barrel files that exist so far
// rather than failing the whole build until every subpath has one.
const entryPoints = allEntryPoints.filter(existsSync)
const skipped = allEntryPoints.filter((entry) => !entryPoints.includes(entry))
if (skipped.length > 0) {
    console.log(`Skipping not-yet-implemented entry points: ${skipped.join(', ')}`)
}

if (entryPoints.length === 0) {
    console.log('No entry points implemented yet - nothing to build.')
    process.exit(0)
}

const shared = {
    entryPoints,
    bundle: true,
    outbase: 'src',
    outdir: 'dist',
    target: 'es2022',
    sourcemap: true,
    external: ['@noble/hashes', '@noble/hashes/*', '@noble/curves', '@noble/curves/*']
}

await build({ ...shared, format: 'esm', platform: 'neutral' })
await build({ ...shared, format: 'cjs', platform: 'node', outExtension: { '.js': '.cjs' } })
