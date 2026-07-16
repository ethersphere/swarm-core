import { concatBytes } from '../bytes/encoding.js'
import { BatchId } from '../bytes/batch-id.js'
import { Bytes } from '../bytes/bytes.js'

export interface Envelope {
  issuer: Uint8Array
  index: Uint8Array
  timestamp: Uint8Array
  signature: Uint8Array
}

export interface EnvelopeWithBatchId extends Envelope {
  batchId: BatchId
}

export function marshalStamp(
  signature: Uint8Array,
  batchId: Uint8Array,
  timestamp: Uint8Array,
  index: Uint8Array,
): Bytes {
  if (signature.length !== 65) {
    throw new Error('invalid signature length')
  }
  if (batchId.length !== 32) {
    throw new Error('invalid batch ID length')
  }
  if (timestamp.length !== 8) {
    throw new Error('invalid timestamp length')
  }
  if (index.length !== 8) {
    throw new Error('invalid index length')
  }
  return new Bytes(concatBytes(batchId, index, timestamp, signature))
}

export function convertEnvelopeToMarshaledStamp(envelope: EnvelopeWithBatchId): Bytes {
  return marshalStamp(envelope.signature, envelope.batchId.toUint8Array(), envelope.timestamp, envelope.index)
}
