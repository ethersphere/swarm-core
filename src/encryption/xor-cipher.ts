/**
 * XORs `bytes` against `key`, repeating the key as needed. Symmetric - the
 * same function both encrypts and decrypts. Used for Mantaray's per-node
 * obfuscation key.
 */
export function xorCypher(bytes: Uint8Array, key: Uint8Array): Uint8Array {
  const result = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    result[i] = bytes[i]! ^ key[i % key.length]!
  }
  return result
}
