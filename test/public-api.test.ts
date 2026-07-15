import { describe, expect, it } from 'vitest'
import * as bytesModule from '../src/bytes/index.js'
import * as cryptoModule from '../src/crypto/index.js'
import * as rootModule from '../src/index.js'

// This is the library's public contract: every subpath's exact export list.
// A name missing here means a breaking removal; a name here missing from the
// module means either an accidental omission or an accidental public leak
// (e.g. an internal constant that slipped into a barrel file).

const BYTES_EXPORTS = ['concatBytes', 'numberToUint256', 'uint256ToNumber', 'uint8ArrayToHex']

const CRYPTO_EXPORTS = [
  'keccak256',
  'checksumEncode',
  'compressPublicKey',
  'privateKeyToPublicKey',
  'publicKeyFromCompressed',
  'publicKeyToAddress',
  'recoverPublicKey',
  'signHash',
  'signMessage',
  'verifySignature',
]

function assertExactExports(module: object, expectedNames: string[], label: string) {
  const actualNames = Object.keys(module).sort()
  expect(actualNames, `${label}: unexpected export list`).toEqual([...expectedNames].sort())
  for (const name of expectedNames) {
    expect(typeof (module as Record<string, unknown>)[name], `${label}.${name} should be a function`).toBe('function')
  }
}

describe('public API contract', () => {
  it('swarm-core-lib/bytes exports exactly the expected functions', () => {
    assertExactExports(bytesModule, BYTES_EXPORTS, 'bytes')
  })

  it('swarm-core-lib/crypto exports exactly the expected functions', () => {
    assertExactExports(cryptoModule, CRYPTO_EXPORTS, 'crypto')
  })

  it('swarm-core-lib (root) re-exports the union of every implemented subpath', () => {
    assertExactExports(rootModule, [...BYTES_EXPORTS, ...CRYPTO_EXPORTS], 'root')
  })
})
