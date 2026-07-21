import { copyFileSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// tsc emits one set of .d.ts (+.d.ts.map) declarations, shared by both the
// ESM and CJS JS output since our public types don't differ between formats.
// Under Node16/NodeNext moduleResolution, a consumer importing the .cjs
// build via require() needs a matching .d.cts twin, or TypeScript treats it
// as a dual-package hazard (ESM types resolved for a CommonJS file) and
// refuses to type-check the import. This duplicates each declaration file,
// rewriting its import specifiers and sourcemap reference from .js/.d.ts.map
// to .cjs/.d.cts.map so the twin stays internally consistent.
function walk(dir) {
    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry)
        if (statSync(path).isDirectory()) {
            walk(path)
            continue
        }
        if (entry.endsWith('.d.ts')) {
            const content = readFileSync(path, 'utf8')
                .replace(/(['"]\.[^'"]*)\.js(['"])/g, '$1.cjs$2')
                .replace(/\.d\.ts\.map$/m, '.d.cts.map')
            writeFileSync(path.replace(/\.d\.ts$/, '.d.cts'), content)
        } else if (entry.endsWith('.d.ts.map')) {
            copyFileSync(path, path.replace(/\.d\.ts\.map$/, '.d.cts.map'))
        }
    }
}

walk('dist')
