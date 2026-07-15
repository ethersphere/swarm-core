export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, array) => sum + array.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const array of arrays) {
    result.set(array, offset)
    offset += array.length
  }
  return result
}

export function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function numberToUint256(value: bigint, endian: 'LE' | 'BE'): Uint8Array {
  const bytes = new Uint8Array(32)
  let remaining = value
  if (endian === 'LE') {
    for (let i = 0; i < 32; i++) {
      bytes[i] = Number(remaining & 0xffn)
      remaining >>= 8n
    }
    return bytes
  }
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(remaining & 0xffn)
    remaining >>= 8n
  }
  return bytes
}

export function uint256ToNumber(bytes: Uint8Array, endian: 'LE' | 'BE'): bigint {
  let result = 0n
  if (endian === 'LE') {
    for (let i = 31; i >= 0; i--) {
      result = (result << 8n) | BigInt(bytes[i]!)
    }
    return result
  }
  for (let i = 0; i < 32; i++) {
    result = (result << 8n) | BigInt(bytes[i]!)
  }
  return result
}
