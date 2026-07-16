import { Bytes } from './bytes.js'

// CID string support (the "bah5..." manifest/feed CID encoding) is deferred -
// it needs a whole separate CID conversion module not yet ported. This class
// covers the common case: a raw 32-byte (or 64-byte, for encrypted references) address.
export class Reference extends Bytes {
  static readonly LENGTH = 32

  constructor(bytes: Uint8Array | string | Bytes) {
    super(bytes, [32, 64])
  }
}
