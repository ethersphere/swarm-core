import { describe, expect, it } from 'vitest'
import { Reference } from '../src/bytes/reference.js'

describe('Reference', () => {
  it('accepts a 32-byte (unencrypted) reference', () => {
    expect(new Reference(new Uint8Array(32)).length).toBe(32)
  })

  it('accepts a 64-byte (encrypted) reference', () => {
    expect(new Reference(new Uint8Array(64)).length).toBe(64)
  })

  it('rejects any other length', () => {
    expect(() => new Reference(new Uint8Array(20))).toThrow()
    expect(() => new Reference(new Uint8Array(33))).toThrow()
  })

  it('accepts a hex string', () => {
    const hex = 'ab'.repeat(32)
    expect(new Reference(hex).toHex()).toBe(hex)
  })
})
