import { secp256k1 } from '@noble/curves/secp256k1.js'
import { concatBytes, numberToUint256, uint8ArrayToHex } from '../bytes/encoding.js'
import { keccak256 } from './keccak.js'

export const SECP256K1_N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n

export function privateKeyToPublicKey(privateKey: bigint): [bigint, bigint] {
  if (privateKey <= 0n || privateKey >= SECP256K1_N) {
    throw new Error('Invalid private key')
  }
  const point = secp256k1.Point.BASE.multiply(privateKey)
  return [point.x, point.y]
}

export function compressPublicKey(publicKey: [bigint, bigint]): Uint8Array {
  return secp256k1.Point.fromAffine({ x: publicKey[0], y: publicKey[1] }).toBytes(true)
}

export function publicKeyFromCompressed(compressed: Uint8Array): [bigint, bigint] {
  if (compressed.length !== 33 || (compressed[0] !== 0x02 && compressed[0] !== 0x03)) {
    throw new Error('Invalid compressed public key')
  }
  const point = secp256k1.Point.fromBytes(compressed)
  return [point.x, point.y]
}

export function publicKeyToAddress(publicKey: [bigint, bigint]): Uint8Array {
  const address = new Uint8Array(20)
  const hash = keccak256(concatBytes(numberToUint256(publicKey[0], 'BE'), numberToUint256(publicKey[1], 'BE')))
  address.set(hash.subarray(12))
  return address
}

export function checksumEncode(addressBytes: Uint8Array): string {
  const address = uint8ArrayToHex(addressBytes)
  const addressAscii = Uint8Array.from(address, char => char.charCodeAt(0))
  const hash = uint8ArrayToHex(keccak256(addressAscii))
  let result = '0x'
  for (let i = 0; i < address.length; i++) {
    result += parseInt(hash.charAt(i), 16) > 7 ? address.charAt(i).toUpperCase() : address.charAt(i)
  }
  return result
}
