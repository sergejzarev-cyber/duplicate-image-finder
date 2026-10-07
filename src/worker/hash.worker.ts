/// <reference lib="webworker" />

export type InMessage =
  | { type: 'sha256'; id: string; path: string; buffer: ArrayBuffer }
  | { type: 'analyze'; id: string; path: string; buffer: ArrayBuffer; computeDhash: boolean };

export type OutMessage =
  | {
      type: 'result';
      id: string;
      path: string;
      sha256?: string;
      dhash?: string;
      width?: number;
      height?: number;
      broken?: boolean;
      error?: string;
    }
  | { type: 'error'; id?: string; message: string };

self.onmessage = async (e: MessageEvent<InMessage>) => {
  const msg = e.data;
  try {
    if (msg.type === 'sha256') {
      const sha = await sha256(msg.buffer);
      self.postMessage({ type: 'result', id: msg.id, path: msg.path, sha256: sha } satisfies OutMessage);
      return;
    }

    if (msg.type === 'analyze') {
      const sha = await sha256(msg.buffer);
      let width: number | undefined;
      let height: number | undefined;
      let dhash: string | undefined;
      let broken = false;
      let error: string | undefined;

      if (msg.computeDhash) {
        try {
          const meta = await analyzeImage(msg.buffer);
          width = meta.width;
          height = meta.height;
          dhash = meta.dhash;
        } catch (err: unknown) {
          broken = true;
          error = err instanceof Error ? err.message : 'broken image';
        }
      }

      self.postMessage({
        type: 'result',
        id: msg.id,
        path: msg.path,
        sha256: sha,
        dhash,
        width,
        height,
        broken,
        error,
      } satisfies OutMessage);
    }
  } catch (err: unknown) {
    self.postMessage({
      type: 'error',
      id: msg.id,
      message: err instanceof Error ? err.message : String(err),
    } satisfies OutMessage);
  }
};

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Difference hash (dHash):
 * 1) decode image
 * 2) draw into 9×8 grayscale canvas (cover + center crop to reduce letterboxing noise)
 * 3) compare each pixel to its right neighbor → 64 bits
 */
async function analyzeImage(
  buffer: ArrayBuffer
): Promise<{ width: number; height: number; dhash: string }> {
  const blob = new Blob([buffer]);
  const bitmap = await createImageBitmap(blob);
  try {
    const width = bitmap.width;
    const height = bitmap.height;
    if (width < 2 || height < 2) throw new Error('image too small');

    const canvas = new OffscreenCanvas(9, 8);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('2d context unavailable');

    // center-crop to square-ish content then scale → more stable across aspect ratios
    const srcSize = Math.min(width, height);
    const sx = Math.floor((width - srcSize) / 2);
    const sy = Math.floor((height - srcSize) / 2);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 9, 8);
    ctx.drawImage(bitmap, sx, sy, srcSize, srcSize, 0, 0, 9, 8);

    const { data } = ctx.getImageData(0, 0, 9, 8);
    const gray = new Float32Array(9 * 8);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      // Rec. 601 luma
      gray[p] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    }

    let bits = '';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const left = gray[y * 9 + x];
        const right = gray[y * 9 + x + 1];
        bits += left < right ? '1' : '0';
      }
    }

    let hex = '';
    for (let i = 0; i < 64; i += 4) {
      hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    }

    return { width, height, dhash: hex };
  } finally {
    bitmap.close();
  }
}

export {};
