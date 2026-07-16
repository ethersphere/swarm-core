import { Bytes } from './bytes.js'

export class TransactionId extends Bytes {
  static readonly LENGTH = 32

  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 32)
  }
}
