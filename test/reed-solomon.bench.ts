import { bench } from 'vitest'
import { rsEncode } from '../src/erasure-coding/reed-solomon.js'

const data = Array.from({ length: 4 }, (_, i) => new Uint8Array(4096).fill(i + 1))

bench('rsEncode 4 x 4096-byte shards, 2 parity', () => {
  rsEncode(data, 2)
})
