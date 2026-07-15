import { describe, expect, it } from 'vitest'
import { uint256ToNumber } from '../src/bytes/encoding.js'
import { keccak256 } from '../src/crypto/keccak.js'
import { privateKeyToPublicKey, SECP256K1_N } from '../src/crypto/keys.js'
import { recoverPublicKey, signHash, signMessage, verifySignature } from '../src/crypto/ecdsa.js'

describe('signMessage / verifySignature', () => {
  it('a signature verifies against the signer’s own public key', () => {
    const privateKey = 12345n
    const publicKey = privateKeyToPublicKey(privateKey)
    const message = Uint8Array.from([104, 101, 108, 108, 111]) // "hello"
    const [r, s] = signMessage(message, privateKey)
    expect(verifySignature(message, publicKey, r, s)).toBe(true)
  })

  it('rejects a signature checked against a different public key', () => {
    const message = Uint8Array.from([1, 2, 3, 4])
    const [r, s] = signMessage(message, 12345n)
    const otherPublicKey = privateKeyToPublicKey(999n)
    expect(verifySignature(message, otherPublicKey, r, s)).toBe(false)
  })

  it('rejects a signature if the message was tampered with', () => {
    const privateKey = 42n
    const publicKey = privateKeyToPublicKey(privateKey)
    const [r, s] = signMessage(Uint8Array.from([1, 2, 3]), privateKey)
    expect(verifySignature(Uint8Array.from([1, 2, 4]), publicKey, r, s)).toBe(false)
  })

  it('always produces a low-s signature (s <= N/2)', () => {
    for (const privateKey of [1n, 2n, 42n, 123456789n]) {
      const [, s] = signMessage(Uint8Array.from([9, 9, 9]), privateKey)
      expect(s <= SECP256K1_N / 2n).toBe(true)
    }
  })

  it('rejects out-of-range private keys', () => {
    expect(() => signMessage(Uint8Array.from([1]), 0n)).toThrow()
    expect(() => signMessage(Uint8Array.from([1]), SECP256K1_N)).toThrow()
  })

  it('is deterministic for the same input (fixed internal nonce derivation)', () => {
    const message = Uint8Array.from([5, 5, 5])
    const sig1 = signMessage(message, 777n)
    const sig2 = signMessage(message, 777n)
    expect(sig1).toEqual(sig2)
  })
})

describe('signHash', () => {
  it('signs a raw hash and verifies via signMessage’s keccak256(message) equivalent', () => {
    const privateKey = 55n
    const publicKey = privateKeyToPublicKey(privateKey)
    const message = Uint8Array.from([7, 8, 9])
    const hash = uint256ToNumber(keccak256(message), 'BE')
    const [r, s] = signHash(hash, privateKey)
    expect(verifySignature(message, publicKey, r, s)).toBe(true)
  })
})

describe('recoverPublicKey', () => {
  it('recovers the exact public key that produced the signature', () => {
    const privateKey = 54321n
    const publicKey = privateKeyToPublicKey(privateKey)
    const message = Uint8Array.from([10, 20, 30])
    const [r, s, v] = signMessage(message, privateKey)
    const recovered = recoverPublicKey(message, r, s, v)
    expect(recovered[0]).toBe(publicKey[0])
    expect(recovered[1]).toBe(publicKey[1])
  })

  it('recovers correctly across many private keys', () => {
    for (const privateKey of [1n, 2n, 100n, 999999n]) {
      const publicKey = privateKeyToPublicKey(privateKey)
      const message = Uint8Array.from([privateKey % 251n].map(Number))
      const [r, s, v] = signMessage(message, privateKey)
      const recovered = recoverPublicKey(message, r, s, v)
      expect(recovered[0]).toBe(publicKey[0])
      expect(recovered[1]).toBe(publicKey[1])
    }
  })
})
