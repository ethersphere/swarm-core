import { keccak256 } from '../crypto/keccak.js'
import { hexToUint8Array, uint8ArrayToBase32, uint8ArrayToBase64, uint8ArrayToHex } from './encoding.js'

const DECODER = new TextDecoder()
const ENCODER = new TextEncoder()

const HEX_PATTERN = /^(0x)?[0-9a-fA-F]*$/

function hasToHexMethod(value: unknown): value is { toHex(): string } {
  return typeof value === 'object' && value !== null && typeof (value as { toHex?: unknown }).toHex === 'function'
}

export class Bytes {
  protected readonly bytes: Uint8Array
  public readonly length: number

  constructor(bytes: Uint8Array | ArrayBuffer | string | Bytes, byteLength?: number | number[]) {
    if (!bytes) {
      throw new Error(`Bytes#constructor: constructor parameter is falsy: ${bytes}`)
    }

    if (bytes instanceof Bytes) {
      this.bytes = bytes.bytes
    } else if (typeof bytes === 'string') {
      if (!HEX_PATTERN.test(bytes) || bytes.replace(/^0x/, '').length % 2 !== 0) {
        throw new Error(`Bytes#constructor: invalid hex string: ${bytes}`)
      }
      this.bytes = hexToUint8Array(bytes)
    } else if (bytes instanceof ArrayBuffer) {
      this.bytes = new Uint8Array(bytes)
    } else if (bytes instanceof Uint8Array) {
      this.bytes = bytes
    } else {
      const unknownInput = bytes as unknown
      if (hasToHexMethod(unknownInput)) {
        this.bytes = hexToUint8Array(unknownInput.toHex())
      } else {
        throw new Error(`Bytes#constructor: unsupported type: ${typeof bytes}`)
      }
    }

    this.length = this.bytes.length

    if (byteLength !== undefined) {
      if (Array.isArray(byteLength)) {
        if (!byteLength.includes(this.length)) {
          throw new Error(
            `Bytes#checkByteLength: bytes length is ${this.length} but expected ${byteLength.join(' or ')}`,
          )
        }
      } else if (this.length !== byteLength) {
        throw new Error(`Bytes#checkByteLength: bytes length is ${this.length} but expected ${byteLength}`)
      }
    }
  }

  static keccak256(bytes: Uint8Array | ArrayBuffer | string | Bytes): Bytes {
    return new Bytes(keccak256(new Bytes(bytes).toUint8Array()))
  }

  static fromUtf8(utf8: string): Bytes {
    return new Bytes(ENCODER.encode(utf8))
  }

  static fromSlice(bytes: Uint8Array, start: number, length?: number): Bytes {
    if (length === undefined) {
      return new Bytes(bytes.slice(start))
    }
    return new Bytes(bytes.slice(start, start + length))
  }

  offset(index: number): Uint8Array {
    return new Uint8Array(this.bytes.slice(index))
  }

  public toUint8Array(): Uint8Array {
    return new Uint8Array(this.bytes)
  }

  public toHex(): string {
    return uint8ArrayToHex(this.bytes)
  }

  public toBase64(): string {
    return uint8ArrayToBase64(this.bytes)
  }

  public toBase32(): string {
    return uint8ArrayToBase32(this.bytes)
  }

  public toString(): string {
    return this.toHex()
  }

  public toUtf8(): string {
    return DECODER.decode(this.bytes)
  }

  public toJSON(): unknown {
    return JSON.parse(this.toUtf8())
  }

  public equals(other: Bytes | Uint8Array | string): boolean {
    return this.toHex() === new Bytes(other).toHex()
  }

  public represent(): string {
    return this.toHex()
  }
}
