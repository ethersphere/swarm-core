import { partition } from '../bytes/encoding.js'

type KeccakState = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

const IOTA_CONSTANTS = [
  0x00000000, 0x00000001, 0x00000000, 0x00008082, 0x80000000, 0x0000808a, 0x80000000, 0x80008000, 0x00000000,
  0x0000808b, 0x00000000, 0x80000001, 0x80000000, 0x80008081, 0x80000000, 0x00008009, 0x00000000, 0x0000008a,
  0x00000000, 0x00000088, 0x00000000, 0x80008009, 0x00000000, 0x8000000a, 0x00000000, 0x8000808b, 0x80000000,
  0x0000008b, 0x80000000, 0x00008089, 0x80000000, 0x00008003, 0x80000000, 0x00008002, 0x80000000, 0x00000080,
  0x00000000, 0x0000800a, 0x80000000, 0x8000000a, 0x80000000, 0x80008081, 0x80000000, 0x00008080, 0x00000000,
  0x80000001, 0x80000000, 0x80008008,
]

/**
 * Hashes `bytes` with Keccak-256 (the original, pre-NIST-finalization
 * padding used by Ethereum/Swarm - not FIPS-202 SHA3-256).
 */
export function keccak256(bytes: Uint8Array): Uint8Array {
  return squeeze(absorb(new Array(50).fill(0) as KeccakState, divideToBlocks(bytes, 0b00000001)))
}

// noUncheckedIndexedAccess can't prove bounds for these computed indices, but
// every access here is bounds-safe by construction (loop limits matching the
// array's known length). Asserted inline rather than through a shared helper
// function: routing different-shaped arrays through one function's `arr[i]`
// makes V8's inline cache go megamorphic, measured at ~30-35% slower.
function absorb(state: KeccakState, blocks: number[][]): KeccakState {
  for (const block of blocks) {
    for (let i = 0; i < 34; i += 2) {
      state[i] = state[i]! ^ block[i + 1]!
      state[i + 1] = state[i + 1]! ^ block[i]!
    }
    keccakPermutate(state)
  }
  return state
}

