import { bench } from 'vitest'
import { MantarayNode } from '../src/mantaray/node.js'

// A directory-shaped tree with 100 files - large enough to exercise the full
// 256-slot fork bitmap scan and the xorCypher pass over every fork's bytes,
// not just a single-entry node.
const root = new MantarayNode()
for (let i = 0; i < 100; i++) {
  root.addFork(`assets/file-${i}.txt`, new Uint8Array(32).fill(i % 256))
}

bench('MantarayNode.marshal 100-file directory', async () => {
  await root.marshal()
})
