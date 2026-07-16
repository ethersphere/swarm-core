import { checksumEncode } from '../crypto/keys.js'
import { Bytes } from './bytes.js'

export class EthAddress extends Bytes {
  static readonly LENGTH = 20

  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 20)
  }

  public toChecksum(): string {
    return checksumEncode(this.bytes)
  }
}
