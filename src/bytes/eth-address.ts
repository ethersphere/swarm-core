import { checksumEncode } from '../crypto/keys.js'
import { Bytes } from './bytes.js'

/**
 * A 20-byte Ethereum address.
 */
export class EthAddress extends Bytes {
  static readonly LENGTH = 20

  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 20)
  }

  /**
   * EIP-55 checksum-cased hex representation (e.g. `0x5aAe...`).
   */
  public toChecksum(): string {
    return checksumEncode(this.bytes)
  }
}
