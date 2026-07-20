// Parity lookup tables ported from Bee's pkg/file/redundancy/level.go.
// Each entry is [shardThresholds (descending), correspondingParityCounts].
// getParities(level, shards) finds the first threshold <= shards and returns its parity count.
// Redundancy levels: NONE=0, MEDIUM=1, STRONG=2, INSANE=3, PARANOID=4.
const ERASURE_TABLES: [number[], number[]][] = [
  [[], []], // NONE (0)
  [
    [95, 69, 47, 29, 15, 6, 2, 1],
    [9, 8, 7, 6, 5, 4, 3, 2],
  ], // MEDIUM (1)
  [
    [105, 96, 87, 78, 70, 62, 54, 47, 40, 33, 27, 21, 16, 11, 7, 4, 2, 1],
    [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
  ], // STRONG (2)
  [
    [93, 88, 83, 78, 74, 69, 64, 60, 55, 51, 46, 42, 38, 34, 30, 27, 23, 20, 17, 14, 11, 9, 6, 4, 3, 2, 1],
    [31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
  ], // INSANE (3)
  [
    [
      37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9,
      8, 7, 6, 5, 4, 3, 2, 1,
    ],
    [
      89, 87, 86, 84, 83, 81, 80, 78, 76, 75, 73, 71, 70, 68, 66, 65, 63, 61, 59, 58, 56, 54, 52, 50, 48, 47, 45, 43,
      40, 38, 36, 34, 31, 29, 26, 23, 19,
    ],
  ], // PARANOID (4)
]

const ENC_ERASURE_TABLES: [number[], number[]][] = [
  [[], []], // NONE (0)
  [
    [47, 34, 23, 14, 7, 3, 1],
    [9, 8, 7, 6, 5, 4, 3],
  ], // encMEDIUM (1)
  [
    [52, 48, 43, 39, 35, 31, 27, 23, 20, 16, 13, 10, 8, 5, 3, 2, 1],
    [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
  ], // encSTRONG (2)
  [
    [46, 44, 41, 39, 37, 34, 32, 30, 27, 25, 23, 21, 19, 17, 15, 13, 11, 10, 8, 7, 5, 4, 3, 2, 1],
    [31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 6],
  ], // encINSANE (3)
  [
    [18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    [87, 84, 81, 78, 75, 71, 68, 65, 61, 58, 54, 50, 47, 43, 38, 34, 29, 23],
  ], // encPARANOID (4)
]

function tableGetParities(table: [number[], number[]], shards: number): number {
  const [thresholds, parities] = table
  for (let i = 0; i < thresholds!.length; i++) {
    if (shards >= thresholds![i]!) return parities![i]!
  }
  return 0
}

/**
 * Returns the number of Reed-Solomon parity shards Bee would add for the
 * given redundancy level and data-shard count.
 */
export function getParities(level: number, shards: number, encrypted: boolean): number {
  if (level <= 0 || level > 4) return 0
  return tableGetParities(encrypted ? ENC_ERASURE_TABLES[level]! : ERASURE_TABLES[level]!, shards)
}

const BRANCHES = 128
const ENC_BRANCHES = 64

/**
 * Returns the max number of data shards per batch for a given redundancy
 * level. Matches Bee's Level.GetMaxShards() and Level.GetMaxEncShards().
 */
export function getMaxShards(level: number, encrypted: boolean): number {
  if (level <= 0) return encrypted ? ENC_BRANCHES : BRANCHES
  if (encrypted) {
    const parities = getParities(level, ENC_BRANCHES, true)
    return Math.floor((BRANCHES - parities) / 2)
  }
  return BRANCHES - getParities(level, BRANCHES, false)
}

/**
 * Returns an approximate multiplier for the storage overhead of uploading
 * `chunks` data shards at the given redundancy level: use it to estimate how
 * many extra chunks will be stored (chunks * overhead) for that upload.
 *
 * Computed directly from getParities' exact tables above rather than a
 * separate estimation table - bee-js's own redundancy.ts had a second,
 * independent set of tables for this that turned out to be a rougher
 * approximation of the same data (one threshold short per level), not a
 * genuinely different computation.
 */
export function approximateOverheadForRedundancyLevel(chunks: number, level: number, encrypted: boolean): number {
  if (level <= 0 || chunks <= 0) {
    return 0
  }

  return getParities(level, chunks, encrypted) / chunks
}

export interface RedundancyStat {
  label: string
  value: number
  errorTolerance: number
}

const MEDIUM_STAT: RedundancyStat = { label: 'medium', value: 1, errorTolerance: 0.01 }
const STRONG_STAT: RedundancyStat = { label: 'strong', value: 2, errorTolerance: 0.05 }
const INSANE_STAT: RedundancyStat = { label: 'insane', value: 3, errorTolerance: 0.1 }
const PARANOID_STAT: RedundancyStat = { label: 'paranoid', value: 4, errorTolerance: 0.5 }

/**
 * Returns descriptive stats (label, level, expected error tolerance) for
 * every redundancy level above NONE.
 */
export function getRedundancyStats(): {
  medium: RedundancyStat
  strong: RedundancyStat
  insane: RedundancyStat
  paranoid: RedundancyStat
} {
  return { medium: MEDIUM_STAT, strong: STRONG_STAT, insane: INSANE_STAT, paranoid: PARANOID_STAT }
}

/**
 * Looks up a single redundancy level's stats by name ('medium'/'strong'/
 * 'insane'/'paranoid', case-insensitive) or by its numeric level (1-4).
 */
export function getRedundancyStat(level: string | number): RedundancyStat {
  if (typeof level === 'string') {
    switch (level.toLowerCase()) {
      case 'medium':
        return MEDIUM_STAT
      case 'strong':
        return STRONG_STAT
      case 'insane':
        return INSANE_STAT
      case 'paranoid':
        return PARANOID_STAT
      default:
        throw new Error(`Unknown redundancy level '${level}'`)
    }
  }

  switch (level) {
    case 1:
      return MEDIUM_STAT
    case 2:
      return STRONG_STAT
    case 3:
      return INSANE_STAT
    case 4:
      return PARANOID_STAT
    default:
      throw new Error(`Unknown redundancy level '${level}'`)
  }
}
