import { build } from 'esbuild'

// One entry point per subpath export in package.json. Each is bundled
// standalone (not just transpiled) so internal cross-module imports never
// need separate .js/.cjs resolution handling between the two output formats.
const entryPoints = [
    'src/index.ts',
    'src/bytes/index.ts',
    'src/crypto/index.ts',
    'src/chunk/index.ts',
    'src/mantaray/index.ts',
    'src/erasure-coding/index.ts',
    'src/encryption/index.ts',
    'src/stamper/index.ts'
]

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
