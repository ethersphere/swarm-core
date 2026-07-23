import { describe, expect, it } from 'vitest'
import { rsDecode, rsEncode } from '../src/erasure-coding/reed-solomon.js'

// Build the full index-aligned shard array (data followed by parity), then null
// out the shards at `missing` indices to simulate erasures.
function withErasures(data: Uint8Array[], parity: Uint8Array[], missing: number[]): (Uint8Array | null)[] {
  const shards: (Uint8Array | null)[] = [...data, ...parity]
  for (const i of missing) shards[i] = null
  return shards
}

describe('rsEncode', () => {
  it('returns no parity shards when parityCount is 0', () => {
    expect(rsEncode([Uint8Array.from([1, 2, 3])], 0)).toEqual([])
  })

  it('with a single data shard, every parity shard is an identical copy of it', () => {
    // Hand-derivable property of this specific construction: with dataShards=1,
    // the encoding matrix reduces to all-1s (gfExp(i, 0) === 1 for every row),
    // so parity_i = 1 * data[0] for every i - i.e. plain replication.
    const data = Uint8Array.from([10, 20, 30, 255, 0, 128])
    const parity = rsEncode([data], 4)
    expect(parity).toHaveLength(4)
    for (const shard of parity) {
      expect(shard).toEqual(data)
    }
  })

  it('produces parity shards matching the input shard size', () => {
    const shardSize = 16
    const data = [
      Uint8Array.from({ length: shardSize }, (_, i) => i),
      Uint8Array.from({ length: shardSize }, (_, i) => i * 2),
      Uint8Array.from({ length: shardSize }, (_, i) => i * 3),
    ]
    const parity = rsEncode(data, 2)
    expect(parity).toHaveLength(2)
    for (const shard of parity) {
      expect(shard.length).toBe(shardSize)
    }
  })

  it('is deterministic', () => {
    const data = [Uint8Array.from([1, 2, 3]), Uint8Array.from([4, 5, 6])]
    expect(rsEncode(data, 3)).toEqual(rsEncode(data, 3))
  })

  it('produces different parity for different data (not a trivial constant)', () => {
    const dataA = [Uint8Array.from([1, 2, 3]), Uint8Array.from([4, 5, 6])]
    const dataB = [Uint8Array.from([7, 8, 9]), Uint8Array.from([10, 11, 12])]
    expect(rsEncode(dataA, 1)).not.toEqual(rsEncode(dataB, 1))
  })

  it('produces distinct parity shards from each other for multi-shard data', () => {
    const data = [Uint8Array.from([1, 2, 3]), Uint8Array.from([4, 5, 6])]
    const [p0, p1] = rsEncode(data, 2)
    expect(p0).not.toEqual(p1)
  })
})

describe('rsDecode', () => {
  const data = [
    Uint8Array.from({ length: 16 }, (_, i) => i + 1),
    Uint8Array.from({ length: 16 }, (_, i) => (i + 1) * 3),
    Uint8Array.from({ length: 16 }, (_, i) => (i * 7 + 5) & 0xff),
    Uint8Array.from({ length: 16 }, (_, i) => (i * 11 + 200) & 0xff),
  ]

  it('reconstructs a single missing data shard from parity', () => {
    const parity = rsEncode(data, 2)
    const recovered = rsDecode(withErasures(data, parity, [1]), data.length, parity.length)
    expect(recovered).toEqual(data)
  })

  it('reconstructs up to parityCount missing data shards', () => {
    const parity = rsEncode(data, 3)
    const recovered = rsDecode(withErasures(data, parity, [0, 2, 3]), data.length, parity.length)
    expect(recovered).toEqual(data)
  })

  it('reconstructs data even when some parity shards are also missing', () => {
    const parity = rsEncode(data, 3)
    // 2 data + 1 parity missing => 4 of 7 present == dataCount, still solvable.
    const recovered = rsDecode(withErasures(data, parity, [1, 3, 5]), data.length, parity.length)
    expect(recovered).toEqual(data)
  })

  it('returns the data unchanged when no data shards are missing', () => {
    const parity = rsEncode(data, 2)
    const recovered = rsDecode(withErasures(data, parity, [4]), data.length, parity.length) // only a parity shard missing
    expect(recovered).toEqual(data)
  })

  it('is the exact inverse of rsEncode for every single-shard erasure', () => {
    const parity = rsEncode(data, 2)
    for (let i = 0; i < data.length; i++) {
      const recovered = rsDecode(withErasures(data, parity, [i]), data.length, parity.length)
      expect(recovered).toEqual(data)
    }
  })

  it('throws when fewer than dataCount shards are present (unrecoverable)', () => {
    const parity = rsEncode(data, 2)
    // 3 missing out of (4 data + 2 parity) leaves only 3 < dataCount(4) present.
    expect(() => rsDecode(withErasures(data, parity, [0, 1, 4]), data.length, parity.length)).toThrow()
  })

  it('round-trips full-size (4096-byte) shards', () => {
    const big = Array.from({ length: 5 }, (_, s) => Uint8Array.from({ length: 4096 }, (_, i) => (i * (s + 1) + s) & 0xff))
    const parity = rsEncode(big, 4)
    const recovered = rsDecode(withErasures(big, parity, [0, 4]), big.length, parity.length)
    expect(recovered).toEqual(big)
  })
})
