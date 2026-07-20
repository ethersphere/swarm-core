import { compressPublicKey, publicKeyFromCompressed, publicKeyToAddress } from '../crypto/keys.js'
import { Bytes } from './bytes.js'
import { concatBytes, numberToUint256, uint256ToNumber, uint8ArrayToHex } from './encoding.js'
import { EthAddress } from './eth-address.js'

export class PublicKey extends Bytes {
  static readonly LENGTH = 64

  constructor(bytes: Uint8Array | string | Bytes) {
    const uncompressed = new Bytes(bytes)

    if (uncompressed.length === 33) {
      const [x, y] = publicKeyFromCompressed(uncompressed.toUint8Array())
      super(concatBytes(numberToUint256(x, 'BE'), numberToUint256(y, 'BE')), 64)
    } else {
      super(bytes, 64)
    }
  }

  address(): EthAddress {
    const x = uint256ToNumber(this.bytes.slice(0, 32), 'BE')
    const y = uint256ToNumber(this.bytes.slice(32, 64), 'BE')

    return new EthAddress(publicKeyToAddress([x, y]))
  }

  toCompressedUint8Array(): Uint8Array {
    const x = uint256ToNumber(this.bytes.slice(0, 32), 'BE')
    const y = uint256ToNumber(this.bytes.slice(32, 64), 'BE')

    return compressPublicKey([x, y])
  }

  toCompressedHex(): string {
    return uint8ArrayToHex(this.toCompressedUint8Array())
  }
}
