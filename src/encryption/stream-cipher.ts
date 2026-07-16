import { uint64ToNumber } from '../bytes/encoding.js'
import { keccak256 } from '../crypto/keccak.js'

// initCtr for the span field: ChunkSize / KeyLength = 4096 / 32 = 128
const SPAN_ENCRYPT_INIT_CTR = 128

// Counter-mode stream cipher: segmentKey = keccak256(keccak256(key || LE32(initCtr+i)))
// Symmetric — the same function both encrypts and decrypts.
export function encryptSegments(key: Uint8Array, initCtr: number, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length)
  const buf = new Uint8Array(36)
  buf.set(key)
  for (let i = 0, offset = 0; offset < data.length; i++, offset += 32) {
    const ctr = (initCtr + i) >>> 0
    buf[32] = ctr & 0xff
    buf[33] = (ctr >>> 8) & 0xff
    buf[34] = (ctr >>> 16) & 0xff
    buf[35] = (ctr >>> 24) & 0xff
    const segKey = keccak256(keccak256(buf))
    const end = Math.min(offset + 32, data.length)
    for (let j = offset; j < end; j++) {
      out[j] = data[j]! ^ segKey[j - offset]!
    }
  }
  return out
}

export function encryptSpan(key: Uint8Array, spanBytes: Uint8Array): Uint8Array {
  return encryptSegments(key, SPAN_ENCRYPT_INIT_CTR, spanBytes)
}

export function encryptData(key: Uint8Array, data: Uint8Array): Uint8Array {
  return encryptSegments(key, 0, data)
}

// encryptSpan / encryptData also serve as their own inverses (XOR cipher).
export function decryptChunk(encBytes: Uint8Array, key: Uint8Array): { span: bigint; data: Uint8Array } {
  return {
    span: uint64ToNumber(encryptSpan(key, encBytes.subarray(0, 8)), 'LE'),
    data: encryptData(key, encBytes.subarray(8, 4104)),
  }
}
