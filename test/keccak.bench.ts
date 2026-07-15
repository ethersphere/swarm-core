import { bench } from 'vitest'
import { keccak256 } from '../src/crypto/keccak.js'

const input = new Uint8Array(4096).fill(0x42)

bench('keccak256 4096 bytes', () => {
  keccak256(input)
})
