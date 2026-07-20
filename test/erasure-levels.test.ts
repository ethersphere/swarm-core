import { describe, expect, it } from 'vitest'
import {
  approximateOverheadForRedundancyLevel,
  getMaxShards,
  getParities,
  getRedundancyStat,
  getRedundancyStats,
} from '../src/erasure-coding/levels.js'

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

describe('approximateOverheadForRedundancyLevel', () => {
  it('is 0 for level NONE (0)', () => {
    expect(approximateOverheadForRedundancyLevel(100, 0, false)).toBe(0)
  })

  it('is 0 for a non-positive chunk count', () => {
    expect(approximateOverheadForRedundancyLevel(0, 1, false)).toBe(0)
    expect(approximateOverheadForRedundancyLevel(-5, 1, false)).toBe(0)
  })

  it('is getParities(level, chunks, encrypted) / chunks', () => {
    expect(approximateOverheadForRedundancyLevel(95, 1, false)).toBeCloseTo(getParities(1, 95, false) / 95)
    expect(approximateOverheadForRedundancyLevel(47, 1, true)).toBeCloseTo(getParities(1, 47, true) / 47)
  })

  it('decreases as more chunks share the same fixed parity count', () => {
    // getParities(1, 69, false) and getParities(1, 94, false) are both 8
    // (same threshold bucket), so more chunks means a lower overhead ratio.
    expect(getParities(1, 69, false)).toBe(getParities(1, 94, false))
    expect(approximateOverheadForRedundancyLevel(94, 1, false)).toBeLessThan(
      approximateOverheadForRedundancyLevel(69, 1, false),
    )
  })
})

describe('getRedundancyStats / getRedundancyStat', () => {
  it('returns all four non-NONE levels with matching labels and values', () => {
    const stats = getRedundancyStats()
    expect(stats.medium).toEqual({ label: 'medium', value: 1, errorTolerance: 0.01 })
    expect(stats.strong).toEqual({ label: 'strong', value: 2, errorTolerance: 0.05 })
    expect(stats.insane).toEqual({ label: 'insane', value: 3, errorTolerance: 0.1 })
    expect(stats.paranoid).toEqual({ label: 'paranoid', value: 4, errorTolerance: 0.5 })
  })

  it('looks up by numeric level', () => {
    expect(getRedundancyStat(1)).toEqual(getRedundancyStats().medium)
    expect(getRedundancyStat(4)).toEqual(getRedundancyStats().paranoid)
  })

  it('looks up by case-insensitive name', () => {
    expect(getRedundancyStat('STRONG')).toEqual(getRedundancyStats().strong)
    expect(getRedundancyStat('insane')).toEqual(getRedundancyStats().insane)
  })

  it('throws for an unknown level', () => {
    expect(() => getRedundancyStat('bogus')).toThrow(/Unknown redundancy level/)
    expect(() => getRedundancyStat(0)).toThrow(/Unknown redundancy level/)
    expect(() => getRedundancyStat(99)).toThrow(/Unknown redundancy level/)
  })
})