function keccakPermutate(state: KeccakState) {
  for (let round = 0; round < 24; round++) {
    // theta
    const thetaC0 = state[0] ^ state[10] ^ state[20] ^ state[30] ^ state[40]
    const thetaC1 = state[1] ^ state[11] ^ state[21] ^ state[31] ^ state[41]
    const thetaC2 = state[2] ^ state[12] ^ state[22] ^ state[32] ^ state[42]
    const thetaC3 = state[3] ^ state[13] ^ state[23] ^ state[33] ^ state[43]
    const thetaC4 = state[4] ^ state[14] ^ state[24] ^ state[34] ^ state[44]
    const thetaC5 = state[5] ^ state[15] ^ state[25] ^ state[35] ^ state[45]
    const thetaC6 = state[6] ^ state[16] ^ state[26] ^ state[36] ^ state[46]
    const thetaC7 = state[7] ^ state[17] ^ state[27] ^ state[37] ^ state[47]
    const thetaC8 = state[8] ^ state[18] ^ state[28] ^ state[38] ^ state[48]
    const thetaC9 = state[9] ^ state[19] ^ state[29] ^ state[39] ^ state[49]
    const rotLow0 = (thetaC2 << 1) | (thetaC3 >>> 31)
    const rotHigh0 = (thetaC3 << 1) | (thetaC2 >>> 31)
    const thetaD0 = thetaC8 ^ rotLow0
    const thetaD1 = thetaC9 ^ rotHigh0
    const rotLow1 = (thetaC4 << 1) | (thetaC5 >>> 31)
    const rotHigh1 = (thetaC5 << 1) | (thetaC4 >>> 31)
    const thetaD2 = thetaC0 ^ rotLow1
    const thetaD3 = thetaC1 ^ rotHigh1
    const rotLow2 = (thetaC6 << 1) | (thetaC7 >>> 31)
    const rotHigh2 = (thetaC7 << 1) | (thetaC6 >>> 31)
    const thetaD4 = thetaC2 ^ rotLow2
    const thetaD5 = thetaC3 ^ rotHigh2
    const rotLow3 = (thetaC8 << 1) | (thetaC9 >>> 31)
    const rotHigh3 = (thetaC9 << 1) | (thetaC8 >>> 31)
    const thetaD6 = thetaC4 ^ rotLow3
    const thetaD7 = thetaC5 ^ rotHigh3
    const rotLow4 = (thetaC0 << 1) | (thetaC1 >>> 31)
    const rotHigh4 = (thetaC1 << 1) | (thetaC0 >>> 31)
    const thetaD8 = thetaC6 ^ rotLow4
    const thetaD9 = thetaC7 ^ rotHigh4
    state[0] ^= thetaD0
    state[1] ^= thetaD1
    state[2] ^= thetaD2
    state[3] ^= thetaD3
    state[4] ^= thetaD4
    state[5] ^= thetaD5
    state[6] ^= thetaD6
    state[7] ^= thetaD7
    state[8] ^= thetaD8
    state[9] ^= thetaD9
    state[10] ^= thetaD0
    state[11] ^= thetaD1
    state[12] ^= thetaD2
    state[13] ^= thetaD3
    state[14] ^= thetaD4
    state[15] ^= thetaD5
    state[16] ^= thetaD6
    state[17] ^= thetaD7
    state[18] ^= thetaD8
    state[19] ^= thetaD9
    state[20] ^= thetaD0
    state[21] ^= thetaD1
    state[22] ^= thetaD2
    state[23] ^= thetaD3
    state[24] ^= thetaD4
    state[25] ^= thetaD5
    state[26] ^= thetaD6
    state[27] ^= thetaD7
    state[28] ^= thetaD8
    state[29] ^= thetaD9
    state[30] ^= thetaD0
    state[31] ^= thetaD1
    state[32] ^= thetaD2
    state[33] ^= thetaD3
    state[34] ^= thetaD4
    state[35] ^= thetaD5
    state[36] ^= thetaD6
    state[37] ^= thetaD7
    state[38] ^= thetaD8
    state[39] ^= thetaD9
    state[40] ^= thetaD0
    state[41] ^= thetaD1
    state[42] ^= thetaD2
    state[43] ^= thetaD3
    state[44] ^= thetaD4
    state[45] ^= thetaD5
    state[46] ^= thetaD6
    state[47] ^= thetaD7
    state[48] ^= thetaD8
    state[49] ^= thetaD9
    // rho and pi
    const piResult0 = state[0]
    const piResult1 = state[1]
    const piResult20 = (state[2] << 1) | (state[3] >>> 31)
    const piResult21 = (state[3] << 1) | (state[2] >>> 31)
    const piResult40 = (state[5] << 30) | (state[4] >>> 2)
    const piResult41 = (state[4] << 30) | (state[5] >>> 2)
    const piResult10 = (state[6] << 28) | (state[7] >>> 4)
    const piResult11 = (state[7] << 28) | (state[6] >>> 4)
    const piResult30 = (state[8] << 27) | (state[9] >>> 5)
    const piResult31 = (state[9] << 27) | (state[8] >>> 5)
    const piResult32 = (state[11] << 4) | (state[10] >>> 28)
    const piResult33 = (state[10] << 4) | (state[11] >>> 28)
    const piResult2 = (state[13] << 12) | (state[12] >>> 20)
    const piResult3 = (state[12] << 12) | (state[13] >>> 20)
    const piResult22 = (state[14] << 6) | (state[15] >>> 26)
    const piResult23 = (state[15] << 6) | (state[14] >>> 26)
    const piResult42 = (state[17] << 23) | (state[16] >>> 9)
    const piResult43 = (state[16] << 23) | (state[17] >>> 9)
    const piResult12 = (state[18] << 20) | (state[19] >>> 12)
    const piResult13 = (state[19] << 20) | (state[18] >>> 12)
    const piResult14 = (state[20] << 3) | (state[21] >>> 29)
    const piResult15 = (state[21] << 3) | (state[20] >>> 29)
    const piResult34 = (state[22] << 10) | (state[23] >>> 22)
    const piResult35 = (state[23] << 10) | (state[22] >>> 22)
    const piResult4 = (state[25] << 11) | (state[24] >>> 21)
    const piResult5 = (state[24] << 11) | (state[25] >>> 21)
    const piResult24 = (state[26] << 25) | (state[27] >>> 7)
    const piResult25 = (state[27] << 25) | (state[26] >>> 7)
    const piResult44 = (state[29] << 7) | (state[28] >>> 25)
    const piResult45 = (state[28] << 7) | (state[29] >>> 25)
    const piResult46 = (state[31] << 9) | (state[30] >>> 23)
    const piResult47 = (state[30] << 9) | (state[31] >>> 23)
    const piResult16 = (state[33] << 13) | (state[32] >>> 19)
    const piResult17 = (state[32] << 13) | (state[33] >>> 19)
    const piResult36 = (state[34] << 15) | (state[35] >>> 17)
    const piResult37 = (state[35] << 15) | (state[34] >>> 17)
    const piResult6 = (state[36] << 21) | (state[37] >>> 11)
    const piResult7 = (state[37] << 21) | (state[36] >>> 11)
    const piResult26 = (state[38] << 8) | (state[39] >>> 24)
    const piResult27 = (state[39] << 8) | (state[38] >>> 24)
    const piResult28 = (state[40] << 18) | (state[41] >>> 14)
    const piResult29 = (state[41] << 18) | (state[40] >>> 14)
    const piResult48 = (state[42] << 2) | (state[43] >>> 30)
    const piResult49 = (state[43] << 2) | (state[42] >>> 30)
    const piResult18 = (state[45] << 29) | (state[44] >>> 3)
    const piResult19 = (state[44] << 29) | (state[45] >>> 3)
    const piResult38 = (state[47] << 24) | (state[46] >>> 8)
    const piResult39 = (state[46] << 24) | (state[47] >>> 8)
    const piResult8 = (state[48] << 14) | (state[49] >>> 18)
    const piResult9 = (state[49] << 14) | (state[48] >>> 18)
    // chi
    state[0] = piResult0 ^ (~piResult2 & piResult4)
    state[1] = piResult1 ^ (~piResult3 & piResult5)
    state[2] = piResult2 ^ (~piResult4 & piResult6)
    state[3] = piResult3 ^ (~piResult5 & piResult7)
    state[4] = piResult4 ^ (~piResult6 & piResult8)
    state[5] = piResult5 ^ (~piResult7 & piResult9)
    state[6] = piResult6 ^ (~piResult8 & piResult0)
    state[7] = piResult7 ^ (~piResult9 & piResult1)
    state[8] = piResult8 ^ (~piResult0 & piResult2)
    state[9] = piResult9 ^ (~piResult1 & piResult3)
    state[10] = piResult10 ^ (~piResult12 & piResult14)
    state[11] = piResult11 ^ (~piResult13 & piResult15)
    state[12] = piResult12 ^ (~piResult14 & piResult16)
    state[13] = piResult13 ^ (~piResult15 & piResult17)
    state[14] = piResult14 ^ (~piResult16 & piResult18)
    state[15] = piResult15 ^ (~piResult17 & piResult19)
    state[16] = piResult16 ^ (~piResult18 & piResult10)
    state[17] = piResult17 ^ (~piResult19 & piResult11)
    state[18] = piResult18 ^ (~piResult10 & piResult12)
    state[19] = piResult19 ^ (~piResult11 & piResult13)
    state[20] = piResult20 ^ (~piResult22 & piResult24)
    state[21] = piResult21 ^ (~piResult23 & piResult25)
    state[22] = piResult22 ^ (~piResult24 & piResult26)
    state[23] = piResult23 ^ (~piResult25 & piResult27)
    state[24] = piResult24 ^ (~piResult26 & piResult28)
    state[25] = piResult25 ^ (~piResult27 & piResult29)
    state[26] = piResult26 ^ (~piResult28 & piResult20)
    state[27] = piResult27 ^ (~piResult29 & piResult21)
    state[28] = piResult28 ^ (~piResult20 & piResult22)
    state[29] = piResult29 ^ (~piResult21 & piResult23)
    state[30] = piResult30 ^ (~piResult32 & piResult34)
    state[31] = piResult31 ^ (~piResult33 & piResult35)
    state[32] = piResult32 ^ (~piResult34 & piResult36)
    state[33] = piResult33 ^ (~piResult35 & piResult37)
    state[34] = piResult34 ^ (~piResult36 & piResult38)
    state[35] = piResult35 ^ (~piResult37 & piResult39)
    state[36] = piResult36 ^ (~piResult38 & piResult30)
    state[37] = piResult37 ^ (~piResult39 & piResult31)
    state[38] = piResult38 ^ (~piResult30 & piResult32)
    state[39] = piResult39 ^ (~piResult31 & piResult33)
    state[40] = piResult40 ^ (~piResult42 & piResult44)
    state[41] = piResult41 ^ (~piResult43 & piResult45)
    state[42] = piResult42 ^ (~piResult44 & piResult46)
    state[43] = piResult43 ^ (~piResult45 & piResult47)
    state[44] = piResult44 ^ (~piResult46 & piResult48)
    state[45] = piResult45 ^ (~piResult47 & piResult49)
    state[46] = piResult46 ^ (~piResult48 & piResult40)
    state[47] = piResult47 ^ (~piResult49 & piResult41)
    state[48] = piResult48 ^ (~piResult40 & piResult42)
    state[49] = piResult49 ^ (~piResult41 & piResult43)
    // iota
    state[0] ^= IOTA_CONSTANTS[round * 2]!
    state[1] ^= IOTA_CONSTANTS[round * 2 + 1]!
  }
}

