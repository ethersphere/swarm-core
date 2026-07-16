import { hexToUint8Array } from '../bytes/encoding.js'

// Ethereum address derived from the fixed private key [1, 0, ..., 0] (32 bytes,
// big-endian) - the single signer used for all dispersed replica SOCs, so any
// node can verify a replica without knowing who actually created it.
export const REPLICAS_OWNER = hexToUint8Array('dc5b20847f43d67928f49cd4f85d696b5a7617b5')
