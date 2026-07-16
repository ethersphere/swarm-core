import { describe, expect, it } from 'vitest'
import { rsEncode } from '../src/erasure-coding/reed-solomon.js'

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
