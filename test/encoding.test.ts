import { describe, expect, it } from 'vitest'
import {
  base32ToUint8Array,
  base64ToUint8Array,
  binaryToUint8Array,
  hexToUint8Array,
  numberToUint16,
  numberToUint32,
  numberToUint64,
  numberToUint8,
  partition,
  sliceBytes,
  uint16ToNumber,
  uint32ToNumber,
  uint64ToNumber,
  uint8ArrayToBase32,
  uint8ArrayToBase64,
  uint8ArrayToBinary,
  uint8ArrayToHex,
  uint8ToNumber,
} from '../src/bytes/encoding.js'

describe('hex', () => {
  it('round-trips', () => {
    const bytes = Uint8Array.from([0x00, 0x01, 0x7f, 0xff, 0xab])
    expect(uint8ArrayToHex(bytes)).toBe('00017fffab')
    expect(hexToUint8Array('00017fffab')).toEqual(bytes)
  })

  it('accepts an 0x prefix', () => {
    expect(hexToUint8Array('0xdeadbeef')).toEqual(Uint8Array.from([0xde, 0xad, 0xbe, 0xef]))
  })
})

describe('base64', () => {
  it('matches the well-known encoding of "hello"', () => {
    const bytes = Uint8Array.from([104, 101, 108, 108, 111])
    expect(uint8ArrayToBase64(bytes)).toBe('aGVsbG8=')
    expect(base64ToUint8Array('aGVsbG8=')).toEqual(bytes)
  })

  it('round-trips arbitrary bytes', () => {
    const bytes = Uint8Array.from({ length: 37 }, (_, i) => (i * 7) % 256)
    expect(base64ToUint8Array(uint8ArrayToBase64(bytes))).toEqual(bytes)
  })
})

describe('base32', () => {
  it('round-trips arbitrary bytes', () => {
    const bytes = Uint8Array.from({ length: 41 }, (_, i) => (i * 11) % 256)
    expect(base32ToUint8Array(uint8ArrayToBase32(bytes))).toEqual(bytes)
  })
})

describe('binary', () => {
  it('matches a known bit pattern and round-trips', () => {
    const bytes = Uint8Array.from([0b10101010, 0b00000001])
    expect(uint8ArrayToBinary(bytes)).toBe('1010101000000001')
    expect(binaryToUint8Array('1010101000000001')).toEqual(bytes)
  })
})

describe('partition', () => {
  it('splits a buffer into fixed-size chunks, with a shorter final chunk', () => {
    const bytes = Uint8Array.from([1, 2, 3, 4, 5, 6, 7])
    const chunks = partition(bytes, 3)
    expect(chunks.map(c => Array.from(c))).toEqual([[1, 2, 3], [4, 5, 6], [7]])
  })

  it('returns views, not copies, of the original buffer', () => {
    const bytes = Uint8Array.from([1, 2, 3, 4])
    const [first] = partition(bytes, 2)
    bytes[0] = 99
    expect(first![0]).toBe(99)
  })
})

describe('sliceBytes', () => {
  it('splits a buffer into the requested lengths in order', () => {
    const bytes = Uint8Array.from([1, 2, 3, 4, 5, 6])
    const [a, b, c] = sliceBytes(bytes, [2, 1, 3])
    expect(Array.from(a!)).toEqual([1, 2])
    expect(Array.from(b!)).toEqual([3])
    expect(Array.from(c!)).toEqual([4, 5, 6])
  })
})

describe('fixed-width integers', () => {
  it('round-trips uint8', () => {
    expect(uint8ToNumber(numberToUint8(200))).toBe(200)
  })

  it('round-trips uint16 in both endiannesses', () => {
    expect(uint16ToNumber(numberToUint16(0x1234, 'BE'), 'BE')).toBe(0x1234)
    expect(uint16ToNumber(numberToUint16(0x1234, 'LE'), 'LE')).toBe(0x1234)
    expect(Array.from(numberToUint16(0x1234, 'BE'))).toEqual([0x12, 0x34])
    expect(Array.from(numberToUint16(0x1234, 'LE'))).toEqual([0x34, 0x12])
  })

  it('round-trips uint32 in both endiannesses', () => {
    expect(uint32ToNumber(numberToUint32(0x12345678, 'BE'), 'BE')).toBe(0x12345678)
    expect(uint32ToNumber(numberToUint32(0x12345678, 'LE'), 'LE')).toBe(0x12345678)
  })

  it('round-trips uint64 (bigint) in both endiannesses', () => {
    const value = 0x0123456789abcdefn
    expect(uint64ToNumber(numberToUint64(value, 'BE'), 'BE')).toBe(value)
    expect(uint64ToNumber(numberToUint64(value, 'LE'), 'LE')).toBe(value)
  })
})
