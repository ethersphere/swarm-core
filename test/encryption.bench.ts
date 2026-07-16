import { bench } from 'vitest'
import { encryptData } from '../src/encryption/stream-cipher.js'

const key = new Uint8Array(32).fill(0x11)
const data = new Uint8Array(4096).fill(0x42)

bench('encryptData 4096 bytes', () => {
  encryptData(key, data)
})
