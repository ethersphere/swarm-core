import { existsSync, readFileSync } from 'node:fs'

// package.json's `exports` map is the single source of truth for the public
// subpaths - shared by build.mjs (bundling) and typedoc.config.mjs (docs) so
// neither keeps its own separately hand-maintained entry-point list.
function allEntryPoints() {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    return Object.values(pkg.exports)
        .filter((target) => typeof target === 'object' && target.import)
        .map((target) => target.import.replace(/^\.\/dist\//, 'src/').replace(/\.js$/, '.ts'))
}

// Modules land incrementally - only the barrel files that exist so far are
// returned, rather than failing every consumer until every subpath has one.
export function getEntryPoints() {
    return allEntryPoints().filter(existsSync)
}

export function getSkippedEntryPoints() {
    const entryPoints = getEntryPoints()
    return allEntryPoints().filter((entry) => !entryPoints.includes(entry))
}
