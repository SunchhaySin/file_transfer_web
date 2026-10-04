// file_stream.ts - preparing files, streaming them out, and reassembling them on the other side.
import type { PeerLink } from "./webRTC";

export const CHUNK = 16 * 1024;          // size of each message on the wire
const BLOCK = 256 * 1024;                // how much of the file we read from disk at a time
const HIGH_WATER = 4 * 1024 * 1024;      // pause sending when this much is queued
const MAX_FILES = 500;

export interface FileMeta {
  name: string;
  size: number;
  mime: string;
}

// ---- sender side ----
export function prepareFiles(files: File[]) {
  const metas: FileMeta[] = files.map((f) => ({ name: f.name, size: f.size, mime: f.type }));
  const totalSize = metas.reduce((sum, m) => sum + m.size, 0);
  return { metas, totalSize };
}

// Streams one file. Returns false if it was aborted or the channel closed.
export async function streamFile(
  link: PeerLink,
  file: File,
  onBytes: (sentSoFar: number) => void,
  isAborted: () => boolean,
): Promise<boolean> {
  let offset = 0;
  while (offset < file.size) {
    const block = await file.slice(offset, offset + BLOCK).arrayBuffer();
    for (let pos = 0; pos < block.byteLength; pos += CHUNK) {
      // backpressure: never queue more than HIGH_WATER in the channel
      while (link.isOpen && !isAborted() && link.buffered > HIGH_WATER) {
        await link.waitForLowBuffer();
      }
      if (!link.isOpen || isAborted()) return false;

      const piece = block.slice(pos, pos + CHUNK);
      link.sendBinary(piece);
      onBytes(offset + pos + piece.byteLength);
    }
    offset += block.byteLength;
  }
  return true;
}

// ---- receiver side ----
// Validates and cleans the file list the sender announced. Returns null if it is not acceptable.
export function sanitizeMetas(raw: unknown): FileMeta[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_FILES) return null;
  const out: FileMeta[] = [];
  for (const r of raw) {
    const size = Number(r?.size);
    if (!Number.isFinite(size) || size < 0) return null;
    const name = String(r?.name ?? '').replace(/[\\/:*?"<>|]/g, '_').slice(0, 255) || 'file';
    out.push({ name, size, mime: String(r?.mime ?? '').slice(0, 100) });
  }
  return out;
}

// Collects the chunks of ONE incoming file
export class FileAssembler {
  readonly meta: FileMeta;
  received = 0;
  private chunks: ArrayBuffer[] = [];

  constructor(meta: FileMeta) {
    this.meta = meta;
  }

  push(buf: ArrayBuffer) {
    this.chunks.push(buf);
    this.received += buf.byteLength;
  }

  // Returns a download URL, or null if the size does not match what was announced
  finish(): string | null {
    if (this.received !== this.meta.size) return null;
    return URL.createObjectURL(new Blob(this.chunks, { type: this.meta.mime }));
  }
}