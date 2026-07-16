/**
 * Calculates usage of a postage batch based on its utilization, depth, and bucket depth.
 * For smaller depths (up to 20), this may provide less accurate results.
 *
 * @returns A number between 0 and 1 representing the usage of the postage batch.
 */
export function getStampUsage(utilization: number, depth: number, bucketDepth: number): number {
  return utilization / Math.pow(2, depth - bucketDepth)
}

/**
 * Calculates the theoretical maximum size of a postage batch based on its depth.
 * For smaller depths (up to 22), this may provide less accurate results.
 *
 * @returns The maximum theoretical size of the postage batch, in bytes.
 */
export function getStampTheoreticalBytes(depth: number): number {
  return 4096 * 2 ** depth
}

const MAX_UTILIZATION = 0.9

function parseSizeToBytes(size: string): number {
  const units: Record<string, number> = { B: 1, kB: 1000, MB: 1000 ** 2, GB: 1000 ** 3, TB: 1000 ** 4, PB: 1000 ** 5 }
  const match = size.match(/^([\d.]+)\s*(B|kB|MB|GB|TB|PB)$/)

  if (!match) {
    throw new Error(`Invalid size format: ${size}`)
  }

  return Math.ceil(parseFloat(match[1]!) * units[match[2]!]!)
}

type Breakpoint = [depth: number, effectiveVolume: string]

/**
 * Effective-utilization breakpoints without erasure coding, indexed by depth
 * 17..34. Below 17 the effective size is 0; above 34 it's always > 99%.
 * From https://docs.ethswarm.org/docs/learn/technology/contracts/postage-stamp/#effective-utilisation-table
 * Optimised for encrypted, medium erasure coding.
 */
const DEFAULT_EFFECTIVE_SIZE_BREAKPOINTS: Breakpoint[] = [
  [17, '0.00004089 GB'],
  [18, '0.00609 GB'],
  [19, '0.10249 GB'],
  [20, '0.62891 GB'],
  [21, '2.38 GB'],
  [22, '7.07 GB'],
  [23, '18.24 GB'],
  [24, '43.04 GB'],
  [25, '96.5 GB'],
  [26, '208.52 GB'],
  [27, '435.98 GB'],
  [28, '908.81 GB'],
  [29, '1870 GB'],
  [30, '3810 GB'],
  [31, '7730 GB'],
  [32, '15610 GB'],
  [33, '31430 GB'],
  [34, '63150 GB'],
]

// Effective-utilization breakpoints per redundancy level (NONE=0, MEDIUM=1,
// STRONG=2, INSANE=3, PARANOID=4), for unencrypted and encrypted uploads.
const ENCRYPTION_OFF_BREAKPOINTS: Breakpoint[][] = [
  [
    [17, '44.70 kB'],
    [18, '6.66 MB'],
    [19, '112.06 MB'],
    [20, '687.62 MB'],
    [21, '2.60 GB'],
    [22, '7.73 GB'],
    [23, '19.94 GB'],
    [24, '47.06 GB'],
    [25, '105.51 GB'],
    [26, '227.98 GB'],
    [27, '476.68 GB'],
    [28, '993.65 GB'],
    [29, '2.04 TB'],
    [30, '4.17 TB'],
    [31, '8.45 TB'],
    [32, '17.07 TB'],
    [33, '34.36 TB'],
    [34, '69.04 TB'],
    [35, '138.54 TB'],
    [36, '277.72 TB'],
    [37, '556.35 TB'],
    [38, '1.11 PB'],
    [39, '2.23 PB'],
    [40, '4.46 PB'],
    [41, '8.93 PB'],
  ], // NONE
  [
    [17, '41.56 kB'],
    [18, '6.19 MB'],
    [19, '104.18 MB'],
    [20, '639.27 MB'],
    [21, '2.41 GB'],
    [22, '7.18 GB'],
    [23, '18.54 GB'],
    [24, '43.75 GB'],
    [25, '98.09 GB'],
    [26, '211.95 GB'],
    [27, '443.16 GB'],
    [28, '923.78 GB'],
    [29, '1.90 TB'],
    [30, '3.88 TB'],
    [31, '7.86 TB'],
    [32, '15.87 TB'],
    [33, '31.94 TB'],
    [34, '64.19 TB'],
    [35, '128.80 TB'],
    [36, '258.19 TB'],
    [37, '517.23 TB'],
    [38, '1.04 PB'],
    [39, '2.07 PB'],
    [40, '4.15 PB'],
    [41, '8.30 PB'],
  ], // MEDIUM
  [
    [17, '37.37 kB'],
    [18, '5.57 MB'],
    [19, '93.68 MB'],
    [20, '574.81 MB'],
    [21, '2.17 GB'],
    [22, '6.46 GB'],
    [23, '16.67 GB'],
    [24, '39.34 GB'],
    [25, '88.20 GB'],
    [26, '190.58 GB'],
    [27, '398.47 GB'],
    [28, '830.63 GB'],
    [29, '1.71 TB'],
    [30, '3.49 TB'],
    [31, '7.07 TB'],
    [32, '14.27 TB'],
    [33, '28.72 TB'],
    [34, '57.71 TB'],
    [35, '115.81 TB'],
    [36, '232.16 TB'],
    [37, '465.07 TB'],
    [38, '931.23 TB'],
    [39, '1.86 PB'],
    [40, '3.73 PB'],
    [41, '7.46 PB'],
  ], // STRONG
  [
    [17, '33.88 kB'],
    [18, '5.05 MB'],
    [19, '84.92 MB'],
    [20, '521.09 MB'],
    [21, '1.97 GB'],
    [22, '5.86 GB'],
    [23, '15.11 GB'],
    [24, '35.66 GB'],
    [25, '79.96 GB'],
    [26, '172.77 GB'],
    [27, '361.23 GB'],
    [28, '753.00 GB'],
    [29, '1.55 TB'],
    [30, '3.16 TB'],
    [31, '6.41 TB'],
    [32, '12.93 TB'],
    [33, '26.04 TB'],
    [34, '52.32 TB'],
    [35, '104.99 TB'],
    [36, '210.46 TB'],
    [37, '421.61 TB'],
    [38, '844.20 TB'],
    [39, '1.69 PB'],
    [40, '3.38 PB'],
    [41, '6.77 PB'],
  ], // INSANE
  [
    [17, '13.27 kB'],
    [18, '1.98 MB'],
    [19, '33.27 MB'],
    [20, '204.14 MB'],
    [21, '771.13 MB'],
    [22, '2.29 GB'],
    [23, '5.92 GB'],
    [24, '13.97 GB'],
    [25, '31.32 GB'],
    [26, '67.68 GB'],
    [27, '141.51 GB'],
    [28, '294.99 GB'],
    [29, '606.90 GB'],
    [30, '1.24 TB'],
    [31, '2.51 TB'],
    [32, '5.07 TB'],
    [33, '10.20 TB'],
    [34, '20.50 TB'],
    [35, '41.13 TB'],
    [36, '82.45 TB'],
    [37, '165.17 TB'],
    [38, '330.72 TB'],
    [39, '661.97 TB'],
    [40, '1.32 PB'],
    [41, '2.65 PB'],
  ], // PARANOID
]

