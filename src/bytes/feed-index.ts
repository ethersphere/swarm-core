import { numberToUint64, uint64ToNumber, uint8ArrayToHex } from './encoding.js'
import { Bytes } from './bytes.js'

const MAX_UINT64 = new Uint8Array(8).fill(0xff, 0, 8)

/**
 * An 8-byte, big-endian sequential feed update index.
 */
export class FeedIndex extends Bytes {
  static readonly LENGTH = 8
  /** Sentinel index (all bits set) some feed types use to mean "no update yet". */
  static readonly MINUS_ONE = new FeedIndex(MAX_UINT64)

  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 8)
  }

  /**
   * Encodes a bigint index as an 8-byte, big-endian FeedIndex.
   */
  static fromBigInt(value: bigint): FeedIndex {
    return new FeedIndex(numberToUint64(value, 'BE'))
  }

  /**
   * Decodes the index as a bigint.
   */
  toBigInt(): bigint {
    return uint64ToNumber(this.bytes, 'BE')
  }

  /**
   * Returns the next sequential index, wrapping {@link MINUS_ONE} back to 0.
   */
  next(): FeedIndex {
    if (uint8ArrayToHex(this.bytes) === uint8ArrayToHex(MAX_UINT64)) {
      return FeedIndex.fromBigInt(0n)
    }
    return FeedIndex.fromBigInt(this.toBigInt() + 1n)
  }
}
