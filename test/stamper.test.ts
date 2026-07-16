import { describe, expect, it } from 'vitest'
import { BatchId } from '../src/bytes/batch-id.js'
import { getStampTheoreticalBytes, getStampUsage } from '../src/stamper/capacity.js'
import { convertEnvelopeToMarshaledStamp, marshalStamp } from '../src/stamper/marshal.js'

describe('getStampUsage', () => {
  it('is 0 when utilization is 0', () => {
    expect(getStampUsage(0, 20, 16)).toBe(0)
  })

  it('halves for each extra level of depth beyond bucket depth', () => {
    expect(getStampUsage(1, 17, 16)).toBeCloseTo(0.5)
    expect(getStampUsage(1, 18, 16)).toBeCloseTo(0.25)
  })
})

describe('getStampTheoreticalBytes', () => {
  it('is chunk size (4096) at depth 0', () => {
    expect(getStampTheoreticalBytes(0)).toBe(4096)
  })

  it('doubles for each extra depth', () => {
    expect(getStampTheoreticalBytes(1)).toBe(8192)
    expect(getStampTheoreticalBytes(2)).toBe(16384)
  })
})

describe('marshalStamp', () => {
  const signature = new Uint8Array(65).fill(1)
  const batchId = new Uint8Array(32).fill(2)
  const timestamp = new Uint8Array(8).fill(3)
  const index = new Uint8Array(8).fill(4)

  it('concatenates batchId || index || timestamp || signature', () => {
    const marshaled = marshalStamp(signature, batchId, timestamp, index)
    expect(marshaled.length).toBe(32 + 8 + 8 + 65)
    const bytes = marshaled.toUint8Array()
    expect(bytes.subarray(0, 32)).toEqual(batchId)
    expect(bytes.subarray(32, 40)).toEqual(index)
    expect(bytes.subarray(40, 48)).toEqual(timestamp)
    expect(bytes.subarray(48, 113)).toEqual(signature)
  })

  it('rejects wrong-length fields', () => {
    expect(() => marshalStamp(new Uint8Array(64), batchId, timestamp, index)).toThrow()
    expect(() => marshalStamp(signature, new Uint8Array(31), timestamp, index)).toThrow()
    expect(() => marshalStamp(signature, batchId, new Uint8Array(7), index)).toThrow()
    expect(() => marshalStamp(signature, batchId, timestamp, new Uint8Array(9))).toThrow()
  })
})

describe('convertEnvelopeToMarshaledStamp', () => {
  it('matches calling marshalStamp directly with the envelope fields', () => {
    const signature = new Uint8Array(65).fill(9)
    const timestamp = new Uint8Array(8).fill(8)
    const index = new Uint8Array(8).fill(7)
    const batchId = new BatchId(new Uint8Array(32).fill(6))

    const viaEnvelope = convertEnvelopeToMarshaledStamp({
      issuer: new Uint8Array(20),
      signature,
      timestamp,
      index,
      batchId,
    })
    const viaDirect = marshalStamp(signature, batchId.toUint8Array(), timestamp, index)

    expect(viaEnvelope.toHex()).toBe(viaDirect.toHex())
  })
})