const ENCRYPTION_ON_BREAKPOINTS: Breakpoint[][] = [
  [
    [17, '44.35 kB'],
    [18, '6.61 MB'],
    [19, '111.18 MB'],
    [20, '682.21 MB'],
    [21, '2.58 GB'],
    [22, '7.67 GB'],
    [23, '19.78 GB'],
    [24, '46.69 GB'],
    [25, '104.68 GB'],
    [26, '226.19 GB'],
    [27, '472.93 GB'],
    [28, '985.83 GB'],
    [29, '2.03 TB'],
    [30, '4.14 TB'],
    [31, '8.39 TB'],
    [32, '16.93 TB'],
    [33, '34.09 TB'],
    [34, '68.50 TB'],
    [35, '137.45 TB'],
    [36, '275.53 TB'],
    [37, '551.97 TB'],
    [38, '1.11 PB'],
    [39, '2.21 PB'],
    [40, '4.43 PB'],
    [41, '8.86 PB'],
  ], // NONE
  [
    [17, '40.89 kB'],
    [18, '6.09 MB'],
    [19, '102.49 MB'],
    [20, '628.91 MB'],
    [21, '2.38 GB'],
    [22, '7.07 GB'],
    [23, '18.24 GB'],
    [24, '43.04 GB'],
    [25, '96.50 GB'],
    [26, '208.52 GB'],
    [27, '435.98 GB'],
    [28, '908.81 GB'],
    [29, '1.87 TB'],
    [30, '3.81 TB'],
    [31, '7.73 TB'],
    [32, '15.61 TB'],
    [33, '31.43 TB'],
    [34, '63.15 TB'],
    [35, '126.71 TB'],
    [36, '254.01 TB'],
    [37, '508.85 TB'],
    [38, '1.02 PB'],
    [39, '2.04 PB'],
    [40, '4.08 PB'],
    [41, '8.17 PB'],
  ], // MEDIUM
  [
    [17, '36.73 kB'],
    [18, '5.47 MB'],
    [19, '92.07 MB'],
    [20, '564.95 MB'],
    [21, '2.13 GB'],
    [22, '6.35 GB'],
    [23, '16.38 GB'],
    [24, '38.66 GB'],
    [25, '86.69 GB'],
    [26, '187.31 GB'],
    [27, '391.64 GB'],
    [28, '816.39 GB'],
    [29, '1.68 TB'],
    [30, '3.43 TB'],
    [31, '6.94 TB'],
    [32, '14.02 TB'],
    [33, '28.23 TB'],
    [34, '56.72 TB'],
    [35, '113.82 TB'],
    [36, '228.18 TB'],
    [37, '457.10 TB'],
    [38, '915.26 TB'],
    [39, '1.83 PB'],
    [40, '3.67 PB'],
    [41, '7.34 PB'],
  ], // STRONG
  [
    [17, '33.26 kB'],
    [18, '4.96 MB'],
    [19, '83.38 MB'],
    [20, '511.65 MB'],
    [21, '1.93 GB'],
    [22, '5.75 GB'],
    [23, '14.84 GB'],
    [24, '35.02 GB'],
    [25, '78.51 GB'],
    [26, '169.64 GB'],
    [27, '354.69 GB'],
    [28, '739.37 GB'],
    [29, '1.52 TB'],
    [30, '3.10 TB'],
    [31, '6.29 TB'],
    [32, '12.70 TB'],
    [33, '25.57 TB'],
    [34, '51.37 TB'],
    [35, '103.08 TB'],
    [36, '206.65 TB'],
    [37, '413.98 TB'],
    [38, '828.91 TB'],
    [39, '1.66 PB'],
    [40, '3.32 PB'],
    [41, '6.64 PB'],
  ], // INSANE
  [
    [17, '13.17 kB'],
    [18, '1.96 MB'],
    [19, '33.01 MB'],
    [20, '202.53 MB'],
    [21, '765.05 MB'],
    [22, '2.28 GB'],
    [23, '5.87 GB'],
    [24, '13.86 GB'],
    [25, '31.08 GB'],
    [26, '67.15 GB'],
    [27, '140.40 GB'],
    [28, '292.67 GB'],
    [29, '602.12 GB'],
    [30, '1.23 TB'],
    [31, '2.49 TB'],
    [32, '5.03 TB'],
    [33, '10.12 TB'],
    [34, '20.34 TB'],
    [35, '40.80 TB'],
    [36, '81.80 TB'],
    [37, '163.87 TB'],
    [38, '328.11 TB'],
    [39, '656.76 TB'],
    [40, '1.31 PB'],
    [41, '2.63 PB'],
  ], // PARANOID
]

