// TextEncoder/TextDecoder are universal WHATWG runtime APIs (Node 11+, all
// browsers, Deno, Bun) - but recognizing them by type requires the full "DOM"
// lib, which would also expose window/document/fetch/etc. as if they were
// safe to use everywhere. Declaring just these two keeps that from happening.

declare class TextEncoder {
  encode(input?: string): Uint8Array
}

declare class TextDecoder {
  decode(input?: Uint8Array | ArrayBuffer): string
}

// Same reasoning: `crypto.getRandomValues` is a universal WHATWG global
// (Node 19+, all browsers, Deno, Bun) used for secure random key generation.
declare const crypto: {
  getRandomValues<T extends ArrayBufferView>(array: T): T
}
