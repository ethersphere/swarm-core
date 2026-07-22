# Swarm Core

Framework-agnostic TypeScript primitives for the [Swarm](https://www.ethswarm.org/) decentralised storage network: typed byte wrappers, content-addressed and single-owner chunks, the Mantaray manifest trie, Reed-Solomon erasure coding, encryption, and postage stamp signing.

No network I/O — this library only builds and parses Swarm's on-disk/on-wire data structures. Talking to a Bee node is left to the consumer (e.g. [bee-js](https://github.com/ethersphere/bee-js)).

## Install

```sh
npm install @ethersphere/swarm-core
```

Ships as both ESM and CommonJS, with full TypeScript types. Import from the subpath you need:

```ts
import { Bytes, Reference } from 'swarm-core/bytes'
import { makeContentAddressedChunk } from 'swarm-core/chunk'
```

## Quick example

```ts
import { makeContentAddressedChunk } from 'swarm-core/chunk'

const chunk = makeContentAddressedChunk('Hello, Swarm!')
console.log(chunk.address.toHex())
```

## What's included

| Subpath | Contents |
|---|---|
| `swarm-core/bytes` | `Bytes` and typed wrappers (`Reference`, `BatchId`, `EthAddress`, `PrivateKey`, `PublicKey`, `Signature`, `Span`, `Topic`, `Identifier`, `FeedIndex`, `PeerAddress`, `TransactionId`) plus low-level encoding helpers (hex/base32/base64, concat, slice, integer packing) |
| `swarm-core/crypto` | Keccak-256, ECDSA sign/recover/verify, public/private key derivation |
| `swarm-core/chunk` | Content Addressed Chunks (CAC), Single Owner Chunks (SOC/SOC replicas), the BMT chunk hash, and `ChunkSplitter`/`ChunkJoiner` for building and reconstructing chunk trees |
| `swarm-core/mantaray` | `MantarayNode` — the manifest trie used for directory/collection uploads |
| `swarm-core/erasure-coding` | Reed-Solomon parity, redundancy-level tables, and the batching logic used to add parity chunks to a stream |
| `swarm-core/encryption` | Chunk-level stream cipher and XOR helpers |
| `swarm-core/stamper` | Postage stamp signing (`Stamper`, `stamp()`) and effective-capacity math |

Every subpath is also re-exported from the package root (`swarm-core`), so `import { Bytes } from 'swarm-core'` works too.

## Development

```sh
pnpm install
pnpm test          # vitest
pnpm typecheck
pnpm format:check
pnpm build          # esbuild (ESM + CJS) + tsc (.d.ts)
pnpm bench          # perf-sensitive functions, checked against a stored baseline
```

Requires Node.js 22+.
