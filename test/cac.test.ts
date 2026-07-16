import { describe, expect, it } from 'vitest'
import { Bytes } from '../src/bytes/bytes.js'
import { Span } from '../src/bytes/span.js'
import { calculateChunkAddress } from '../src/chunk/bmt.js'
import { makeContentAddressedChunk, MAX_PAYLOAD_SIZE, MIN_PAYLOAD_SIZE, unmarshalContentAddressedChunk } from '../src/chunk/cac.js'

describe('makeContentAddressedChunk', () => {
  it('auto-computes the span from payload length when span is omitted', () => {
    const chunk = makeContentAddressedChunk('hello')
    expect(chunk.span.toBigInt()).toBe(5n)
  })

  it('accepts an explicit span as a bigint', () => {
    const chunk = makeContentAddressedChunk(new Uint8Array(10), 123n)
    expect(chunk.span.toBigInt()).toBe(123n)
  })

  it('accepts an explicit span as a Span instance', () => {
    const chunk = makeContentAddressedChunk(new Uint8Array(10), Span.fromBigInt(99n))
    expect(chunk.span.toBigInt()).toBe(99n)
  })

  it('treats a string payload as UTF-8', () => {
    const chunk = makeContentAddressedChunk('hello')
    expect(chunk.payload.toUtf8()).toBe('hello')
  })

  it('address matches calculateChunkAddress(span || payload) directly', () => {
    const chunk = makeContentAddressedChunk(new Uint8Array(50).fill(7))
    const expected = calculateChunkAddress(chunk.data)
    expect(chunk.address.toHex()).toBe(expected.toHex())
  })

  it('rejects a payload below MIN_PAYLOAD_SIZE', () => {
    expect(() => makeContentAddressedChunk(new Uint8Array(0))).toThrow()
  })

  it('rejects a payload above MAX_PAYLOAD_SIZE', () => {
    expect(() => makeContentAddressedChunk(new Uint8Array(MAX_PAYLOAD_SIZE + 1))).toThrow()
  })

  it('accepts payloads at the exact boundaries', () => {
    expect(() => makeContentAddressedChunk(new Uint8Array(MIN_PAYLOAD_SIZE))).not.toThrow()
    expect(() => makeContentAddressedChunk(new Uint8Array(MAX_PAYLOAD_SIZE))).not.toThrow()
  })
})

describe('unmarshalContentAddressedChunk', () => {
  it('round-trips a chunk created by makeContentAddressedChunk', () => {
    const original = makeContentAddressedChunk('round trip me')
    const parsed = unmarshalContentAddressedChunk(original.data)

    expect(parsed.payload.toUtf8()).toBe('round trip me')
    expect(parsed.span.toBigInt()).toBe(original.span.toBigInt())
    expect(parsed.address.toHex()).toBe(original.address.toHex())
  })

  it('accepts a Bytes instance as well as a Uint8Array', () => {
    const original = makeContentAddressedChunk('via bytes')
    const parsed = unmarshalContentAddressedChunk(new Bytes(original.data))
    expect(parsed.payload.toUtf8()).toBe('via bytes')
  })
})
