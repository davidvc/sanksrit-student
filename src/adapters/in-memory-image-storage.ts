import {
  ImageStorageStrategy,
  ImageHandle,
  FileUpload,
} from '../domain/image-storage-strategy';

/**
 * In-memory image storage strategy.
 *
 * Stores uploaded images in memory (Map) for the duration of processing.
 * Suitable for small files (≤5MB) in serverless environments.
 *
 * Images are automatically garbage collected after cleanup().
 */
export class InMemoryImageStorage implements ImageStorageStrategy {
  private buffers = new Map<string, Buffer>();
  private idCounter = 0;

  /**
   * Store uploaded image in memory.
   */
  async store(upload: FileUpload): Promise<ImageHandle> {
    let buffer: Buffer;

    // For testing: allow direct buffer
    if (upload._buffer) {
      // Ensure it's a proper Buffer (GraphQL Yoga might transform it to a plain object)
      buffer = Buffer.isBuffer(upload._buffer) ? upload._buffer : Buffer.from(upload._buffer);
    } else if (upload.createReadStream) {
      const chunks: Buffer[] = [];
      const stream = upload.createReadStream();

      // Read stream into buffer
      for await (const chunk of stream) {
        chunks.push(chunk as Buffer);
      }

      buffer = Buffer.concat(chunks);
    } else {
      throw new Error('Invalid upload: must have createReadStream or _buffer');
    }

    const id = `img-${++this.idCounter}`;
    this.buffers.set(id, buffer);

    return {
      id,
      size: buffer.length,
      mimetype: upload.mimetype,
      metadata: { filename: upload.filename },
    };
  }

  /**
   * Retrieve image buffer from memory.
   */
  async retrieve(handle: ImageHandle): Promise<Buffer> {
    const buffer = this.buffers.get(handle.id);
    if (!buffer) {
      throw new Error(`Image not found: ${handle.id}`);
    }
    return buffer;
  }

  /**
   * Clean up stored image (delete from memory).
   */
  async cleanup(handle: ImageHandle): Promise<void> {
    this.buffers.delete(handle.id);
  }
}
