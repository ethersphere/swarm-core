import { describe, expect, it } from 'vitest'
import { keccak256 } from '../src/crypto/keccak.js'

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

describe('keccak256', () => {
  it('matches the known vector for empty input', () => {
    expect(toHex(keccak256(new Uint8Array(0)))).toBe(
      'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
    )
  })

  it('produces a 32-byte digest', () => {
    expect(keccak256(new Uint8Array(0)).length).toBe(32)
    expect(keccak256(new Uint8Array(4096).fill(0x42)).length).toBe(32)
  })

  it('is deterministic across multiple blocks (regression guard, not an independently-verified vector)', () => {
    const input = new Uint8Array(4096).fill(0x42)
    expect(toHex(keccak256(input))).toBe('10595bb007e0aaedd221ba0eb3eb7603349721234ea88737d518256eaf4cd237')
  })
})
