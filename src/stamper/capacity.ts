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
