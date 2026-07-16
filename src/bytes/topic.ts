import { keccak256 } from '../crypto/keccak.js'
import { Bytes } from './bytes.js'

const ENCODER = new TextEncoder()

export class Topic extends Bytes {
  static readonly LENGTH = 32

  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 32)
  }

  static fromString(value: string): Topic {
    return new Topic(keccak256(ENCODER.encode(value)))
  }
}
