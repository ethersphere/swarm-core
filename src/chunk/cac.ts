import { concatBytes } from '../bytes/encoding.js'
import { Bytes } from '../bytes/bytes.js'
import { Reference } from '../bytes/reference.js'
import { Span } from '../bytes/span.js'
import { calculateChunkAddress } from './bmt.js'

export const MIN_PAYLOAD_SIZE = 1
export const MAX_PAYLOAD_SIZE = 4096

/**
 * Content Addressed Chunk (CAC) - the immutable building block of Swarm,
 * holding at most 4096 bytes of payload.
 *
 * - `span` indicates the size of the `payload` in bytes.
 * - `payload` contains the actual data or the body of the chunk.
 * - `data` contains the full chunk data - `span` and `payload`.
 * - `address` is the Swarm hash (or reference) of the chunk.
 *
 * Note: bee-js's Chunk also has a `toSingleOwnerChunk()` method - deferred
 * here until SOC (a separate, still-unreconciled Unify item) exists.
 */
export interface Chunk {
  readonly data: Uint8Array
  span: Span
  payload: Bytes
  address: Reference
}

export function makeContentAddressedChunk(rawPayload: Bytes | Uint8Array | string, span?: Span | bigint): Chunk {
  if (typeof rawPayload === 'string') {
    rawPayload = Bytes.fromUtf8(rawPayload)
  }

  if (rawPayload.length < MIN_PAYLOAD_SIZE || rawPayload.length > MAX_PAYLOAD_SIZE) {
    throw new RangeError(`payload size ${rawPayload.length} exceeds limits [${MIN_PAYLOAD_SIZE}, ${MAX_PAYLOAD_SIZE}]`)
  }

  const typedSpan: Span = span
    ? typeof span === 'bigint'
      ? Span.fromBigInt(span)
      : span
    : Span.fromBigInt(BigInt(rawPayload.length))
  const payload = new Bytes(rawPayload)
  const data = concatBytes(typedSpan.toUint8Array(), payload.toUint8Array())
  const address = calculateChunkAddress(data)

  return { data, span: typedSpan, payload, address }
}

export function unmarshalContentAddressedChunk(data: Bytes | Uint8Array): Chunk {
  const bytes = new Bytes(data)

  return makeContentAddressedChunk(bytes.toUint8Array().slice(Span.LENGTH), Span.fromSlice(bytes.toUint8Array(), 0))
}
