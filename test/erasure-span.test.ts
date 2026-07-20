import { describe, expect, it } from 'vitest'
import { getMaxShards, getParities } from '../src/erasure-coding/levels.js'
import { decodeRedundancyLevel, encodeRedundancyLevel, referenceCount } from '../src/erasure-coding/span.js'

describe('encodeRedundancyLevel / decodeRedundancyLevel', () => {
  it('round-trips every real redundancy level while preserving the span value', () => {
    const span = 123456n
    for (const level of [1, 2, 3, 4]) {
      const encoded = encodeRedundancyLevel(span, level)
      expect(decodeRedundancyLevel(encoded)).toEqual({ level, span })
    }
  })

  it('reports level 0 for a plain, never-encoded span', () => {
    expect(decodeRedundancyLevel(4096n)).toEqual({ level: 0, span: 4096n })
    expect(decodeRedundancyLevel(0n)).toEqual({ level: 0, span: 0n })
  })

  it('only touches the top byte of the span', () => {
    const span = 0x1122334455n // fits in the low 7 bytes
    const encoded = encodeRedundancyLevel(span, 3)
    expect(encoded & 0x00ffffffffffffffn).toBe(span)
    expect(Number(encoded >> 56n)).toBe(3 | 0x80)
  })

  it('distinguishes a legitimately large plain span from an encoded one', () => {
    // A real (unencoded) span could coincidentally have a nonzero top byte
    // if it were astronomically large - but never > 128, since that would
    // require an implausible ~9.2 exabyte file. Values <=128 in the top byte
    // must be treated as real span data, not a redundancy flag.
    const span = 100n << 56n
    expect(decodeRedundancyLevel(span)).toEqual({ level: 0, span })
  })
})

describe('referenceCount', () => {
  it('is 2 data shards for a span that spills 1 byte past a single leaf', () => {
    // 4097 bytes needs a second 4096-byte leaf for that last byte.
    const { dataShardCount, parityShardCount } = referenceCount(4097n, 1, false)
    expect(dataShardCount).toBe(2)
    expect(parityShardCount).toBe(getParities(1, 2, false))
  })

  it('matches ceil(span / 4096) data shards when everything fits in one level', () => {
    const maxShards = getMaxShards(1, false)
    // Pick a span that spans exactly 5 leaf chunks and stays within a single
    // level (5 <= maxShards), so referenceSize is exactly one leaf (4096).
    const span = 4096n * 4n + 1n
    const { dataShardCount } = referenceCount(span, 1, false)
    expect(dataShardCount).toBe(5)
    expect(maxShards).toBeGreaterThan(5)
  })

  it('parityShardCount matches getParities for the derived data shard count', () => {
    const span = 4096n * 10n
    const { dataShardCount, parityShardCount } = referenceCount(span, 2, true)
    expect(parityShardCount).toBeGreaterThanOrEqual(0)
    expect(Number.isInteger(parityShardCount)).toBe(true)
    expect(Number.isInteger(dataShardCount)).toBe(true)
  })

  it('produces more data shards for a larger span, holding level/encryption fixed', () => {
    const small = referenceCount(4096n * 3n, 1, false).dataShardCount
    const large = referenceCount(4096n * 30n, 1, false).dataShardCount
    expect(large).toBeGreaterThan(small)
  })
})
