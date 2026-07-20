import { describe, expect, it } from 'vitest'
import { numberToUint256, uint8ArrayToHex } from '../src/bytes/encoding.js'
import { EthAddress } from '../src/bytes/eth-address.js'
import { PrivateKey } from '../src/bytes/private-key.js'
import { PublicKey } from '../src/bytes/public-key.js'
import { Signature } from '../src/bytes/signature.js'
import { privateKeyToPublicKey } from '../src/crypto/keys.js'

// Independently-known values (not derived from the implementation under test).
const SECP256K1_X = 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n
const SECP256K1_Y = 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n
// Well-known address for private key = 1 (the generator point itself),
// cross-checked in test/keys.test.ts's publicKeyToAddress test too.
const PRIVATE_KEY_ONE_ADDRESS = '7e5f4552091a69125d5dfcb7b8c2659029395bdf'

describe('PrivateKey.publicKey', () => {
  it('derives the generator point for private key 1', () => {
    const privateKey = new PrivateKey(numberToUint256(1n, 'BE'))
    const publicKey = privateKey.publicKey()

    expect(publicKey.length).toBe(64)
    expect(uint8ArrayToHex(publicKey.toUint8Array().subarray(0, 32))).toBe(uint8ArrayToHex(numberToUint256(SECP256K1_X, 'BE')))
    expect(uint8ArrayToHex(publicKey.toUint8Array().subarray(32, 64))).toBe(uint8ArrayToHex(numberToUint256(SECP256K1_Y, 'BE')))
  })

  it('matches the raw crypto/keys.ts function for an arbitrary key', () => {
    const rawKey = 424242n
    const privateKey = new PrivateKey(numberToUint256(rawKey, 'BE'))
    const [x, y] = privateKeyToPublicKey(rawKey)

    expect(privateKey.publicKey().toHex()).toBe(uint8ArrayToHex(numberToUint256(x, 'BE')) + uint8ArrayToHex(numberToUint256(y, 'BE')))
  })
})

describe('PublicKey.address', () => {
  it('matches the well-known address for private key 1', () => {
    const publicKey = new PrivateKey(numberToUint256(1n, 'BE')).publicKey()
    expect(publicKey.address().toHex()).toBe(PRIVATE_KEY_ONE_ADDRESS)
  })
})

describe('PublicKey compressed round-trip', () => {
  it('round-trips through the 33-byte compressed constructor path', () => {
    const publicKey = new PrivateKey(numberToUint256(777n, 'BE')).publicKey()
    const compressed = publicKey.toCompressedUint8Array()
    expect(compressed.length).toBe(33)

    const restored = new PublicKey(compressed)
    expect(restored.toHex()).toBe(publicKey.toHex())
    expect(restored.address().toHex()).toBe(publicKey.address().toHex())
  })

  it('toCompressedHex matches uint8ArrayToHex(toCompressedUint8Array())', () => {
    const publicKey = new PrivateKey(numberToUint256(3n, 'BE')).publicKey()
    expect(publicKey.toCompressedHex()).toBe(uint8ArrayToHex(publicKey.toCompressedUint8Array()))
  })
})

describe('PrivateKey.sign / Signature.recoverPublicKey / Signature.isValid', () => {
  it('a signature verifies against the signer’s own address and recovers the exact public key', () => {
    const privateKey = new PrivateKey(numberToUint256(9999n, 'BE'))
    const publicKey = privateKey.publicKey()
    const message = 'hello swarm'

    const signature = privateKey.sign(message)
    expect(signature.length).toBe(65)

    const recovered = signature.recoverPublicKey(message)
    expect(recovered.toHex()).toBe(publicKey.toHex())
    expect(signature.isValid(message, publicKey.address())).toBe(true)
  })

  it('rejects a signature checked against a different address', () => {
    const privateKey = new PrivateKey(numberToUint256(1n, 'BE'))
    const otherAddress = new PrivateKey(numberToUint256(2n, 'BE')).publicKey().address()
    const signature = privateKey.sign('message')

    expect(signature.isValid('message', otherAddress)).toBe(false)
  })

  it('rejects a signature if the signed data was tampered with', () => {
    const privateKey = new PrivateKey(numberToUint256(42n, 'BE'))
    const signature = privateKey.sign('original message')

    expect(signature.isValid('a different message', privateKey.publicKey().address())).toBe(false)
  })

  it('accepts raw Uint8Array data as well as strings', () => {
    const privateKey = new PrivateKey(numberToUint256(55n, 'BE'))
    const data = Uint8Array.from([1, 2, 3, 4, 5])
    const signature = privateKey.sign(data)

    expect(signature.isValid(data, privateKey.publicKey().address())).toBe(true)
  })

  it('Signature.fromSlice extracts a signature embedded in a larger buffer', () => {
    const privateKey = new PrivateKey(numberToUint256(7n, 'BE'))
    const signature = privateKey.sign('embedded')
    const buffer = new Uint8Array(10 + 65 + 5)
    buffer.set(signature.toUint8Array(), 10)

    const extracted = Signature.fromSlice(buffer, 10)
    expect(extracted.toHex()).toBe(signature.toHex())
  })
})

describe('EthAddress.equals interop with Signature.isValid', () => {
  it('accepts a raw Uint8Array or hex string as the expected address', () => {
    const privateKey = new PrivateKey(numberToUint256(1n, 'BE'))
    const signature = privateKey.sign('x')
    const address: EthAddress = privateKey.publicKey().address()

    expect(signature.isValid('x', address.toUint8Array())).toBe(true)
    expect(signature.isValid('x', address.toHex())).toBe(true)
  })
})
