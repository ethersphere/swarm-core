import { numberToUint64, uint64ToNumber, uint8ArrayToHex } from './encoding.js'
import { Bytes } from './bytes.js'

const MAX_UINT64 = new Uint8Array(8).fill(0xff, 0, 8)

export class FeedIndex extends Bytes {
  static readonly LENGTH = 8
  static readonly MINUS_ONE = new FeedIndex(MAX_UINT64)

  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 8)
  }

  static fromBigInt(value: bigint): FeedIndex {
    return new FeedIndex(numberToUint64(value, 'BE'))
  }

  toBigInt(): bigint {
    return uint64ToNumber(this.bytes, 'BE')
  }

  next(): FeedIndex {
    if (uint8ArrayToHex(this.bytes) === uint8ArrayToHex(MAX_UINT64)) {
      return FeedIndex.fromBigInt(0n)
    }
    return FeedIndex.fromBigInt(this.toBigInt() + 1n)
  }
}
