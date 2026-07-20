import { Bytes } from './bytes.js'

/**
 * A 32-byte Swarm overlay (peer) address.
 */
export class PeerAddress extends Bytes {
  static readonly LENGTH = 32

  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, 32)
  }
}
