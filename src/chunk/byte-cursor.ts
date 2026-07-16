export class Uint8ArrayReader {
  cursor = 0
  buffer: Uint8Array

  constructor(buffer: Uint8Array) {
    this.buffer = buffer
  }

  read(size: number): Uint8Array {
    const data = this.buffer.subarray(this.cursor, this.cursor + size)
    this.cursor += size
    return data
  }

  max(): number {
    return this.buffer.length - this.cursor
  }
}

export class Uint8ArrayWriter {
  cursor = 0
  buffer: Uint8Array

  constructor(buffer: Uint8Array) {
    this.buffer = buffer
  }

  write(reader: Uint8ArrayReader): number {
    const max = Math.min(this.max(), reader.max())
    this.buffer.set(reader.read(max), this.cursor)
    this.cursor += max
    return max
  }

  max(): number {
    return this.buffer.length - this.cursor
  }
}
