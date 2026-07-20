/**
 * Sequentially reads chunks of bytes out of a buffer, tracking position.
 */
export class Uint8ArrayReader {
  cursor = 0
  buffer: Uint8Array

  constructor(buffer: Uint8Array) {
    this.buffer = buffer
  }

  /**
   * Reads (a view into) the next `size` bytes and advances the cursor.
   */
  read(size: number): Uint8Array {
    const data = this.buffer.subarray(this.cursor, this.cursor + size)
    this.cursor += size
    return data
  }

  /**
   * Returns the number of unread bytes remaining.
   */
  max(): number {
    return this.buffer.length - this.cursor
  }
}

/**
 * Sequentially writes bytes (read from a Uint8ArrayReader) into a buffer,
 * tracking position.
 */
export class Uint8ArrayWriter {
  cursor = 0
  buffer: Uint8Array

  constructor(buffer: Uint8Array) {
    this.buffer = buffer
  }

  /**
   * Copies as many bytes as fit from `reader` into the buffer at the
   * current cursor, advancing both. Returns the number of bytes written.
   */
  write(reader: Uint8ArrayReader): number {
    const max = Math.min(this.max(), reader.max())
    this.buffer.set(reader.read(max), this.cursor)
    this.cursor += max
    return max
  }

  /**
   * Returns the number of unwritten bytes remaining.
   */
  max(): number {
    return this.buffer.length - this.cursor
  }
}
