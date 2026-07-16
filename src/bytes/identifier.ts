import { keccak256 } from '../crypto/keccak.js'
import { Bytes } from './bytes.js'

const ENCODER = new TextEncoder()

export class Identifier extends Bytes {
  static readonly LENGTH = 32

  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 32)
  }

  static fromString(value: string): Identifier {
    return new Identifier(keccak256(ENCODER.encode(value)))
  }
}
