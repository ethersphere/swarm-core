import { describe, expect, it } from 'vitest'
import { BatchId } from '../src/bytes/batch-id.js'
import {
  getDepthForSize,
  getStampEffectiveBytes,
  getStampEffectiveBytesBreakpoints,
  getStampTheoreticalBytes,
  getStampUsage,
} from '../src/stamper/capacity.js'
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

describe('getStampEffectiveBytes', () => {
  it('is 0 below depth 17', () => {
    expect(getStampEffectiveBytes(10)).toBe(0)
  })

  it('uses the default (encrypted, medium) table when encryption/level are omitted', () => {
    // https://docs.ethswarm.org/docs/learn/technology/contracts/postage-stamp/#effective-utilisation-table
    expect(getStampEffectiveBytes(25)).toBe(96_500_000_000)
  })

  it('falls back to theoreticalBytes * 0.9 above the table range', () => {
    expect(getStampEffectiveBytes(40)).toBe(Math.ceil(getStampTheoreticalBytes(40) * 0.9))
  })

  it('picks the exact table for a given encryption/redundancy-level combination', () => {
    // ENCRYPTION_OFF, level NONE (0), depth 25 -> "105.51 GB"
    expect(getStampEffectiveBytes(25, false, 0)).toBe(105_510_000_000)
    // ENCRYPTION_ON, level PARANOID (4), depth 20 -> "202.53 MB"
    expect(getStampEffectiveBytes(20, true, 4)).toBe(202_530_000)
  })
})

describe('getStampEffectiveBytesBreakpoints', () => {
  it('covers depths 17..34 and matches getStampEffectiveBytes for each', () => {
    const breakpoints = getStampEffectiveBytesBreakpoints(false, 0)
    expect(breakpoints.size).toBe(18)
    expect(breakpoints.get(25)).toBe(getStampEffectiveBytes(25, false, 0))
    expect(breakpoints.get(17)).toBe(getStampEffectiveBytes(17, false, 0))
  })
})

describe('getDepthForSize', () => {
  it('is the smallest depth whose effective size covers the given size', () => {
    const sizeAtDepth25 = getStampEffectiveBytes(25)
    expect(getDepthForSize(sizeAtDepth25)).toBe(25)
  })

  it('is 17 for a size of 0', () => {
    expect(getDepthForSize(0)).toBe(17)
  })

  it('is 35 for a size beyond the table range', () => {
    expect(getDepthForSize(1e18)).toBe(35)
  })

  it('round-trips with getStampEffectiveBytes for an explicit encryption/level combination', () => {
    const sizeOffNone25 = getStampEffectiveBytes(25, false, 0)
    expect(getDepthForSize(sizeOffNone25, false, 0)).toBe(25)
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
