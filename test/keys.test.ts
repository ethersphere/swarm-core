import { describe, expect, it } from 'vitest'
import {
  checksumEncode,
  compressPublicKey,
  privateKeyToPublicKey,
  publicKeyFromCompressed,
  publicKeyToAddress,
  SECP256K1_N,
} from '../src/crypto/keys.js'

// Independently-known values (not imported from the implementation under test).
const SECP256K1_X = 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n
const SECP256K1_Y = 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, '')
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

describe('privateKeyToPublicKey', () => {
  it('returns the generator point itself for private key 1', () => {
    const [x, y] = privateKeyToPublicKey(1n)
    expect(x).toBe(SECP256K1_X)
    expect(y).toBe(SECP256K1_Y)
  })

  it('rejects out-of-range private keys', () => {
    expect(() => privateKeyToPublicKey(0n)).toThrow()
    expect(() => privateKeyToPublicKey(SECP256K1_N)).toThrow()
  })

  it('produces a different point for a different private key', () => {
    const [x] = privateKeyToPublicKey(2n)
    expect(x).not.toBe(SECP256K1_X)
  })
})

describe('compressPublicKey / publicKeyFromCompressed', () => {
  it('round-trips the generator point', () => {
    const publicKey = privateKeyToPublicKey(1n)
    const compressed = compressPublicKey(publicKey)
    expect(compressed.length).toBe(33)
    const [x, y] = publicKeyFromCompressed(compressed)
    expect(x).toBe(publicKey[0])
    expect(y).toBe(publicKey[1])
  })

  it('round-trips an arbitrary private key, preserving y-parity via the 0x02/0x03 prefix', () => {
    for (const privateKey of [42n, 12345n, 999999999999n]) {
      const publicKey = privateKeyToPublicKey(privateKey)
      const compressed = compressPublicKey(publicKey)
      expect(compressed[0]).toBe(publicKey[1] % 2n === 0n ? 0x02 : 0x03)
      const [x, y] = publicKeyFromCompressed(compressed)
      expect(x).toBe(publicKey[0])
      expect(y).toBe(publicKey[1])
    }
  })

  it('rejects malformed compressed keys', () => {
    expect(() => publicKeyFromCompressed(new Uint8Array(33))).toThrow()
    expect(() => publicKeyFromCompressed(new Uint8Array(32))).toThrow()
  })
})

describe('publicKeyToAddress', () => {
  it('matches the well-known address for the secp256k1 generator point (private key = 1)', () => {
    const Gx = 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n
    const Gy = 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n
    expect(toHex(publicKeyToAddress([Gx, Gy]))).toBe('7e5f4552091a69125d5dfcb7b8c2659029395bdf')
  })
})

describe('checksumEncode', () => {
  // Canonical test vectors from the EIP-55 specification itself.
  const vectors = [
    '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
    '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
    '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
  ]

  for (const expected of vectors) {
    it(`checksums ${expected}`, () => {
      expect(checksumEncode(hexToBytes(expected))).toBe(expected)
    })
  }
})
