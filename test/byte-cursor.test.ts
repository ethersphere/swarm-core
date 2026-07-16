import { describe, expect, it } from 'vitest'
import { Uint8ArrayReader, Uint8ArrayWriter } from '../src/chunk/byte-cursor.js'

describe('Uint8ArrayReader', () => {
  it('reads sequential chunks and advances the cursor', () => {
    const reader = new Uint8ArrayReader(Uint8Array.from([1, 2, 3, 4, 5, 6]))
    expect(Array.from(reader.read(2))).toEqual([1, 2])
    expect(Array.from(reader.read(3))).toEqual([3, 4, 5])
    expect(reader.max()).toBe(1)
    expect(Array.from(reader.read(1))).toEqual([6])
    expect(reader.max()).toBe(0)
  })
})

describe('Uint8ArrayWriter', () => {
  it('copies from a reader and advances both cursors', () => {
    const reader = new Uint8ArrayReader(Uint8Array.from([9, 8, 7, 6]))
    const target = new Uint8Array(4)
    const writer = new Uint8ArrayWriter(target)
    const written = writer.write(reader)
    expect(written).toBe(4)
    expect(Array.from(target)).toEqual([9, 8, 7, 6])
    expect(writer.max()).toBe(0)
    expect(reader.max()).toBe(0)
  })

  it('is bounded by whichever side has less room', () => {
    const reader = new Uint8ArrayReader(Uint8Array.from([1, 2, 3, 4, 5]))
    const target = new Uint8Array(3)
    const writer = new Uint8ArrayWriter(target)
    const written = writer.write(reader)
    expect(written).toBe(3)
    expect(Array.from(target)).toEqual([1, 2, 3])
    expect(reader.max()).toBe(2)
  })
})
