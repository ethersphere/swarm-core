import { secp256k1 } from '@noble/curves/secp256k1.js'
import { keccak256 } from './keccak.js'

// prehash: false everywhere below - we hash with keccak256 ourselves (Ethereum
// convention), not the sha256 @noble/curves would apply by default.

/**
 * Signs keccak256(message) with the given private key, using @noble/curves'
 * constant-time secp256k1 implementation. Returns [r, s, v] with v as
 * Ethereum's 27/28 recovery-id convention.
 */
export function signMessage(message: Uint8Array, privateKey: bigint): [bigint, bigint, 27n | 28n] {
  const signature = secp256k1.sign(keccak256(message), privateKey, { prehash: false })
  const v: 27n | 28n = signature.recovery === 0 ? 27n : 28n
  return [signature.r, signature.s, v]
}

/**
 * Signs a raw 32-byte hash directly (no keccak256 applied), otherwise
 * identical to {@link signMessage}.
 */
export function signHash(hash: bigint, privateKey: bigint): [bigint, bigint, 27n | 28n] {
  const hashBytes = new Uint8Array(32)
  let remaining = hash
  for (let i = 31; i >= 0; i--) {
    hashBytes[i] = Number(remaining & 0xffn)
    remaining >>= 8n
  }
  const signature = secp256k1.sign(hashBytes, privateKey, { prehash: false })
  const v: 27n | 28n = signature.recovery === 0 ? 27n : 28n
  return [signature.r, signature.s, v]
}

/**
 * Recovers the public key point that produced a [r, s, v] signature over keccak256(message).
 */
export function recoverPublicKey(message: Uint8Array, r: bigint, s: bigint, v: 27n | 28n): [bigint, bigint] {
  const recovery = v === 27n ? 0 : 1
  const signature = new secp256k1.Signature(r, s, recovery)
  const point = signature.recoverPublicKey(keccak256(message))
  return [point.x, point.y]
}

/**
 * Verifies that [r, s] is a valid signature over keccak256(message) by the given public key.
 */
export function verifySignature(message: Uint8Array, publicKey: [bigint, bigint], r: bigint, s: bigint): boolean {
  const signatureBytes = new secp256k1.Signature(r, s).toBytes('compact')
  const publicKeyBytes = secp256k1.Point.fromAffine({ x: publicKey[0], y: publicKey[1] }).toBytes(true)
  return secp256k1.verify(signatureBytes, keccak256(message), publicKeyBytes, { prehash: false })
}