function divideToBlocks(bytes: Uint8Array, paddingByte: 0b00000001 | 0b00000110): number[][] {
  if (!bytes.length) {
    const padding = new Uint8Array(136)
    padding[0] = paddingByte
    padding[135] = 0b10000000
    return [bytesToNumbers(padding)]
  }
  const blocks = partition(bytes, 136)
  const lastBlock = blocks[blocks.length - 1]!
  if (lastBlock.length < 136) {
    const padded = new Uint8Array(136)
    padded.set(lastBlock)
    padded[lastBlock.length] = paddingByte
    padded[135] = padded[135]! | 0b10000000
    blocks[blocks.length - 1] = padded
  }
  if (lastBlock.length === 136) {
    const padding = new Uint8Array(136)
    padding[0] = paddingByte
    padding[135] = 0b10000000
    blocks.push(padding)
  }
  return blocks.map(bytesToNumbers)
}

function bytesToNumbers(bytes: Uint8Array): number[] {
  const numbers: number[] = []
  for (let i = 0; i < bytes.length; i += 4) {
    numbers.push(bytes[i]! | (bytes[i + 1]! << 8) | (bytes[i + 2]! << 16) | (bytes[i + 3]! << 24))
  }
  return numbers
}

function squeeze(state: KeccakState): Uint8Array {
  return new Uint8Array([
    state[1],
    state[1] >> -24,
    state[1] >> -16,
    state[1] >> -8,
    state[0],
    state[0] >> 8,
    state[0] >> 16,
    state[0] >> 24,
    state[3],
    state[3] >> -24,
    state[3] >> -16,
    state[3] >> -8,
    state[2],
    state[2] >> 8,
    state[2] >> 16,
    state[2] >> 24,
    state[5],
    state[5] >> -24,
    state[5] >> -16,
    state[5] >> -8,
    state[4],
    state[4] >> 8,
    state[4] >> 16,
    state[4] >> 24,
    state[7],
    state[7] >> -24,
    state[7] >> -16,
    state[7] >> -8,
    state[6],
    state[6] >> 8,
    state[6] >> 16,
    state[6] >> 24,
  ])
}
