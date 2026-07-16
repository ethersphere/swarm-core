import { describe, expect, it } from 'vitest'
import { uint256ToNumber, uint8ArrayToHex } from '../src/bytes/encoding.js'
import { REPLICAS_OWNER } from '../src/chunk/soc.js'
import { privateKeyToPublicKey, publicKeyToAddress } from '../src/crypto/keys.js'

describe('REPLICAS_OWNER', () => {
  it('is the address derived from the documented fixed private key [1, 0, ..., 0]', () => {
    const key = new Uint8Array(32)
    key[0] = 1
    const privateKey = uint256ToNumber(key, 'BE')
    const derivedAddress = publicKeyToAddress(privateKeyToPublicKey(privateKey))
    expect(uint8ArrayToHex(derivedAddress)).toBe(uint8ArrayToHex(REPLICAS_OWNER))
  })

  it('is 20 bytes', () => {
    expect(REPLICAS_OWNER.length).toBe(20)
  })
})
