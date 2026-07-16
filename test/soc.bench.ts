import { bench } from 'vitest'
import { makeContentAddressedChunk } from '../src/chunk/cac.js'
import { makeSingleOwnerChunk, unmarshalSingleOwnerChunk } from '../src/chunk/soc.js'

const PRIVATE_KEY = 0x1234567890abcdefn
const IDENTIFIER = new Uint8Array(32).fill(9)
const cac = makeContentAddressedChunk(new Uint8Array(4096).fill(0x42))
const soc = makeSingleOwnerChunk(cac, IDENTIFIER, PRIVATE_KEY)

bench('makeSingleOwnerChunk (sign) 4096-byte payload', () => {
  makeSingleOwnerChunk(cac, IDENTIFIER, PRIVATE_KEY)
})

bench('unmarshalSingleOwnerChunk (recover + verify) 4096-byte payload', () => {
  unmarshalSingleOwnerChunk(soc.data, soc.address)
})
