import { bench } from 'vitest'
import { calculateChunkAddress } from '../src/chunk/bmt.js'

const span = new Uint8Array(8)
new DataView(span.buffer).setBigUint64(0, 4096n, true)
const payload = new Uint8Array(4096).fill(0x42)
const chunkContent = new Uint8Array(8 + 4096)
chunkContent.set(span, 0)
chunkContent.set(payload, 8)

bench('calculateChunkAddress full 4096-byte chunk', () => {
  calculateChunkAddress(chunkContent)
})
