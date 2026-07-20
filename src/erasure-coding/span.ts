import { getMaxShards, getParities } from './levels.js'

const CLEAR_TOP_BYTE_MASK = 0x00ffffffffffffffn

/**
 * Encodes the redundancy level used for an intermediate chunk into bit 7 of
 * span byte 7 (assumes little-endian span), keeping the real byte count in
 * the remaining bits. Matches Bee's redundancy.EncodeLevel. Only meaningful
 * for level > 0 - callers should not call this for level 0 (NONE).
 */
export function encodeRedundancyLevel(span: bigint, level: number): bigint {
  return (span & CLEAR_TOP_BYTE_MASK) | (BigInt(level | 0x80) << 56n)
}

/**
 * Decodes a span produced by encodeRedundancyLevel back into the redundancy
 * level (0 if none was encoded) and the real byte count. Matches Bee's
 * redundancy.DecodeSpan/IsLevelEncoded.
 */
export function decodeRedundancyLevel(span: bigint): { level: number; span: bigint } {
  const topByte = Number((span >> 56n) & 0xffn)

  if (topByte <= 128) {
    return { level: 0, span }
  }

  return { level: topByte & 0x7f, span: span & CLEAR_TOP_BYTE_MASK }
}

/**
 * Brute-forces the data- and parity-shard count of an intermediate chunk's
 * children from its (already redundancy-level-decoded) span alone, without
 * inspecting the chunk's payload bytes.
 *
 * This works because a redundancy-enabled ChunkSplitter always fills each
 * level to exactly getMaxShards(level, encrypted) data children (except
 * possibly the last, which may be a smaller remainder) before adding parity
 * refs - so the tree shape at any node is fully determined by its span and
 * level. Matches Bee's file.ReferenceCount. Assumes span > 4096 (i.e. this
 * chunk actually has children, not just a leaf payload).
 */
export function referenceCount(
  span: bigint,
  level: number,
  encrypted: boolean,
): { dataShardCount: number; parityShardCount: number } {
  const maxShards = BigInt(getMaxShards(level, encrypted))

  let branchSize = 4096n
  let branchLevel = 1
  while (branchSize < span) {
    branchSize *= maxShards
    branchLevel++
  }

  let referenceSize = 4096n
  for (let i = 1; i < branchLevel - 1; i++) {
    referenceSize *= maxShards
  }

  let dataShardCount = 1
  let spanOffset = referenceSize
  while (spanOffset < span) {
    spanOffset += referenceSize
    dataShardCount++
  }

  return { dataShardCount, parityShardCount: getParities(level, dataShardCount, encrypted) }
}
