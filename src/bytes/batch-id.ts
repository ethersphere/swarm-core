import { Bytes } from './bytes.js'

/**
 * A 32-byte postage batch identifier.
 */
export class BatchId extends Bytes {
  static readonly LENGTH = 32

  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 32)
  }
}
