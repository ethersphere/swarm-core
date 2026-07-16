import { describe, expect, it } from 'vitest'
import { getMaxShards, getParities } from '../src/erasure-coding/levels.js'

describe('getParities', () => {
  it('returns 0 for level NONE (0) regardless of shard count', () => {
    expect(getParities(0, 100, false)).toBe(0)
  })

  it('returns 0 for an out-of-range level', () => {
    expect(getParities(5, 100, false)).toBe(0)
  })

  it('returns 0 below the smallest threshold', () => {
    expect(getParities(1, 0, false)).toBe(0)
  })

  it('picks the parity count for the first threshold met, MEDIUM level', () => {
    // MEDIUM (unencrypted) thresholds: [95, 69, 47, 29, 15, 6, 2, 1] -> parities [9, 8, 7, 6, 5, 4, 3, 2]
    expect(getParities(1, 95, false)).toBe(9)
    expect(getParities(1, 94, false)).toBe(8)
    expect(getParities(1, 1, false)).toBe(2)
  })

  it('uses a different (smaller-shard) table when encrypted', () => {
    // encMEDIUM thresholds: [47, 34, 23, 14, 7, 3, 1] -> parities [9, 8, 7, 6, 5, 4, 3]
    expect(getParities(1, 47, true)).toBe(9)
    expect(getParities(1, 46, true)).toBe(8)
  })
})

describe('getMaxShards', () => {
  it('returns the full branch count for level NONE (0)', () => {
    expect(getMaxShards(0, false)).toBe(128)
    expect(getMaxShards(0, true)).toBe(64)
  })

  it('subtracts the parity count from the branch count when unencrypted', () => {
    // getParities(1, 128, false) === 9 (128 >= 95 threshold)
    expect(getMaxShards(1, false)).toBe(128 - 9)
  })

  it('halves the remaining capacity after parity when encrypted', () => {
    // getParities(1, 64, true) === 9 (64 >= 47 threshold)
    expect(getMaxShards(1, true)).toBe(Math.floor((128 - 9) / 2))
  })
})
