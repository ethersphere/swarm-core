import { keccak256 } from '../crypto/keccak.js'
import { Bytes } from './bytes.js'

const ENCODER = new TextEncoder()

/**
 * A 32-byte feed/SOC identifier - an arbitrary value selected by the uploader
 * that, together with the owner's address, determines a single-owner chunk's address.
 */
export class Identifier extends Bytes {
  static readonly LENGTH = 32

  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 32)
  }

  /**
   * Derives an identifier by hashing an arbitrary string with keccak256.
   */
  static fromString(value: string): Identifier {
    return new Identifier(keccak256(ENCODER.encode(value)))
  }
}
