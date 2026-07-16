import { keccak_256 } from '@noble/hashes/sha3.js'
import { describe, expect, it } from 'vitest'
import { calculateChunkAddress } from '../src/chunk/bmt.js'

// Independent reference implementation of the same documented BMT algorithm
// (bee-js's chunk/bmt.ts doc comment), using @noble/hashes' keccak_256
// instead of our own - a different codebase entirely, so agreement between
// the two is real evidence of correctness, not just self-consistency.
function referenceCalculateChunkAddress(chunkContent: Uint8Array): Uint8Array {
  const span = chunkContent.subarray(0, 8)
  const payload = chunkContent.subarray(8)
  const input = new Uint8Array(4096)
  input.set(payload)

  let segments: Uint8Array[] = []
  for (let i = 0; i < input.length; i += 32) {
    segments.push(input.subarray(i, i + 32))
  }
  while (segments.length > 1) {
    const next: Uint8Array[] = []
    for (let i = 0; i < segments.length; i += 2) {
      const combined = new Uint8Array(64)
      combined.set(segments[i]!, 0)
      combined.set(segments[i + 1]!, 32)
      next.push(keccak_256(combined))
    }
    segments = next
  }

  const combined = new Uint8Array(8 + 32)
  combined.set(span, 0)
  combined.set(segments[0]!, 8)

  return keccak_256(combined)
}

describe('calculateChunkAddress', () => {
  const cases: [string, number][] = [
    ['empty payload', 0],
    ['single byte', 1],
    ['exactly one segment (32 bytes)', 32],
    ['just under a segment boundary (31 bytes)', 31],
    ['just over a segment boundary (33 bytes)', 33],
    ['a full chunk (4096 bytes)', 4096],
  ]

  for (const [label, payloadLength] of cases) {
    it(`matches an independent reference implementation for ${label}`, () => {
      const span = new Uint8Array(8)
      new DataView(span.buffer).setBigUint64(0, BigInt(payloadLength), true)
      const payload = Uint8Array.from({ length: payloadLength }, (_, i) => (i * 31 + 7) % 256)
      const chunkContent = new Uint8Array(8 + payloadLength)
      chunkContent.set(span, 0)
      chunkContent.set(payload, 8)

      const address = calculateChunkAddress(chunkContent)
      const expected = referenceCalculateChunkAddress(chunkContent)
      expect(address.toUint8Array()).toEqual(expected)
    })
  }

  it('is sensitive to a single changed payload byte', () => {
    const a = new Uint8Array(8 + 32)
    const b = new Uint8Array(8 + 32)
    b[8] = 1
    expect(calculateChunkAddress(a).toHex()).not.toBe(calculateChunkAddress(b).toHex())
  })

  it('rejects an over-sized payload', () => {
    const chunkContent = new Uint8Array(8 + 4097)
    expect(() => calculateChunkAddress(chunkContent)).toThrow()
  })
})