/**
 * Calculates the effective size of a postage batch based on its depth.
 * Below depth 17 the effective size is 0.
 *
 * When `encryption` and `erasureCodeLevel` (0=NONE, 1=MEDIUM, 2=STRONG,
 * 3=INSANE, 4=PARANOID) are both given, uses the exact breakpoint table for
 * that combination; otherwise falls back to the encrypted+MEDIUM-optimised
 * default table.
 *
 * @returns The effective size of the postage batch, in bytes.
 */
export function getStampEffectiveBytes(depth: number, encryption?: boolean, erasureCodeLevel?: number): number {
  if (depth < 17) {
    return 0
  }

  if (encryption !== undefined && erasureCodeLevel !== undefined) {
    const breakpoints = (encryption ? ENCRYPTION_ON_BREAKPOINTS : ENCRYPTION_OFF_BREAKPOINTS)[erasureCodeLevel]
    const entry = breakpoints?.find(([batchDepth]) => batchDepth === depth)

    if (entry) {
      return parseSizeToBytes(entry[1])
    }
  } else {
    const entry = DEFAULT_EFFECTIVE_SIZE_BREAKPOINTS.find(([batchDepth]) => batchDepth === depth)

    if (entry) {
      return parseSizeToBytes(entry[1])
    }
  }

  return Math.ceil(getStampTheoreticalBytes(depth) * MAX_UTILIZATION)
}

/**
 * Returns the effective size (in bytes) for every depth in the supported
 * breakpoint range (17..34), keyed by depth.
 */
export function getStampEffectiveBytesBreakpoints(encryption: boolean, erasureCodeLevel?: number): Map<number, number> {
  const map = new Map<number, number>()

  for (let depth = 17; depth < 35; depth++) {
    map.set(depth, getStampEffectiveBytes(depth, encryption, erasureCodeLevel))
  }

  return map
}

/**
 * Calculates the depth required for a postage batch to achieve the given
 * effective size, in bytes.
 */
export function getDepthForSize(size: number, encryption?: boolean, erasureCodeLevel?: number): number {
  if (encryption !== undefined && erasureCodeLevel !== undefined) {
    const breakpoints = (encryption ? ENCRYPTION_ON_BREAKPOINTS : ENCRYPTION_OFF_BREAKPOINTS)[erasureCodeLevel]
    const entry = breakpoints?.find(([, effectiveVolume]) => size <= parseSizeToBytes(effectiveVolume))

    if (entry) {
      return entry[0]
    }
  } else {
    for (const [depth, effectiveVolume] of DEFAULT_EFFECTIVE_SIZE_BREAKPOINTS) {
      if (size <= parseSizeToBytes(effectiveVolume)) {
        return depth
      }
    }
  }

  return 35
}
