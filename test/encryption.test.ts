import { describe, expect, it } from 'vitest'
import { numberToUint64 } from '../src/bytes/encoding.js'
import { decryptChunk, encryptData, encryptSegments, encryptSpan, xorCypher } from '../src/encryption/index.js'

describe('xorCypher', () => {
  it('encrypting twice with the same key returns the original bytes', () => {
    const key = Uint8Array.from([1, 2, 3, 4])
    const data = Uint8Array.from([10, 20, 30, 40, 50, 60, 70])
    expect(xorCypher(xorCypher(data, key), key)).toEqual(data)
  })

  it('matches a hand-computed XOR', () => {
    expect(xorCypher(Uint8Array.from([0b1010, 0b0110]), Uint8Array.from([0b1111]))).toEqual(
      Uint8Array.from([0b0101, 0b1001]),
    )
  })
})

describe('encryptSegments / encryptSpan / encryptData', () => {
  const key = Uint8Array.from({ length: 32 }, (_, i) => i)

  it('is its own inverse (symmetric stream cipher)', () => {
    const data = Uint8Array.from({ length: 100 }, (_, i) => (i * 13) % 256)
    const encrypted = encryptSegments(key, 0, data)
    expect(encrypted).not.toEqual(data)
    expect(encryptSegments(key, 0, encrypted)).toEqual(data)
  })

  it('encryptSpan and encryptData use different counters, producing different output for the same bytes', () => {
    const bytes = Uint8Array.from({ length: 8 }, (_, i) => i)
    expect(encryptSpan(key, bytes)).not.toEqual(encryptData(key, bytes))
  })
})

describe('decryptChunk', () => {
  it('recovers the original span and data from an encrypted chunk', () => {
    const key = Uint8Array.from({ length: 32 }, (_, i) => i * 3)
    const span = 4096n
    const data = Uint8Array.from({ length: 4096 }, (_, i) => (i * 17) % 256)

    const encryptedSpan = encryptSpan(key, numberToUint64(span, 'LE'))
    const encryptedData = encryptData(key, data)
    const encryptedChunk = new Uint8Array(8 + 4096)
    encryptedChunk.set(encryptedSpan, 0)
    encryptedChunk.set(encryptedData, 8)

    const decrypted = decryptChunk(encryptedChunk, key)
    expect(decrypted.span).toBe(span)
    expect(decrypted.data).toEqual(data)
  })
})
