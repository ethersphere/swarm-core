import { describe, expect, it } from 'vitest'
import { concatBytes, numberToUint64, uint8ArrayToHex } from '../src/bytes/encoding.js'
import { makeContentAddressedChunk } from '../src/chunk/cac.js'
import { ChunkJoiner } from '../src/chunk/joiner.js'
import { ChunkBuilder, ChunkEntry, ChunkSplitter } from '../src/chunk/splitter.js'
import { encryptData, encryptSpan } from '../src/encryption/stream-cipher.js'

// Captures every sealed chunk (leaf and intermediate) as onBatch sees them,
// so a ChunkJoiner can later fetch them back out by address.
function makeStorage() {
  const store = new Map<string, Uint8Array>()

  async function onBatch(entries: ChunkEntry[]): Promise<ChunkEntry[]> {
    for (const { chunk, key } of entries) {
      if (key) {
        // encryptedHash() only returns {address, key}, not the encrypted
        // bytes themselves - a real storage layer computes those separately,
        // same as here.
        const { address } = chunk.encryptedHash(key)
        const encSpan = encryptSpan(key, numberToUint64(chunk.span, 'LE'))
        const encPayload = encryptData(key, chunk.writer.buffer)
        store.set(uint8ArrayToHex(address.toUint8Array()), concatBytes(encSpan, encPayload))
      } else {
        store.set(uint8ArrayToHex(chunk.hash().toUint8Array()), chunk.build())
      }
    }

    return []
  }

  function put(address: Uint8Array, data: Uint8Array) {
    store.set(uint8ArrayToHex(address), data)
  }

  async function fetch(address: Uint8Array): Promise<Uint8Array> {
    const data = store.get(uint8ArrayToHex(address))
    if (!data) throw new Error(`not found: ${uint8ArrayToHex(address)}`)

    return data
  }

  return { onBatch, put, fetch }
}

describe('ChunkSplitter', () => {
  it('a single-chunk payload produces the same address as makeContentAddressedChunk', async () => {
    const data = Uint8Array.from({ length: 100 }, (_, i) => i)
    const root = await ChunkSplitter.root(data)
    const cac = makeContentAddressedChunk(data)

    expect(root.hash().toHex()).toBe(cac.address.toHex())
  })

  it('a full 4096-byte payload also stays a single chunk', async () => {
    const data = new Uint8Array(4096).fill(9)
    const root = await ChunkSplitter.root(data)
    const cac = makeContentAddressedChunk(data)

    expect(root.hash().toHex()).toBe(cac.address.toHex())
  })
})

describe('ChunkSplitter + ChunkJoiner round-trip', () => {
  it('reconstructs a small (single-chunk) payload', async () => {
    const storage = makeStorage()
    const data = Uint8Array.from({ length: 500 }, (_, i) => (i * 3) % 256)

    const splitter = new ChunkSplitter(storage.onBatch)
    await splitter.append(data)
    const root: ChunkBuilder = await splitter.finalize()
    storage.put(root.hash().toUint8Array(), root.build())

    const collected = await ChunkJoiner.collect(root.hash().toUint8Array(), storage.fetch)
    expect(collected).toEqual(data)
  })

  it('reconstructs a multi-chunk payload (spanning several 4096-byte leaves)', async () => {
    const storage = makeStorage()
    const data = Uint8Array.from({ length: 4096 * 5 + 777 }, (_, i) => (i * 7 + 3) % 256)

    const splitter = new ChunkSplitter(storage.onBatch)
    await splitter.append(data)
    const root = await splitter.finalize()
    storage.put(root.hash().toUint8Array(), root.build())

    const collected = await ChunkJoiner.collect(root.hash().toUint8Array(), storage.fetch)
    expect(collected).toEqual(data)
  })

  it('reconstructs an encrypted multi-chunk payload', async () => {
    const storage = makeStorage()
    const data = Uint8Array.from({ length: 4096 * 3 + 123 }, (_, i) => (i * 5 + 1) % 256)

    const splitter = new ChunkSplitter(storage.onBatch, undefined, true)
    await splitter.append(data)
    const root = await splitter.finalize()
    const { address, key } = root.encryptedHash()
    const encSpan = encryptSpan(key, numberToUint64(root.span, 'LE'))
    const encPayload = encryptData(key, root.writer.buffer)
    storage.put(address.toUint8Array(), concatBytes(encSpan, encPayload))

    const collected = await ChunkJoiner.collectEncrypted(address.toUint8Array(), key, storage.fetch)
    expect(collected).toEqual(data)
  })

  it('reconstructs an empty payload', async () => {
    const storage = makeStorage()
    const splitter = new ChunkSplitter(storage.onBatch)
    await splitter.append(new Uint8Array(0))
    const root = await splitter.finalize()
    storage.put(root.hash().toUint8Array(), root.build())

    const collected = await ChunkJoiner.collect(root.hash().toUint8Array(), storage.fetch)
    expect(collected).toEqual(new Uint8Array(0))
  })
})
