import { numberToUint64, uint64ToNumber } from './encoding.js'
import { Bytes } from './bytes.js'

/**
 * An 8-byte, little-endian span - the byte count prefixing a chunk's payload.
 */
export class Span extends Bytes {
  static readonly LENGTH = 8

  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 8)
  }

  /**
   * Encodes a bigint byte count as an 8-byte, little-endian Span.
   */
  static fromBigInt(value: bigint): Span {
    return new Span(numberToUint64(value, 'LE'))
  }

  /**
   * Decodes the span as a bigint byte count.
   */
  toBigInt(): bigint {
    return uint64ToNumber(this.bytes, 'LE')
  }

  /**
   * Reads an 8-byte Span out of a larger buffer, starting at `start`.
   */
  static fromSlice(bytes: Uint8Array, start: number): Span {
    return new Span(bytes.slice(start, start + Span.LENGTH))
  }
}
