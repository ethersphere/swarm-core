import { numberToUint64, uint64ToNumber } from './encoding.js'
import { Bytes } from './bytes.js'

export class Span extends Bytes {
  static readonly LENGTH = 8

  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 8)
  }

  static fromBigInt(value: bigint): Span {
    return new Span(numberToUint64(value, 'LE'))
  }

  toBigInt(): bigint {
    return uint64ToNumber(this.bytes, 'LE')
  }

  static fromSlice(bytes: Uint8Array, start: number): Span {
    return new Span(bytes.slice(start, start + Span.LENGTH))
  }
}
